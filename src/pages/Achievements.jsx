import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trophy, User } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import BadgeCard from "@/components/achievements/BadgeCard";
import CreateBadgeModal from "@/components/achievements/CreateBadgeModal";
import PersonalTrophyModal from "@/components/achievements/PersonalTrophyModal";

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("mine"); // "mine" | "all"
  const [badges, setBadges] = useState([]);
  const [awards, setAwards] = useState([]);
  const [members, setMembers] = useState([]);
  const [otterUsernames, setOtterUsernames] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPrivileged = (role) => ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(role);
  const isAdminLevel = (role) => ["owner", "admin", "chairman"].includes(role);

  const load = async () => {
    setLoading(true);
    const [u, b, a] = await Promise.all([
      base44.auth.me(),
      base44.entities.Badge.list("-created_date", 100),
      base44.entities.BadgeAward.list("-awarded_date", 500),
    ]);
    setUser(u);
    setBadges(b.filter(badge => badge.active !== false));
    setAwards(a);

    if (isPrivileged(u?.role)) {
      const [m, un] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.OtterUsername.list(),
      ]);
      setMembers(m);
      const map = {};
      un.forEach(r => { if (r.user_email) map[r.user_email] = r.username || ""; });
      setOtterUsernames(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const myAwards = awards.filter(a => a.recipient_email === user?.email);
  const myBadgeIds = [...new Set(myAwards.map(a => a.badge_id))];
  const myBadges = badges.filter(b => myBadgeIds.includes(b.id));

  const canAward = isPrivileged(user?.role);
  const canCreate = isAdminLevel(user?.role) || isPrivileged(user?.role);

  if (loading) {
    return (
      <div className="py-2 flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Achievements</h1>
          <p className="text-cyan-200/40 text-sm mt-0.5">Trophies, badges & awards</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/40 hover:opacity-90 flex items-center justify-center transition-all text-white"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("mine")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${tab === "mine" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 border-transparent shadow-lg shadow-cyan-500/40" : "bg-slate-900/60 text-white/60 border-white/10 hover:text-white"}`}
        >
          <User size={13} /> My Achievements
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${tab === "all" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 border-transparent shadow-lg shadow-cyan-500/40" : "bg-slate-900/60 text-white/60 border-white/10 hover:text-white"}`}
        >
          <Trophy size={13} /> All Trophies
        </button>
      </div>

      {/* My Achievements Tab */}
      {tab === "mine" && (
        <div>
          {myAwards.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-10 text-center">
              <div className="text-5xl mb-3">🏅</div>
              <p className="text-white/40 text-sm">No awards yet — keep sailing!</p>
            </div>
          ) : (
            <>
              {/* Summary row */}
              <div className="flex gap-3 mb-7">
                {[
                  { label: "Trophies", cat: "trophy", emoji: "🏆" },
                  { label: "Badges", cat: "badge", emoji: "🎖️" },
                  { label: "Medals", cat: "medal", emoji: "🥇" },
                ].map(({ label, cat, emoji }) => {
                  const count = myAwards.filter(a => badges.find(b => b.id === a.badge_id)?.category === cat).length;
                  return (
                    <div key={cat} className="flex-1 bg-white/[0.04] border border-white/8 rounded-2xl p-4 text-center">
                      <div className="text-2xl mb-1">{emoji}</div>
                      <p className="text-white font-bold text-lg">{count}</p>
                      <p className="text-white/30 text-[10px]">{label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Timeline of awards */}
              <div className="space-y-3">
                {myAwards.map(award => {
                  const badge = badges.find(b => b.id === award.badge_id);
                  if (!badge) return null;
                  return (
                    <button
                      key={award.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="flex items-center gap-4 bg-white/[0.04] border border-white/8 rounded-2xl px-5 py-4 hover:bg-white/[0.08] hover:border-white/15 transition-all text-left w-full"
                    >
                      <div className="text-3xl">{badge.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{badge.name}</p>
                        {award.note && <p className="text-white/50 text-xs italic mt-0.5">"{award.note}"</p>}
                        <p className="text-white/30 text-xs mt-0.5">Season {award.season || "—"}</p>
                      </div>
                      <span className="text-white/30 text-xs flex-shrink-0">{award.awarded_date}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* All Trophies Tab */}
      {tab === "all" && (
        <div>
          {badges.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-10 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-white/40 text-sm">No trophies created yet.</p>
              {canCreate && <p className="text-white/25 text-xs mt-1">Tap + to create the first one</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {badges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  awards={awards}
                  canAward={canAward}
                  members={members}
                  otterUsernames={otterUsernames}
                  onAward={load}
                  userRole={user?.role}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateBadgeModal onClose={() => setShowCreate(false)} onCreated={load} />
        )}
        {selectedBadge && (
          <PersonalTrophyModal
            badge={selectedBadge}
            awards={awards}
            otterUsernames={otterUsernames}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}