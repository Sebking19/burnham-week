import { FileText, ExternalLink } from "lucide-react";

const DOCS = [
  { label: "Sailing Instructions", url: "https://www.burnhamweek.com/wp-content/uploads/2025/08/SI-print-file-final-03082025.pdf" },
  { label: "Dinghy Sailing Instructions (Appendix B)", url: "https://www.burnhamweek.com/wp-content/uploads/2025/08/Dinghy-Final-01082025.pdf" },
  { label: "Beastie Sailing Instructions Appendix", url: "https://www.burnhamweek.com/wp-content/uploads/2025/08/Beastie-segment-of-the-BW-sis-Final-1.pdf" },
  { label: "Notice of Race", url: "https://www.burnhamweek.com/wp-content/uploads/2025/05/2025-Burnham-Week-NoR-Final.pdf" },
  { label: "Competitor Safety Plan", url: "https://www.burnhamweek.com/wp-content/uploads/2025/07/Safety-Plan-for-competitors-BW2025.pdf" },
  { label: "Arbitration at this Event", url: "https://www.burnhamweek.com/wp-content/uploads/2021/08/Arbitration-at-this-event.pdf" },
  { label: "Emergency Procedures", url: "https://www.burnhamweek.com/emergengy-procedures/" },
  { label: "Tips for New Entrants", url: "https://www.burnhamweek.com/tips-for-new-entrants-2018/" },
  { label: "Crew Wanted / Available", url: "https://www.burnhamweek.com/wp-content/uploads/2025/07/Crews-Available-2025-.pdf" },
  { label: "Official Notice Board (live)", url: "https://www.burnhamweek.com/noticeboard1/" },
  { label: "Enter Burnham Week 2026", url: "https://www.burnhamweek.com/enter-here/" },
];

export default function DocumentLinks() {
  return (
    <div className="divide-y-2 divide-[#0B1F44]/10">
      {DOCS.map((d) => (
        <a
          key={d.label}
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 py-4 hover:bg-[#C8A24A]/15 px-1"
        >
          <FileText size={22} className="text-[#C8A24A] shrink-0" />
          <span className="flex-1 text-lg">{d.label}</span>
          <ExternalLink size={18} className="text-[#0B1F44]/50 shrink-0" />
        </a>
      ))}
    </div>
  );
}