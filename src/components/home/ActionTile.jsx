import { ArrowRight } from "lucide-react";

export default function ActionTile({ icon: Icon, title, subtitle, gradient, shadow, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      className="group relative flex flex-col justify-between text-left w-full h-full rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] hover:border-white/20 active:scale-[0.97] transition-all duration-200 p-4 min-h-[128px] overflow-hidden"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${gradient}`} aria-hidden="true" />
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} ${shadow} shadow-lg flex items-center justify-center`}>
        <Icon size={20} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="mt-3">
        <p className="text-white font-bold text-sm leading-tight">{title}</p>
        <p className="flex items-center gap-1 text-white/40 text-[11px] mt-0.5">
          {subtitle}
          <ArrowRight size={10} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </p>
      </div>
    </button>
  );
}