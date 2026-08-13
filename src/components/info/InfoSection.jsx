export default function InfoSection({ title, children }) {
  return (
    <section className="bg-white/70 border-2 border-[#0B1F44]/15 rounded-sm p-5 mb-5">
      <h2 className="font-display text-2xl mb-3 text-[#0B1F44]">{title}</h2>
      <div className="space-y-3 text-[#0B1F44]/90 leading-relaxed">{children}</div>
    </section>
  );
}