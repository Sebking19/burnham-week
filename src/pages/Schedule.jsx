import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import EventEditor from "@/components/schedule/EventEditor";

const DATES = [
  "2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31",
  "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05",
];

export default function Schedule() {
  const [events, setEvents] = useState(null);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(null); // { date, event? }

  const load = () => base44.entities.WeekEvent.list().then(setEvents);

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user && (user.role === "admin" || user.role === "owner");
  const today = format(new Date(), "yyyy-MM-dd");

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    await base44.entities.WeekEvent.delete(id);
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-[#0E2A4E]">Week Schedule</h1>
        <p className="text-lg text-slate-600 mt-1">Burnham Week · 29 August – 5 September 2026</p>
      </div>

      {events === null ? (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex items-center gap-3 text-lg text-slate-600">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-[#0E2A4E] rounded-full animate-spin" />
          Loading the schedule...
        </div>
      ) : (
        DATES.map(date => {
          const dayEvents = events
            .filter(e => e.date === date)
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          const isToday = date === today;
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-xl font-bold ${isToday ? "text-white bg-[#0E2A4E] px-3 py-1 rounded-xl" : "text-[#0E2A4E]"}`}>
                  {format(parseISO(date), "EEEE d MMMM")}{isToday ? " — Today" : ""}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setEditing({ date })}
                    aria-label={`Add event on ${date}`}
                    className="flex items-center gap-1 text-base font-bold text-[#0E2A4E] border-2 border-[#0E2A4E] rounded-xl px-3 py-1.5 hover:bg-[#0E2A4E] hover:text-white"
                  >
                    <Plus size={18} /> Add
                  </button>
                )}
              </div>
              {dayEvents.length === 0 ? (
                <p className="text-lg text-slate-500 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3">Nothing scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map(ev => (
                    <div key={ev.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xl font-bold text-slate-900">{ev.title}</p>
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setEditing({ date, event: ev })} aria-label="Edit event" className="p-2 rounded-xl text-slate-400 hover:text-[#0E2A4E] hover:bg-slate-100">
                              <Pencil size={20} />
                            </button>
                            <button onClick={() => handleDelete(ev.id)} aria-label="Delete event" className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-lg text-slate-700">
                        {ev.time && <span className="flex items-center gap-1.5"><Clock size={20} className="text-[#0E2A4E]" />{ev.time}</span>}
                        {ev.location && <span className="flex items-center gap-1.5"><MapPin size={20} className="text-[#0E2A4E]" />{ev.location}</span>}
                      </div>
                      {ev.details && <p className="text-lg text-slate-600 mt-2">{ev.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {editing && (
        <EventEditor
          date={editing.date}
          event={editing.event}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}