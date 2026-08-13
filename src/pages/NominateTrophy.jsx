import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, AlertCircle } from "lucide-react";

export default function NominateTrophy() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("person"); // "person" | "trophy" | "reason" | "success"
  const [members, setMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otterUsernames, setOtterUsernames] = useState({});

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const [m, b, un] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Badge.list(),
        base44.entities.OtterUsername.list(),
      ]);
      setMembers(m.filter(x => x.email !== u.email));
      setBadges(b.filter(x => x.active !== false && x.category === "trophy"));
      const map = {};
      un.forEach(r => { if (r.user_email) map[r.user_email] = r.username || ""; });
      setOtterUsernames(map);
    };
    load().catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!selectedMember || !selectedBadge || !reason.trim()) return;
    setSubmitting(true);
    await base44.entities.TrophyNomination.create({
      badge_id: selectedBadge.id,
      nominee_email: selectedMember.email,
      nominee_name: selectedMember.full_name,
      nominator_email: user.email,
      nominator_name: otterUsernames[user.email] || user.full_name,
      reason: reason.trim(),
    });
    setSubmitting(false);
    setStep("success");
    setTimeout(() => {
      setStep("person");
      setSelectedMember(null);
      setSelectedBadge(null);
      setReason("");
    }, 3000);
  };

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Nominate a Sailor</h1>
        <p className="text-cyan-200/40 text-sm mt-1">Know someone who deserves a trophy? Nominate them here.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === "person" && (
          <motion.div
            key="person"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <p className="text-white/60 text-sm font-semibold">Step 1: Who are you nominating?</p>
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
              {members.map(m => (
                <button
                  key={m.email}
                  onClick={() => { setSelectedMember(m); setStep("trophy"); }}
                  className={`w-full p-4 rounded-2xl text-left border transition-all ${
                    selectedMember?.email === m.email
                      ? "bg-gradient-to-b from-sky-500/40 to-cyan-400/15 border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                      : "bg-slate-900/50 border-white/10 hover:border-cyan-400/30"
                  }`}
                >
                  <p className="text-white font-semibold">{otterUsernames[m.email] || m.full_name}</p>
                  <p className="text-white/40 text-xs">{m.email}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "trophy" && (
          <motion.div
            key="trophy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep("person")}
                className="text-white/40 hover:text-white text-sm"
              >
                ← Back
              </button>
              <p className="text-white/60 text-sm font-semibold">Step 2: Which trophy?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {badges.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBadge(b); setStep("reason"); }}
                  className={`p-4 rounded-2xl text-center border transition-all ${
                    selectedBadge?.id === b.id
                      ? "bg-gradient-to-b from-sky-500/40 to-cyan-400/15 border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                      : "bg-slate-900/50 border-white/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="text-3xl mb-2">{b.emoji}</div>
                  <p className="text-white font-semibold text-sm">{b.name}</p>
                  {b.description && <p className="text-white/30 text-xs mt-1">{b.description}</p>}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "reason" && (
          <motion.div
            key="reason"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep("trophy")}
                className="text-white/40 hover:text-white text-sm"
              >
                ← Back
              </button>
              <p className="text-white/60 text-sm font-semibold">Step 3: Why?</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Nominating</p>
                <p className="text-white font-bold">{selectedMember?.full_name}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Trophy</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedBadge?.emoji}</span>
                  <p className="text-white font-bold">{selectedBadge?.name}</p>
                </div>
              </div>
            </div>

            <textarea
              placeholder="Why do you think they deserve this trophy?"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/25 text-sm focus:outline-none resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40 font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? "Submitting..." : <>
                <Send size={14} />
                Submit Nomination
              </>}
            </button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 text-center space-y-3"
          >
            <div className="text-5xl">✨</div>
            <h2 className="text-white font-bold text-lg">Nomination Submitted!</h2>
            <p className="text-white/60 text-sm">Thanks for nominating {selectedMember?.full_name}. Trainers and admins will review it soon.</p>
            <Check size={20} className="text-green-400 mx-auto" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}