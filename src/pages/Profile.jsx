import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Check } from "lucide-react";
import DeleteAccountDialog from "@/components/profile/DeleteAccountDialog";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [sailingRole, setSailingRole] = useState("");
  const [boatName, setBoatName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setSailingRole(u.sailing_role || "");
      setBoatName(u.boat_name || "");
      setDisplayName(u.display_name || u.full_name || "");
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      sailing_role: sailingRole || null,
      boat_name: boatName.trim(),
      display_name: displayName.trim(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-slate-200 dark:border-white/10 rounded-2xl p-6 flex items-center gap-3 text-lg text-slate-600">
        <div className="w-6 h-6 border-4 border-slate-200 border-t-[#0E2A4E] rounded-full animate-spin" />
        Loading your profile...
      </div>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "owner";
  const roleBtn = (value, label) =>
    `flex-1 text-xl font-bold py-5 rounded-2xl border-2 ${
      sailingRole === value
        ? "bg-[#0E2A4E] text-white border-[#0E2A4E]"
        : "bg-white dark:bg-[#1A1A1A] text-slate-700 dark:text-white border-slate-300 dark:border-white/15 hover:border-[#0E2A4E]"
    }`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-[#0E2A4E] dark:text-[#8FAEF7]">My Profile</h1>
        <p className="text-lg text-slate-600 dark:text-white/70 mt-1">{user.full_name} · {user.email}</p>
        {isAdmin && <p className="inline-block mt-2 bg-amber-300 text-[#0E2A4E] text-base font-bold px-3 py-1 rounded-xl">Organiser (Admin)</p>}
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-bold text-[#0E2A4E] dark:text-[#8FAEF7]">My name</h2>
        <p className="text-base text-slate-600 dark:text-white/70">Use the official name you entered Burnham Week under.</p>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g. John Smith"
          className="w-full text-lg border-2 border-slate-300 dark:border-white/15 dark:bg-[#121212] dark:text-white rounded-xl px-4 py-3 focus:border-[#0E2A4E] outline-none"
        />
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-bold text-[#0E2A4E] dark:text-[#8FAEF7]">I sail as a...</h2>
        <div className="flex gap-3">
          <button onClick={() => setSailingRole("helm")} className={roleBtn("helm")}>Helm</button>
          <button onClick={() => setSailingRole("crew")} className={roleBtn("crew")}>Crew</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="text-xl font-bold text-[#0E2A4E] dark:text-[#8FAEF7]">My boat</h2>
        <input
          value={boatName}
          onChange={e => setBoatName(e.target.value)}
          placeholder="Boat name"
          className="w-full text-lg border-2 border-slate-300 dark:border-white/15 dark:bg-[#121212] dark:text-white rounded-xl px-4 py-3 focus:border-[#0E2A4E] outline-none"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#0E2A4E] text-white text-xl font-bold py-4 rounded-2xl hover:bg-[#173B6B] disabled:opacity-50"
      >
        {saved ? <><Check size={24} /> Saved</> : saving ? "Saving..." : "Save my details"}
      </button>

      <button
        onClick={() => base44.auth.logout()}
        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1A1A1A] border-2 border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 text-xl font-bold py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10"
      >
        <LogOut size={24} /> Sign out
      </button>

      <DeleteAccountDialog user={user} />
    </div>
  );
}