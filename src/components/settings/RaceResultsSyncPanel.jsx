import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Check, AlertTriangle, Trophy } from "lucide-react";

export default function RaceResultsSyncPanel() {
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null); // "done" | "failed"

  const load = () =>
    base44.entities.RaceResult.list("-fetched_at", 50).then(setResults).catch(() => {});

  useEffect(() => { load(); }, []);

  const lastUpdated = results.reduce(
    (latest, r) => (r.fetched_at && r.fetched_at > latest ? r.fetched_at : latest),
    ""
  );

  const refresh = async () => {
    setBusy(true);
    setOutcome(null);
    const res = await base44.functions.invoke("syncRaceResults", { force: true }).catch(() => null);
    setOutcome(res?.data?.ok && !res?.data?.stalled ? "done" : "failed");
    await load();
    setBusy(false);
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6 mt-6">
      <h2 className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7] flex items-center gap-2">
        <Trophy size={24} className="text-[#4C7CF0]" /> Race results
      </h2>
      <p className="text-[#141B34]/70 dark:text-white/70 mt-1">
        Standings are updated automatically every few minutes on race days. Use this to fetch them right now.
      </p>

      <div className="mt-4 flex items-center justify-between gap-4 py-3 border-t border-[#141B34]/10 dark:border-white/10">
        <span className="text-lg flex items-center gap-2">
          {results.length} classes loaded
          {outcome === "done" && <Check size={18} className="text-green-600" />}
          {outcome === "failed" && <AlertTriangle size={18} className="text-red-600" />}
        </span>
        <span className="text-base text-[#141B34]/70 dark:text-white/70 text-right">
          {busy
            ? "Checking the results pages…"
            : lastUpdated
              ? "Updated " + new Date(lastUpdated).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
              : "Not yet loaded"}
        </span>
      </div>

      <button
        onClick={refresh}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 bg-[#4C7CF0] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#3E6BDB] disabled:opacity-60"
      >
        <RefreshCw size={20} className={busy ? "animate-spin" : ""} />
        {busy ? "Updating results…" : "Update results now"}
      </button>

      {outcome === "failed" && !busy && (
        <p className="mt-3 text-base text-red-700 dark:text-red-400">
          The results website blocked us or was slow — some classes may not have refreshed. Please try again in a few minutes.
        </p>
      )}
    </div>
  );
}