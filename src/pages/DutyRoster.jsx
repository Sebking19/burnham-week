import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, addWeeks, startOfWeek, nextSaturday, isSameDay } from "date-fns";
import SelectDrawer from "@/components/SelectDrawer";
import { ChevronLeft, ChevronRight, Plus, X, Tag, Users, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OtterWeekRoster from "@/components/OtterWeekRoster";

const DEFAULT_ROLES = [
  { name: "Beach", tags: ["beach", "safety"], color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
  { name: "Safety Boat 1", tags: ["safety", "rib"], color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { name: "Safety Boat 2", tags: ["safety", "rib"], color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { name: "Safety Boat 3", tags: ["safety", "rib"], color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { name: "Safety Boat 4", tags: ["safety", "rib"], color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { name: "Race Officer", tags: ["race", "committee"], color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
];

const TAG_COLORS = {
  beach: "bg-blue-500/20 text-blue-300",
  safety: "bg-orange-500/20 text-orange-300",
  rib: "bg-orange-500/20 text-orange-300",
  race: "bg-purple-500/20 text-purple-300",
  committee: "bg-violet-500/20 text-violet-300",
  medical: "bg-green-500/20 text-green-300",
  shore: "bg-cyan-500/20 text-cyan-300",
  default: "bg-white/10 text-white/50",
};

function getSaturday(offset = 0) {
  const today = new Date();
  const sat = nextSaturday(today);
  return addWeeks(offset === 0 ? sat : sat, offset);
}

function getUpcomingSaturdays(count = 8) {
  const saturdays = [];
  const today = new Date();
  let sat = nextSaturday(today);
  // Include today if it's saturday
  const todayDay = today.getDay();
  if (todayDay === 6) sat = today;
  for (let i = 0; i < count; i++) {
    saturdays.push(addWeeks(sat, i));
  }
  return saturdays;
}

export default function DutyRoster() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [otterUsernames, setOtterUsernames] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => getUpcomingSaturdays(1)[0]);
  const [roster, setRoster] = useState(null); // the DB record for selected week
  const [assignments, setAssignments] = useState([]); // working copy
  const [customRoles, setCustomRoles] = useState([]);
  const [configId, setConfigId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleTags, setNewRoleTags] = useState("");
  const [safetyBoatCount, setSafetyBoatCount] = useState(4);
  const [allRosters, setAllRosters] = useState([]);
  const [activeTab, setActiveTab] = useState("saturday");
  const [showOtterWeek, setShowOtterWeek] = useState(false);
  const [availabilities, setAvailabilities] = useState([]); // all availability records for selected date
  const [myAvailability, setMyAvailability] = useState(null); // current user's record
  const [availNote, setAvailNote] = useState("");

  const saturdays = getUpcomingSaturdays(8);

  const isTrainerPlus = user && ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    base44.entities.DutyRoster.list("-week_date", 20).then(setAllRosters).catch(() => {});
    base44.entities.OtterWeekConfig.list().then(records => {
      if (records.length > 0) setShowOtterWeek(records[0].show_otter_week_features === true);
    }).catch(() => {});
    base44.entities.OtterUsername.list().then(records => {
      const map = {};
      records.forEach(r => { if (r.user_email) map[r.user_email] = r.username || ""; });
      setOtterUsernames(map);
    }).catch(() => {});
  }, []);

  // Load availabilities when date or user changes
  useEffect(() => {
    if (!selectedDate || !user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    base44.entities.DutyAvailability.filter({ date: dateStr }).then(records => {
      setAvailabilities(records);
      const mine = records.find(r => r.user_email === user.email);
      setMyAvailability(mine || null);
      setAvailNote(mine?.note || "");
    }).catch(() => {});
  }, [selectedDate, user]);

  useEffect(() => {
    if (isTrainerPlus) {
      base44.entities.User.list().then(setMembers).catch(() => {});
    }
  }, [isTrainerPlus]);

  // Load custom roles from SettingsConfig
  useEffect(() => {
    base44.entities.SettingsConfig.filter({ key: "duty_custom_roles" }, "", 1).then(records => {
      if (records.length > 0) {
        setConfigId(records[0].id);
        try { setCustomRoles(JSON.parse(records[0].value)); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Build safety boats dynamically
  const safetyBoats = Array.from({ length: safetyBoatCount }, (_, i) => ({
    name: `Safety Boat ${i + 1}`,
    tags: ["safety", "rib"],
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  }));

  const allRoles = [
    DEFAULT_ROLES[0], // Beach
    ...safetyBoats,
    DEFAULT_ROLES[DEFAULT_ROLES.length - 1], // Race Officer
    ...customRoles,
  ];

  const selectDate = (date) => setSelectedDate(date);

  // Keep the roster in sync with the selected date once data loads
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existing = allRosters.find(r => r.week_date === dateStr) || null;
    setRoster(existing);
    setAssignments(existing?.assignments || []);
    const maxBoat = (existing?.assignments || []).reduce((max, a) => {
      const m = /^Safety Boat (\d+)$/.exec(a.role);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    setSafetyBoatCount(c => Math.max(c, maxBoat));
  }, [selectedDate, allRosters]);

  const setAssignee = (roleName, userEmail) => {
    const member = members.find(m => m.email === userEmail);
    setAssignments(prev => {
      const filtered = prev.filter(a => a.role !== roleName);
      if (!userEmail) return filtered;
      return [...filtered, {
        role: roleName,
        user_email: userEmail,
        user_name: member?.full_name || userEmail,
      }];
    });
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const payload = { week_date: dateStr, assignments };
    if (roster?.id) {
      const updated = await base44.entities.DutyRoster.update(roster.id, payload);
      setRoster(updated);
      setAllRosters(prev => prev.map(r => r.id === updated.id ? updated : r));
    } else {
      const created = await base44.entities.DutyRoster.create(payload);
      setRoster(created);
      setAllRosters(prev => [...prev, created]);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddCustomRole = async () => {
    if (!newRoleName.trim()) return;
    const tags = newRoleTags.split(",").map(t => t.trim()).filter(Boolean);
    const newRole = { name: newRoleName.trim(), tags, color: "from-white/5 to-white/10 border-white/15" };
    const updated = [...customRoles, newRole];
    setCustomRoles(updated);
    const value = JSON.stringify(updated);
    if (configId) {
      await base44.entities.SettingsConfig.update(configId, { key: "duty_custom_roles", value });
    } else {
      const created = await base44.entities.SettingsConfig.create({ key: "duty_custom_roles", value });
      setConfigId(created.id);
    }
    setNewRoleName("");
    setNewRoleTags("");
    setShowAddRole(false);
  };

  const handleRemoveCustomRole = async (roleName) => {
    const updated = customRoles.filter(r => r.name !== roleName);
    setCustomRoles(updated);
    const value = JSON.stringify(updated);
    if (configId) {
      await base44.entities.SettingsConfig.update(configId, { key: "duty_custom_roles", value });
    }
  };

  const handleToggleAvailability = async (available) => {
    if (!selectedDate || !user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const payload = {
      user_email: user.email,
      user_name: user.full_name || user.email,
      date: dateStr,
      available,
      note: availNote.trim(),
    };
    if (myAvailability?.id) {
      const updated = await base44.entities.DutyAvailability.update(myAvailability.id, payload);
      setMyAvailability(updated);
      setAvailabilities(prev => prev.map(r => r.id === updated.id ? updated : r));
    } else {
      const created = await base44.entities.DutyAvailability.create(payload);
      setMyAvailability(created);
      setAvailabilities(prev => [...prev, created]);
    }
  };

  const handleUpdateNote = async () => {
    if (!myAvailability?.id) return;
    const updated = await base44.entities.DutyAvailability.update(myAvailability.id, { note: availNote.trim() });
    setMyAvailability(updated);
    setAvailabilities(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const toggleVolunteerRole = async (roleName) => {
    if (!myAvailability?.id) return;
    const current = myAvailability.roles || [];
    const roles = current.includes(roleName) ? current.filter(r => r !== roleName) : [...current, roleName];
    const updated = await base44.entities.DutyAvailability.update(myAvailability.id, { roles });
    setMyAvailability(updated);
    setAvailabilities(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const displayName = (email) => otterUsernames[email] || members.find(m => m.email === email)?.full_name || email;

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Duty Roster</h1>
        <p className="text-cyan-200/40 text-sm mt-1">Saturday duty assignments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab("saturday")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${activeTab === "saturday" ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 border-transparent shadow-lg shadow-cyan-500/40" : "bg-slate-900/60 text-white/60 border-white/10 hover:text-white"}`}
        >
          Saturdays
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

      {activeTab === "otter_week" && showOtterWeek && (
        <OtterWeekRoster user={user} members={members} otterUsernames={otterUsernames} />
      )}

      {activeTab === "saturday" && <>
      {/* Week selector */}
      <div className="mb-8">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-4">Select Saturday</p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {saturdays.map(sat => {
            const dateStr = format(sat, "yyyy-MM-dd");
            const hasRoster = allRosters.some(r => r.week_date === dateStr && (r.assignments || []).length > 0);
            const isSelected = selectedDate && isSameDay(selectedDate, sat);
            return (
              <button
                key={dateStr}
                onClick={() => selectDate(sat)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-gradient-to-b from-sky-500/50 to-cyan-400/20 border-cyan-400/60 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    : "bg-slate-900/50 border-white/10 text-white/60 hover:border-cyan-400/30"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide">{format(sat, "MMM")}</span>
                <span className="text-lg font-bold leading-none mt-0.5">{format(sat, "d")}</span>
                {isSameDay(sat, new Date()) && <span className="text-[8px] font-bold text-cyan-300 mt-0.5">TODAY</span>}
                {hasRoster && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {!selectedDate ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 text-center">
          <p className="text-white/30 text-sm">Select a Saturday to view or edit the duty roster</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-base">{format(selectedDate, "EEEE d MMMM yyyy")}</h2>
            {assignments.length > 0 && (
              <span className="text-xs text-white/30">{assignments.length} assigned</span>
            )}
          </div>

          {/* My Availability Toggle */}
          <div className={`border rounded-2xl p-5 mb-5 ${
            myAvailability?.available === true ? "bg-green-500/10 border-green-500/30" :
            myAvailability?.available === false ? "bg-red-500/10 border-red-500/30" :
            "bg-white/[0.04] border-white/10"
          }`}>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">Your Availability</p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleToggleAvailability(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  myAvailability?.available === true
                    ? "bg-green-500/25 border-green-500/50 text-green-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-green-500/10 hover:text-green-300"
                }`}
              >
                <CheckCircle2 size={14} /> Available
              </button>
              <button
                onClick={() => handleToggleAvailability(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  myAvailability?.available === false
                    ? "bg-red-500/25 border-red-500/50 text-red-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-red-500/10 hover:text-red-300"
                }`}
              >
                <XCircle size={14} /> Unavailable
              </button>
            </div>
            {myAvailability && (
              <div className="flex gap-2">
                <input
                  placeholder="Add a note (e.g. available from 10am)..."
                  value={availNote}
                  onChange={e => setAvailNote(e.target.value)}
                  onBlur={handleUpdateNote}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none"
                />
              </div>
            )}
            {myAvailability?.available === true && (
              <div className="mt-3">
                <p className="text-white/40 text-[11px] mb-2">Which duties would you like to volunteer for? <span className="text-white/25">(optional)</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {allRoles.map(role => {
                    const picked = (myAvailability.roles || []).includes(role.name);
                    return (
                      <button
                        key={role.name}
                        onClick={() => toggleVolunteerRole(role.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all min-h-[36px] ${
                          picked
                            ? "bg-cyan-500/25 border-cyan-400/50 text-cyan-200"
                            : "bg-white/5 border-white/10 text-white/45 hover:text-white/70 hover:border-white/20"
                        }`}
                      >
                        {picked ? "🙋 " : ""}{role.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Trainer: Availability Overview */}
          {isTrainerPlus && availabilities.length > 0 && (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={13} className="text-white/40" />
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">
                  Member Availability ({availabilities.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {availabilities.map(a => (
                  <div key={a.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.available ? "bg-green-400" : "bg-red-400"}`} />
                      <span className="text-white/80 text-xs font-medium flex-1">
                        {otterUsernames[a.user_email] || a.user_name}
                      </span>
                      {a.note && <span className="text-white/30 text-xs truncate max-w-[100px]">{a.note}</span>}
                      <span className={`text-[10px] font-bold ${a.available ? "text-green-400" : "text-red-400"}`}>
                        {a.available ? "✓" : "✗"}
                      </span>
                    </div>
                    {a.available && (a.roles || []).length > 0 && (
                      <p className="text-cyan-300/60 text-[10px] ml-3.5 mt-0.5">🙋 {a.roles.join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles grid */}
          <div className="space-y-4 mb-5">
            {allRoles.map(role => {
              const assignment = assignments.find(a => a.role === role.name);
              const isCustom = customRoles.some(r => r.name === role.name);
              return (
                <div key={role.name} className={`bg-gradient-to-br ${role.color} border rounded-2xl px-5 py-4`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{role.name}</p>
                        {isCustom && isTrainerPlus && (
                          <button
                            onClick={() => handleRemoveCustomRole(role.name)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                            title="Remove custom role"
                          ><X size={12} /></button>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(role.tags || []).map(tag => (
                          <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide ${TAG_COLORS[tag] || TAG_COLORS.default}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {assignment ? (
                      <span className="text-xs font-semibold text-white/80 shrink-0 mt-0.5">
                        {displayName(assignment.user_email)}
                      </span>
                    ) : (() => {
                      const volCount = availabilities.filter(a => a.available && (a.roles || []).includes(role.name)).length;
                      return volCount > 0 ? (
                        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                          🙋 {volCount} volunteered
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {isTrainerPlus ? (
                    <div className="mt-1">
                      <SelectDrawer
                        label={role.name}
                        value={assignment?.user_email || ""}
                        onValueChange={v => setAssignee(role.name, v)}
                        options={(() => {
                          const volunteered = availabilities.filter(a => a.available && (a.roles || []).includes(role.name));
                          const otherAvailable = availabilities.filter(a => a.available && !(a.roles || []).includes(role.name));
                          return [
                            { value: "", label: "— Unassigned —" },
                            ...volunteered.map(a => ({
                              value: a.user_email,
                              label: `🙋 ${otterUsernames[a.user_email] || a.user_name} — volunteered`,
                            })),
                            ...otherAvailable.map(a => ({
                              value: a.user_email,
                              label: `✓ ${otterUsernames[a.user_email] || a.user_name}`,
                            })),
                            ...members
                              .filter(m => !availabilities.find(a => a.available && a.user_email === m.email))
                              .map(m => ({
                                value: m.email,
                                label: otterUsernames[m.email] || m.full_name || m.email,
                              })),
                          ];
                        })()}
                      />
                    </div>
                  ) : (
                    !assignment && <p className="text-white/25 text-xs italic mt-1">Not yet assigned</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add safety boat */}
          {isTrainerPlus && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSafetyBoatCount(c => c + 1)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-orange-500/10 border border-dashed border-orange-500/25 text-orange-300/70 hover:text-orange-300 hover:border-orange-500/40 transition-all text-sm"
              >
                <Plus size={13} /> Safety Boat {safetyBoatCount + 1}
              </button>
              {safetyBoatCount > 1 && (
                <button
                  onClick={() => setSafetyBoatCount(c => Math.max(1, c - 1))}
                  className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-white/50 transition-all text-sm"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Add custom role */}
          {isTrainerPlus && (
            <div className="mb-5">
              <AnimatePresence>
                {showAddRole ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 space-y-2"
                  >
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">New Duty Role</p>
                    <input
                      placeholder="Role name (e.g. Rescue Coordinator)"
                      value={newRoleName}
                      onChange={e => setNewRoleName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none"
                    />
                    <input
                      placeholder="Tags, comma separated (e.g. safety, rib)"
                      value={newRoleTags}
                      onChange={e => setNewRoleTags(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddRole(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Cancel</button>
                      <button onClick={handleAddCustomRole} disabled={!newRoleName.trim()} className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40">Add Role</button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowAddRole(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-dashed border-white/15 text-white/40 hover:text-white/60 hover:border-white/25 transition-all text-sm"
                  >
                    <Plus size={14} /> Add Custom Role
                  </button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Save button */}
          {isTrainerPlus && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all border disabled:opacity-50 ${saved ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-white/10 text-white hover:bg-white/15 border-white/10"}`}
            >
              {saving ? "Saving..." : saved ? "✓ Saved" : "Save Roster"}
            </button>
          )}
        </div>
      )}
      </>}
    </div>
  );
}