import { useState } from "react";
import { Glasses } from "lucide-react";

export default function SimpleModeCard() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("simple_mode") === "true");

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("simple_mode", String(next));
    if (next) document.documentElement.setAttribute("data-simple-mode", "true");
    else document.documentElement.removeAttribute("data-simple-mode");
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Glasses size={15} className="text-cyan-400/70" />
        <h2 className="text-sm font-bold text-white">Simple Mode</h2>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-white/70 text-sm">Bigger text &amp; buttons</p>
          <p className="text-white/30 text-xs mt-0.5">Easier to read for all ages — just for this device</p>
        </div>
        <button
          onClick={toggle}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle Simple Mode"
          className={`relative w-14 h-8 rounded-full border transition-all shrink-0 ${enabled ? "bg-cyan-500/40 border-cyan-400/60" : "bg-white/5 border-white/15"}`}
        >
          <span
            className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ${enabled ? "left-7 bg-gradient-to-br from-sky-400 to-cyan-300 shadow-md shadow-cyan-500/50" : "left-1 bg-white/40"}`}
          />
        </button>
      </div>
    </div>
  );
}