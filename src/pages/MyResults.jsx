import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MyResultCard from "@/components/results/MyResultCard";

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

export default function MyResults() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      const myName = norm(user?.display_name || user?.full_name);
      const myBoat = norm(user?.boat_name);
      setName(user?.display_name || user?.full_name || "");

      const records = await base44.entities.RaceResult.list();
      const found = [];
      for (const rec of records) {
        for (const row of rec.rows || []) {
          const hit =
            (myName && (norm(row.helm).includes(myName) || norm(row.crew).includes(myName))) ||
            (myBoat && norm(row.boat) === myBoat);
          if (hit) found.push({ className: rec.class_name, url: rec.source_url, row });
        }
      }
      setMatches(found);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="pt-2 space-y-4">
      <div>
        <h1 className="font-display text-3xl text-[#1B2A5B] dark:text-[#8FAEF7]">My Results</h1>
        <p className="text-lg text-[#141B34]/70 dark:text-white/70 mt-1">
          Standings from the official results pages that match {name || "your name"}.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-lg text-[#141B34]/70 dark:text-white/70">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-[#1B2A5B] rounded-full animate-spin" />
          Looking for your results...
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6 text-lg text-[#141B34]/80 dark:text-white/80 space-y-3">
          <p>No results found for you yet.</p>
          <p className="text-base text-[#141B34]/70 dark:text-white/70">
            Results appear here once racing has been scored. Make sure your{" "}
            <Link to="/Profile" className="font-bold text-[#4C7CF0] underline">profile name and boat</Link>{" "}
            match your Burnham Week entry exactly.
          </p>
        </div>
      )}

      {matches.map((m, i) => (
        <MyResultCard key={`${m.url}-${i}`} className={m.className} url={m.url} row={m.row} />
      ))}
    </div>
  );
}