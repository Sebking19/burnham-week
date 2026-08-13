// Wind recommendations based on RYA / class association guidelines
// Sources: RYA Club Racing, IODA Race Management Guidelines, class handbooks
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_BOATS } from "./BoatWindLimitsSettings";
import { format } from "date-fns";
import { X, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const BOATS_CONFIG = [
  { name: "Optimist",  icon: "⛵", group: "pond",   minKn: 3,  notes: "Max F4 (16kn) recommended by IODA for juniors. Abandon if >25kn average." },
  { name: "Cadet",     icon: "⛵", group: "cadets", minKn: 4,  notes: "Two-handed junior boat. F5 (18kn) is upper limit; consider crew weight." },
  { name: "Tera",      icon: "⛵", group: "pond",   minKn: 3,  notes: "Pro rig suits stronger winds. Sport rig limit ~F4. Switch to Pro at F3+." },
  { name: "Feva",      icon: "⛵", group: "river1", minKn: 5,  notes: "Drop jib in F5+. Two-handed; upper limit ~F5 (22kn) for less experienced crews." },
  { name: "Topper",    icon: "⛵", group: "river1", minKn: 4,  notes: "Rig down to smaller sail in F4+. Max ~F5 for lighter/less experienced sailors." },
  { name: "Laser 4.7", icon: "⛵", group: "river2", minKn: 5,  notes: "Junior / lighter sailor rig. Comfortable to ~F5 (22kn); manageable to 25kn." },
  { name: "Laser 5.7", icon: "⛵", group: "river2", minKn: 6,  notes: "Intermediate rig. Upper limit ~F6 (25kn) depending on sailor weight and skill." },
  { name: "RS200",     icon: "⛵", group: "race",   minKn: 6,  notes: "Reef main at ~18kn; drop spinnaker in F5+. Experienced crews can sail to F6." },
];

function getStatus(windKn, boat) {
  if (windKn < boat.minKn)          return { label: "Too light",   color: "text-white/30",   bg: "bg-white/5",         dot: "bg-white/20" };
  if (windKn > boat.redAbove)       return { label: "Too strong",  color: "text-red-400",    bg: "bg-red-500/10",      dot: "bg-red-500" };
  if (windKn > boat.yellowMax)      return { label: "Caution",     color: "text-orange-300", bg: "bg-orange-500/10",   dot: "bg-orange-400" };
  if (windKn > boat.greenMax)       return { label: "Reef/reduce", color: "text-yellow-300", bg: "bg-yellow-500/10",   dot: "bg-yellow-400" };
  return                                   { label: "Good to go",  color: "text-green-400",  bg: "bg-green-500/10",    dot: "bg-green-500" };
}

export default function BoatWindGuide({ windKn, gustKn, user }) {
  const [overrides, setOverrides] = useState({});
  const [cancellations, setCancellations] = useState([]); // today's cancellations
  const [confirmBoat, setConfirmBoat] = useState(null); // boat name awaiting confirm
  const [withdrawBoat, setWithdrawBoat] = useState(null); // boat name awaiting withdraw confirm
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const isTrainerPlus = user && ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);

  useEffect(() => {
    base44.entities.BoatWindConfig.list("", 1).then(records => {
      if (records.length > 0) setOverrides(records[0].limits || {});
    }).catch(() => {});

    base44.entities.SailingCancellation.filter({ date: today }).then(setCancellations).catch(() => {});
  }, []);

  // Merge defaults with any saved overrides per boat
  const BOATS = BOATS_CONFIG.map(b => {
    const defaults = DEFAULT_BOATS.find(d => d.name === b.name) || {};
    const saved = overrides[b.name] || {};
    return {
      ...b,
      greenMax:  saved.greenMax  ?? defaults.greenMax,
      yellowMax: saved.yellowMax ?? defaults.yellowMax,
      redAbove:  saved.redAbove  ?? defaults.redAbove,
    };
  });

  const handleCancel = async (boat) => {
    setSaving(true);
    const created = await base44.entities.SailingCancellation.create({
      boat_name: boat.name,
      date: today,
      reason: `Wind ${windKn}kn${gustKn ? ` / gusts ${gustKn}kn` : ""}`,
      cancelled_by: user?.full_name || user?.email || "Trainer",
    });
    setCancellations(prev => [...prev, created]);
    setConfirmBoat(null);
    setSaving(false);
  };

  const handleWithdraw = async (boatName) => {
    setSaving(true);
    const record = cancellations.find(c => c.boat_name === boatName && c.date === today);
    if (record) {
      await base44.entities.SailingCancellation.delete(record.id);
      setCancellations(prev => prev.filter(c => c.id !== record.id));
    }
    setWithdrawBoat(null);
    setSaving(false);
  };

  if (windKn == null) return null;

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5 mb-5">
      <div className="mb-4">
        <p className="text-white font-bold text-sm">🚤 Boat Wind Guide</p>
        <p className="text-white/30 text-[10px] mt-0.5">
          Based on {windKn}kn wind{gustKn ? ` / ${gustKn}kn gusts` : ""} · RYA &amp; class association guidelines
        </p>
      </div>

      <div className="space-y-2">
        {BOATS.map((boat) => {
          const status = getStatus(windKn, boat);
          const isCancelled = cancellations.some(c => c.boat_name === boat.name && c.date === today);
          const isConfirming = confirmBoat === boat.name;
          const isWithdrawing = withdrawBoat === boat.name;

          return (
            <div key={boat.name} className={`border border-white/8 rounded-2xl px-4 py-3 ${isCancelled ? "bg-red-900/20 border-red-500/20" : status.bg}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCancelled ? "bg-red-500" : status.dot}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isCancelled ? "text-red-300 line-through" : "text-white"}`}>{boat.name}</p>
                    {isCancelled ? (
                      <p className="text-red-400/70 text-[10px] font-semibold">SAILING CANCELLED TODAY</p>
                    ) : (
                      <p className="text-white/35 text-[10px] leading-snug mt-0.5 truncate">{boat.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isCancelled && (
                    <div className="text-right mr-1">
                      <p className={`text-xs font-bold ${status.color}`}>{status.label}</p>
                      <p className="text-white/25 text-[10px]">red &gt;{boat.redAbove}kn</p>
                    </div>
                  )}
                  {isTrainerPlus && !isCancelled && !isConfirming && (
                    <button
                      onClick={() => setConfirmBoat(boat.name)}
                      className="text-[10px] px-2.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-semibold whitespace-nowrap"
                    >
                      Cancel sailing
                    </button>
                  )}
                  {isTrainerPlus && isCancelled && !isWithdrawing && (
                    <button
                      onClick={() => setWithdrawBoat(boat.name)}
                      className="text-[10px] px-2.5 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all font-semibold whitespace-nowrap"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm cancel */}
              <AnimatePresence>
                {isConfirming && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-red-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-xs font-semibold">Cancel sailing for {boat.name} today?</p>
                    </div>
                    <p className="text-white/40 text-[11px] mb-3">This will be visible to all members on the forecast page.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmBoat(null)}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
                      >
                        No, keep
                      </button>
                      <button
                        onClick={() => handleCancel(boat)}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
                      >
                        Yes, cancel sailing
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Confirm withdraw */}
                {isWithdrawing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-green-500/20"
                  >
                    <p className="text-green-300 text-xs font-semibold mb-1">Withdraw cancellation for {boat.name}?</p>
                    <p className="text-white/40 text-[11px] mb-3">Sailing will show as active again for all members.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawBoat(null)}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
                      >
                        Keep cancelled
                      </button>
                      <button
                        onClick={() => handleWithdraw(boat.name)}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
                      >
                        Yes, withdraw
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="text-white/15 text-[9px] mt-3">
        Guidelines sourced from RYA, IODA &amp; class associations. Always use instructor/race officer judgement on the day.
      </p>
    </div>
  );
}