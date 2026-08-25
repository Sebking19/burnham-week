import { Map } from "lucide-react";
import useSiteContent from "@/lib/useSiteContent";
import LinkRow from "@/components/info/LinkRow";

export default function CoursesCard() {
  const { items, loading } = useSiteContent("courses");

  if (loading) return <p className="text-[#141B34]/70 dark:text-white/70">Loading courses…</p>;

  const heading = items.find(i => !i.url && !i.image_url);
  const images = items.filter(i => i.image_url);
  const links = items.filter(i => i.url && !i.image_url);

  return (
    <div>
      {heading && (
        <>
          <p className="text-xl font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">{heading.title}</p>
          {heading.subtitle && <p className="mt-2">{heading.subtitle}</p>}
        </>
      )}
      {images.map(item => (
        <a key={item.image_url} href={item.image_url} target="_blank" rel="noopener noreferrer" className="block mt-4">
          <img src={item.image_url} alt={item.title} className="w-full rounded-lg border border-[#141B34]/20" />
          <p className="mt-1 text-base text-[#141B34]/70 dark:text-white/70">{item.title} — tap to enlarge</p>
        </a>
      ))}
      {links.map(item => (
        <LinkRow key={item.url} label={item.title} url={item.url} icon={Map} />
      ))}
      {!heading && !links.length && (
        <LinkRow label="Courses on the website" url="https://www.burnhamweek.com/courses-2/" icon={Map} />
      )}
    </div>
  );
}