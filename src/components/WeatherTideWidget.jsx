import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wind, Droplets, Thermometer, ArrowUp, ArrowDown, RefreshCw, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";

// WMO weather code → emoji + label
function weatherInfo(code) {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2) return { icon: "⛅", label: "Partly Cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code <= 49) return { icon: "🌫️", label: "Fog" };
  if (code <= 55) return { icon: "🌦️", label: "Drizzle" };
  if (code <= 65) return { icon: "🌧️", label: "Rain" };
  if (code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code <= 82) return { icon: "🌧️", label: "Showers" };
  if (code <= 99) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌡️", label: "Unknown" };
}

// Wind direction degrees → compass
function windDir(deg) {
  if (deg == null) return "—";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Beaufort scale from knots
function beaufort(kn) {
  if (kn < 1) return 0;
  if (kn < 4) return 1;
  if (kn < 7) return 2;
  if (kn < 11) return 3;
  if (kn < 17) return 4;
  if (kn < 22) return 5;
  if (kn < 28) return 6;
  if (kn < 34) return 7;
  if (kn < 41) return 8;
  if (kn < 48) return 9;
  if (kn < 56) return 10;
  if (kn < 64) return 11;
  return 12;
}

function beaufortLabel(b) {
  const labels = ["Calm", "Light Air", "Light Breeze", "Gentle", "Moderate", "Fresh", "Strong", "Near Gale", "Gale", "Severe Gale", "Storm", "Violent Storm", "Hurricane"];
  return labels[b] || "—";
}

// Visual tide bar: show height relative to typical Burnham range (−0.5m to 6m)
function TideBar({ height }) {
  const min = -0.5, max = 6.0;
  const pct = Math.max(0, Math.min(100, ((height - min) / (max - min)) * 100));
  const color = height > 3.5 ? "bg-blue-400" : height > 1.5 ? "bg-cyan-400" : "bg-teal-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${height > 3.5 ? "text-blue-300" : height > 1.5 ? "text-cyan-300" : "text-teal-400"}`}>
        {height.toFixed(2)}m
      </span>
    </div>
  );
}

function WindyModal({ date, onClose }) {
  const lat = 51.63;
  const lon = 0.82;
  const [hourly, setHourly] = useState(null);
  const [loadingHourly, setLoadingHourly] = useState(true);

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m,winddirection_10m,windgusts_10m&windspeed_unit=kn&timezone=Europe%2FLondon&forecast_days=7`)
      .then(r => r.json())
      .then(d => {
        const times = d.hourly.time;
        const speeds = d.hourly.windspeed_10m;
        const dirs = d.hourly.winddirection_10m;
        const gusts = d.hourly.windgusts_10m;
        const filtered = times
          .map((t, i) => ({ time: t, speed: speeds[i], dir: dirs[i], gust: gusts[i] }))
          .filter(h => h.time.startsWith(date) && [6,9,12,15,18,21].includes(new Date(h.time).getHours()));
        setHourly(filtered);
        setLoadingHourly(false);
      })
      .catch(() => setLoadingHourly(false));
  }, [date]);

  const windyUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&ptype=pd&source=forecast&o=pd&lang=en&zoom=10&pressure=true&calendar=now&overlay=wind&menu=&message=true&marker=true&forecast=12&hours=false&type=map&actualGrid=&metricWind=kn&metricTemp=%C2%B0C`;

  const bColor = (kn) => {
    const b = beaufort(kn);
    if (b <= 3) return "text-green-300 bg-green-500/10 border-green-500/20";
    if (b <= 5) return "text-yellow-300 bg-yellow-500/10 border-yellow-500/20";
    if (b <= 7) return "text-orange-300 bg-orange-500/10 border-orange-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden outline-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <p className="text-white font-bold text-sm">🌬️ {format(parseISO(date), "EEEE d MMM")} · Wind Detail</p>
              <p className="text-white/40 text-xs mt-0.5">Burnham-on-Crouch · River Crouch</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.windy.com/?wind,${lat},${lon},10`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 transition-colors"
                title="Open in Windy"
              >
                <ExternalLink size={16} />
              </a>
              <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Hourly breakdown */}
          <div className="p-4 border-b border-white/8">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-3">Hourly Wind Forecast</p>
            {loadingHourly ? (
              <div className="flex items-center gap-2 text-white/30 text-xs py-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                Loading hourly data...
              </div>
            ) : hourly && hourly.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {hourly.map(h => {
                  const hour = new Date(h.time).getHours();
                  const timeLabel = `${String(hour).padStart(2,'0')}:00`;
                  const b = beaufort(h.speed);
                  const colorClass = bColor(h.speed);
                  return (
                    <div key={h.time} className={`rounded-xl border p-2.5 text-center ${colorClass}`}>
                      <p className="text-white/50 text-[10px] font-semibold mb-1">{timeLabel}</p>
                      <p className="font-bold text-sm">{Math.round(h.speed)}kn</p>
                      <p className="text-[10px] font-semibold">{windDir(h.dir)}</p>
                      <p className="text-[9px] opacity-60 mt-0.5">F{b}</p>
                      {h.gust != null && h.gust > h.speed + 2 && (
                        <p className="text-orange-300/70 text-[9px] mt-0.5">↑{Math.round(h.gust)}kn</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/30 text-xs">Hourly data unavailable</p>
            )}
          </div>

          {/* Windy embed */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={windyUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              title="Windy weather map"
            />
          </div>
          <p className="text-white/20 text-[10px] px-4 py-3">Weather: Open-Meteo · Map: Windy.com · NOT FOR NAVIGATION</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DayCard({ weather, tides, onOpenWindy }) {
  const dateLabel = format(parseISO(weather.date), "EEE d MMM");
  const weatherAvailable = !weather.unavailable && weather.weather_code != null;

  const w = weatherAvailable ? weatherInfo(weather.weather_code) : null;
  const b = weatherAvailable ? beaufort(weather.wind_speed_kn) : null;
  const windColor = b == null ? "text-white/30" : b <= 3 ? "text-green-300" : b <= 5 ? "text-yellow-300" : b <= 7 ? "text-orange-300" : "text-red-400";

  return (
    <div
      className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 space-y-3 min-w-[200px] flex-shrink-0 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-all"
      onClick={onOpenWindy}
      title="Click for detailed Windy forecast"
    >
      {/* Date + weather */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs font-semibold">{dateLabel}</p>
          {weatherAvailable
            ? <p className="text-white text-sm font-bold mt-0.5">{w.icon} {w.label}</p>
            : <p className="text-white/25 text-xs mt-0.5 italic">Forecast not yet available</p>
          }
        </div>
        {weatherAvailable && (
          <div className="text-right">
            <p className="text-white font-bold text-sm">{Math.round(weather.temp_max)}°C</p>
            <p className="text-white/40 text-xs">{Math.round(weather.temp_min)}° low</p>
          </div>
        )}
      </div>

      {/* Wind */}
      {weatherAvailable && (
        <div className="flex items-center gap-2 flex-wrap">
          <Wind size={13} className={windColor} />
          <span className={`text-xs font-bold ${windColor}`}>
            {weather.wind_speed_kn}kn {windDir(weather.wind_dir)}
          </span>
          <span className="text-white/30 text-xs">
            F{b} {beaufortLabel(b)}
          </span>
          {weather.wind_gust_kn != null && (
            <span className="text-orange-300/70 text-[10px]">gusts {weather.wind_gust_kn}kn</span>
          )}
        </div>
      )}

      {/* Rain */}
      {weatherAvailable && weather.rain_prob != null && (
        <div className="flex items-center gap-2">
          <Droplets size={13} className="text-blue-400/70" />
          <span className="text-xs text-white/50">{weather.rain_prob}% rain</span>
        </div>
      )}

      {/* Tides */}
      {tides && tides.length > 0 && (
        <div className="border-t border-white/8 pt-3 space-y-1.5">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide mb-2">River Crouch Tides</p>
          {tides.map((tide, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {tide.type === "High"
                  ? <ArrowUp size={11} className="text-blue-300" />
                  : <ArrowDown size={11} className="text-teal-400" />}
                <span className={`text-xs font-semibold ${tide.type === "High" ? "text-blue-200" : "text-teal-300"}`}>
                  {tide.type}
                </span>
                <span className="text-white/40 text-xs">{tide.time}</span>
              </div>
              <TideBar height={tide.height} />
            </div>
          ))}
        </div>
      )}

      <p className="text-white/20 text-[9px] text-center pt-1">Tap for Windy detail →</p>
    </div>
  );
}

export default function WeatherTideWidget({ mode = "standard", title = "3-Day Forecast · Burnham-on-Crouch", onTodayWeather }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windyDate, setWindyDate] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("weatherAndTides", { mode });
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setData(res.data);
      if (onTodayWeather && res.data?.weather?.[0]) {
        onTodayWeather(res.data.weather[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [mode]);

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5 mb-5">
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
          Loading weather & tides...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5 mb-5">
        <p className="text-white/30 text-xs">Weather & tide data unavailable</p>
      </div>
    );
  }

  const days = data.weather || [];

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-bold text-sm">🌊 {title}</p>
          <p className="text-white/30 text-[10px] mt-0.5">Weather · Wind · Tides · River Crouch</p>
        </div>
        <button onClick={load} className="text-white/20 hover:text-white/50 transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {windyDate && <WindyModal date={windyDate} onClose={() => setWindyDate(null)} />}

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {days.map(day => (
          <DayCard
            key={day.date}
            weather={day}
            tides={data.tides?.[day.date] || []}
            onOpenWindy={() => setWindyDate(day.date)}
          />
        ))}
      </div>

      <p className="text-white/15 text-[9px] mt-3">Weather: Open-Meteo · Tides: Admiralty/tidetimes.org.uk · NOT FOR NAVIGATION</p>
    </div>
  );
}