import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check } from "lucide-react";

const EMOJIS = ["🦦", "⛵", "🌊", "⚓", "🐟", "🐚", "🦈", "🐙", "🌟", "🔱", "🛟", "🏆"];
const COLORS = ["#0EA5E9", "#22D3EE", "#34D399", "#F59E0B", "#F472B6", "#A78BFA", "#F87171", "#FACC15"];

export default function AvatarPicker({ userEmail }) {
  const [record, setRecord] = useState(null);
  const [emoji, setEmoji] = useState("🦦");
  const [color, setColor] = useState("#0EA5E9");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.OtterUsername.filter({ user_email: userEmail }).then(records => {
      if (records.length > 0) {
        setRecord(records[0]);
        if (records[0].avatar_emoji) setEmoji(records[0].avatar_emoji);
        if (records[0].avatar_color) setColor(records[0].avatar_color);
      }
    }).catch(() => {});
  }, [userEmail]);

  const handleSave = async () => {
    setSaving(true);
    if (record) {
      await base44.entities.OtterUsername.update(record.id, { avatar_emoji: emoji, avatar_color: color });
    } else {
      const created = await base44.entities.OtterUsername.create({ user_email: userEmail, avatar_emoji: emoji, avatar_color: color });
      setRecord(created);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-gentle-drift"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
        >
          {emoji}
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Otter Avatar</h3>
          <p className="text-white/40 text-xs">Shown next to your name on the feed</p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2 mb-4">
        {EMOJIS.map(e => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            aria-label={`Choose avatar ${e}`}
            className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all border ${
              emoji === e ? "bg-cyan-500/20 border-cyan-400/50" : "bg-white/5 border-transparent hover:bg-white/10"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={`Choose colour ${c}`}
            className={`w-9 h-9 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/30 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saved ? <><Check size={14} /> Saved!</> : saving ? "Saving..." : "Save Avatar"}
      </button>
    </div>
  );
}