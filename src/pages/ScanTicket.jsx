import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import QRScanner from "@/components/QRScanner";
import { ScanLine } from "lucide-react";
import SelectDrawer from "@/components/SelectDrawer";

export default function ScanTicket() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const today = new Date().toISOString().split("T")[0];
    base44.entities.Event.list("-date", 50)
      .then(evs => {
        // Show upcoming + recent events
        const filtered = evs.filter(e => e.date >= today || !e.date).slice(0, 20);
        setEvents(filtered);
        if (filtered.length > 0) setSelectedEventId(filtered[0].id);
      })
      .catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "owner" || user?.role === "chairman";

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="py-2 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ScanLine size={48} className="text-white/20 mb-4" />
        <p className="text-white/40 text-sm">Admin access required to scan tickets.</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Scan Tickets</h1>
        <p className="text-cyan-200/40 text-sm mt-0.5">Check in attendees by scanning their QR code</p>
      </div>

      <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-5 mb-4">
        <label className="block text-xs text-white/50 font-semibold mb-2">Select Event</label>
        <SelectDrawer
          label="Select Event"
          value={selectedEventId}
          onValueChange={setSelectedEventId}
          options={events.map(ev => ({ value: ev.id, label: `${ev.title} · ${ev.date || "No date"}` }))}
        />
      </div>

      <button
        onClick={() => setScanning(true)}
        disabled={!selectedEventId}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40 hover:opacity-90 transition-all font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ScanLine size={18} />
        Start Scanning
      </button>

      {scanning && selectedEventId && (
        <QRScanner
          eventId={selectedEventId}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}