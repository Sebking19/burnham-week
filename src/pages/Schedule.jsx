import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { fetchWithCache } from "@/lib/offlineCache";
import OfflineBanner from "@/components/OfflineBanner";
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Pencil, Calendar, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SelectDrawer from "@/components/SelectDrawer";
import EventRSVP from "@/components/EventRSVP";
import EventComments from "@/components/EventComments";
import MapView from "@/components/MapView";
import EventsMap from "@/components/EventsMap";
import PushNotificationManager from "@/components/PushNotificationManager";
import WeatherTideWidget from "@/components/WeatherTideWidget";
import OtterWeekSchedule from "@/components/OtterWeekSchedule";
import WeekView from "@/components/schedule/WeekView";
import { usePullToRefresh } from "@/components/PullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import { eventSortKey } from "@/lib/eventTime";

const TYPE_COLORS = {
  Training: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Event: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Fun: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Race: "bg-red-500/20 text-red-400 border-red-500/30",
};

const GROUP_LABELS = {
  pond: "Pond", river1: "River 1", river2: "River 2",
  race: "Race", cadets: "Cadets", fast: "Fast", trainers: "Trainers", all: "Everyone",
};

const GROUP_COLORS = {
  pond: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  river1: "bg-green-500/20 text-green-400 border-green-500/30",
  river2: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  race: "bg-red-500/20 text-red-400 border-red-500/30",
  cadets: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  fast: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  trainers: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  all: "bg-white/10 text-white/60 border-white/20",
};

const GROUP_DOTS = {
  pond: "bg-cyan-400", river1: "bg-green-400", river2: "bg-teal-400",
  race: "bg-red-400", cadets: "bg-orange-400", fast: "bg-purple-400", trainers: "bg-amber-400", all: "bg-white/70",
};

const ALL_GROUPS = ["pond", "river1", "river2", "race", "cadets", "fast"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ROLE_TO_GROUP = {
  pond: "pond", pond_trainer: "pond", pond_parent: "pond",
  river1: "river1", river1_trainer: "river1", river1_parent: "river1",
  river2: "river2", river2_trainer: "river2", river2_parent: "river2",
  race: "race", race_trainer: "race", race_parent: "race",
  cadets: "cadets", cadet_trainer: "cadets", cadet_parent: "cadets",
  fast: "fast", fast_trainer: "fast", fast_parent: "fast",
};

function getUserGroup(role) {
  if (role === "admin" || role === "admiral" || role === "owner") return null;
  return ROLE_TO_GROUP[role] || null;
}

// Returns all groups a user belongs to (primary + extras from roles array)
function getUserGroups(user) {
  if (!user) return [];
  const primary = getUserGroup(user.role);
  const extra = (user.roles || []).map(r => ROLE_TO_GROUP[r]).filter(Boolean);
  const all = [...new Set([...(primary ? [primary] : []), ...extra])];
  return all;
}

function canEdit(role, group) {
  if (role === "admin" || role === "admiral" || role === "owner") return true;
  const trainerMap = {
    pond_trainer: "pond", river1_trainer: "river1", river2_trainer: "river2",
    race_trainer: "race", cadet_trainer: "cadets", fast_trainer: "fast",
  };
  return trainerMap[role] === group;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", time: "", location: "", type: "Training", group: "all", info: "", link: "", year: new Date().getFullYear(), month: new Date().getMonth(), day: null, rsvp_enabled: false, payment_enabled: false, payment_amount: "", recurrence_type: "none", recurrence_end_date: "" });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [weekStart, setWeekStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d; });
  const [rsvpCounts, setRsvpCounts] = useState({});
  const [editScope, setEditScope] = useState("single");
  const backViewRef = useRef("month");
  const [editingEvent, setEditingEvent] = useState(null);
  const [view, setView] = useState("month");
  const [otterWeekDay, setOtterWeekDay] = useState(null); // "month" | "week" | "day"
  const [selectedDate, setSelectedDate] = useState(null);
  const [formFromOtterWeek, setFormFromOtterWeek] = useState(false);
  const [formOtterWeekDay, setFormOtterWeekDay] = useState(null);
  const [calendarView, setCalendarView] = useState("personal"); // "personal" | "universal" | "otter_week"
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState(null);
  const [expandedSeries, setExpandedSeries] = useState(null);
  const [expandedOtterDay, setExpandedOtterDay] = useState(null);
  const [otterDayRaces, setOtterDayRaces] = useState({});
  const [expandedOtterEvent, setExpandedOtterEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setSelectedGroup(getUserGroup(u?.role));
      // If user has multiple groups, default to showing all (null = all their groups)
      if ((u?.roles || []).length > 0) setSelectedGroup(null);
    }).catch(() => {});
    loadEvents();
    loadRaces();

    // RSVP counts for "N going" labels
    base44.entities.RSVP.list("-created_date", 1000).then(rs => {
      const map = {};
      rs.forEach(r => { if (r.status === "attending") map[r.event_id] = (map[r.event_id] || 0) + 1; });
      setRsvpCounts(map);
    }).catch(() => {});

    // Auto-open buy tickets if coming from home page link
    const params = new URLSearchParams(window.location.search);
    if (params.get("otter_week") === "1") {
      setCalendarView("otter_week");
      const url = new URL(window.location.href);
      url.searchParams.delete("otter_week");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const loadRaces = async () => {
    try {
      const config = await base44.entities.SettingsConfig.filter({ key: "otter_week_races" });
      if (config.length > 0) {
        setOtterDayRaces(JSON.parse(config[0].value));
      }
    } catch (err) {
      console.error("Failed to load races:", err);
    }
  };

  const saveRaces = async (races) => {
    try {
      const existing = await base44.entities.SettingsConfig.filter({ key: "otter_week_races" });
      if (existing.length > 0) {
        await base44.entities.SettingsConfig.update(existing[0].id, { value: JSON.stringify(races) });
      } else {
        await base44.entities.SettingsConfig.create({ key: "otter_week_races", value: JSON.stringify(races) });
      }
    } catch (err) {
      console.error("Failed to save races:", err);
    }
  };

  const [eventsFromCache, setEventsFromCache] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data, fromCache } = await fetchWithCache(
      'schedule-events',
      () => base44.entities.Event.list("-created_date", 200)
    );
    if (data) setEvents(data);
    setEventsFromCache(fromCache);
  }, []);

  const { pullY, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(loadEvents);

  const isAdmin = user?.role === "admin" || user?.role === "admiral" || user?.role === "owner";
  const isChairman = user?.role === "chairman";
  const isTrainerRole = !!user && ["owner", "admin", "admiral", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);
  const isViewer = user?.role === "viewer";
  const userGroup = getUserGroup(user?.role);
  const userGroups = getUserGroups(user); // all groups including extras

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const canEditCurrent = (isAdmin || isChairman || (user?.role && canEdit(user?.role, userGroup)));

  // For personal view: if a specific group is selected use it, otherwise match any of user's groups
  const activeGroup = calendarView === "universal" ? "all" : (calendarView === "otter_week" ? "all" : ((isAdmin || isChairman || isViewer) ? (selectedGroup || "all") : selectedGroup));
  const canEditCurrent2 = calendarView === "otter_week" ? (isAdmin || isChairman) : canEditCurrent;

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getEventsForDateStr = (dateStr) => {
    return events.filter(e => {
      if (e.date !== dateStr) return false;
      if (e.date < todayStr) return false; // finished events disappear
      if (!matchesSearch(e)) return false;
      // Trainers-only events are hidden from regular members
      if (e.group === "trainers") return isTrainerRole && (!activeGroup || activeGroup === "all" || activeGroup === "trainers");
      if (activeGroup === "all") return true;
      if (activeGroup) return e.group === activeGroup || e.group === "all";
      // No specific group selected in personal view — show all user's groups
      if (isAdmin || isChairman || isViewer) return true;
      if (userGroups.length === 0) return true;
      return e.group === "all" || userGroups.includes(e.group);
    });
  };

  const getEventsForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (calendarView === "otter_week") {
      // Otter Week 2026: Sat 25 July – Fri 31 July
      return events.filter(e => e.date >= "2026-07-25" && e.date <= "2026-07-31" && e.date >= todayStr && matchesSearch(e) && (e.group !== "trainers" || isTrainerRole));
    }
    return getEventsForDateStr(dateStr);
  };

  const matchesSearch = (event) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return event.title.toLowerCase().includes(query) || 
           (event.location && event.location.toLowerCase().includes(query)) || 
           (event.type && event.type.toLowerCase().includes(query));
  };

  const generateRecurringInstances = (baseEvent, recurrenceType, endDate) => {
    const instances = [];
    const start = new Date(baseEvent.date);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current <= end) {
      // Local date string — toISOString shifts a day back in BST
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][current.getDay()];
      instances.push({
        ...baseEvent,
        date: dateStr,
        day: dayName,
      });

      switch (recurrenceType) {
        case "daily":
          current.setDate(current.getDate() + 1);
          break;
        case "weekly":
          current.setDate(current.getDate() + 7);
          break;
        case "monthly":
          current.setMonth(current.getMonth() + 1);
          break;
        case "yearly":
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          return instances;
      }
    }

    return instances;
  };

  const handleAdd = async () => {
    if (!form.title || !form.day) return;
    const dayOfWeekIndex = new Date(form.year || currentYear, form.month, form.day).getDay();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeekIndex];
    const dateStr = `${form.year || currentYear}-${String(form.month + 1).padStart(2, '0')}-${String(form.day).padStart(2, '0')}`;
    const eventGroup = (isAdmin || isChairman) ? form.group : userGroup;
    const eventRole = user?.role;
    const canCreateEvent = eventRole === "admin" || eventRole === "admiral" || eventRole === "owner" || eventRole === "chairman" || canEdit(eventRole, userGroup);
    
    const baseEvent = { 
      title: form.title, 
      day: dayName, 
      date: dateStr, 
      time: form.time, 
      location: form.location, 
      type: form.type, 
      group: eventGroup, 
      info: form.info, 
      link: form.link, 
      rsvp_enabled: form.rsvp_enabled,
      payment_enabled: form.rsvp_enabled ? form.payment_enabled : false,
      payment_amount: form.rsvp_enabled && form.payment_enabled ? parseFloat(form.payment_amount) || 0 : 0,
      recurrence_type: form.recurrence_type || "none"
    };

    if (form.recurrence_type && form.recurrence_type !== "none" && form.recurrence_end_date) {
      // Create series parent
      const parentEvent = await base44.entities.Event.create({
        ...baseEvent,
        is_series_parent: true,
        recurrence_end_date: form.recurrence_end_date
      });

      // Generate and create instances
      const instances = generateRecurringInstances({ ...baseEvent, series_parent_id: parentEvent.id }, form.recurrence_type, form.recurrence_end_date);
      for (const instance of instances) {
        await base44.entities.Event.create(instance);
      }

      setEvents(prev => [...prev, parentEvent, ...instances]);
    } else {
      const created = await base44.entities.Event.create(baseEvent);
      setEvents(prev => [...prev, created]);
    }

    setShowForm(false);
    setFormFromOtterWeek(false);
    setForm({ title: "", time: "", location: "", type: "Training", group: "all", info: "", link: "", year: currentYear, month: currentMonth, day: null, rsvp_enabled: false, payment_enabled: false, payment_amount: "", recurrence_type: "none", recurrence_end_date: "" });
  };

  const handleDelete = async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await base44.entities.Event.delete(id);
  };

  const handleEdit = (event) => {
    // Parse date parts directly — new Date("YYYY-MM-DD") is UTC and can shift a day
    const [evYear, evMonth, evDay] = (event.date || "").split("-").map(Number);
    const d = { getMonth: () => (evMonth || 1) - 1, getDate: () => evDay || 1 };
    setEditingEvent(event);
    setEditScope("single");
    setForm({
      title: event.title || "",
      time: event.time || "",
      location: event.location || "",
      type: event.type || "Training",
      group: event.group || "all",
      info: event.info || "",
      link: event.link || "",
      year: evYear || new Date().getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      rsvp_enabled: event.rsvp_enabled || false,
      payment_enabled: event.payment_enabled || false,
      payment_amount: event.payment_amount ? event.payment_amount.toString() : "",
      recurrence_type: event.recurrence_type || "none",
      recurrence_end_date: event.recurrence_end_date || "",
    });
    setShowForm(true);
  };

  const handleSaveEdit = async () => {
   if (!editingEvent || !form.title || !form.day) return;
   const dayOfWeekIndex = new Date(form.year || currentYear, form.month, form.day).getDay();
   const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayOfWeekIndex];
   const dateStr = `${form.year || currentYear}-${String(form.month + 1).padStart(2,'0')}-${String(form.day).padStart(2,'0')}`;
   const updated = { title: form.title, day: dayName, date: dateStr, time: form.time, location: form.location, type: form.type, group: form.group, info: form.info, link: form.link, rsvp_enabled: form.rsvp_enabled, payment_enabled: form.rsvp_enabled ? form.payment_enabled : false, payment_amount: form.rsvp_enabled && form.payment_enabled ? parseFloat(form.payment_amount) || 0 : 0 };
   const parentId = editingEvent.series_parent_id || (editingEvent.is_series_parent ? editingEvent.id : null);
   if (parentId && editScope === "future") {
     // Apply shared fields (not date/day) to this and all future events in the series
     const { day: _day, date: _date, ...sharedFields } = updated;
     await base44.entities.Event.update(editingEvent.id, updated);
     const siblings = events.filter(e => e.id !== editingEvent.id && (e.series_parent_id === parentId || e.id === parentId) && e.date >= editingEvent.date);
     if (siblings.length > 0) {
       await base44.entities.Event.bulkUpdate(siblings.map(s => ({ id: s.id, ...sharedFields })));
     }
     const siblingIds = new Set(siblings.map(s => s.id));
     setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...updated } : siblingIds.has(e.id) ? { ...e, ...sharedFields } : e));
   } else {
     await base44.entities.Event.update(editingEvent.id, updated);
     setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...updated } : e));
   }
   setShowForm(false);
   setFormFromOtterWeek(false);
   setEditingEvent(null);
   setForm({ title: "", time: "", location: "", type: "Training", group: "all", info: "", link: "", year: new Date().getFullYear(), month: new Date().getMonth(), day: null, rsvp_enabled: false, payment_enabled: false, payment_amount: "", recurrence_type: "none", recurrence_end_date: "" });
  };

  const handleExportICS = async (event) => {
    try {
      const response = await base44.functions.invoke('generateICS', { eventId: event.id });
      const icsContent = response.data;
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      console.error('Failed to export ICS:', err);
      alert('Failed to export event');
    }
  };

  return (
    <div className="py-2" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <OfflineBanner />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Calendar {currentYear}</h1>
          <p className="text-cyan-200/40 text-sm mt-0.5">{calendarView === "universal" ? "Everyone" : (GROUP_LABELS[activeGroup] || "My Group")}</p>
        </div>
        <div className="flex gap-2 items-center">
          {user && <PushNotificationManager user={user} />}
          {canEditCurrent2 && calendarView !== "otter_week" && (
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setFormFromOtterWeek(false);
                  setForm(f => ({ ...f, year: currentYear, month: currentMonth, day: selectedDate || null }));
                  setShowForm(true);
                }}
                aria-label="Add event"
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/40 hover:opacity-90 flex items-center justify-center transition-all text-white"
              >
                <Plus size={18} />
              </button>
            )}
        </div>
      </div>

      {calendarView !== "map" && <div className="flex gap-2 mb-5">
        <input 
          type="text" 
          placeholder="Search by title, location, or type..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="flex-1 bg-slate-900/60 border border-cyan-400/25 rounded-full px-5 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60"
        />

      </div>}

      <div className="flex gap-1 mb-5 p-1.5 rounded-full bg-slate-900/70 border border-cyan-400/25 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
        {[
          { key: "personal", label: "My Group" },
          { key: "universal", label: "Everyone" },
          { key: "otter_week", label: "Otter Week" },
          { key: "map", label: "Map" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setCalendarView(key); setView("month"); }}
            className={`flex-1 py-2.5 px-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${calendarView === key ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/40" : "text-white/60 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

        {calendarView === "personal" && (isAdmin || isChairman || isViewer || userGroups.length > 1) && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button onClick={() => setSelectedGroup(null)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedGroup === null ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"}`}>
            All
          </button>
          {(isAdmin || isChairman || isViewer ? ALL_GROUPS : userGroups).map(g => (
            <button key={g} onClick={() => setSelectedGroup(g)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedGroup === g ? `${GROUP_COLORS[g]}` : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"}`}>
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      )}

      {(calendarView === "personal" || calendarView === "universal") && view !== "day" && (
        <div className="flex gap-1 mb-5 p-1 rounded-full bg-slate-900/70 border border-white/10 w-fit">
          {[{ key: "month", label: "Month" }, { key: "week", label: "Week" }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                if (key === "week") { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); setWeekStart(d); }
                setView(key);
              }}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${view === key ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-md shadow-cyan-500/30" : "text-white/50 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {calendarView === "map" && (
          <motion.div key="events-map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="rounded-[28px] p-5 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
              <h2 className="text-lg font-bold text-white mb-1">Events Map</h2>
              <p className="text-white/40 text-xs mb-4">Upcoming events, race locations &amp; club facilities</p>
              <EventsMap events={isTrainerRole ? events : events.filter(e => e.group !== "trainers")} showFacilities={true} />
            </div>
          </motion.div>
        )}

         {calendarView === "otter_week" && view === "month" && (
           <motion.div key="otter-week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.33, 0.66, 0.66, 1] }}>
           {/* Show Otter Week weather only within 16 days of July 26 */}
           {(() => {
             const otterStart = new Date('2026-07-26');
             const today = new Date();
             const daysAway = (otterStart - today) / (1000 * 60 * 60 * 24);
             return daysAway <= 16 ? (
               <WeatherTideWidget mode="otter_week" title="Otter Week Forecast · 26–31 July" />
             ) : (
               <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-4 mb-0 text-center">
                 <p className="text-white/30 text-xs">🌊 Otter Week weather & tides will appear here closer to the time</p>
                 <p className="text-white/20 text-[10px] mt-1">{Math.ceil(daysAway - 16)} days until forecast is available</p>
               </div>
             );
           })()}
           <div className="mt-4">
             <OtterWeekSchedule
               events={isTrainerRole ? events : events.filter(e => e.group !== "trainers")}
               races={otterDayRaces}
               onRaceChange={(dateStr, value) => {
                 const updated = { ...otterDayRaces, [dateStr]: value };
                 setOtterDayRaces(updated);
                 saveRaces(updated);
               }}
               canManage={isAdmin || isChairman}
               canEditRaces={isAdmin || isChairman || user?.role === "owner"}
               onBack={() => setCalendarView("personal")}
               onAddGeneral={() => {
                 setEditingEvent(null);
                 setFormFromOtterWeek(false);
                 setForm(f => ({ ...f, year: 2026, month: 6, day: 25 }));
                 setShowForm(true);
               }}
               onAddForDay={(date, dayName) => {
                 setEditingEvent(null);
                 setForm({ title: "", time: "", location: "", type: "Training", group: "all", info: "", link: "", year: date.getFullYear(), month: date.getMonth(), day: date.getDate(), rsvp_enabled: false, payment_enabled: false, payment_amount: "", recurrence_type: "none", recurrence_end_date: "" });
                 setFormFromOtterWeek(true);
                 setFormOtterWeekDay(dayName);
                 setShowForm(true);
               }}
               onEditEvent={handleEdit}
               onDeleteEvent={handleDelete}
             />
           </div>
           </motion.div>
         )}
         {view === "month" && calendarView !== "otter_week" && (
          <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.33, 0.66, 0.66, 1] }}>
            <div className="rounded-[28px] p-4 md:p-6 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
              <div className="flex items-center justify-between mb-5">
                <button aria-label="Previous month" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else { setCurrentMonth(m => m - 1); } }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 border border-white/15 text-white/70 hover:bg-slate-700/80 hover:text-white transition-all">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex flex-col items-center">
                  <h2 className="text-lg md:text-xl font-extrabold text-white tracking-[0.15em] uppercase">{MONTHS[currentMonth]} {currentYear}</h2>
                  {(currentMonth !== new Date().getMonth() || currentYear !== new Date().getFullYear()) && (
                    <button
                      onClick={() => { const t = new Date(); setCurrentMonth(t.getMonth()); setCurrentYear(t.getFullYear()); }}
                      className="text-[10px] text-cyan-300/70 hover:text-cyan-200 font-bold mt-0.5"
                    >
                      ↩ Jump to today
                    </button>
                  )}
                </div>
                <button aria-label="Next month" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else { setCurrentMonth(m => m + 1); } }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 border border-white/15 text-white/70 hover:bg-slate-700/80 hover:text-white transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-cyan-200/60 text-[11px] font-bold uppercase tracking-wider py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array(firstDay).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {Array(daysInMonth).fill(null).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const t = new Date();
                  const isToday = day === t.getDate() && currentMonth === t.getMonth() && currentYear === t.getFullYear();
                  const dayGroups = [...new Set(dayEvents.map(e => e.group))].slice(0, 3);
                  const going = dayEvents.reduce((sum, e) => sum + (rsvpCounts[e.id] || 0), 0);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        backViewRef.current = "month";
                        setSelectedDate(day);
                        setView("day");
                      }}
                      className={`aspect-square rounded-xl p-1.5 transition-all flex flex-col items-center justify-start text-center border overflow-hidden ${isToday ? "ring-2 ring-cyan-300 " : ""}${dayEvents.length > 0 ? "bg-gradient-to-b from-sky-500/40 to-cyan-400/15 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)] hover:from-sky-500/55" : "bg-slate-700/30 border-white/10 hover:bg-slate-600/40"}`}
                    >
                      <span className={`text-sm font-semibold ${isToday ? "text-cyan-300" : "text-white"}`}>{day}</span>
                      {dayGroups.length > 0 && (
                        <span className="flex gap-0.5 mt-0.5">
                          {dayGroups.map(g => (
                            <span key={g} className={`w-1.5 h-1.5 rounded-full ${GROUP_DOTS[g] || "bg-white/60"}`} />
                          ))}
                        </span>
                      )}
                      {dayEvents.length > 0 && (
                        <span className="w-full text-[8px] font-bold bg-cyan-300 text-slate-900 px-1 py-0.5 rounded-md mt-0.5 leading-tight truncate">
                          {dayEvents.length === 1 ? dayEvents[0].title : `${dayEvents.length} events`}
                        </span>
                      )}
                      {going > 0 && (
                        <span className="text-[7px] text-cyan-200 font-bold mt-0.5 leading-none">{going} going</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          {/* Monthly Summary */}
          {(() => {
            const monthEvents = Array.from({ length: daysInMonth }, (_, i) => i + 1)
              .flatMap(day => getEventsForDate(day).map(e => ({ ...e, _day: day })))
              .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
            if (monthEvents.length === 0) return null;
            return (
              <div className="mt-4 rounded-[28px] p-5 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)] space-y-2">
                <h3 className="flex items-center gap-3 text-base font-extrabold text-white mb-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                    <Calendar size={18} className="text-white" />
                  </span>
                  Coming Up in {MONTHS[currentMonth]}
                </h3>
                {monthEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => { setSelectedDate(event._day); setView("day"); }}
                    className="w-full flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 hover:border-cyan-400/40 hover:bg-white/[0.06] transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-cyan-500/30 flex-shrink-0">
                      {event._day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                      <p className="text-[11px] text-white/40">{event.time && `${event.time} · `}{event.location || event.type}{rsvpCounts[event.id] > 0 ? ` · ${rsvpCounts[event.id]} going` : ""}</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full border border-cyan-400/50 text-cyan-300 font-semibold flex-shrink-0">
                      {event.type}
                    </span>
                  </button>
                ))}
              </div>
            );
          })()}
          </motion.div>
        )}

        {view === "week" && calendarView !== "otter_week" && calendarView !== "map" && (
          <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <WeekView
              weekStart={weekStart}
              onNavigate={(delta) => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d; })}
              onToday={() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); setWeekStart(d); }}
              getEventsForDateStr={getEventsForDateStr}
              rsvpCounts={rsvpCounts}
              groupDots={GROUP_DOTS}
              onSelectDay={(d) => {
                backViewRef.current = "week";
                setCurrentYear(d.getFullYear());
                setCurrentMonth(d.getMonth());
                setSelectedDate(d.getDate());
                setView("day");
              }}
            />
          </motion.div>
        )}

        {view === "day" && selectedDate && calendarView !== "otter_week" && calendarView !== "map" && (
          <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.33, 0.66, 0.66, 1] }}>
            <div className="rounded-[28px] p-6 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
              <button onClick={() => setView(backViewRef.current)} className="text-cyan-300/60 hover:text-cyan-200 mb-4 text-sm font-semibold">
                ← Back to {backViewRef.current === "week" ? "Week" : "Month"}
              </button>
              <h2 className="text-2xl font-bold text-white mb-6">
                {MONTHS[currentMonth]} {selectedDate}
              </h2>

              <div className="space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-white/30 text-center py-8">No events</p>
                ) : (
                  getEventsForDate(selectedDate).map(event => {
                    const eventEditable = calendarView === "otter_week" ? (isAdmin || isChairman) : (isAdmin || isChairman || (user?.role && canEdit(user?.role, event.group)));
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.33, 0.66, 0.66, 1] }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white mb-2">{event.title}</p>
                              {event.is_series_parent && (
                                <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Series</span>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[event.type] || "bg-white/10 text-white/50 border-white/20"}`}>
                                {event.type}
                              </span>
                              {event.time && <span className="text-[10px] text-white/50">{event.time}</span>}
                              {event.location && <span className="text-[10px] text-white/50">{event.location}</span>}
                              {event.recurrence_type && event.recurrence_type !== "none" && (
                                <span className="text-[10px] text-blue-300">{event.recurrence_type}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button aria-label="Export to calendar" onClick={() => handleExportICS(event)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-violet-400 hover:bg-white/5 transition-colors" title="Export to calendar">
                              <Calendar size={15} />
                            </button>
                            {eventEditable && (
                              <>
                                <button aria-label="Edit event" onClick={() => handleEdit(event)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-blue-400 hover:bg-white/5 transition-colors">
                                  <Pencil size={15} />
                                </button>
                                <button aria-label="Delete event" onClick={() => handleDelete(event.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors">
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {event.is_series_parent && isAdmin && (
                          <button
                            onClick={() => setExpandedSeries(expandedSeries === event.id ? null : event.id)}
                            className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
                          >
                            {expandedSeries === event.id ? "Hide Series Instances" : "Show Series Instances"}
                          </button>
                        )}

                        {user && event.rsvp_enabled && (
                           <button
                             onClick={() => setSelectedEventForRsvp(event.id === selectedEventForRsvp ? null : event.id)}
                             className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                           >
                             {selectedEventForRsvp === event.id ? "Hide RSVP" : "Show RSVP & Reminder"}
                           </button>
                         )}

                         {selectedEventForRsvp === event.id && user && event.rsvp_enabled && (
                          <EventRSVP eventId={event.id} user={user} event={event} />
                         )}

                         {/* Comments section - always visible */}
                         <EventComments eventId={event.id} user={user} />

                         {expandedSeries === event.id && event.is_series_parent && (
                           <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                             <p className="text-xs text-white/50">Ends: {event.recurrence_end_date}</p>
                             <div className="text-xs text-white/40 max-h-32 overflow-y-auto">
                               {events
                                 .filter(e => e.series_parent_id === event.id)
                                 .sort((a, b) => new Date(a.date) - new Date(b.date))
                                 .slice(0, 5)
                                 .map(instance => (
                                   <div key={instance.id} className="py-1">{instance.date}</div>
                                 ))}
                               {events.filter(e => e.series_parent_id === event.id).length > 5 && (
                                 <div className="py-1 text-white/30">+{events.filter(e => e.series_parent_id === event.id).length - 5} more</div>
                               )}
                             </div>
                           </div>
                         )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Form Bottom Sheet */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center lg:justify-center lg:p-6" onTouchMove={e => e.stopPropagation()}>
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/40"
            onClick={() => { setShowForm(false); setEditingEvent(null); setFormFromOtterWeek(false); }}
          />
          {/* Sheet — fixed height with internal scroll */}
          <div
            className="relative w-full flex flex-col rounded-t-3xl h-[75dvh] lg:h-auto lg:max-h-[85vh] lg:max-w-lg lg:rounded-3xl border-t lg:border border-cyan-400/30"
            style={{
              background: "linear-gradient(to bottom, rgb(15,23,42), rgb(11,18,32))",
              boxShadow: "0 -8px 40px rgba(34,211,238,0.15)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 lg:hidden">
              <div className="w-10 h-1 rounded-full bg-cyan-400/30" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                  {editingEvent ? <Pencil size={15} className="text-white" /> : <Plus size={16} className="text-white" />}
                </span>
                <h2 className="text-base font-extrabold text-white">{editingEvent ? "Edit Event" : "Add Event"}</h2>
              </div>
              <button
                aria-label="Close form"
                onClick={() => { setShowForm(false); setEditingEvent(null); setFormFromOtterWeek(false); }}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {/* Scrollable form body */}
            <div
              className="overflow-y-auto flex-1 px-5 py-4 space-y-3"
              style={{ WebkitOverflowScrolling: "touch", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
            >
              <input
                className="w-full bg-slate-800/60 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60"
                placeholder="Event title *"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              {editingEvent && (editingEvent.series_parent_id || editingEvent.is_series_parent) && (
                <div className="bg-slate-800/60 border border-white/15 rounded-2xl p-3">
                  <p className="text-xs text-white/50 font-semibold mb-2">🔁 This event is part of a repeating series</p>
                  <div className="flex gap-2">
                    {[{ v: "single", l: "Just this event" }, { v: "future", l: "This & all future" }].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setEditScope(o.v)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${editScope === o.v ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 border-transparent shadow-md shadow-cyan-500/30" : "bg-white/5 text-white/50 border-white/10 hover:text-white"}`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!formFromOtterWeek ? (
                <div className="grid grid-cols-3 gap-3">
                  <SelectDrawer
                    label="Year"
                    value={(form.year || currentYear).toString()}
                    onValueChange={v => setForm({ ...form, year: parseInt(v) })}
                    options={[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => ({ value: y.toString(), label: y.toString() }))}
                  />
                  <SelectDrawer
                    label="Month"
                    value={form.month.toString()}
                    onValueChange={v => setForm({ ...form, month: parseInt(v), day: null })}
                    options={MONTHS.map((m, i) => ({ value: i.toString(), label: m }))}
                  />
                  <SelectDrawer
                    label="Day"
                    value={form.day ? form.day.toString() : ""}
                    onValueChange={v => setForm({ ...form, day: parseInt(v) })}
                    options={Array.from({ length: getDaysInMonth(form.year || currentYear, form.month) }, (_, i) => i + 1).map(d => ({ value: d.toString(), label: d.toString() }))}
                    placeholder="Day"
                  />
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm">
                  📅 {formOtterWeekDay}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <SelectDrawer
                  label="Type"
                  value={form.type}
                  onValueChange={v => setForm({ ...form, type: v })}
                  options={["Training", "Event", "Fun", "Race"].map(t => ({ value: t, label: t }))}
                />
                {(isAdmin || isChairman) && (
                  <SelectDrawer
                    label="Group"
                    value={form.group}
                    onValueChange={v => setForm({ ...form, group: v })}
                    options={[{ value: "all", label: "All Groups" }, ...ALL_GROUPS.map(g => ({ value: g, label: GROUP_LABELS[g] })), { value: "trainers", label: "Trainers" }]}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full bg-slate-800/60 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60"
                  placeholder="Time (e.g. 6pm)"
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                />
                <input
                  className="w-full bg-slate-800/60 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60"
                  placeholder="Location"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <textarea
                className="w-full bg-slate-800/60 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60 resize-none"
                placeholder="Additional info (optional)"
                rows="2"
                value={form.info}
                onChange={e => setForm({ ...form, info: e.target.value })}
              />
              <input
                className="w-full bg-slate-800/60 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/60"
                placeholder="Link (optional)"
                value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
              />
              {/* RSVP toggle */}
              <button
                type="button"
                onClick={() => setForm({ ...form, rsvp_enabled: !form.rsvp_enabled, payment_enabled: false })}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 active:bg-white/10 transition-colors"
              >
                <span className="text-sm text-white">Enable RSVP</span>
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${form.rsvp_enabled ? "bg-gradient-to-r from-sky-500 to-cyan-400" : "bg-white/20"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.rsvp_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>
              {/* Payment toggle — only show when RSVP enabled */}
              {form.rsvp_enabled && (
                <div className="space-y-2 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, payment_enabled: !form.payment_enabled })}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="text-sm text-white">Require Payment</span>
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ml-3 ${form.payment_enabled ? "bg-gradient-to-r from-sky-500 to-cyan-400" : "bg-white/20"}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.payment_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </button>
                  {form.payment_enabled && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-white/50 text-sm font-medium">£</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.payment_amount}
                        onChange={e => setForm({ ...form, payment_amount: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/25"
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Recurrence — admin/owner only */}
              {(isAdmin || user?.role === "owner") && (
                <>
                  <SelectDrawer
                    label="Recurrence"
                    value={form.recurrence_type}
                    onValueChange={v => setForm({ ...form, recurrence_type: v })}
                    options={[
                      { value: "none", label: "One-time" },
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "monthly", label: "Monthly" },
                      { value: "yearly", label: "Yearly" }
                    ]}
                  />
                  {form.recurrence_type !== "none" && (
                    <div>
                      <p className="text-xs text-white/40 mb-1 px-1">Repeat until</p>
                      <input
                        type="date"
                        value={form.recurrence_end_date}
                        onChange={e => setForm({ ...form, recurrence_end_date: e.target.value })}
                        className="w-full bg-slate-800/60 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400/60"
                      />
                    </div>
                  )}
                </>
              )}
              {/* Submit */}
              <button
                onClick={editingEvent ? handleSaveEdit : handleAdd}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40 font-bold py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-sm mt-1"
              >
                {editingEvent ? "Save Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}