import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, isToday } from "date-fns";

export default function WeekView({ weekStart, onNavigate, onToday, getEventsForDateStr, onSelectDay, rsvpCounts, groupDots }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const showingToday = days.some(d => isToday(d));

  return (
    <div className="rounded-[28px] p-4 md:p-6 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
      <div className="flex items-center justify-between mb-5">
        <button aria-label="Previous week" onClick={() => onNavigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 border border-white/15 text-white/70 hover:bg-slate-700/80 hover:text-white transition-all">
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-base md:text-lg font-extrabold text-white tracking-wide uppercase">
            {format(days[0], "d MMM")} – {format(days[6], "d MMM yyyy")}
          </h2>
          {!showingToday && (
            <button onClick={onToday} className="text-[10px] text-cyan-300/70 hover:text-cyan-200 font-bold mt-0.5">
              ↩ Jump to this week
            </button>
          )}
        </div>
        <button aria-label="Next week" onClick={() => onNavigate(1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 border border-white/15 text-white/70 hover:bg-slate-700/80 hover:text-white transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {days.map(d => {
          const evs = getEventsForDateStr(dateStr(d));
          const today = isToday(d);
          return (
            <button
              key={dateStr(d)}
              onClick={() => onSelectDay(d)}
              className={`w-full text-left flex gap-3 rounded-2xl px-4 py-3 border transition-all hover:border-cyan-400/50 ${
                today
                  ? "border-cyan-300/70 bg-sky-500/15 ring-1 ring-cyan-300/40"
                  : evs.length > 0
                    ? "border-cyan-400/30 bg-white/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="w-12 shrink-0 text-center">
                <p className={`text-[10px] font-bold uppercase tracking-wide ${today ? "text-cyan-300" : "text-cyan-200/50"}`}>{format(d, "EEE")}</p>
                <p className={`text-lg font-extrabold leading-tight ${today ? "text-cyan-300" : "text-white"}`}>{format(d, "d")}</p>
                {today && <p className="text-[8px] font-bold text-cyan-300 uppercase">Today</p>}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 py-0.5">
                {evs.length === 0 ? (
                  <p className="text-white/20 text-xs italic py-1">No events</p>
                ) : (
                  evs.map(e => (
                    <div key={e.id} className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${groupDots[e.group] || "bg-white/60"}`} />
                      <p className="text-white text-xs font-semibold truncate">{e.title}</p>
                      {e.time && <span className="text-white/40 text-[10px] shrink-0">{e.time}</span>}
                      {rsvpCounts[e.id] > 0 && (
                        <span className="text-cyan-300 text-[10px] font-bold shrink-0">{rsvpCounts[e.id]} going</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}