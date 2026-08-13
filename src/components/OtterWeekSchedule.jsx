import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Waves, Anchor, Clock } from "lucide-react";
import OtterWeekDayModal from "@/components/OtterWeekDayModal";

// Otter Week 2026: Saturday 25 July → Friday 31 July
const OTTER_WEEK_START = new Date(2026, 6, 25);
const DAY_NAMES = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Local date string (avoids UTC off-by-one from toISOString in BST)
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Parse time text into minutes ("9:00", "09.30", "9am", "2pm") — null if no time
function timeToMinutes(t) {
  if (!t) return null;
  const m = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i.exec(t);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = m[2] ? parseInt(m[2]) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

export default function OtterWeekSchedule({ events, races, onRaceChange, canManage, canEditRaces, onBack, onAddGeneral, onAddForDay, onEditEvent, onDeleteEvent }) {
  const [expandedDay, setExpandedDay] = useState(null);

  const days = DAY_NAMES.map((name, idx) => {
    const date = new Date(OTTER_WEEK_START);
    date.setDate(date.getDate() + idx);
    const dateStr = fmtDate(date);
    const today = fmtDate(new Date());
    const dayEvents = events
      .filter(e => e.date === dateStr && e.date >= today && !e.is_series_parent)
      .sort((a, b) => {
        const ta = timeToMinutes(a.time);
        const tb = timeToMinutes(b.time);
        if (ta !== null && tb !== null) return ta - tb; // both timed: earliest first
        if (ta !== null) return -1; // timed events above untimed
        if (tb !== null) return 1;
        return new Date(a.created_date) - new Date(b.created_date); // untimed: order added
      });
    return { name, date, dateStr, dayEvents };
  });

  const expanded = expandedDay !== null ? days[expandedDay] : null;

  return (
    <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-b from-cyan-500/[0.08] via-blue-600/[0.05] to-transparent p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="min-h-[36px] px-2 -ml-2 rounded-lg text-white/40 hover:text-white text-sm font-semibold transition-colors">
          ← Back
        </button>
        {canManage && (
          <button
            onClick={onAddGeneral}
            className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 transition-colors px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            <Plus size={14} /> Add Event
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Waves size={20} className="text-cyan-400" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-white">Otter Week</h2>
      </div>
      <p className="text-cyan-300/50 text-xs mb-5">Sat 25 – Fri 31 July · Swipe through the days</p>

      {/* Day carousel */}
      <div
        className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 nav-scroll"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        role="list"
        aria-label="Otter Week days"
      >
        {days.map((day, idx) => (
          <button
            key={day.dateStr}
            role="listitem"
            onClick={() => setExpandedDay(idx)}
            aria-label={`${day.name} ${day.date.getDate()} July, ${day.dayEvents.length} event${day.dayEvents.length === 1 ? "" : "s"}`}
            className="flex-shrink-0 w-[72vw] max-w-[250px] min-h-[230px] flex flex-col text-left rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-blue-900/20 hover:border-cyan-300/40 hover:from-cyan-500/20 transition-all p-4"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-base font-bold text-white">{day.name}</h3>
              <span className="text-[10px] font-semibold text-cyan-300/70 bg-cyan-500/15 border border-cyan-400/20 rounded-full px-2 py-0.5">
                {day.date.getDate()} Jul
              </span>
            </div>
            <p className="flex items-center gap-1 text-[11px] text-white/40 mb-3">
              <Anchor size={10} className="text-cyan-400/60" aria-hidden="true" />
              Races · {races[day.dateStr] || "—"}
            </p>
            <div className="flex-1 space-y-2 overflow-hidden mb-3">
              {day.dayEvents.length === 0 ? (
                <p className="text-white/25 text-xs italic">No events yet</p>
              ) : (
                <>
                  {day.dayEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs">
                      <p className="font-semibold text-white truncate">{event.title}</p>
                      {event.time && (
                        <p className="flex items-center gap-1 text-cyan-300/60 text-[10px] mt-0.5">
                          <Clock size={9} aria-hidden="true" /> {event.time}
                        </p>
                      )}
                    </div>
                  ))}
                  {day.dayEvents.length > 3 && (
                    <p className="text-cyan-300/50 text-[10px] font-semibold px-1">+{day.dayEvents.length - 3} more</p>
                  )}
                </>
              )}
            </div>
            <p className="text-[10px] text-white/35 text-center">Tap for details</p>
          </button>
        ))}
      </div>

      {/* Swipe dots */}
      <div className="flex justify-center gap-1.5 mt-1" aria-hidden="true">
        {days.map((day, idx) => (
          <span key={day.dateStr} className={`h-1.5 rounded-full transition-all ${idx === (expandedDay ?? -1) ? "w-4 bg-cyan-400" : "w-1.5 bg-white/20"}`} />
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <OtterWeekDayModal
            day={expanded}
            raceValue={races[expanded.dateStr]}
            onRaceChange={onRaceChange}
            canManage={canManage}
            canEditRaces={canEditRaces}
            onClose={() => setExpandedDay(null)}
            onAddForDay={(date, dayName) => { setExpandedDay(null); onAddForDay(date, dayName); }}
            onEditEvent={(event) => { setExpandedDay(null); onEditEvent(event); }}
            onDeleteEvent={onDeleteEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}