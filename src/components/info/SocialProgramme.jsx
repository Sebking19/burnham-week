import { PartyPopper } from "lucide-react";
import useSiteContent from "@/lib/useSiteContent";
import LinkRow from "@/components/info/LinkRow";

export default function SocialProgramme() {
  const { items, loading } = useSiteContent("social");

  if (loading) return <p className="text-[#141B34]/70 dark:text-white/70">Loading social programme…</p>;

  const withLinks = items.filter(i => i.url);
  const plain = items.filter(i => !i.url);

  return (
    <div>
      {withLinks.map(item => (
        <LinkRow key={item.url} label={item.title} sublabel="Open the club's social programme" url={item.url} icon={PartyPopper} />
      ))}
      {plain.length > 0 && (
        <p className="mt-3 text-[#141B34]/70 dark:text-white/70">
          No programme published yet for: {plain.map(i => i.title).join(", ")}. Check back closer to the week.
        </p>
      )}
      {!items.length && (
        <LinkRow label="Social programme on the website" url="https://www.burnhamweek.com/social/" icon={PartyPopper} />
      )}
    </div>
  );
}