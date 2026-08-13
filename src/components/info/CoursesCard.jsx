import { Map } from "lucide-react";
import useSiteContent from "@/lib/useSiteContent";
import LinkRow from "@/components/info/LinkRow";

export default function CoursesCard() {
  const { items, loading } = useSiteContent("courses");

  if (loading) return <p className="text-[#141B34]/70 dark:text-white/70">Loading courses…</p>;

  const heading = items.find(i => !i.url);
  const links = items.filter(i => i.url);

  return (
    <div>
      {heading && (
        <>
          <p className="text-xl font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">{heading.title}</p>
          {heading.subtitle && <p className="mt-2">{heading.subtitle}</p>}
        </>
      )}
      {links.map(item => (
        <LinkRow key={item.url} label={item.title} url={item.url} icon={Map} />
      ))}
      {!heading && !links.length && (
        <LinkRow label="Courses on the website" url="https://www.burnhamweek.com/courses-2/" icon={Map} />
      )}
    </div>
  );
}