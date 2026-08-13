import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function EventEditor({ date, event, onClose, onSaved }) {
  const [title, setTitle] = useState(event?.title || "");
  const [time, setTime] = useState(event?.time || "");
  const [location, setLocation] = useState(event?.location || "");
  const [details, setDetails] = useState(event?.details || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = { date, title: title.trim(), time: time.trim(), location: location.trim(), details: details.trim() };
    if (event) {
      await base44.entities.WeekEvent.update(event.id, data);
    } else {
      await base44.entities.WeekEvent.create(data);
    }
    onSaved();
  };

  const field = "w-full text-lg border-2 border-slate-300 dark:border-white/10 bg-white dark:bg-[#121212] text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:border-[#0E2A4E] dark:focus:border-[#8FAEF7] outline-none";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-end justify-center sm:items-center sm:px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="bg-white dark:bg-[#1A1A1A] w-full max-w-lg p-6 pb-8 space-y-3 rounded-t-3xl sm:rounded-2xl sm:pb-6 max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20 sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0E2A4E] dark:text-[#8FAEF7]">
            {event ? "Edit event" : "Add event"} — {format(parseISO(date), "EEE d MMM")}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" className={field} />
        <input value={time} onChange={e => setTime(e.target.value)} placeholder="Time (e.g. 10:00)" className={field} />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className={field} />
        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Details (optional)" rows={3} className={field} />
        <button
          onClick={save}
          disabled={saving || !title.trim()}
          className="w-full bg-[#0E2A4E] dark:bg-[#4C7CF0] text-white text-lg font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save event"}
        </button>
      </motion.div>
    </div>
  );
}