import ForecastList from "@/components/weather/ForecastList";

export default function Forecast() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-[#0E2A4E]">Weather, Wind & Tides</h1>
        <p className="text-lg text-slate-600 mt-1">Burnham-on-Crouch · River Crouch</p>
      </div>
      <ForecastList />
      <p className="text-base text-slate-500 text-center pb-2">⚠️ For planning only — not for navigation.</p>
    </div>
  );
}