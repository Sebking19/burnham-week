import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wind, Droplets, ArrowUp, ArrowDown, RefreshCw, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";

function weatherInfo(code) {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2) return { icon: "⛅", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code <= 49) return { icon: "🌫️", label: "Fog" };
  if (code <= 55) return { icon: "🌦️", label: "Drizzle" };
  if (code <= 65) return { icon: "🌧️", label: "Rain" };
  if (code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code <= 82) return { icon: "🌧️", label: "Showers" };
  if (code <= 99) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌡️", label: "—" };
}

const DIR_WORDS = { N: "north", NNE: "north-north-east", NE: "north-east", ENE: "east-north-east", E: "east", ESE: "east-south-east", SE: "south-east", SSE: "south-south-east", S: "south", SSW: "south-south-west", SW: "south-west", WSW: "west-south-west", W: "west", WNW: "west-north-west", NW: "north-west", NNW: "north-north-west" };

function windDir(deg) {
  if (deg == null) return "";
  const dirs = Object.keys(DIR_WORDS);
  return dirs[Math.round(deg / 22.5) % 16];
}

function beaufort(kn) {
  const limits = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];
  const idx = limits.findIndex(l => kn < l);
  return idx === -1 ? 12 : idx;
}

const BEAUFORT_LABELS = ["Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze", "Fresh breeze", "Strong breeze", "Near gale", "Gale", "Severe gale", "Storm", "Violent storm", "Hurricane"];

export default function ForecastList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("weatherAndTides", { mode: "standard" });
    setData(res.data?.error ? null : res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex items-center gap-3 text-lg text-slate-600">
        <div className="w-6 h-6 border-4 border-slate-200 border-t-[#0E2A4E] rounded-full animate-spin" />
        Loading the forecast...
      </div>
    );
  }

  if (!data?.weather?.length) {
    return <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-lg text-slate-600">The forecast is unavailable right now. Please try again later.</div>;
  }

  return (
    <div className="space-y-4">
      {data.weather.map(day => {
        const available = !day.unavailable && day.weather_code != null;
        const w = available ? weatherInfo(day.weather_code) : null;
        const b = available ? beaufort(day.wind_speed_kn) : null;
        const dir = available ? windDir(day.wind_dir) : "";
        const tides = data.tides?.[day.date] || [];
        return (
          <div key={day.date} className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0E2A4E]">{format(parseISO(day.date), "EEEE d MMMM")}</h2>
              {available && <span className="text-4xl">{w.icon}</span>}
            </div>

            {available ? (
              <>
                <p className="text-xl">
                  {w.label} · High <span className="font-bold">{Math.round(day.temp_max)}°C</span>, low {Math.round(day.temp_min)}°C
                </p>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xl">
                    <Wind size={24} className="text-[#0E2A4E]" />
                    <span className="font-bold">{Math.round(day.wind_speed_kn)} knots</span>
                    {dir && <span>from the {DIR_WORDS[dir]}</span>}
                  </div>
                  <p className="text-lg text-slate-700 mt-1">Force {b} — {BEAUFORT_LABELS[b]}{day.wind_gust_kn != null ? ` · gusts up to ${Math.round(day.wind_gust_kn)} knots` : ""}</p>
                </div>
                {day.rain_prob != null && (
                  <p className="flex items-center gap-2 text-lg text-slate-700">
                    <Droplets size={22} className="text-sky-600" /> {day.rain_prob}% chance of rain
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg text-slate-500 italic">Forecast not yet available for this day.</p>
            )}

            {tides.length > 0 && (
              <div className="border-t-2 border-slate-100 pt-3">
                <p className="text-lg font-bold text-[#0E2A4E] mb-2">River Crouch Tides</p>
                <div className="space-y-2">
                  {tides.map((tide, i) => (
                    <p key={i} className="flex items-center gap-2 text-lg">
                      {tide.type === "High"
                        ? <ArrowUp size={22} className="text-sky-700" />
                        : <ArrowDown size={22} className="text-teal-700" />}
                      <span className="font-bold w-28">{tide.type} water</span>
                      <span>{tide.time}</span>
                      <span className="text-slate-500">({tide.height.toFixed(1)} m)</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={load}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0E2A4E] text-white text-lg font-bold py-4 rounded-2xl hover:bg-[#173B6B]"
        >
          <RefreshCw size={22} /> Update forecast
        </button>
        <a
          href="https://www.windy.com/?wind,51.63,0.82,10"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#0E2A4E] text-[#0E2A4E] text-lg font-bold py-4 rounded-2xl hover:bg-slate-50"
        >
          <ExternalLink size={22} /> Open live wind map
        </a>
      </div>
    </div>
  );
}