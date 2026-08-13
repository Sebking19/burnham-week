import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BURNHAM_LAT = 51.62362;
const BURNHAM_LON = 0.82192;

// Try Open-Meteo first (free, no key)
async function fetchWeatherOpenMeteo(startDate, endDate) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${BURNHAM_LAT}&longitude=${BURNHAM_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,wind_gusts_10m_max&wind_speed_unit=kn&timezone=Europe%2FLondon&start_date=${startDate}&end_date=${endDate}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CorinthianOttersApp/1.0' } });
  const data = await res.json();
  const wd = data.daily;

  if (!wd || !wd.time) {
    console.error('Open-Meteo failed:', res.status, JSON.stringify(data).slice(0, 300));
    return null;
  }

  return wd.time.map((date, i) => ({
    date,
    weather_code: wd.weather_code[i],
    temp_max: wd.temperature_2m_max[i],
    temp_min: wd.temperature_2m_min[i],
    rain_prob: wd.precipitation_probability_max[i],
    wind_speed_kn: Math.round(wd.wind_speed_10m_max[i]),
    wind_gust_kn: Math.round(wd.wind_gusts_10m_max[i]),
    wind_dir: wd.wind_direction_10m_dominant[i],
  }));
}

// met.no symbol_code → approximate WMO weather code
function symbolToWmo(symbol) {
  if (!symbol) return 3;
  const s = symbol.split('_')[0];
  const map = {
    clearsky: 0, fair: 1, partlycloudy: 2, cloudy: 3, fog: 45,
    lightrain: 61, lightrainshowers: 80, rain: 63, rainshowers: 81,
    heavyrain: 65, heavyrainshowers: 82, lightsleet: 56, sleet: 57,
    lightsnow: 71, snow: 73, heavysnow: 75,
  };
  if (s.includes('thunder')) return 95;
  return map[s] ?? 3;
}

// Fallback: met.no Locationforecast (free, server-friendly, requires User-Agent)
async function fetchWeatherMetNo(startDate, endDate) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${BURNHAM_LAT}&lon=${BURNHAM_LON}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CorinthianOttersApp/1.0 github.com/base44' }
  });
  if (!res.ok) {
    console.error('met.no failed:', res.status);
    return null;
  }
  const data = await res.json();
  const series = data?.properties?.timeseries;
  if (!series || series.length === 0) return null;

  const MS_TO_KN = 1.94384;
  const byDate = {};
  for (const entry of series) {
    const date = entry.time.split('T')[0];
    if (date < startDate || date > endDate) continue;
    const inst = entry.data?.instant?.details;
    if (!inst) continue;
    if (!byDate[date]) byDate[date] = { temps: [], winds: [], gusts: [], symbols: [] };
    const d = byDate[date];
    if (inst.air_temperature != null) d.temps.push(inst.air_temperature);
    if (inst.wind_speed != null) d.winds.push({ speed: inst.wind_speed, dir: inst.wind_from_direction });
    if (inst.wind_speed_of_gust != null) d.gusts.push(inst.wind_speed_of_gust);
    const hour = new Date(entry.time).getUTCHours();
    const symbol = entry.data?.next_6_hours?.summary?.symbol_code || entry.data?.next_1_hours?.summary?.symbol_code;
    if (symbol) d.symbols.push({ hour, symbol });
  }

  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const date = dt.toISOString().split('T')[0];
    const d = byDate[date];
    if (!d || d.temps.length === 0 || d.winds.length === 0) {
      days.push({ date, unavailable: true });
      continue;
    }
    const maxWind = d.winds.reduce((a, b) => (b.speed > a.speed ? b : a));
    // Prefer the symbol closest to midday
    const midday = d.symbols.length > 0
      ? d.symbols.reduce((a, b) => (Math.abs(b.hour - 12) < Math.abs(a.hour - 12) ? b : a)).symbol
      : null;
    days.push({
      date,
      weather_code: symbolToWmo(midday),
      temp_max: Math.max(...d.temps),
      temp_min: Math.min(...d.temps),
      rain_prob: null,
      wind_speed_kn: Math.round(maxWind.speed * MS_TO_KN),
      wind_gust_kn: d.gusts.length > 0 ? Math.round(Math.max(...d.gusts) * MS_TO_KN) : null,
      wind_dir: maxWind.dir,
    });
  }
  return days;
}

async function fetchWeather(startDate, endDate) {
  let weather = await fetchWeatherOpenMeteo(startDate, endDate).catch(() => null);
  if (!weather) {
    weather = await fetchWeatherMetNo(startDate, endDate).catch(() => null);
  }
  if (weather) return weather;

  // Both sources failed — mark all days unavailable
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push({ date: d.toISOString().split('T')[0], unavailable: true });
  }
  return dates;
}

// Strip HTML tags and decode &nbsp;
function cellText(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Parse monthly tide table from crouchharbour.uk
// The site uses single-quoted class attributes: class='date', class='tidetime', etc.
async function fetchTidesForMonth(year, month) {
  const monthStr = String(month).padStart(2, '0');
  const url = `https://crouchharbour.uk/tides/${year}-${monthStr}/`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OttersApp/1.0)', 'Accept': 'text/html' }
  });
  const html = await res.text();
  const tidesByDay = {};

  // Split into rows
  const rows = html.split(/<\/tr>/i);

  for (const row of rows) {
    // Match date cell — single OR double quoted class attribute containing 'date'
    const dateMatch = row.match(/<td[^>]*class=['"][^'"]*\bdate\b[^'"]*['"][^>]*>([\s\S]*?)<\/td>/i);
    if (!dateMatch) continue;
    const dayNum = parseInt(cellText(dateMatch[1]));
    if (!dayNum || dayNum < 1 || dayNum > 31) continue;

    // Extract all td elements
    const tdRe = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdM;
    while ((tdM = tdRe.exec(row)) !== null) {
      const classAttr = tdM[1];
      const content = cellText(tdM[2]);
      const isLow = /\blow\b/.test(classAttr);
      const isTideTime = /\btidetime\b/.test(classAttr);
      const isTideHeight = /\btideheight\b/.test(classAttr);
      cells.push({ content, isLow, isTideTime, isTideHeight });
    }

    const highTimes = cells.filter(c => c.isTideTime && !c.isLow).map(c => c.content);
    const highHeights = cells.filter(c => c.isTideHeight && !c.isLow).map(c => c.content);
    const lowTimes = cells.filter(c => c.isTideTime && c.isLow).map(c => c.content);
    const lowHeights = cells.filter(c => c.isTideHeight && c.isLow).map(c => c.content);

    const tides = [];
    for (let i = 0; i < highTimes.length; i++) {
      if (/\d+:\d+/.test(highTimes[i]) && highHeights[i] && !isNaN(parseFloat(highHeights[i]))) {
        tides.push({ type: 'High', time: highTimes[i], height: parseFloat(highHeights[i]) });
      }
    }
    for (let i = 0; i < lowTimes.length; i++) {
      if (/\d+:\d+/.test(lowTimes[i]) && lowHeights[i] && !isNaN(parseFloat(lowHeights[i]))) {
        tides.push({ type: 'Low', time: lowTimes[i], height: parseFloat(lowHeights[i]) });
      }
    }

    if (tides.length > 0) {
      tides.sort((a, b) => a.time.localeCompare(b.time));
      tidesByDay[dayNum] = tides;
    }
  }

  return tidesByDay;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { mode = 'standard' } = body;

    let weatherData, tideData;

    if (mode === 'otter_week') {
      const [weatherRaw, julyTides] = await Promise.all([
        fetchWeather('2026-07-26', '2026-07-31'),
        fetchTidesForMonth(2026, 7)
      ]);
      weatherData = weatherRaw;
      tideData = {};
      for (let d = 26; d <= 31; d++) {
        const key = `2026-07-${String(d).padStart(2, '0')}`;
        tideData[key] = julyTides[d] || [];
      }
    } else {
      const today = new Date();
      const in2 = new Date(today);
      in2.setDate(today.getDate() + 2);
      const startDate = today.toISOString().split('T')[0];
      const endDate = in2.toISOString().split('T')[0];

      weatherData = await fetchWeather(startDate, endDate);

      const months = new Set();
      weatherData.forEach(d => {
        const dt = new Date(d.date);
        months.add(`${dt.getFullYear()}-${dt.getMonth() + 1}`);
      });

      const tideMonthsArray = Array.from(months);
      const tidesArrays = await Promise.all(
        tideMonthsArray.map(ym => {
          const [y, m] = ym.split('-').map(Number);
          return fetchTidesForMonth(y, m);
        })
      );

      const tideCache = {};
      tideMonthsArray.forEach((ym, i) => {
        tideCache[ym] = tidesArrays[i];
      });

      tideData = {};
      for (const day of weatherData) {
        const dt = new Date(day.date);
        const ym = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
        tideData[day.date] = tideCache[ym]?.[dt.getDate()] || [];
      }
    }

    return Response.json({ weather: weatherData, tides: tideData });
  } catch (error) {
    console.error('weatherAndTides error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});