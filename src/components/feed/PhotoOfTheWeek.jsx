import { Heart, Camera } from "lucide-react";

export default function PhotoOfTheWeek({ posts }) {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const candidates = posts.filter(
    p => p.image_url && (p.likes || 0) > 0 && new Date(p.created_date).getTime() > weekAgo
  );
  if (candidates.length === 0) return null;
  const best = candidates.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.15)] mb-6">
      <img src={best.image_url} alt={`Photo of the week by ${best.author_name || "a teammate"}`} className="w-full max-h-56 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400/90 text-slate-900 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full shadow-lg animate-gentle-drift">
        <Camera size={11} /> Photo of the Week
      </div>
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        <span className="text-white font-bold text-sm drop-shadow">{best.author_name || "Teammate"}</span>
        <span className="flex items-center gap-1 text-red-300 text-xs font-bold">
          <Heart size={12} fill="currentColor" /> {best.likes}
        </span>
      </div>
    </div>
  );
}