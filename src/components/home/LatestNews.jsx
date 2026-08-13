import useSiteContent from "@/lib/useSiteContent";

export default function LatestNews() {
  const { items, loading } = useSiteContent("news");

  if (loading || !items.length) return null;

  return (
    <div className="mt-6 bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6">
      <h2 className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">Latest news</h2>
      <div className="mt-3">
        {items.slice(0, 4).map(item => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 border-b border-[#141B34]/10 dark:border-white/10 last:border-0 group"
          >
            <span className="text-lg font-bold text-[#1B2A5B] dark:text-[#8FAEF7] group-hover:underline">{item.title}</span>
            {item.subtitle && <span className="block text-base text-[#141B34]/70 dark:text-white/70">{item.subtitle}</span>}
          </a>
        ))}
      </div>
      <a
        href="https://www.burnhamweek.com/news/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 text-base font-bold text-[#1B2A5B] dark:text-[#8FAEF7] underline"
      >
        All news on the website
      </a>
    </div>
  );
}