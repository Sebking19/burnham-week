import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Globe, ExternalLink, Pencil, Trash2 } from "lucide-react";
import PhotoLightbox from "@/components/sponsors/PhotoLightbox";

export default function SponsorCard({ sponsor, canEdit, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [photoIndex, setPhotoIndex] = useState(null);
  const allPhotos = [...(sponsor.logo_url ? [sponsor.logo_url] : []), ...(sponsor.photos || [])];
  const accent = sponsor.accent_color || "#22d3ee";

  const handleMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - y) * 14, ry: (x - 0.5) * 14, gx: x * 100, gy: y * 100 });
  };

  const handleLeave = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative rounded-3xl border border-white/15 overflow-hidden bg-slate-900/70 backdrop-blur-xl"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: `0 20px 50px rgba(2,10,30,0.6), 0 0 40px ${accent}22`,
        }}
      >
        {/* Glossy shine following the cursor */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.14), transparent 55%)` }}
          aria-hidden="true"
        />
        {/* Accent glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: accent }} aria-hidden="true" />

        {/* Photo / logo */}
        {sponsor.logo_url && (
          <button
            onClick={() => setPhotoIndex(0)}
            aria-label={`View ${sponsor.name} photo full size`}
            className="relative h-44 overflow-hidden w-full block cursor-zoom-in"
            style={{ transform: "translateZ(30px)" }}
          >
            <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
          </button>
        )}

        <div className="relative p-5" style={{ transform: "translateZ(40px)" }}>
          <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{sponsor.name}</h3>
          {sponsor.place && (
            <p className="flex items-center gap-1.5 text-white/50 text-xs mt-2">
              <MapPin size={12} style={{ color: accent }} /> {sponsor.place}
            </p>
          )}
          {sponsor.description && <p className="text-white/60 text-sm leading-relaxed mt-3">{sponsor.description}</p>}

          {/* Extra photos */}
          {sponsor.photos?.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto nav-scroll">
              {sponsor.photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i + (sponsor.logo_url ? 1 : 0))}
                  aria-label={`View ${sponsor.name} photo ${i + 1} full size`}
                  className="shrink-0 cursor-zoom-in"
                >
                  <img src={url} alt={`${sponsor.name} photo ${i + 1}`} className="w-16 h-16 rounded-xl object-cover border border-white/15 hover:border-cyan-400/50 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2 mt-4">
            {sponsor.website && (
              <a
                href={sponsor.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)`, boxShadow: `0 4px 15px ${accent}44` }}
              >
                <Globe size={13} /> Visit Website
              </a>
            )}
            {(sponsor.links || []).filter(l => l?.url).map((link, i) => (
              <a
                key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 transition-all"
              >
                <ExternalLink size={12} /> {link.label || "Link"}
              </a>
            ))}
          </div>

          {canEdit && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
              <button onClick={() => onEdit(sponsor)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all">
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => onDelete(sponsor)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs font-semibold transition-all">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {photoIndex !== null && (
        <PhotoLightbox
          photos={allPhotos}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onNavigate={setPhotoIndex}
        />
      )}
    </motion.div>
  );
}