import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "@/components/PullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import { format, addWeeks, nextFriday, isSameDay } from "date-fns";
import { Check, Users, Anchor, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OtterWeekVolunteering from "@/components/OtterWeekVolunteering";

const DEFAULT_ROLES = ["Launch Ribs"];

function getUpcomingFridays(count = 6) {
  const today = new Date();
  const fri = today.getDay() === 5 ? today : nextFriday(today);
  return Array.from({ length: count }, (_, i) => addWeeks(fri, i));
}

export default function Volunteering() {
  const [user, setUser] = useState(null);
  const [otterUsernames, setOtterUsernames] = useState({});
  const [allSignups, setAllSignups] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => getUpcomingFridays(1)[0]);
  const [mySignup, setMySignup] = useState(null);
  const [volunteerRoles, setVolunteerRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [activeTab, setActiveTab] = useState("friday");
  const [showOtterWeek, setShowOtterWeek] = useState(false);

  const fridays = getUpcomingFridays(6);

  const isTrainerPlus = user && ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);
  const hasVolunteerSubrole = user && (Array.isArray(user.roles) ? user.roles.includes("otter_volunteer") : user.role === "otter_volunteer");
  const isVolunteer = hasVolunteerSubrole || isTrainerPlus;

  const loadSignups = async () => {
    const data = await base44.entities.VolunteerSignup.list("-friday_date", 100);
    setAllSignups(data);
  };

  const { pullY, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(loadSignups);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadSignups();
    base44.entities.OtterWeekConfig.list().then(records => {
      if (records.length > 0) setShowOtterWeek(records[0].show_otter_week_features === true);
    }).catch(() => {});
    base44.entities.OtterUsername.list().then(records => {
      const map = {};
      records.forEach(r => { if (r.user_email) map[r.user_email] = r.username || ""; });
      setOtterUsernames(map);
    }).catch(() => {});
    // Load custom roles from settings
    base44.entities.SettingsConfig.filter({ key: "volunteer_roles" }, "", 1).then(records => {
      if (records.length > 0) {
        try {
          const roles = JSON.parse(records[0].value);
          if (Array.isArray(roles) && roles.length > 0) {
            setVolunteerRoles(roles);
            setSelectedRole(roles[0]);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDate && user) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const mine = allSignups.find(s => s.friday_date === dateStr && s.user_email === user.email);
      setMySignup(mine || null);
      setSelectedRole(mine?.role || volunteerRoles[0]);
      setNote(mine?.note || "");
    }
  }, [selectedDate, allSignups, user]);

  const selectDate = (date) => setSelectedDate(date);

  const handleSignup = async () => {
    if (!selectedDate || !user) return;
    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const payload = {
      user_email: user.email,
      user_name: user.full_name || user.email,
      friday_date: dateStr,
      role: selectedRole,
      note: note.trim(),
    };
    if (mySignup?.id) {
      const updated = await base44.entities.VolunteerSignup.update(mySignup.id, payload);
      setAllSignups(prev => prev.map(s => s.id === updated.id ? updated : s));
      setMySignup(updated);
    } else {
      const created = await base44.entities.VolunteerSignup.create(payload);
      setAllSignups(prev => [...prev, created]);
      setMySignup(created);
    }
    setSaving(false);
  };

  const handleWithdraw = async () => {
    if (!mySignup?.id) return;
    setSaving(true);
    await base44.entities.VolunteerSignup.delete(mySignup.id);
    setAllSignups(prev => prev.filter(s => s.id !== mySignup.id));
    setMySignup(null);
    setNote("");
    setSaving(false);
  };

  const handleConfirm = async (signupId, confirmed) => {
    const updated = await base44.entities.VolunteerSignup.update(signupId, { confirmed });
    setAllSignups(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const saveRoles = async (roles) => {
    const value = JSON.stringify(roles);
    const records = await base44.entities.SettingsConfig.filter({ key: "volunteer_roles" }, "", 1);
    if (records.length > 0) {
      await base44.entities.SettingsConfig.update(records[0].id, { key: "volunteer_roles", value });
    } else {
      await base44.entities.SettingsConfig.create({ key: "volunteer_roles", value });
    }
  };

  const handleAddRole = async () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed || volunteerRoles.includes(trimmed)) return;
    const updated = [...volunteerRoles, trimmed];
    setVolunteerRoles(updated);
    setNewRoleInput("");
    setShowAddRole(false);
    await saveRoles(updated);
  };

  const handleRemoveRole = async (role) => {
    const updated = volunteerRoles.filter(r => r !== role);
    if (updated.length === 0) return;
    setVolunteerRoles(updated);
    if (selectedRole === role) setSelectedRole(updated[0]);
    await saveRoles(updated);
  };

  const displayName = (email, name) => otterUsernames[email] || name || email;

  const dateSignups = selectedDate
    ? allSignups.filter(s => s.friday_date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  if (!isVolunteer) {
    return (
      <div className="py-2">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Volunteering</h1>
          <p className="text-cyan-200/40 text-sm mt-0.5">RIB launch volunteers</p>
        </div>
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-8 text-center">
          <Anchor size={32} className="text-cyan-400/50 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Volunteer Access Required</p>
          <p className="text-white/40 text-sm">You need the volunteer role to view this page. Sign up in your Profile to get access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <div className="mb-4">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Volunteering</h1>
        <p className="text-cyan-200/40 text-sm mt-0.5">RIB launch & safety cover sign-ups</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("friday")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${activeTab === "friday" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 border-transparent shadow-lg shadow-cyan-500/40" : "bg-slate-900/60 text-white/60 border-white/10 hover:text-white"}`}
        >
          Friday Evenings
        </button>
        {showOtterWeek && (
          <button
            onClick={() => setActiveTab("otter_week")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${activeTab === "otter_week" ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/30" : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"}`}
          >
            🦦 Otter Week
          </button>
        )}
      </div>

      {activeTab === "otter_week" && showOtterWeek ? (
        <OtterWeekVolunteering user={user} otterUsernames={otterUsernames} />
      ) : null}

      {activeTab === "friday" && <>
      {/* Friday selector */}
      <div className="mb-6">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Select Friday</p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {fridays.map(fri => {
            const dateStr = format(fri, "yyyy-MM-dd");
            const count = allSignups.filter(s => s.friday_date === dateStr).length;
            const isSelected = selectedDate && isSameDay(selectedDate, fri);
            const iSignedUp = user && allSignups.some(s => s.friday_date === dateStr && s.user_email === user.email);
            return (
              <button
                key={dateStr}
                onClick={() => selectDate(fri)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all ${
                  isSelected ? "bg-gradient-to-b from-sky-500/50 to-cyan-400/20 border-cyan-400/60 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "bg-slate-900/50 border-white/10 text-white/60 hover:border-cyan-400/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide">{format(fri, "MMM")}</span>
                <span className="text-lg font-bold leading-none mt-0.5">{format(fri, "d")}</span>
                <span className="text-[10px] text-white/40 mt-1">{count} 🙋</span>
                {isSameDay(fri, new Date()) && <span className="text-[8px] font-bold text-cyan-300 mt-0.5">TODAY</span>}
                {iSignedUp && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {!selectedDate ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 text-center">
          <p className="text-white/30 text-sm">Select a Friday to sign up or see who's volunteering</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-white font-bold text-base">{format(selectedDate, "EEEE d MMMM yyyy")}</h2>

          {/* My signup card */}
          <div className={`border rounded-3xl p-5 ${mySignup ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/[0.04] border-white/8"}`}>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3">
              {mySignup ? "✓ You're signed up" : "Sign up to volunteer"}
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white/40 text-xs">Volunteer role</p>
                  {isTrainerPlus && (
                    <button
                      onClick={() => setShowAddRole(v => !v)}
                      className="flex items-center gap-1 text-[10px] text-cyan-400/70 hover:text-cyan-300 transition-colors"
                    >
                      <Plus size={10} /> Add role
                    </button>
                  )}
                </div>
                {isTrainerPlus && showAddRole && (
                  <div className="flex gap-2 mb-2">
                    <input
                      value={newRoleInput}
                      onChange={e => setNewRoleInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddRole()}
                      placeholder="New role name..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none"
                    />
                    <button onClick={handleAddRole} className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">Add</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {volunteerRoles.map(r => (
                    <div key={r} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-sm cursor-pointer transition-all ${selectedRole === r ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8"}`}
                      onClick={() => setSelectedRole(r)}
                    >
                      {r}
                      {isTrainerPlus && volunteerRoles.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); handleRemoveRole(r); }}
                          className="ml-1 text-white/30 hover:text-red-400 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Note (optional)</p>
                <input
                  placeholder="Any notes..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                {mySignup && (
                  <button
                    onClick={handleWithdraw}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/15 transition-all disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                )}
                <button
                  onClick={handleSignup}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-bold hover:bg-cyan-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? "..." : mySignup ? "Update" : "Sign Up"}
                </button>
              </div>
            </div>
          </div>

          {/* Who's volunteering */}
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-white/40" />
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                Volunteers ({dateSignups.length})
              </p>
            </div>
            {dateSignups.length === 0 ? (
              <p className="text-white/25 text-sm text-center py-4">No volunteers yet for this Friday</p>
            ) : (
              <div className="space-y-2">
                {dateSignups.map(s => (
                  <div key={s.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border ${s.confirmed ? "bg-green-500/10 border-green-500/20" : "bg-white/[0.03] border-white/8"}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{displayName(s.user_email, s.user_name)}</p>
                      <p className="text-white/40 text-xs">{s.role}{s.note ? ` · ${s.note}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.confirmed && <span className="text-[10px] text-green-400 font-bold">CONFIRMED</span>}
                      {isTrainerPlus && (
                        <button
                          onClick={() => handleConfirm(s.id, !s.confirmed)}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${s.confirmed ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"}`}
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </>}
    </div>
  );
}