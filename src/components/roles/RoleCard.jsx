import { Check } from "lucide-react";

export default function RoleCard({ entry }) {
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 hover:border-cyan-400/30 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${entry.color}22`, border: `1px solid ${entry.color}55` }}
        >
          {entry.emoji}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">{entry.role}</p>
          <p className="text-white/30 text-[11px] truncate">{entry.value}</p>
        </div>
        <span
          className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: `${entry.color}22`, color: entry.color, border: `1px solid ${entry.color}44` }}
        >
          {entry.level}
        </span>
      </div>
      <ul className="space-y-1.5">
        {entry.permissions.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white/60">
            <Check size={12} className="mt-0.5 shrink-0" style={{ color: entry.color }} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}