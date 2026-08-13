import { FileText } from "lucide-react";
import useSiteContent from "@/lib/useSiteContent";
import LinkRow from "@/components/info/LinkRow";

export default function LiveDocuments() {
  const { items, loading } = useSiteContent("documents");

  if (loading) return <p className="text-[#141B34]/70 dark:text-white/70">Loading documents…</p>;

  if (!items.length) {
    return (
      <LinkRow
        label="Open the official notice board"
        sublabel="Documents could not be loaded — view them on the website"
        url="https://www.burnhamweek.com/notice-board-2026/"
        icon={FileText}
      />
    );
  }

  return (
    <div>
      {items.map(item => (
        <LinkRow key={item.url} label={item.title} url={item.url} icon={FileText} />
      ))}
    </div>
  );
}