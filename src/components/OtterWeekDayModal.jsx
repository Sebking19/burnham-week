import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plus, X, MapPin, Clock, Anchor, ExternalLink, Pencil, Trash2 } from "lucide-react";

export default function OtterWeekDayModal({ day, raceValue, onRaceChange, canManage, canEditRaces, onClose, onAddForDay, onEditEvent, onDeleteEvent }) {
  const [expandedEvent, setExpandedEvent] = useState(null);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${day.name} schedule`}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[82vh] flex flex-col rounded-3xl border border-cyan-400/20 overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgb(12,30,55) 0%, rgb(8,18,36) 100%)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">{day.name}</h2>
            <p className="text-cyan-300/60 text-xs mt-0.5">
              {day.date.getDate()} July · Otter Week
            </p>
          </div>
          <button
            aria-label="Close day view"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Races */}
          <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-2xl px-4 py-3">
            <label htmlFor={`races-${day.dateStr}`} className="flex items-center gap-1.5 text-xs text-cyan-300/80 font-semibold mb-2">
              <Anchor size={12} /> Races
            </label>
            <input
              id={`races-${day.dateStr}`}
              type="text"
              value={raceValue || ""}
              onChange={e => onRaceChange(day.dateStr, e.target.value)}
              placeholder={canEditRaces ? "Enter number or name..." : "Not set"}
              disabled={!canEditRaces}
              className={`w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400/40 ${canEditRaces ? "text-white placeholder-white/30" : "text-white/40 cursor-not-allowed"}`}
            />
          </div>

          {/* Events */}
          {day.dayEvents.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No events scheduled for this day yet.</p>
          ) : (
            day.dayEvents.map(event => {
              const isOpen = expandedEvent === event.id;
              return (
                <div key={event.id} className="bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedEvent(isOpen ? null : event.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white text-sm">{event.title}</p>
                      {event.time && (
                        <span className="flex items-center gap-1 text-cyan-300/70 text-xs shrink-0">
                          <Clock size={11} /> {event.time}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <p className="flex items-center gap-1 text-white/40 text-xs mt-1">
                        <MapPin size={11} /> {event.location}
                      </p>
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pt-1 border-t border-white/10 space-y-2">
                      {event.info && <p className="text-white/60 text-xs leading-relaxed">{event.info}</p>}
                      {event.link && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs underline"
                        >
                          More info <ExternalLink size={11} />
                        </a>
                      )}
                      {event.type && <p className="text-white/35 text-[10px] uppercase tracking-wide">{event.type}</p>}
                      {canManage && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => onEditEvent(event)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition-colors"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition-colors"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {canManage && (
          <div className="px-6 pb-6 pt-2 flex-shrink-0" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <button
              onClick={() => onAddForDay(day.date, day.name)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus size={15} /> Add Event to {day.name}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}