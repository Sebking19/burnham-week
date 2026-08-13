import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wind } from "lucide-react";

export const DEFAULT_BOATS = [
  { name: "Optimist",  greenMax: 12, yellowMax: 16, redAbove: 16 },
  { name: "Cadet",     greenMax: 14, yellowMax: 18, redAbove: 18 },
  { name: "Tera",      greenMax: 16, yellowMax: 20, redAbove: 20 },
  { name: "Feva",      greenMax: 16, yellowMax: 22, redAbove: 22 },
  { name: "Topper",    greenMax: 16, yellowMax: 22, redAbove: 22 },
  { name: "Laser 4.7", greenMax: 18, yellowMax: 22, redAbove: 22 },
  { name: "Laser 5.7", greenMax: 20, yellowMax: 25, redAbove: 25 },
  { name: "RS200",     greenMax: 22, yellowMax: 28, redAbove: 28 },
];

// greenMax  = up to here → green "Good to go"
// yellowMax = up to here → yellow/orange "Caution"
// redAbove  = above this → red "Too strong"

export default function BoatWindLimitsSettings() {
  const [limits, setLimits] = useState({});
  const [configId, setConfigId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.BoatWindConfig.list("", 1).then(records => {
      if (records.length > 0) {
        setConfigId(records[0].id);
        setLimits(records[0].limits || {});
      }
    }).catch(() => {});
  }, []);

  const getVal = (name, field) => limits[name]?.[field] ?? DEFAULT_BOATS.find(b => b.name === name)?.[field];

  const handleChange = (name, field, val) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1) return;
    setLimits(prev => ({
      ...prev,
      [name]: { ...(prev[name] || {}), [field]: num },
    }));
  };

  const handleReset = (name) => {
    setLimits(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const isBoatOverridden = (name) => limits[name] != null;

  const handleSave = async () => {
    setSaving(true);
    if (configId) {
      await base44.entities.BoatWindConfig.update(configId, { limits });
    } else {
      const created = await base44.entities.BoatWindConfig.create({ limits });
      setConfigId(created.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Wind size={15} className="text-cyan-400/70" />
        <h2 className="text-sm font-bold text-white">Boat Wind Limits</h2>
        <span className="ml-auto text-[11px] text-white/25">Trainers &amp; above</span>
      </div>
      <p className="text-white/30 text-xs mb-4">
        Set the wind thresholds (knots) for each colour status on the Forecast tab.
      </p>

      {/* Legend */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[11px] text-white/50">Green up to</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-[11px] text-white/50">Yellow up to</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[11px] text-white/50">Red above</span></div>
      </div>

      <div className="space-y-3">
        {DEFAULT_BOATS.map(boat => (
          <div key={boat.name} className="bg-white/[0.03] border border-white/8 rounded-2xl px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-semibold">{boat.name}</span>
              {isBoatOverridden(boat.name) && (
                <button
                  onClick={() => handleReset(boat.name)}
                  className="text-[10px] text-orange-300/70 bg-orange-500/10 px-1.5 py-0.5 rounded-md hover:bg-orange-500/20 transition-colors"
                >
                  reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { field: "greenMax",  label: "Green ≤", dot: "bg-green-500" },
                { field: "yellowMax", label: "Yellow ≤", dot: "bg-yellow-400" },
                { field: "redAbove",  label: "Red >", dot: "bg-red-500" },
              ].map(({ field, label, dot }) => (
                <div key={field} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-[10px] text-white/40">{label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={getVal(boat.name, field)}
                      onChange={e => handleChange(boat.name, field, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-white/25"
                    />
                    <span className="text-white/30 text-[10px]">kn</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-4 w-full py-2.5 rounded-2xl text-sm font-bold transition-all border disabled:opacity-50 ${saved ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-white/10 text-white hover:bg-white/15 border-white/10"}`}
      >
        {saving ? "Saving..." : saved ? "✓ Saved" : "Save Limits"}
      </button>
    </div>
  );
}