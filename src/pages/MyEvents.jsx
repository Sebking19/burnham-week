import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fetchWithCache } from "@/lib/offlineCache";
import OfflineBanner from "@/components/OfflineBanner";
import { CalendarDays, CalendarPlus, MapPin, Clock, QrCode, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

const downloadICS = (event) => {
  const dt = event.date.replace(/-/g, "");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Corinthian Otters//EN", "BEGIN:VEVENT",
    `UID:${event.id}@corinthian-otters`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : "",
    event.time ? `DESCRIPTION:Time: ${event.time}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${event.title}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
};
import { format } from "date-fns";
import AttendeeQRCode from "@/components/AttendeeQRCode";
import Tilt3D from "@/components/Tilt3D";

const statusConfig = {
  attending: { label: "Attending", icon: CheckCircle2, color: "text-green-300", bg: "bg-green-500/10 border-green-500/20" },
  checked_in: { label: "Checked In", icon: CheckCircle2, color: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-500/20" },
  maybe: { label: "Maybe", icon: HelpCircle, color: "text-yellow-300", bg: "bg-yellow-500/10 border-yellow-500/20" },
  not_attending: { label: "Can't Attend", icon: XCircle, color: "text-red-300", bg: "bg-red-500/10 border-red-500/20" },
};

export default function MyEvents() {
  const [user, setUser] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [events, setEvents] = useState({});
  const [guests, setGuests] = useState({});
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(null); // { rsvp, event }
  const [otterUsername, setOtterUsername] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadData(u);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async (u) => {
    setLoading(true);
    const { data: cachedBundle, fromCache: cached } = await fetchWithCache(
      `my-events-${u.email}`,
      async () => {
        const [userRsvps, allRsvps, usernameRecords] = await Promise.all([
          base44.entities.RSVP.filter({ user_email: u.email }),
          base44.entities.RSVP.list(),
          base44.entities.OtterUsername.filter({ user_email: u.email }),
        ]);
        const eventIds = [...new Set(userRsvps.map(r => r.event_id))];
        const eventRecords = await Promise.all(eventIds.map(id => base44.entities.Event.filter({ id })));
        const eventMap = {};
        eventRecords.forEach(records => records.forEach(e => { eventMap[e.id] = e; }));
        const guestMap = {};
        userRsvps.forEach(r => {
          const myGuests = allRsvps.filter(g => g.user_email?.startsWith("guest_") && g.created_by === u.email && g.event_id === r.event_id);
          guestMap[r.id] = myGuests;
        });
        const username = usernameRecords.length > 0 ? usernameRecords[0].username : null;
        return { userRsvps, eventMap, guestMap, username };
      }
    );

    setFromCache(cached);
    if (cachedBundle) {
      setRsvps(cachedBundle.userRsvps);
      setEvents(cachedBundle.eventMap);
      setGuests(cachedBundle.guestMap);
      if (cachedBundle.username) setOtterUsername(cachedBundle.username);
    }
    setLoading(false);
  };

  const displayName = otterUsername || user?.full_name || user?.email;

  // Sort: upcoming first
  const sortedRsvps = [...rsvps].sort((a, b) => {
    const eA = events[a.event_id];
    const eB = events[b.event_id];
    if (!eA || !eB) return 0;
    return new Date(eA.date) - new Date(eB.date);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/40 text-sm">Loading your events...</div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>My Events</h1>
      <OfflineBanner />

      {sortedRsvps.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30 animate-gentle-drift" />
          You haven't RSVP'd to any events yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRsvps.map(rsvp => {
            const event = events[rsvp.event_id];
            if (!event) return null;
            const effectiveStatus = rsvp.status === "attending" && rsvp.checked_in ? "checked_in" : rsvp.status;
            const status = statusConfig[effectiveStatus] || statusConfig.maybe;
            const StatusIcon = status.icon;
            const isPast = event.date && new Date(event.date) < new Date(new Date().toDateString());
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const isToday = event.date === todayStr;
            const rsvpGuests = guests[rsvp.id] || [];

            return (
              <Tilt3D max={5} key={rsvp.id}>
              <div
                className={`rounded-2xl border p-4 space-y-3 ${isPast ? "opacity-50" : ""} bg-slate-900/50 ${isToday ? "border-cyan-300/60 ring-1 ring-cyan-300/40" : "border-white/10"} hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-200`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{event.title}</h3>
                      {isToday && <span className="shrink-0 text-[9px] font-black uppercase text-cyan-300 bg-cyan-500/15 border border-cyan-400/40 px-1.5 py-0.5 rounded-md">Today</span>}
                      {!isPast && !isToday && event.date && (() => {
                        const days = Math.round((new Date(event.date) - new Date(todayStr)) / 86400000);
                        return (
                          <span className="shrink-0 text-[9px] font-black uppercase text-sky-300 bg-sky-500/15 border border-sky-400/40 px-1.5 py-0.5 rounded-md">
                            {days === 1 ? "Tomorrow" : `In ${days} days`}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {event.date && (
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <CalendarDays size={10} />
                          {format(new Date(event.date), "EEE d MMM yyyy")}
                        </span>
                      )}
                      {event.time && (
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <Clock size={10} />
                          {event.time}
                        </span>
                      )}
                      {event.location && (
                        <span className="text-white/40 text-xs flex items-center gap-1">
                          <MapPin size={10} />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${status.bg} ${status.color}`}>
                    <StatusIcon size={11} />
                    {status.label}
                  </span>
                </div>

                {rsvp.status === "attending" && (!event.payment_enabled || rsvp.paid) && (
                  <button
                    onClick={() => setShowQR({ rsvp, event })}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30"
                  >
                    <QrCode size={12} />
                    {rsvpGuests.length > 0 ? `View Tickets (${1 + rsvpGuests.length})` : "View Ticket QR"}
                  </button>
                )}
                {rsvp.status === "attending" && event.payment_enabled && !rsvp.paid && (
                  <div className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                    <QrCode size={12} />
                    QR available after payment
                  </div>
                )}
                {!isPast && event.date && (
                  <button
                    onClick={() => downloadICS(event)}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/20"
                  >
                    <CalendarPlus size={12} />
                    Add to my calendar
                  </button>
                )}
              </div>
              </Tilt3D>
            );
          })}
        </div>
      )}

      {showQR && (
        <AttendeeQRCode
          rsvpId={showQR.rsvp.id}
          userName={displayName}
          eventTitle={showQR.event.title}
          guests={guests[showQR.rsvp.id] || []}
          onClose={() => setShowQR(null)}
        />
      )}
    </div>
  );
}