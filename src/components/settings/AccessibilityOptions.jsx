import { useState } from "react";
import { loadSettings, saveSettings, defaultSettings } from "@/lib/accessibility";

const SIZES = [
  { label: "Normal", value: 18 },
  { label: "Large", value: 21 },
  { label: "Extra large", value: 24 },
];

export default function AccessibilityOptions() {
  const [settings, setSettings] = useState(loadSettings);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="bg-white border-2 border-dotted border-[#141B34]/40 rounded-2xl p-6">
      <h2 className="font-display text-2xl text-[#1B2A5B]">Accessibility</h2>

      <p className="mt-5 font-bold text-[#1B2A5B]">Text size</p>
      <div className="flex flex-wrap gap-3 mt-2">
        {SIZES.map((s) => (
          <button
            key={s.value}
            onClick={() => update({ textSize: s.value })}
            className={`px-5 py-3 rounded-lg text-lg font-bold border-2 ${
              settings.textSize === s.value
                ? "bg-[#4C7CF0] border-[#4C7CF0] text-white"
                : "border-[#1B2A5B]/30 text-[#1B2A5B] hover:bg-[#4C7CF0]/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="flex items-center justify-between gap-4 mt-6 py-3 border-t border-[#141B34]/10">
        <span className="text-lg text-[#141B34]">High contrast text</span>
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={(e) => update({ highContrast: e.target.checked })}
          className="w-7 h-7 accent-[#4C7CF0]"
        />
      </label>

      <label className="flex items-center justify-between gap-4 py-3 border-t border-[#141B34]/10">
        <span className="text-lg text-[#141B34]">Underline all links</span>
        <input
          type="checkbox"
          checked={settings.underlineLinks}
          onChange={(e) => update({ underlineLinks: e.target.checked })}
          className="w-7 h-7 accent-[#4C7CF0]"
        />
      </label>

      <button
        onClick={() => update(defaultSettings)}
        className="mt-4 text-lg font-bold text-[#4C7CF0] underline"
      >
        Reset to normal
      </button>
    </div>
  );
}