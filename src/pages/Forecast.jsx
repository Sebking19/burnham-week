import { useState, useEffect } from "react";
import WeatherTideWidget from "@/components/WeatherTideWidget";
import BoatWindGuide from "@/components/BoatWindGuide";
import { base44 } from "@/api/base44Client";

export default function Forecast() {
  const [todayWeather, setTodayWeather] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Forecast</h1>
        <p className="text-cyan-200/40 text-sm mt-0.5">Burnham-on-Crouch · River Crouch</p>
      </div>
      <WeatherTideWidget
        mode="standard"
        title="3-Day Forecast · Burnham-on-Crouch"
        onTodayWeather={setTodayWeather}
      />
      <BoatWindGuide
        windKn={todayWeather?.wind_speed_kn}
        gustKn={todayWeather?.wind_gust_kn}
        user={user}
      />
      <p className="text-white/20 text-[10px] px-1 mt-2">⚠️ NOT FOR NAVIGATION — for planning purposes only</p>
    </div>
  );
}