import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Check, AlertTriangle, Loader2 } from "lucide-react";

// Notice board, courses and news are the priority blocks, so they refresh first.
const LABELS = {
  documents: "Notice board documents",
  courses: "Courses",
  news: "Latest news",
  fleets: "Racing classes",
  sponsors: "Sponsors",
  social: "Social programme",
};

export default function WebsiteSyncPanel() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({}); // key -> "checking" | "done" | "failed"

  const load = () => base44.entities.SiteContent.list().then(setRows).catch(() => {});

  useEffect(() => { load(); }, []);

  const syncOne = async (key) => {
    const res = await base44.functions.invoke("syncBurnhamSite", { key }).catch(() => null);
    return typeof res?.data?.results?.[key] === "number";
  };

  const refresh = async () => {
    setBusy(true);
    setStatus({});
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const keys = Object.keys(LABELS);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      setStatus(s => ({ ...s, [key]: "checking" }));
      // The website's bot check blocks rapid requests, so retry once after a pause.
      let ok = await syncOne(key);
      if (!ok) {
        await sleep(6000);
        ok = await syncOne(key);
      }
      setStatus(s => ({ ...s, [key]: ok ? "done" : "failed" }));
      await load();
      // Pause between sections so the website never sees a burst of requests.
      if (i < keys.length - 1) await sleep(4000);
    }
    setBusy(false);
  };

  const failed = Object.keys(status).filter(k => status[k] === "failed");

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6 mt-6">
      <h2 className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">Website content</h2>
      <p className="text-[#141B34]/70 dark:text-white/70 mt-1">
        Updated automatically from burnhamweek.com every 15 minutes, with the notice board, courses and news checked most often.
      </p>

      <div className="mt-4">
        {Object.keys(LABELS).map(key => {
          const row = rows.find(r => r.key === key);
          const st = status[key];
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-3 border-b border-[#141B34]/10 dark:border-white/10 last:border-0">
              <span className="text-lg flex items-center gap-2">
                {LABELS[key]}
                {st === "checking" && <Loader2 size={18} className="animate-spin text-[#4C7CF0]" />}
                {st === "done" && <Check size={18} className="text-green-600" />}
                {st === "failed" && <AlertTriangle size={18} className="text-red-600" />}
              </span>
              <span className="text-base text-[#141B34]/70 dark:text-white/70 text-right">
                {st === "checking"
                  ? "Checking the website…"
                  : row?.fetched_at
                    ? new Date(row.fetched_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                    : "Not yet loaded"}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={refresh}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 bg-[#4C7CF0] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#3E6BDB] disabled:opacity-60"
      >
        <RefreshCw size={20} className={busy ? "animate-spin" : ""} />
        {busy ? "Refreshing each section…" : "Check for updates now"}
      </button>

      {failed.length > 0 && !busy && (
        <p className="mt-3 text-base text-red-700 dark:text-red-400">
          The website blocked us while fetching: {failed.map(k => LABELS[k]).join(", ")}. Please try again in a minute.
        </p>
      )}
    </div>
  );
}