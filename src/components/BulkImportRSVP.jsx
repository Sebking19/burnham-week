import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, CheckCircle2, AlertCircle, X, Download } from "lucide-react";
import SelectDrawer from "@/components/SelectDrawer";

export default function BulkImportRSVP({ events, onClose }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [parsed, setParsed] = useState(null); // array of {name, email}
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null); // {success, skipped, errors}
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setParsed(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row.");
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const nameIdx = headers.findIndex(h => h === "name" || h === "full_name" || h === "fullname");
      const emailIdx = headers.findIndex(h => h === "email");

      if (nameIdx === -1 && emailIdx === -1) {
        setError("CSV must have a 'name' and/or 'email' column.");
        return;
      }

      const rows = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
        return {
          name: nameIdx !== -1 ? cols[nameIdx] : "",
          email: emailIdx !== -1 ? cols[emailIdx] : "",
        };
      }).filter(r => r.name || r.email);

      if (rows.length === 0) {
        setError("No valid rows found in CSV.");
        return;
      }
      setParsed(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedEventId || !parsed?.length) return;
    setImporting(true);
    setResult(null);

    // Fetch existing RSVPs to avoid dupes
    const existing = await base44.entities.RSVP.filter({ event_id: selectedEventId });
    const existingEmails = new Set(existing.map(r => r.user_email?.toLowerCase()));

    let success = 0, skipped = 0, errors = 0;

    for (const row of parsed) {
      const email = row.email?.toLowerCase() || `guest_import_${Date.now()}_${Math.random().toString(36).substr(2,6)}@guest`;
      const name = row.name || row.email || "Unknown";

      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }

      await base44.entities.RSVP.create({
        event_id: selectedEventId,
        user_email: email,
        user_name: name,
        status: "attending",
        paid: false,
        checked_in: false,
      });
      existingEmails.add(email);
      success++;
    }

    setResult({ success, skipped, errors });
    setImporting(false);
  };

  const downloadTemplate = () => {
    const csv = "name,email\nJohn Smith,john@example.com\nJane Doe,jane@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvp_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Bulk Import Guests</h2>
            <p className="text-white/40 text-xs mt-0.5">Upload a CSV to add attendees to an event</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white/70 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Event picker */}
        <div>
          <label className="block text-xs text-white/50 font-semibold mb-1.5">Select Event</label>
          <SelectDrawer
            label="Select Event"
            value={selectedEventId}
            onValueChange={setSelectedEventId}
            placeholder="— Choose an event —"
            options={events.map(ev => ({ value: ev.id, label: `${ev.title} · ${ev.date}` }))}
          />
        </div>

        {/* File upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-white/50 font-semibold">Upload CSV</label>
            <button onClick={downloadTemplate} className="flex items-center gap-1 text-[11px] text-blue-300/70 hover:text-blue-300 transition-colors">
              <Download size={10} /> Download template
            </button>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-white/30 transition-all"
          >
            <Upload size={20} className="mx-auto mb-2 text-white/30" />
            <p className="text-white/40 text-xs">Click to upload <span className="text-white/60 font-semibold">.csv</span> file</p>
            <p className="text-white/25 text-[11px] mt-1">Columns: <code className="text-white/40">name, email</code></p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Preview */}
        {parsed && !result && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-white/50 text-xs font-semibold mb-2">{parsed.length} rows found — preview:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {parsed.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="text-white/70 font-medium">{r.name || "—"}</span>
                  {r.email && <span className="text-white/30">{r.email}</span>}
                </div>
              ))}
              {parsed.length > 5 && <p className="text-white/25 text-[11px]">...and {parsed.length - 5} more</p>}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <p className="text-green-300 text-xs font-semibold">Import complete</p>
            </div>
            <p className="text-white/50 text-xs">✓ {result.success} added &nbsp;·&nbsp; {result.skipped} skipped (already exist)</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 transition-all">
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!selectedEventId || !parsed || importing}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? (
                <><span className="animate-spin">⟳</span> Importing...</>
              ) : (
                <><Upload size={12} /> Import {parsed ? `${parsed.length} guests` : "guests"}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}