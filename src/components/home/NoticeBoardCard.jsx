import { FileText } from "lucide-react";

export default function NoticeBoardCard() {
  return (
    <div className="mt-6 space-y-4">
      <a
        href="https://www.burnhamweek.com/notice-board-2026/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-[#1B2A5B] text-white rounded-2xl px-6 py-5 hover:bg-[#16224A]"
      >
        <FileText size={28} className="shrink-0" />
        <span>
          <span className="block font-display text-2xl">Official Notice Board</span>
          <span className="block text-white/80">Sailing instructions, notice of race and changes</span>
        </span>
      </a>

      <div className="bg-[#FDECEC] dark:bg-[#3A1A1A] border-2 border-[#C62828]/40 rounded-2xl px-6 py-5">
        <h2 className="font-display text-2xl text-[#C62828] dark:text-[#FF8A80]">Safety on the water</h2>
        <p className="mt-2 text-lg">
          In an emergency call <span className="font-bold">999</span> and ask for the Coastguard.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="https://www.burnhamweek.com/wp-content/uploads/2026/04/Safety-Plan-2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white dark:bg-white/10 text-[#C62828] dark:text-[#FF8A80] font-bold px-5 py-3 rounded-lg border-2 border-[#C62828]/40"
          >
            Competitor Safety Plan
          </a>
        </div>
      </div>
    </div>
  );
}