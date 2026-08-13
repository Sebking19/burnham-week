import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, ChevronDown, Trash2, Users } from "lucide-react";
import TrophyViewer from "./TrophyViewer";
import Tilt3D from "@/components/Tilt3D";

export default function BadgeCard({ badge, awards = [], canAward, members, otterUsernames, onAward, userRole }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [awardForm, setAwardForm] = useState({ recipient_email: "", recipient_legal_name: "", note: "", awarded_date: new Date().toISOString().split("T")[0] });
  const [bulkForm, setBulkForm] = useState({ role: "", note: "", awarded_date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [groupOnly, setGroupOnly] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const isAdminLevel = ["owner", "admin", "chairman"].includes(userRole);

  // Map trainer roles to groups
  const getTrainerGroup = (role) => {
    const groupMap = {
      pond_trainer: "pond",
      river1_trainer: "river1",
      river2_trainer: "river2",
      race_trainer: "race",
      cadet_trainer: "cadets",
      fast_trainer: "fast",
    };
    return groupMap[role];
  };

  const trainerGroup = getTrainerGroup(userRole);
  const isTrainer = !!trainerGroup;

  // Filter members by group if trainer and groupOnly is true
  const getAvailableMembers = () => {
    if (!isTrainer || !groupOnly) return members;
    return members.filter(m => m.role && m.role.includes(trainerGroup));
  };

  const badgeAwards = awards.filter(a => a.badge_id === badge.id).sort((a, b) => new Date(b.awarded_date) - new Date(a.awarded_date));

  const handleAward = async () => {
    if (!awardForm.recipient_email || !awardForm.recipient_legal_name.trim()) return;
    setSaving(true);
    await base44.entities.BadgeAward.create({
      badge_id: badge.id,
      recipient_email: awardForm.recipient_email,
      recipient_name: awardForm.recipient_legal_name.trim(),
      note: awardForm.note,
      awarded_date: awardForm.awarded_date,
      season: new Date(awardForm.awarded_date).getFullYear().toString(),
    });
    setShowAwardForm(false);
    setAwardForm({ recipient_email: "", recipient_legal_name: "", note: "", awarded_date: new Date().toISOString().split("T")[0] });
    setSaving(false);
    onAward?.();
  };

  const handleDeleteBadge = async () => {
    if (!confirm(`Delete "${badge.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await base44.entities.Badge.update(badge.id, { active: false });
    setShowHistory(false);
    setDeleting(false);
    onAward?.();
  };

  const handleBulkAward = async () => {
    if (!bulkForm.role) return;
    setSaving(true);
    const recipientsToAward = bulkForm.role === "*" 
      ? members 
      : members.filter(m => m.role && m.role.includes(bulkForm.role));
    for (const member of recipientsToAward) {
      await base44.entities.BadgeAward.create({
        badge_id: badge.id,
        recipient_email: member.email,
        recipient_name: member.full_name,
        note: bulkForm.note,
        awarded_date: bulkForm.awarded_date,
        season: new Date(bulkForm.awarded_date).getFullYear().toString(),
      });
    }
    setShowBulkForm(false);
    setBulkForm({ role: "", note: "", awarded_date: new Date().toISOString().split("T")[0] });
    setSaving(false);
    onAward?.();
  };

  const categoryColor = {
    trophy: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
    badge: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    medal: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  }[badge.category] || "from-white/5 to-white/10 border-white/15";

  return (
    <>
      <Tilt3D max={10}>
      <button
        onClick={() => setShowHistory(true)}
        className={`w-full h-full bg-gradient-to-br ${categoryColor} border rounded-2xl p-4 text-left transition-all duration-200`}
      >
        <div className="text-3xl mb-2">{badge.emoji}</div>
        <p className="text-white font-bold text-sm">{badge.name}</p>
        {badge.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{badge.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-white/30 text-[10px] uppercase font-semibold tracking-wide">{badge.category}</span>
          <span className="text-white/40 text-xs">{badgeAwards.length} award{badgeAwards.length !== 1 ? "s" : ""}</span>
        </div>
      </button>
      </Tilt3D>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Sticky header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
                <h2 className="text-white font-bold text-lg">{badge.name}</h2>
                <div className="flex items-center gap-2">
                  {isAdminLevel && (
                    <button
                      onClick={handleDeleteBadge}
                      disabled={deleting}
                      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      title="Delete trophy"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button onClick={() => setShowHistory(false)} className="text-white/30 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
                {/* 3D Trophy */}
                <div className="flex justify-center">
                  <TrophyViewer modelUrl={badge.model_url} emoji={badge.emoji} size={140} />
                </div>
                {badge.description && <p className="text-white/40 text-sm">{badge.description}</p>}

                <div className="space-y-2">
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Winners History</p>
                  {badgeAwards.length === 0 ? (
                    <p className="text-white/20 text-sm text-center py-6">No awards yet</p>
                  ) : (
                    badgeAwards.map((award, i) => (
                       <div key={award.id || i} className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                         <div className="flex items-center justify-between">
                           <p className="text-white font-semibold text-sm">{otterUsernames[award.recipient_email] || award.recipient_name}</p>
                           <span className="text-white/40 text-xs">{award.awarded_date}</span>
                         </div>
                         {award.note && <p className="text-white/50 text-xs mt-1 italic">"{award.note}"</p>}
                         {award.season && <p className="text-white/25 text-[10px] mt-1">Season {award.season}</p>}
                       </div>
                     ))
                  )}
                </div>

                  {canAward && (
                   <>
                     {!showAwardForm && !showBulkForm ? (
                       <div className="flex gap-2">
                         <button
                           onClick={() => setShowAwardForm(true)}
                           className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-all border border-white/10"
                         >
                           + Award Individual
                         </button>
                         {isAdminLevel && (
                           <button
                             onClick={() => setShowBulkForm(true)}
                             className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-all border border-white/10 flex items-center justify-center gap-1"
                             title="Award to everyone with a role"
                           >
                             <Users size={14} />
                             Award by Role
                           </button>
                         )}
                       </div>
                     ) : showAwardForm ? (
                      <div className="space-y-2 border-t border-white/10 pt-4">
                        {isTrainer && (
                          <div className="flex items-center gap-2 px-1">
                            <input
                              type="checkbox"
                              id="groupOnly"
                              checked={groupOnly}
                              onChange={e => {
                                setGroupOnly(e.target.checked);
                                setAwardForm(f => ({ ...f, recipient_email: "" }));
                              }}
                              className="w-4 h-4"
                            />
                            <label htmlFor="groupOnly" className="text-white/60 text-xs font-medium">
                              {trainerGroup.charAt(0).toUpperCase() + trainerGroup.slice(1)} group only
                            </label>
                          </div>
                        )}
                        <select
                           value={awardForm.recipient_email}
                           onChange={e => {
                             const member = getAvailableMembers().find(m => m.email === e.target.value);
                             setAwardForm(f => ({ 
                               ...f, 
                               recipient_email: e.target.value,
                               recipient_legal_name: member?.full_name || ""
                             }));
                           }}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                         >
                           <option value="">Select member...</option>
                           {getAvailableMembers().map(m => (
                             <option key={m.email} value={m.email}>
                               {otterUsernames[m.email] || m.full_name || m.email}
                             </option>
                           ))}
                         </select>
                         <input
                           placeholder="Legal name (required)"
                           value={awardForm.recipient_legal_name}
                           onChange={e => setAwardForm(f => ({ ...f, recipient_legal_name: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none"
                         />
                         <input
                           type="date"
                           value={awardForm.awarded_date}
                           onChange={e => setAwardForm(f => ({ ...f, awarded_date: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                         />
                         <input
                           placeholder="Note / reason (optional)"
                           value={awardForm.note}
                           onChange={e => setAwardForm(f => ({ ...f, note: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none"
                         />
                        <div className="flex gap-2">
                           <button onClick={() => setShowAwardForm(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Cancel</button>
                           <button onClick={handleAward} disabled={saving || !awardForm.recipient_email || !awardForm.recipient_legal_name.trim()} className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40">
                             {saving ? "Saving..." : "Award"}
                           </button>
                         </div>
                        </div>
                        ) : showBulkForm ? (
                        <div className="space-y-2 border-t border-white/10 pt-4">
                         <select
                           value={bulkForm.role}
                           onChange={e => setBulkForm(f => ({ ...f, role: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                         >
                           <option value="">Select role...</option>
                           <option value="*">Everyone</option>
                           <option value="pond">Pond</option>
                           <option value="river1">River 1</option>
                           <option value="river2">River 2</option>
                           <option value="race">Race</option>
                           <option value="cadets">Cadets</option>
                           <option value="fast">Fast</option>
                           <option value="trainer">Trainer</option>
                           <option value="admin">Admin</option>
                         </select>
                         <input
                           type="date"
                           value={bulkForm.awarded_date}
                           onChange={e => setBulkForm(f => ({ ...f, awarded_date: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                         />
                         <input
                           placeholder="Note / reason (optional)"
                           value={bulkForm.note}
                           onChange={e => setBulkForm(f => ({ ...f, note: e.target.value }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none"
                         />
                         <div className="flex gap-2">
                           <button onClick={() => setShowBulkForm(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Cancel</button>
                           <button onClick={handleBulkAward} disabled={saving || !bulkForm.role} className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40">
                             {saving ? "Awarding..." : `Award to ${bulkForm.role ? members.filter(m => m.role && m.role.includes(bulkForm.role)).length : 0}`}
                           </button>
                         </div>
                        </div>
                        ) : null}
                        </>
                        )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}