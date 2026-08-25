import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw } from "lucide-react";

const LABELS = {
  news: "Latest news",
  fleets: "Racing classes",
  documents: "Notice board documents",
  courses: "Courses",
  sponsors: "Sponsors",
  social: "Social programme",
};

export default function WebsiteSyncPanel() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState([]);

  const load = () => base44.entities.SiteContent.list().then(setRows).catch(() => {});

  useEffect(() => { load(); }, []);

  const runSync = async (payload) => {
    const res = await base44.functions.invoke("syncBurnhamSite", payload).catch(() => null);
    const results = res?.data?.results || {};
    return Object.keys(results).filter(k => typeof results[k] === "string");
  };

  const refresh = async () => {
    setBusy(true);
    setFailed([]);
    // The website's bot check sometimes blocks a page, so retry anything that failed.
    let stillFailed = await runSync({ all: true });
    for (const key of stillFailed.slice()) {
      const again = await runSync({ key });
      if (!again.length) stillFailed = stillFailed.filter(k => k !== key);
    }
    setFailed(stillFailed);
    await load();
    setBusy(false);
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6 mt-6">
      <h2 className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">Website content</h2>
      <p className="text-[#141B34]/70 dark:text-white/70 mt-1">
        Updated automatically from burnhamweek.com three times a day.
      </p>

      <div className="mt-4">
        {Object.keys(LABELS).map(key => {
          const row = rows.find(r => r.key === key);
          return (
            <div key={key} className="flex justify-between gap-4 py-3 border-b border-[#141B34]/10 dark:border-white/10 last:border-0">
              <span className="text-lg">{LABELS[key]}</span>
              <span className="text-base text-[#141B34]/70 dark:text-white/70 text-right">
                {row?.fetched_at ? new Date(row.fetched_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Not yet loaded"}
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
        {busy ? "Checking…" : "Check for updates now"}
      </button>

      {failed.length > 0 && (
        <p className="mt-3 text-base text-red-700 dark:text-red-400">
          The website blocked us while fetching: {failed.map(k => LABELS[k] || k).join(", ")}. Please try again in a minute.
        </p>
      )}
    </div>
  );
}