import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Tilt3D from "@/components/Tilt3D";
import { isUpcoming, eventSortKey } from "@/lib/eventTime";

export default function NextEventCard() {
  const navigate = useNavigate();
  const [nextEvent, setNextEvent] = useState(null);
  const [going, setGoing] = useState(0);

  useEffect(() => {
    const load = async () => {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const events = await base44.entities.Event.list("date", 200);
      const now = new Date();
      const upcoming = events
        .filter(e => !e.is_series_parent && e.date && isUpcoming(e, now))
        .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
      if (upcoming.length === 0) return;
      const ev = upcoming[0];
      setNextEvent(ev);
      const rs = await base44.entities.RSVP.filter({ event_id: ev.id, status: "attending" });
      setGoing(rs.length);
    };
    load().catch(() => {});
  }, []);

  if (!nextEvent) return null;

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const isToday = nextEvent.date === todayStr;
  const [y, m, day] = nextEvent.date.split("-").map(Number);
  const eventDate = new Date(y, m - 1, day);

  return (
    <Tilt3D max={6} className="mb-5">
    <button
      onClick={() => navigate("/Schedule")}
      className="w-full text-left rounded-2xl p-4 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:border-cyan-300/60 transition-all flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/40 flex flex-col items-center justify-center shrink-0">
        <span className="text-[9px] font-black text-white/80 uppercase leading-none">{format(eventDate, "MMM")}</span>
        <span className="text-lg font-black text-white leading-tight">{format(eventDate, "d")}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300/70">
            {isToday ? "Happening Today" : "Next Event"}
          </p>
          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />}
        </div>
        <p className="text-white font-bold text-sm truncate mt-0.5">{nextEvent.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-white/40">
          {nextEvent.time && <span className="flex items-center gap-1"><Clock size={9} />{nextEvent.time}</span>}
          {nextEvent.location && <span className="flex items-center gap-1 truncate"><MapPin size={9} />{nextEvent.location}</span>}
          {going > 0 && <span className="text-cyan-300 font-bold">{going} going</span>}
        </div>
      </div>
      <ChevronRight size={16} className="text-cyan-300/50 shrink-0" />
    </button>
    </Tilt3D>
  );
}