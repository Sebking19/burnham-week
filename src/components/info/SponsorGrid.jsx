import useSiteContent from "@/lib/useSiteContent";

export default function SponsorGrid() {
  const { items, loading } = useSiteContent("sponsors");

  if (loading) return <p className="text-[#141B34]/70 dark:text-white/70">Loading sponsors…</p>;

  if (!items.length) {
    return (
      <a
        href="https://www.burnhamweek.com/sponsors/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-[#1B2A5B] dark:text-[#8FAEF7] underline"
      >
        See the Burnham Week sponsors
      </a>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(item => {
        const logo = (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-16 object-contain"
            loading="lazy"
          />
        );
        return item.url ? (
          <a
            key={item.image_url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-white/90 rounded-lg p-3 flex items-center justify-center hover:ring-2 hover:ring-[#4C7CF0]"
          >
            {logo}
          </a>
        ) : (
          <div key={item.image_url} className="bg-white dark:bg-white/90 rounded-lg p-3 flex items-center justify-center">
            {logo}
          </div>
        );
      })}
    </div>
  );
}