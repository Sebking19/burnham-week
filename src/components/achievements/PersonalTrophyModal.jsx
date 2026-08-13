import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import TrophyViewer from "./TrophyViewer";

export default function PersonalTrophyModal({ badge, awards, otterUsernames, onClose }) {
  if (!badge) return null;

  const badgeAwards = awards.filter(a => a.badge_id === badge.id).sort((a, b) => new Date(b.awarded_date) - new Date(a.awarded_date));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
            <h2 className="text-white font-bold text-lg">{badge.name}</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
            {/* 3D Trophy */}
            <div className="flex justify-center py-4 bg-white/[0.02] rounded-2xl">
              <TrophyViewer key={badge.id} modelUrl={badge.model_url} emoji={badge.emoji} size={140} />
            </div>

            {/* Description */}
            {badge.description && <p className="text-white/40 text-sm">{badge.description}</p>}

            {/* Who else has it */}
            <div className="space-y-2">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wide">Others with this award</p>
              {badgeAwards.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-4">No awards yet</p>
              ) : (
                <div className="space-y-2">
                  {badgeAwards.map((award, i) => (
                    <div key={award.id || i} className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold text-sm">{otterUsernames[award.recipient_email] || award.recipient_name}</p>
                        <span className="text-white/40 text-xs">{award.awarded_date}</span>
                      </div>
                      {award.note && <p className="text-white/50 text-xs mt-1 italic">"{award.note}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}