import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle, Ship } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AvatarPicker from "@/components/profile/AvatarPicker";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otterUsername, setOtterUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const u = await base44.auth.me();
      setUser(u);

      const records = await base44.entities.OtterUsername.filter({ user_email: u.email }, '', 1);
      if (records.length > 0) {
        setOtterUsername(records[0].username || "");
        setUsernameInput(records[0].username || "");
      } else {
        await base44.entities.OtterUsername.create({ user_email: u.email, username: "" });
      }
      setLoading(false);
    };

    loadProfile().catch(() => setLoading(false));

    const unsubscribe = base44.entities.OtterUsername.subscribe(() => {
      loadProfile().catch(() => {});
    });

    return unsubscribe;
  }, []);

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
      const records = await base44.entities.OtterUsername.filter({ user_email: user.email }, '', 1);
      if (records.length > 0) {
        await base44.entities.OtterUsername.update(records[0].id, { username: usernameInput.trim() });
      } else {
        await base44.entities.OtterUsername.create({ user_email: user.email, username: usernameInput.trim() });
      }
      setOtterUsername(usernameInput.trim());
      setEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update username:', error);
      alert('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-2 flex items-center justify-center min-h-screen">
        <p className="text-white/40">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-2"
    >
      <div className="flex items-center gap-3 mb-8">
        <Link
          to={createPageUrl("Settings")}
          aria-label="Back to settings"
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={16} className="text-white/60" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Profile</h1>
          <p className="text-cyan-200/40 text-sm mt-0.5">Your Otter identity</p>
        </div>
      </div>

      {user && (
        <div className="rounded-[28px] p-6 max-w-md mb-6 bg-slate-900/60 border border-cyan-400/40 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/40 flex items-center justify-center text-2xl font-bold text-white animate-gentle-drift">
              {(otterUsername || "O").charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wide">
                Otter Username
              </label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveUsername();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    maxLength={20}
                    className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                    autoFocus
                    placeholder="Enter your Otter username"
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving}
                    className="bg-white text-black text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {saving ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setUsernameInput(otterUsername);
                    }}
                    aria-label="Cancel editing"
                    className="bg-white/10 text-white/70 text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/15 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="text-left w-full group hover:text-blue-300 transition-colors"
                >
                  <p className="text-white text-sm">
                    {otterUsername || <span className="text-white/30 italic">Not set</span>}
                    <span className="text-white/20 text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                  </p>
                </button>
              )}
              <p className="text-white/30 text-xs mt-1">{usernameInput.length}/20</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wide">
                Email
              </label>
              <p className="text-white text-sm">{user.email}</p>
            </div>
          </div>

          {/* Volunteer sign-up */}
          {(() => {
            const isVolunteer = user && ((user.roles || []).includes("otter_volunteer") || user.role === "otter_volunteer");
            const isTrainerPlus = user && ["owner","admin","chairman","pond_trainer","river1_trainer","river2_trainer","race_trainer","cadet_trainer","fast_trainer"].includes(user.role);
            if (isTrainerPlus) return null;
            return isVolunteer ? (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Ship size={15} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm font-semibold">Volunteer Member ✓</p>
                    <p className="text-white/40 text-xs mt-0.5">You have access to the Volunteering page</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Ship size={15} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Volunteer to Launch Ribs</p>
                    <p className="text-white/40 text-xs mt-0.5">Join the Friday volunteer crew. You'll get access to the volunteering sign-up page.</p>
                    <button
                      onClick={async () => {
                        await base44.functions.invoke("updateUserRole", { userId: user.id, addSubrole: "otter_volunteer" });
                        const u = await base44.auth.me();
                        setUser(u);
                      }}
                      className="mt-2 px-4 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all"
                    >
                      Sign Up as Volunteer
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {user && (
            <div className="mt-6 pt-6 border-t border-white/5 text-xs text-white/40 space-y-1">
              <p>ID: {user.id}</p>
              <p>Joined: {new Date(user.created_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="max-w-md mb-6">
          <AvatarPicker userEmail={user.email} />
        </div>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="status"
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500/20 border border-green-500/40 rounded-2xl px-5 py-3 flex items-center gap-3 z-[70] backdrop-blur-xl"
          >
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-sm font-medium text-green-300">Username updated!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}