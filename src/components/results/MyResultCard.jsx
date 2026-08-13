export default function MyResultCard({ className, url, row }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-5 hover:border-[#4C7CF0]"
    >
      <p className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">{className}</p>
      <div className="flex items-baseline gap-3 mt-2">
        <span className="text-3xl font-bold text-[#141B34] dark:text-white">{row.rank || "–"}</span>
        <span className="text-lg text-[#141B34]/80 dark:text-white/80">{row.boat}{row.sail_no ? ` (${row.sail_no})` : ""}</span>
      </div>
      <p className="text-lg text-[#141B34]/70 dark:text-white/70 mt-1">
        Helm: {row.helm || "–"}{row.crew ? ` · Crew: ${row.crew}` : ""}
      </p>
      {(row.nett || row.total) && (
        <p className="text-base text-[#141B34]/60 dark:text-white/60 mt-1">
          Nett {row.nett || "–"} · Total {row.total || "–"}
        </p>
      )}
      <p className="text-base text-[#4C7CF0] font-bold mt-3">See the full table</p>
    </a>
  );
}