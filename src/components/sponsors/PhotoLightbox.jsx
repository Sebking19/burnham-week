import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function PhotoLightbox({ photos, index, onClose, onNavigate }) {
  if (index === null || index === undefined) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          aria-label="Close photo"
          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white z-10"
          style={{ marginTop: "env(safe-area-inset-top)" }}
        >
          <X size={20} />
        </button>

        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + photos.length) % photos.length); }}
              aria-label="Previous photo"
              className="absolute left-2 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white z-10"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % photos.length); }}
              aria-label="Next photo"
              className="absolute right-2 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white z-10"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <motion.img
          key={index}
          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
          src={photos[index]}
          alt={`Photo ${index + 1} of ${photos.length}`}
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        {photos.length > 1 && (
          <p className="absolute bottom-6 text-white/60 text-xs font-bold">{index + 1} / {photos.length}</p>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}