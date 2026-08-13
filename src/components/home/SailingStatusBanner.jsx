import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sailboat, Pencil } from "lucide-react";
import Tilt3D from "@/components/Tilt3D";

const TRAINER_ROLES = ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"];

const STATUS_CONFIG = {
  on: {
    label: "Sailing is ON today",
    emoji: "🟢",
    classes: "bg-green-500/10 border-green-400/40 shadow-[0_0_25px_rgba(74,222,128,0.12)]",
    text: "text-green-300",
  },
  caution: {
    label: "Sailing may change — check before you travel",
    emoji: "🟡",
    classes: "bg-amber-500/10 border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.12)]",
    text: "text-amber-300",
  },
  off: {
    label: "Sailing is OFF today",
    emoji: "🔴",
    classes: "bg-red-500/10 border-red-400/40 shadow-[0_0_25px_rgba(248,113,113,0.12)]",
    text: "text-red-300",
  },
};

export default function SailingStatusBanner({ user }) {
  const [record, setRecord] = useState(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-CA");
  const isTrainer = user && TRAINER_ROLES.includes(user.role);

  useEffect(() => {
    base44.entities.SailingStatus.filter({ date: todayStr }, "-created_date", 1)
      .then(records => { if (records.length > 0) setRecord(records[0]); })
      .catch(() => {});
  }, [todayStr]);

  const setStatus = async (status) => {
    setSaving(true);
    const data = { date: todayStr, status, note: note.trim(), set_by: user.full_name || user.email };
    if (record) {
      await base44.entities.SailingStatus.update(record.id, data);
      setRecord({ ...record, ...data });
    } else {
      const created = await base44.entities.SailingStatus.create(data);
      setRecord(created);
    }
    setSaving(false);
    setEditing(false);
  };

  // Members with no status set today: show nothing
  if (!record && !isTrainer) return null;

  const cfg = record ? STATUS_CONFIG[record.status] : null;

  return (
    <Tilt3D max={5} className="mb-5">
    <div className={`rounded-2xl border p-4 ${cfg ? cfg.classes : "bg-white/5 border-white/10"}`}>
      {record && !editing && (
        <div className="flex items-start gap-3">
          <span className="text-2xl animate-gentle-sway" aria-hidden="true">{cfg.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${cfg.text}`}>{cfg.label}</p>
            {record.note && <p className="text-white/60 text-xs mt-1 leading-relaxed">{record.note}</p>}
            <p className="text-white/30 text-[10px] mt-1.5">Set by {record.set_by || "staff"}</p>
          </div>
          {isTrainer && (
            <button
              onClick={() => { setNote(record.note || ""); setEditing(true); }}
              aria-label="Update sailing status"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white shrink-0 transition-all"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      )}

      {!record && !editing && isTrainer && (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30 animate-gentle-sway">
            <Sailboat size={16} className="text-white" />
          </span>
          <div>
            <p className="text-white font-bold text-sm">Set today's sailing status</p>
            <p className="text-white/40 text-xs">Let everyone know if sailing is on</p>
          </div>
        </button>
      )}

      {editing && (
        <div>
          <p className="text-white font-bold text-sm mb-3">Sailing today?</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { key: "on", label: "On", emoji: "🟢" },
              { key: "caution", label: "Maybe", emoji: "🟡" },
              { key: "off", label: "Off", emoji: "🔴" },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                disabled={saving}
                className="min-h-[52px] rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/40 flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-50"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">{label}</span>
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note e.g. strong gusts after 2pm"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/50 focus:outline-none mb-2"
          />
          <button onClick={() => setEditing(false)} className="text-white/40 text-xs hover:text-white/60 px-1 py-1">
            Cancel
          </button>
        </div>
      )}
    </div>
    </Tilt3D>
  );
}