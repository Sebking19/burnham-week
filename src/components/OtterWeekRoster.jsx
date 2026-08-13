import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SelectDrawer from "@/components/SelectDrawer";

const OTTER_WEEK_DAYS = [
  { label: "Sun 26 Jul", date: "2026-07-26" },
  { label: "Mon 27 Jul", date: "2026-07-27" },
  { label: "Tue 28 Jul", date: "2026-07-28" },
  { label: "Wed 29 Jul", date: "2026-07-29" },
  { label: "Thu 30 Jul", date: "2026-07-30" },
  { label: "Fri 31 Jul", date: "2026-07-31" },
];

const DEFAULT_ROLES = [
  { name: "Race Officer", tags: ["race"], color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
  { name: "Safety Boat 1", tags: ["safety", "rib"], color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { name: "Safety Boat 2", tags: ["safety", "rib"], color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { name: "Shore Support", tags: ["shore"], color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30" },
];

const TAG_COLORS = {
  race: "bg-purple-500/20 text-purple-300",
  safety: "bg-orange-500/20 text-orange-300",
  rib: "bg-orange-500/20 text-orange-300",
  shore: "bg-cyan-500/20 text-cyan-300",
  default: "bg-white/10 text-white/50",
};

export default function OtterWeekRoster({ user, members, otterUsernames }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [allRosters, setAllRosters] = useState([]);
  const [roster, setRoster] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [configId, setConfigId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleTags, setNewRoleTags] = useState("");

  const isTrainerPlus = user && ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);

  useEffect(() => {
    const otterDates = OTTER_WEEK_DAYS.map(d => d.date);
    const loadRosters = () => {
      base44.entities.DutyRoster.list("-week_date", 20).then(records => {
        const filtered = records.filter(r => otterDates.includes(r.week_date));
        setAllRosters(filtered);
        // Keep current day's assignments in sync
        setSelectedDate(prev => {
          if (prev) {
            const updated = filtered.find(r => r.week_date === prev);
            setRoster(updated || null);
            setAssignments(updated?.assignments || []);
          }
          return prev;
        });
      }).catch(() => {});
    };
    loadRosters();
    base44.entities.SettingsConfig.filter({ key: "otter_week_roster_roles" }, "", 1).then(records => {
      if (records.length > 0) {
        setConfigId(records[0].id);
        try { setCustomRoles(JSON.parse(records[0].value)); } catch {}
      }
    }).catch(() => {});
    const unsub = base44.entities.DutyRoster.subscribe(loadRosters);
    return unsub;
  }, []);

  const selectDate = (date) => {
    setSelectedDate(date);
    const existing = allRosters.find(r => r.week_date === date);
    if (existing) {
      setRoster(existing);
      setAssignments(existing.assignments || []);
    } else {
      setRoster(null);
      setAssignments([]);
    }
  };

  const allRoles = [...DEFAULT_ROLES, ...customRoles];

  const setAssignee = (roleName, userEmail) => {
    const member = members.find(m => m.email === userEmail);
    setAssignments(prev => {
      const filtered = prev.filter(a => a.role !== roleName);
      if (!userEmail) return filtered;
      return [...filtered, { role: roleName, user_email: userEmail, user_name: member?.full_name || userEmail, from_volunteer: false }];
    });
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const payload = { week_date: selectedDate, assignments };
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
      await base44.entities.SettingsConfig.update(configId, { key: "otter_week_roster_roles", value });
    } else {
      const created = await base44.entities.SettingsConfig.create({ key: "otter_week_roster_roles", value });
      setConfigId(created.id);
    }
    setNewRoleName("");
    setNewRoleTags("");
    setShowAddRole(false);
  };

  const handleRemoveCustomRole = async (roleName) => {
    const updated = customRoles.filter(r => r.name !== roleName);
    setCustomRoles(updated);
    if (configId) {
      await base44.entities.SettingsConfig.update(configId, { key: "otter_week_roster_roles", value: JSON.stringify(updated) });
    }
  };

  const displayName = (email) => otterUsernames[email] || members.find(m => m.email === email)?.full_name || email;

  return (
    <div>
      {/* Day selector */}
      <div className="mb-6">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Select Day</p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {OTTER_WEEK_DAYS.map(({ label, date }) => {
            const hasRoster = allRosters.some(r => r.week_date === date && (r.assignments || []).length > 0);
            const isSelected = selectedDate === date;
            return (
              <button key={date} onClick={() => selectDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-3 rounded-2xl border transition-all ${
                  isSelected ? "bg-cyan-500/20 border-cyan-500/40 text-white" : "bg-white/[0.04] border-white/8 text-white/60 hover:bg-white/8"
                }`}
              >
                <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
                {hasRoster && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {!selectedDate ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 text-center">
          <p className="text-white/30 text-sm">Select a day to view or edit the roster</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">{OTTER_WEEK_DAYS.find(d => d.date === selectedDate)?.label}</h2>
            {assignments.length > 0 && <span className="text-xs text-white/30">{assignments.length} assigned</span>}
          </div>

          {/* Volunteer-confirmed assignments not in predefined roles */}
          {assignments.filter(a => a.from_volunteer && !allRoles.some(r => r.name === a.role)).length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">From Volunteers</p>
              {assignments.filter(a => a.from_volunteer && !allRoles.some(r => r.name === a.role)).map(a => (
                <div key={a.role + a.user_email} className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-white text-sm font-semibold">{a.role}</p>
                    <p className="text-cyan-300 text-xs">{displayName(a.user_email)} <span className="text-cyan-400/50">· volunteer confirmed</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 mb-4">
            {allRoles.map(role => {
              const assignment = assignments.find(a => a.role === role.name);
              const isCustom = customRoles.some(r => r.name === role.name);
              return (
                <div key={role.name} className={`bg-gradient-to-br ${role.color} border rounded-2xl px-4 py-3`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{role.name}</p>
                        {isCustom && isTrainerPlus && (
                          <button onClick={() => handleRemoveCustomRole(role.name)} className="text-white/20 hover:text-red-400 transition-colors">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(role.tags || []).map(tag => (
                          <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide ${TAG_COLORS[tag] || TAG_COLORS.default}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    {assignment && <span className="text-xs font-semibold text-white/80 shrink-0 mt-0.5">{displayName(assignment.user_email)}</span>}
                  </div>
                  {assignment?.from_volunteer && (
                    <span className="text-[9px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded-md font-semibold">volunteer confirmed</span>
                  )}
                  {isTrainerPlus ? (
                    <div className="mt-1">
                      <SelectDrawer
                        label={role.name}
                        value={assignment?.user_email || ""}
                        onValueChange={v => setAssignee(role.name, v)}
                        options={[
                          { value: "", label: "— Unassigned —" },
                          ...members.map(m => ({ value: m.email, label: otterUsernames[m.email] || m.full_name || m.email }))
                        ]}
                      />
                    </div>
                  ) : (
                    !assignment && <p className="text-white/25 text-xs italic mt-1">Not yet assigned</p>
                  )}
                </div>
              );
            })}
          </div>

          {isTrainerPlus && (
            <div className="mb-4">
              <AnimatePresence>
                {showAddRole ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white/[0.04] border border-white/8 rounded-2xl p-4 space-y-2">
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">New Role</p>
                    <input placeholder="Role name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none" />
                    <input placeholder="Tags, comma separated" value={newRoleTags} onChange={e => setNewRoleTags(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddRole(false)} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Cancel</button>
                      <button onClick={handleAddCustomRole} disabled={!newRoleName.trim()} className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-sm disabled:opacity-40">Add Role</button>
                    </div>
                  </motion.div>
                ) : (
                  <button onClick={() => setShowAddRole(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] border border-dashed border-white/15 text-white/40 hover:text-white/60 hover:border-white/25 transition-all text-sm">
                    <Plus size={14} /> Add Custom Role
                  </button>
                )}
              </AnimatePresence>
            </div>
          )}

          {isTrainerPlus && (
            <button onClick={handleSave} disabled={saving}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all border disabled:opacity-50 ${saved ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-white/10 text-white hover:bg-white/15 border-white/10"}`}>
              {saving ? "Saving..." : saved ? "✓ Saved" : "Save Roster"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}