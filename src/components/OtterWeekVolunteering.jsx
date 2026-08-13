import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, isSameDay } from "date-fns";
import { Check, Users } from "lucide-react";

const OTTER_WEEK_DAYS = [
  { label: "Sun 26 Jul", date: "2026-07-26" },
  { label: "Mon 27 Jul", date: "2026-07-27" },
  { label: "Tue 28 Jul", date: "2026-07-28" },
  { label: "Wed 29 Jul", date: "2026-07-29" },
  { label: "Thu 30 Jul", date: "2026-07-30" },
  { label: "Fri 31 Jul", date: "2026-07-31" },
];

const DEFAULT_ROLES = ["Race Officer", "Safety Boat", "Launch Ribs", "Shore Support"];

export default function OtterWeekVolunteering({ user, otterUsernames }) {
  const [allSignups, setAllSignups] = useState([]);
  const [allRosters, setAllRosters] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mySignup, setMySignup] = useState(null);
  const [volunteerRoles, setVolunteerRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);


  const isTrainerPlus = user && ["owner", "admin", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);

  const loadData = async () => {
    const otterDates = OTTER_WEEK_DAYS.map(d => d.date);
    const [signups, rosters] = await Promise.all([
      base44.entities.VolunteerSignup.list("-friday_date", 200),
      base44.entities.DutyRoster.list("-week_date", 20),
    ]);
    setAllSignups(signups.filter(r => otterDates.includes(r.friday_date)));
    setAllRosters(rosters.filter(r => otterDates.includes(r.week_date)));
  };

  useEffect(() => {
    loadData();
    // Load custom roles from roster config and merge with defaults
    const loadRoles = () => {
      base44.entities.SettingsConfig.filter({ key: "otter_week_roster_roles" }, "", 1).then(records => {
        if (records.length > 0) {
          try {
            const parsed = JSON.parse(records[0].value);
            if (Array.isArray(parsed)) {
              const customNames = parsed.map(r => typeof r === "string" ? r : r.name).filter(Boolean);
              // Merge: defaults + any custom names not already in defaults
              const merged = [...DEFAULT_ROLES, ...customNames.filter(n => !DEFAULT_ROLES.includes(n))];
              setVolunteerRoles(merged);
            }
          } catch {}
        }
      }).catch(() => {});
    };
    loadRoles();

    // Subscribe to SettingsConfig changes so new roster roles appear live
    const unsubConfig = base44.entities.SettingsConfig.subscribe(loadRoles);

    // Real-time updates
    const unsubSignups = base44.entities.VolunteerSignup.subscribe(() => loadData());
    const unsubRosters = base44.entities.DutyRoster.subscribe(() => loadData());
    return () => { unsubSignups(); unsubRosters(); unsubConfig(); };
  }, []);

  useEffect(() => {
    if (selectedDate && user) {
      const mine = allSignups.find(s => s.friday_date === selectedDate && s.user_email === user.email);
      setMySignup(mine || null);
      setSelectedRole(mine?.role || volunteerRoles[0]);
      setNote(mine?.note || "");
    }
  }, [selectedDate, allSignups, user]);

  const displayName = (email, name) => otterUsernames[email] || name || email;

  const handleSignup = async () => {
    if (!selectedDate || !user) return;
    setSaving(true);
    const payload = {
      user_email: user.email,
      user_name: user.full_name || user.email,
      friday_date: selectedDate,
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

  const syncToRoster = async (signup, confirmed) => {
    // Find or create the DutyRoster record for this date
    const rosters = await base44.entities.DutyRoster.filter({ week_date: signup.friday_date });
    let roster = rosters[0] || null;
    const currentAssignments = roster?.assignments || [];

    let newAssignments;
    if (confirmed) {
      // Add/replace assignment for this role (volunteer-sourced)
      const filtered = currentAssignments.filter(a => !(a.role === signup.role && a.from_volunteer));
      newAssignments = [...filtered, {
        role: signup.role,
        user_email: signup.user_email,
        user_name: signup.user_name,
        from_volunteer: true,
        signup_id: signup.id,
      }];
    } else {
      // Remove the volunteer-sourced assignment for this signup
      newAssignments = currentAssignments.filter(a => a.signup_id !== signup.id);
    }

    if (roster?.id) {
      await base44.entities.DutyRoster.update(roster.id, { assignments: newAssignments });
    } else {
      await base44.entities.DutyRoster.create({ week_date: signup.friday_date, assignments: newAssignments });
    }
  };

  const handleConfirm = async (signupId, confirmed) => {
    const signup = allSignups.find(s => s.id === signupId);
    const updated = await base44.entities.VolunteerSignup.update(signupId, { confirmed });
    setAllSignups(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (signup) await syncToRoster({ ...signup, confirmed: updated.confirmed }, confirmed);
  };



  const dateSignups = selectedDate ? allSignups.filter(s => s.friday_date === selectedDate) : [];
  const dateRoster = selectedDate ? (allRosters.find(r => r.week_date === selectedDate)?.assignments || []) : [];
  // Roster assignments that are NOT already shown via a confirmed volunteer signup
  const rosterOnly = dateRoster.filter(a => !a.from_volunteer && a.user_email);

  return (
    <div>
      {/* Day selector */}
      <div className="mb-6">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wide mb-3">Select Day</p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {OTTER_WEEK_DAYS.map(({ label, date }) => {
            const count = allSignups.filter(s => s.friday_date === date).length;
            const isSelected = selectedDate === date;
            const iSignedUp = user && allSignups.some(s => s.friday_date === date && s.user_email === user.email);
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-3 rounded-2xl border transition-all ${
                  isSelected ? "bg-cyan-500/20 border-cyan-500/40 text-white" : "bg-white/[0.04] border-white/8 text-white/60 hover:bg-white/8"
                }`}
              >
                <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
                <span className="text-[10px] text-white/40 mt-1">{count} 🙋</span>
                {iSignedUp && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {!selectedDate ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 text-center">
          <p className="text-white/30 text-sm">Select a day to sign up or see who's volunteering</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-white font-bold text-base">
            {OTTER_WEEK_DAYS.find(d => d.date === selectedDate)?.label}
          </h2>

          {/* My signup card */}
          <div className={`border rounded-3xl p-5 ${mySignup ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/[0.04] border-white/8"}`}>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-3">
              {mySignup ? "✓ You're signed up" : "Sign up to volunteer"}
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-white/40 text-xs mb-1">Volunteer role</p>
                <div className="flex flex-wrap gap-2">
                  {volunteerRoles.map(r => (
                    <div key={r} className={`px-3 py-1.5 rounded-xl border text-sm cursor-pointer transition-all ${selectedRole === r ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/8"}`}
                      onClick={() => setSelectedRole(r)}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Note (optional)</p>
                <input placeholder="Any notes..." value={note} onChange={e => setNote(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                {mySignup && (
                  <button onClick={handleWithdraw} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/15 transition-all disabled:opacity-50">
                    Withdraw
                  </button>
                )}
                <button onClick={handleSignup} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-bold hover:bg-cyan-500/25 transition-all disabled:opacity-50">
                  {saving ? "..." : mySignup ? "Update" : "Sign Up"}
                </button>
              </div>
            </div>
          </div>

          {/* Who's volunteering */}
          <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-white/40" />
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Volunteers ({dateSignups.length})</p>
            </div>
            {dateSignups.length === 0 ? (
              <p className="text-white/25 text-sm text-center py-4">No volunteers yet for this day</p>
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
                        <button onClick={() => handleConfirm(s.id, !s.confirmed)} className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${s.confirmed ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"}`}>
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Roster assignments (set directly on roster by admins) */}
          {rosterOnly.length > 0 && (
            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-5">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">📋 Roster Assignments</p>
              <div className="space-y-2">
                {rosterOnly.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border bg-white/[0.03] border-white/8">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{displayName(a.user_email, a.user_name)}</p>
                      <p className="text-white/40 text-xs">{a.role}</p>
                    </div>
                    <span className="text-[10px] text-blue-300 font-bold shrink-0">ROSTERED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}