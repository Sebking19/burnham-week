export default function InfoSection({ title, children }) {
  return (
    <section className="bg-white border-2 border-dotted border-[#141B34]/40 rounded-2xl p-6 mb-5">
      <h2 className="font-display text-2xl mb-3 text-[#1B2A5B]">{title}</h2>
      <div className="space-y-3 text-[#141B34]/85 leading-relaxed">{children}</div>
    </section>
  );
}