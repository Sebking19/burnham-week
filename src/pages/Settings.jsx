import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, LogOut, AlertTriangle, Users, ChevronDown, Check, Search, X, Ticket, Palette } from "lucide-react";
// ChevronDown and Check still used in group-roles section
import BoatWindLimitsSettings from "@/components/BoatWindLimitsSettings";
import { THEMES, useTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import SelectDrawer from "@/components/SelectDrawer";
import SimpleModeCard from "@/components/SimpleModeCard";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner (Full Access)" },
  { value: "admin", label: "Admin (Flag Officer)" },
  { value: "admiral", label: "Admiral (Admin Level)" },
  { value: "chairman", label: "Chairman" },
  { value: "viewer", label: "Viewer (Read-only)" },
  { value: "pond", label: "Pond" },
  { value: "pond_trainer", label: "Pond Trainer" },
  { value: "pond_parent", label: "Pond Parent" },
  { value: "river1", label: "River 1" },
  { value: "river1_trainer", label: "River 1 Trainer" },
  { value: "river1_parent", label: "River 1 Parent" },
  { value: "river2", label: "River 2" },
  { value: "river2_trainer", label: "River 2 Trainer" },
  { value: "river2_parent", label: "River 2 Parent" },
  { value: "race", label: "Race" },
  { value: "race_trainer", label: "Race Trainer" },
  { value: "race_parent", label: "Race Parent" },
  { value: "cadets", label: "Cadets" },
  { value: "cadet_trainer", label: "Cadet Trainer" },
  { value: "cadet_parent", label: "Cadet Parent" },
  { value: "fast", label: "Fast" },
  { value: "fast_trainer", label: "Fast Trainer" },
  { value: "fast_parent", label: "Fast Parent" },
  { value: "otter_volunteer", label: "Otter Volunteer" },
  { value: "user", label: "No Role" },
];

function RoleLabel({ role }) {
  const found = ROLE_OPTIONS.find(r => r.value === role);
  return <span>{found ? found.label : (role || "No Role")}</span>;
}

const GROUP_ROLES = [
  { value: "pond", label: "Pond" },
  { value: "pond_trainer", label: "Pond Trainer" },
  { value: "pond_parent", label: "Pond Parent" },
  { value: "river1", label: "River 1" },
  { value: "river1_trainer", label: "River 1 Trainer" },
  { value: "river1_parent", label: "River 1 Parent" },
  { value: "river2", label: "River 2" },
  { value: "river2_trainer", label: "River 2 Trainer" },
  { value: "river2_parent", label: "River 2 Parent" },
  { value: "race", label: "Race" },
  { value: "race_trainer", label: "Race Trainer" },
  { value: "race_parent", label: "Race Parent" },
  { value: "cadets", label: "Cadets" },
  { value: "cadet_trainer", label: "Cadet Trainer" },
  { value: "cadet_parent", label: "Cadet Parent" },
  { value: "fast", label: "Fast" },
  { value: "fast_trainer", label: "Fast Trainer" },
  { value: "fast_parent", label: "Fast Parent" },
  { value: "otter_volunteer", label: "Otter Volunteer" },
];

function UserRoleRow({ member, onRoleChange, user, initialOtterUsername = "", onOtterUsernameChange }) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otterUsername, setOtterUsername] = useState(initialOtterUsername);
  const [otterUsernameId, setOtterUsernameId] = useState(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(initialOtterUsername);
  const [memberRoles, setMemberRoles] = useState(member.roles || []);

  useEffect(() => {
    setOtterUsername(initialOtterUsername);
    setUsernameInput(initialOtterUsername);
  }, [initialOtterUsername]);

  useEffect(() => {
    base44.entities.OtterUsername.filter({ user_email: member.email }, '', 1).then(records => {
      if (records.length > 0) {
        setOtterUsernameId(records[0].id);
      }
    }).catch(() => {});
  }, [member.email]);

  const handleSelect = async (role) => {
    if (member.role === "owner" && user.role !== "owner" && user.role !== "admin" && user.role !== "admiral") {
      alert("Only owners and admins can modify owner role assignments");
      return;
    }
    setSaving(true);
    await base44.entities.User.update(member.id, { role });
    onRoleChange(member.id, role);
    setSaving(false);
  };

  const handleToggleGroupRole = async (groupRole) => {
    const current = memberRoles.includes(groupRole)
      ? memberRoles.filter(r => r !== groupRole)
      : [...memberRoles, groupRole];
    setMemberRoles(current);
    await base44.entities.User.update(member.id, { roles: current });
  };

  const handleSaveUsername = async () => {
    if (usernameInput.trim().length < 1) {
      alert('Username cannot be empty');
      return;
    }
    if (usernameInput.trim().length > 20) {
      alert('Username must be 20 characters or less');
      return;
    }

    setSaving(true);
    try {
      if (otterUsernameId) {
        await base44.entities.OtterUsername.update(otterUsernameId, { username: usernameInput.trim() });
      } else {
        await base44.entities.OtterUsername.create({ user_email: member.email, username: usernameInput.trim() });
      }
      setOtterUsername(usernameInput.trim());
      setEditingUsername(false);
      onOtterUsernameChange?.(member.email, usernameInput.trim());
    } catch (error) {
      console.error('Failed to update username:', error);
      alert('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 shadow-md shadow-cyan-500/30 flex items-center justify-center text-xs font-bold shrink-0">
            {(otterUsername || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {editingUsername ? (
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  maxLength={20}
                  className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-white/30 flex-1"
                  autoFocus
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={saving}
                  className="bg-white text-black text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditingUsername(false);
                    setUsernameInput(otterUsername);
                  }}
                  className="text-white/40 hover:text-white/60 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingUsername(true)}
                className="text-left group hover:text-blue-300 transition-colors"
              >
                <p className="text-white text-sm font-medium">
                  {otterUsername || <span className="text-white/30 italic">No username</span>}
                  <span className="text-white/20 text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                </p>
              </button>
            )}
            <p className="text-white/30 text-xs truncate">{member.email}</p>
          </div>
        </div>
        <div className="ml-2 shrink-0 w-32">
          {saving ? (
            <span className="text-xs text-white/40 px-3 py-1.5 block">Saving...</span>
          ) : (
            <SelectDrawer
              label="Assign Role"
              value={member.role || "user"}
              onValueChange={handleSelect}
              options={ROLE_OPTIONS.filter(opt => opt.value !== "owner" || user.role === "owner")}
              placeholder="Set role"
            />
          )}
        </div>
      </div>

      {/* Additional group memberships */}
      <div className="mt-2 pl-11">
        <button
          onClick={() => setRolesOpen(o => !o)}
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors mb-1"
        >
          <ChevronDown size={11} className={`transition-transform ${rolesOpen ? "rotate-180" : ""}`} />
          {memberRoles.length > 0 ? `${memberRoles.length} extra group${memberRoles.length > 1 ? "s" : ""}` : "Add extra groups"}
        </button>
        {memberRoles.length > 0 && !rolesOpen && (
          <div className="flex flex-wrap gap-1 mb-1">
            {memberRoles.map(r => {
              const found = GROUP_ROLES.find(g => g.value === r);
              return (
                <span key={r} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                  {found?.label || r}
                </span>
              );
            })}
          </div>
        )}
        <AnimatePresence>
          {rolesOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 overflow-hidden"
            >
              {GROUP_ROLES.map(g => {
                const active = memberRoles.includes(g.value);
                return (
                  <button
                    key={g.value}
                    onClick={() => handleToggleGroupRole(g.value)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium ${
                      active
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"
                    }`}
                  >
                    {active ? "✓ " : ""}{g.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Settings() {
  const { themeId, setThemeId } = useTheme();
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [otterUsernames, setOtterUsernames] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [otterConfig, setOtterConfig] = useState(null);
  const [otterConfigSaving, setOtterConfigSaving] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const ROLE_FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "admiral", label: "Admiral" },
    { value: "chairman", label: "Chairman" },
    { value: "viewer", label: "Viewer" },
    { value: "pond", label: "Pond" },
    { value: "river1", label: "River 1" },
    { value: "river2", label: "River 2" },
    { value: "race", label: "Race" },
    { value: "cadets", label: "Cadets" },
    { value: "fast", label: "Fast" },
    { value: "user", label: "No Role" },
  ];


  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin" || u?.role === "admiral" || u?.role === "owner") {
        base44.entities.User.list().then(setMembers).catch(() => {});
        base44.entities.OtterUsername.list().then(records => {
          const map = {};
          records.forEach(r => { if (r.user_email) map[r.user_email] = r.username || ""; });
          setOtterUsernames(map);
        }).catch(() => {});
      }
      if (u?.role === "owner") {
        base44.entities.OtterWeekConfig.list().then(records => {
          if (records.length > 0) setOtterConfig(records[0]);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const toggleShowOtterWeek = async () => {
    setOtterConfigSaving(true);
    if (otterConfig) {
      const updated = await base44.entities.OtterWeekConfig.update(otterConfig.id, { show_otter_week: !otterConfig.show_otter_week });
      setOtterConfig(updated);
    } else {
      const created = await base44.entities.OtterWeekConfig.create({ tickets_enabled: true, show_otter_week: true });
      setOtterConfig(created);
    }
    setOtterConfigSaving(false);
  };



  const handleRoleChange = (id, role) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const reloadMembers = async () => {
    const updated = await base44.entities.User.list();
    setMembers(updated);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await base44.entities.User.delete(user.id);
    base44.auth.logout("/");
  };

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Settings</h1>
        <p className="text-cyan-200/40 text-sm mt-0.5">Account & preferences</p>
      </div>

      {user && (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 shadow-md shadow-cyan-500/30 flex items-center justify-center text-sm font-bold animate-gentle-drift">
              {(user.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{user.full_name}</p>
              <p className="text-white/40 text-xs">{user.email}</p>
              <p className="text-white/25 text-xs mt-0.5">
                <RoleLabel role={user.role} />
              </p>
            </div>
          </div>
        </div>
      )}

      {(user?.role === "admin" || user?.role === "admiral" || user?.role === "owner") && members.length > 0 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
          <button
            className="flex items-center gap-2 w-full"
            onClick={() => setMembersOpen(o => !o)}
          >
            <Users size={15} className="text-white/50" />
            <h2 className="text-sm font-bold text-white">Manage Member Roles</h2>
            <span className="ml-auto text-xs text-white/30">{members.length} members</span>
            <ChevronDown size={14} className={`text-white/40 transition-transform duration-200 ${membersOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
          {membersOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="mt-4">

          {/* Search */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2.5 text-white placeholder-white/25 text-xs focus:outline-none focus:border-white/25"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Role filter chips */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {ROLE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  roleFilter === opt.value
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            {members
              .filter(m => {
                const otterName = otterUsernames[m.email] || "";
                const matchesSearch = !searchQuery.trim() ||
                  otterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (m.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());
                const matchesRole = roleFilter === "all" ||
                  m.role === roleFilter ||
                  (roleFilter === "pond" && (m.role === "pond" || m.role === "pond_trainer" || m.role === "pond_parent")) ||
                  (roleFilter === "river1" && (m.role === "river1" || m.role === "river1_trainer" || m.role === "river1_parent")) ||
                  (roleFilter === "river2" && (m.role === "river2" || m.role === "river2_trainer" || m.role === "river2_parent")) ||
                  (roleFilter === "race" && (m.role === "race" || m.role === "race_trainer" || m.role === "race_parent")) ||
                  (roleFilter === "cadets" && (m.role === "cadets" || m.role === "cadet_trainer" || m.role === "cadet_parent")) ||
                  (roleFilter === "fast" && (m.role === "fast" || m.role === "fast_trainer" || m.role === "fast_parent"));
                return matchesSearch && matchesRole;
              })
              .map(m => (
                <UserRoleRow key={m.id} member={m} onRoleChange={handleRoleChange} user={user} initialOtterUsername={otterUsernames[m.email] || ""} onOtterUsernameChange={(email, name) => setOtterUsernames(prev => ({ ...prev, [email]: name }))} />
              ))}
            {members.filter(m => {
              const otterName = otterUsernames[m.email] || "";
              const matchesSearch = !searchQuery.trim() ||
                otterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());
              const matchesRole = roleFilter === "all" ||
                m.role === roleFilter ||
                (roleFilter === "pond" && (m.role === "pond" || m.role === "pond_trainer" || m.role === "pond_parent")) ||
                (roleFilter === "river1" && (m.role === "river1" || m.role === "river1_trainer" || m.role === "river1_parent")) ||
                (roleFilter === "river2" && (m.role === "river2" || m.role === "river2_trainer" || m.role === "river2_parent")) ||
                (roleFilter === "race" && (m.role === "race" || m.role === "race_trainer" || m.role === "race_parent")) ||
                (roleFilter === "cadets" && (m.role === "cadets" || m.role === "cadet_trainer" || m.role === "cadet_parent")) ||
                (roleFilter === "fast" && (m.role === "fast" || m.role === "fast_trainer" || m.role === "fast_parent"));
              return matchesSearch && matchesRole;
            }).length === 0 && (
              <p className="text-white/30 text-xs text-center py-4">No members match your filters</p>
            )}
          </div>
          </div>
          </motion.div>}
          </AnimatePresence>
        </div>
      )}

      {/* Owner-only: Otter Week visibility */}
      {user?.role === "owner" && (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={15} className="text-cyan-400/70" />
            <h2 className="text-sm font-bold text-white">🦦 Otter Week</h2>
            <span className="ml-auto text-[11px] text-white/25">Owner only</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Show ticket button &amp; stats tab</p>
              <p className="text-white/30 text-xs mt-0.5">Visible to everyone (except when hidden)</p>
            </div>
            <button
              onClick={toggleShowOtterWeek}
              disabled={otterConfigSaving}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 ${otterConfig?.show_otter_week ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-white/5 text-white/40 border-white/10"}`}
            >
              {otterConfig?.show_otter_week ? "Visible" : "Hidden"}
            </button>
          </div>
        </div>
      )}

      {/* Owner-only: Otter Week Features (calendar + volunteering) */}
      {user?.role === "owner" && (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🦦</span>
            <h2 className="text-sm font-bold text-white">Otter Week Features</h2>
            <span className="ml-auto text-[11px] text-white/25">Owner only</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Show Otter Week tabs in Volunteer &amp; Roster</p>
              <p className="text-white/30 text-xs mt-0.5">26–31 July daily sign-up &amp; duty roster</p>
            </div>
            <button
              onClick={async () => {
                if (otterConfig) {
                  const updated = await base44.entities.OtterWeekConfig.update(otterConfig.id, { show_otter_week_features: !otterConfig.show_otter_week_features });
                  setOtterConfig(updated);
                } else {
                  const created = await base44.entities.OtterWeekConfig.create({ tickets_enabled: true, show_otter_week: false, show_otter_week_features: true });
                  setOtterConfig(created);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${otterConfig?.show_otter_week_features ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-white/5 text-white/40 border-white/10"}`}
            >
              {otterConfig?.show_otter_week_features ? "Enabled" : "Disabled"}
            </button>
          </div>
        </div>
      )}

      {/* Owner-only: Achievements visibility */}
      {user?.role === "owner" && (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏆</span>
            <h2 className="text-sm font-bold text-white">Achievements</h2>
            <span className="ml-auto text-[11px] text-white/25">Owner only</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Show Awards &amp; Trophies tab</p>
              <p className="text-white/30 text-xs mt-0.5">Visible to all members when enabled</p>
            </div>
            <button
              onClick={async () => {
                if (otterConfig) {
                  const updated = await base44.entities.OtterWeekConfig.update(otterConfig.id, { show_achievements: !otterConfig.show_achievements });
                  setOtterConfig(updated);
                } else {
                  const created = await base44.entities.OtterWeekConfig.create({ tickets_enabled: true, show_otter_week: false, show_achievements: true });
                  setOtterConfig(created);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${otterConfig?.show_achievements ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-white/5 text-white/40 border-white/10"}`}
            >
              {otterConfig?.show_achievements ? "Visible" : "Hidden"}
            </button>
          </div>
        </div>
      )}

      {/* Boat Wind Limits - trainers and above */}
      {user && ["owner","admin","admiral","chairman","pond_trainer","river1_trainer","river2_trainer","race_trainer","cadet_trainer","fast_trainer"].includes(user.role) && (
        <BoatWindLimitsSettings />
      )}

      {/* Simple mode */}
      <SimpleModeCard />

      {/* Theme picker */}
      <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={15} className="text-white/50" />
          <h2 className="text-sm font-bold text-white">App Theme</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                themeId === theme.id
                  ? "border-white/40 bg-white/10"
                  : "border-white/8 bg-white/[0.03] hover:bg-white/8"
              }`}
            >
              <div className="flex gap-1 flex-shrink-0">
                {theme.preview.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${themeId === theme.id ? "text-white" : "text-white/60"}`}>{theme.label}</p>
                <p className="text-white/25 text-[10px] truncate">{theme.description}</p>
              </div>
              {themeId === theme.id && <Check size={12} className="text-white ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-white/[0.04] border border-white/8 rounded-2xl px-5 py-4 text-white/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 hover:bg-red-500/15 transition-all text-sm font-medium"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#161616] border border-white/10 rounded-3xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Delete Account</h2>
                  <p className="text-white/40 text-xs">This cannot be undone</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-6">
                Your account and all associated data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/8 text-white/70 text-sm font-medium hover:bg-white/12 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}