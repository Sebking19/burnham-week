import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PoundSterling, Users, CheckCircle2, TrendingUp, CalendarDays, RefreshCw, Upload, Download, Ticket } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import BulkImportRSVP from "@/components/BulkImportRSVP";
import OtterWeekTicketsTab from "@/components/OtterWeekTicketsTab";

export default function AdminStats() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportEventId, setExportEventId] = useState("");
  const [activeTab, setActiveTab] = useState("events");
  const [showOtterWeekTab, setShowOtterWeekTab] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin" || u?.role === "admiral" || u?.role === "owner" || u?.role === "chairman") {
        loadData();
        base44.entities.OtterWeekConfig.list().then(records => {
          if (records.length > 0) setShowOtterWeekTab(records[0].show_otter_week || u.role === "owner");
          else if (u.role === "owner") setShowOtterWeekTab(true);
        }).catch(() => {});
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Real-time subscription for RSVPs
    const unsub = base44.entities.RSVP.subscribe(() => {
      loadRsvps();
    });
    return unsub;
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadEvents(), loadRsvps()]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const loadEvents = async () => {
    const data = await base44.entities.Event.list("date", 200);
    setEvents(data.filter(e => !e.is_series_parent));
  };

  const loadRsvps = async () => {
    const data = await base44.entities.RSVP.list();
    setRsvps(data);
    setLastUpdated(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/40 text-sm">Loading stats...</div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "admiral" && user.role !== "owner" && user.role !== "chairman")) {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <div>
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-white/40 text-sm">Admin access only</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const upcomingEvents = events
    .filter(e => e.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  // Summary stats: only the next upcoming event
  const nextEvent = upcomingEvents[0] || null;
  const nextEventRsvps = nextEvent ? rsvps.filter(r => r.event_id === nextEvent.id) : [];
  const allAttending = nextEventRsvps.filter(r => r.status === "attending");
  const allMaybe = nextEventRsvps.filter(r => r.status === "maybe");
  const allCheckedIn = nextEventRsvps.filter(r => r.checked_in);

  // Revenue: only count RSVPs that have paid=true for the next event
  const totalRevenue = nextEvent && nextEvent.payment_enabled && nextEvent.payment_amount > 0
    ? rsvps.filter(r => r.event_id === nextEvent.id && r.status === "attending" && r.paid).length * (nextEvent.payment_amount || 0)
    : 0;

  const exportCSV = (event, eventRsvps) => {
    const rows = [
      ["Name", "Email", "Status", "Paid", "Checked In"],
      ...eventRsvps.map(r => [
        r.user_name || "",
        r.user_email || "",
        r.status || "",
        r.paid ? "Yes" : "No",
        r.checked_in ? "Yes" : "No",
      ])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}_${event.date}_attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-cyan-400/30 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-white/50 text-xs">{label}</p>
        <p className="text-white font-bold text-xl">{value}</p>
        {sub && <p className="text-white/30 text-[11px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="py-4 space-y-5">
      {showImport && (
        <BulkImportRSVP
          events={events}
          onClose={() => { setShowImport(false); loadData(); }}
        />
      )}

      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-cyan-400/40 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">Export Attendees</h2>
                <p className="text-white/40 text-xs mt-0.5">Download a CSV of attendees for an event</p>
              </div>
              <button onClick={() => setShowExport(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white/70 transition-all">✕</button>
            </div>
            <div>
              <label className="block text-xs text-white/50 font-semibold mb-1.5">Select Event</label>
              <select
                value={exportEventId}
                onChange={e => setExportEventId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
              >
                <option value="">— Choose an event —</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title} · {ev.date}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowExport(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button
                disabled={!exportEventId}
                onClick={() => {
                  const ev = events.find(e => e.id === exportEventId);
                  const eventRsvps = rsvps.filter(r => r.event_id === exportEventId);
                  exportCSV(ev, eventRsvps);
                  setShowExport(false);
                  setExportEventId("");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={12} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Stats</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all"
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
          >
            <Upload size={12} />
            Import
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-white/60 border border-white/10 hover:bg-white/20 transition-all"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-900/70 border border-cyan-400/25 rounded-full p-1.5 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
        <button
          onClick={() => setActiveTab("events")}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === "events" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/40" : "text-white/40 hover:text-white/70"}`}
        >
          Event Stats
        </button>
        {showOtterWeekTab && (
          <button
            onClick={() => setActiveTab("otter_tickets")}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === "otter_tickets" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/40" : "text-white/40 hover:text-white/70"}`}
          >
            <Ticket size={11} /> 🦦 Tickets
          </button>
        )}
      </div>

      {activeTab === "otter_tickets" && <OtterWeekTicketsTab user={user} />}

      {activeTab === "events" && lastUpdated && (
        <p className="text-white/25 text-[11px]">Live • Last updated {format(lastUpdated, "HH:mm:ss")}</p>
      )}

      {activeTab === "events" && (
      <>
      {/* Summary cards — next upcoming event only */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide">Next Event Summary</h2>
        {nextEvent && <p className="text-white/30 text-xs">{nextEvent.title} · {format(new Date(nextEvent.date), "EEE d MMM")}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={PoundSterling} label="Est. Revenue" value={`£${totalRevenue.toFixed(2)}`} sub="paid attendees" color="bg-yellow-500/20 text-yellow-300" />
        <StatCard icon={Users} label="Attending" value={allAttending.length} sub="next event" color="bg-green-500/20 text-green-300" />
        <StatCard icon={CheckCircle2} label="Checked In" value={allCheckedIn.length} sub={`of ${allAttending.length} attending`} color="bg-blue-500/20 text-blue-300" />
        <StatCard icon={TrendingUp} label="Maybe" value={allMaybe.length} sub="undecided" color="bg-orange-500/20 text-orange-300" />
      </div>

      {/* Per-event breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide">Upcoming Events</h2>
        {upcomingEvents.length === 0 && (
          <div className="text-white/30 text-sm text-center py-8">No upcoming RSVP events</div>
        )}
        {upcomingEvents.map(event => {
          const eventRsvps = rsvps.filter(r => r.event_id === event.id);
          const attending = eventRsvps.filter(r => r.status === "attending");
          const maybe = eventRsvps.filter(r => r.status === "maybe");
          const notAttending = eventRsvps.filter(r => r.status === "not_attending");
          const checkedIn = attending.filter(r => r.checked_in);
          const checkInPct = attending.length > 0 ? Math.round((checkedIn.length / attending.length) * 100) : 0;
          const paidAttending = eventRsvps.filter(r => r.status === "attending" && r.paid);
          const revenue = event.payment_enabled && event.payment_amount > 0
            ? paidAttending.length * event.payment_amount
            : null;
          const total = eventRsvps.length;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-cyan-400/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-semibold text-sm">{event.title}</p>
                  <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                    <CalendarDays size={10} />
                    {format(new Date(event.date), "EEE d MMM")}
                    {event.time && ` · ${event.time}`}
                  </p>
                </div>
                {revenue !== null && (
                  <span className="text-yellow-300 text-xs font-bold bg-yellow-500/15 border border-yellow-500/20 px-2 py-1 rounded-lg flex-shrink-0">
                    £{revenue.toFixed(2)}
                  </span>
                )}
              </div>

              {/* RSVP status bar */}
              {total > 0 && (
                <div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-1.5">
                    {attending.length > 0 && (
                      <div className="bg-green-500/70" style={{ width: `${(attending.length / total) * 100}%` }} />
                    )}
                    {maybe.length > 0 && (
                      <div className="bg-yellow-500/70" style={{ width: `${(maybe.length / total) * 100}%` }} />
                    )}
                    {notAttending.length > 0 && (
                      <div className="bg-red-500/40" style={{ width: `${(notAttending.length / total) * 100}%` }} />
                    )}
                  </div>
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-green-300">✓ {attending.length} attending</span>
                    <span className="text-yellow-300">? {maybe.length} maybe</span>
                    <span className="text-red-300/70">✗ {notAttending.length}</span>
                  </div>
                </div>
              )}

              {/* Check-in progress */}
              {attending.length > 0 && (
                <div>
                  <div className="flex justify-between text-[11px] text-white/40 mb-1">
                    <span>Check-in progress</span>
                    <span className="text-white/60">{checkedIn.length}/{attending.length} ({checkInPct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400/70 rounded-full transition-all duration-500"
                      style={{ width: `${checkInPct}%` }}
                    />
                  </div>
                </div>
              )}

              {total === 0 && (
                <p className="text-white/25 text-xs">No RSVPs yet</p>
              )}

              {/* Export CSV button */}
              {total > 0 && (
                <button
                  onClick={() => exportCSV(event, eventRsvps)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60 transition-all"
                >
                  <Download size={10} />
                  Export attendees CSV
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}