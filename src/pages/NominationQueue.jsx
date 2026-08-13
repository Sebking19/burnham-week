import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock } from "lucide-react";

export default function NominationQueue() {
  const [user, setUser] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [badges, setBadges] = useState({});
  const [filter, setFilter] = useState("pending"); // "pending" | "approved" | "declined" | "all"
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const isModeration = (role) => ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(role);

  const load = async () => {
    setLoading(true);
    const [u, n, b] = await Promise.all([
      base44.auth.me(),
      base44.entities.TrophyNomination.list("-created_date", 100),
      base44.entities.Badge.list(),
    ]);
    setUser(u);
    setNominations(n);
    const badgeMap = {};
    b.forEach(badge => { badgeMap[badge.id] = badge; });
    setBadges(badgeMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (nom) => {
    setProcessing(nom.id);
    const badge = badges[nom.badge_id];
    await base44.entities.TrophyNomination.update(nom.id, {
      status: "approved",
      decided_by: user.email,
      decided_date: new Date().toISOString().split("T")[0],
    });
    // Auto-award the trophy
    await base44.entities.BadgeAward.create({
      badge_id: nom.badge_id,
      recipient_email: nom.nominee_email,
      recipient_name: nom.nominee_name,
      awarded_by_name: user.full_name,
      note: `Nominated by ${nom.nominator_name}: ${nom.reason}`,
      awarded_date: new Date().toISOString().split("T")[0],
      season: new Date().getFullYear().toString(),
    });
    setProcessing(null);
    await load();
  };

  const handleDecline = async (nom) => {
    setProcessing(nom.id);
    await base44.entities.TrophyNomination.update(nom.id, {
      status: "declined",
      decided_by: user.email,
      decided_date: new Date().toISOString().split("T")[0],
    });
    setProcessing(null);
    await load();
  };

  if (!isModeration(user?.role)) {
    return (
      <div className="py-12 text-center">
        <p className="text-white/40">You don't have access to this queue.</p>
      </div>
    );
  }

  const filtered = nominations.filter(n => filter === "all" ? true : n.status === filter);
  const pending = nominations.filter(n => n.status === "pending").length;

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Nomination Queue</h1>
          <p className="text-cyan-200/40 text-sm mt-1">Review and approve trophy nominations</p>
        </div>
        {pending > 0 && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-3 py-1.5">
            <p className="text-blue-200 font-bold text-sm">{pending} pending</p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["pending", "approved", "declined", "all"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === f
                ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 border-transparent shadow-lg shadow-cyan-500/40"
                : "bg-slate-900/60 text-white/40 border-white/10 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pending > 0 && ` (${pending})`}
          </button>
        ))}
      </div>

      {/* Nominations list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/20 text-sm">No {filter} nominations</p>
            </div>
          ) : (
            filtered.map(nom => {
              const badge = badges[nom.badge_id];
              const statusConfig = {
                pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
                approved: { icon: Check, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
                declined: { icon: X, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
              }[nom.status];
              const Icon = statusConfig.icon;

              return (
                <motion.div
                  key={nom.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`border rounded-2xl p-4 ${statusConfig.bg}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{badge?.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm">{nom.nominee_name}</p>
                        <p className="text-white/50 text-xs">{badge?.name || "Trophy"}</p>
                        <p className="text-white/40 text-xs mt-1">Nominated by: {nom.nominator_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Icon className={`${statusConfig.color} w-4 h-4`} />
                    </div>
                  </div>

                  {nom.reason && (
                    <div className="bg-white/5 rounded-xl p-3 mb-3">
                      <p className="text-white/70 text-xs italic">"{nom.reason}"</p>
                    </div>
                  )}

                  {nom.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(nom)}
                        disabled={processing === nom.id}
                        className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs disabled:opacity-50 transition-all"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDecline(nom)}
                        disabled={processing === nom.id}
                        className="flex-1 py-2 rounded-xl bg-red-600/50 hover:bg-red-600 text-white font-bold text-xs disabled:opacity-50 transition-all"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  )}

                  {nom.status !== "pending" && (
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{nom.status === "approved" ? "✓ Approved" : "✕ Declined"}</span>
                      {nom.decided_date && <span>• {nom.decided_date}</span>}
                      {nom.decided_by && <span>• by {nom.decided_by}</span>}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}