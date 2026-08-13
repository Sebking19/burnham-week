import useSiteContent from "@/lib/useSiteContent";

export default function FleetList() {
  const { items, loading } = useSiteContent("fleets");

  if (loading) return <p className="text-[#141B34]/70 dark:text-white/70">Loading classes…</p>;

  if (!items.length) {
    return (
      <a
        href="https://www.burnhamweek.com/fleets/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-bold text-[#1B2A5B] dark:text-[#8FAEF7] underline"
      >
        View the racing classes on the website
      </a>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {items.map(item => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 rounded-lg bg-[#F4F7FC] dark:bg-white/5 text-lg text-[#1B2A5B] dark:text-[#8FAEF7] font-bold hover:bg-[#4C7CF0]/10"
        >
          {item.title}
        </a>
      ))}
    </div>
  );
}