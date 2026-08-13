import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Anchor, Wind, Waves, ArrowRight, MessageSquare, CalendarDays, Sailboat, Gem } from "lucide-react";
import ActionTile from "@/components/home/ActionTile";
import Tilt3D from "@/components/Tilt3D";
import NextEventCard from "@/components/home/NextEventCard";
import SailingStatusBanner from "@/components/home/SailingStatusBanner";

export default function Welcome() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [otterUsername, setOtterUsername] = useState("");
  const [showOtterWeek, setShowOtterWeek] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const [usernameRecords, configRecords] = await Promise.all([
        base44.entities.OtterUsername.filter({ user_email: u.email }, '', 1),
        base44.entities.OtterWeekConfig.list()
      ]);
      if (usernameRecords.length > 0) setOtterUsername(usernameRecords[0].username || "");
      if (configRecords.length > 0) setShowOtterWeek(configRecords[0].show_otter_week || u.role === "owner");
      else if (u.role === "owner") setShowOtterWeek(true);
    };

    loadUser().catch(() => {});

    const unsubscribe = base44.entities.OtterUsername.subscribe(() => {
      loadUser().catch(() => {});
    });

    return unsubscribe;
  }, [isAuthenticated]);

  const noRole = user && (!user.role || user.role === "user");

  // Show login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
            <Anchor size={44} strokeWidth={1.5} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Wind size={14} className="text-cyan-300" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Waves size={14} className="text-blue-300" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Corinthian Otters</h1>
        <p className="text-cyan-300/70 text-lg font-semibold mb-6">Welcome to the club</p>
        <p className="text-white/40 text-sm mb-8 max-w-xs leading-relaxed">
          Sign in to access the schedule, feeds, and events.
        </p>

        <button
          onClick={navigateToLogin}
          className="w-full max-w-xs bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold py-4 rounded-2xl text-sm hover:from-sky-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
        >
          Sign In
          <ArrowRight size={14} />
        </button>

        <button
          onClick={() => navigate("/PrivacyPolicy")}
          className="mt-6 text-white/40 text-xs underline underline-offset-2 hover:text-white/60 transition-colors"
        >
          Privacy Policy
        </button>
      </div>
    );
  }

  if (noRole) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <Anchor size={44} strokeWidth={1.5} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Wind size={14} className="text-amber-300" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Waves size={14} className="text-orange-300" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Almost there!</h1>
        <p className="text-white/50 text-base font-medium mb-2">Corinthian Otters</p>
        <p className="text-white/40 text-sm mb-8 max-w-xs leading-relaxed">
          Your account is pending approval. An admin will assign you a role before you can access the app.
        </p>

        <div className="w-full max-w-xs bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-6 text-left">
          <p className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-3">While you wait</p>
          <p className="text-white/70 text-sm leading-relaxed">
            Set your <strong className="text-white">Otter username</strong> on your profile so admins can identify you and assign you the correct role.
          </p>
        </div>

        {!otterUsername && (
          <div className="w-full max-w-xs mb-4 bg-blue-500/15 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-blue-100 text-sm mb-3 font-medium">⚡ You haven't set a username yet</p>
            <button
              onClick={() => navigate("/Profile")}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all"
            >
              Set Otter Username
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {otterUsername && (
          <div className="w-full max-w-xs mb-4 bg-green-500/10 border border-green-500/25 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-300 text-sm font-bold shrink-0">
              ✓
            </div>
            <div>
              <p className="text-green-200 text-xs font-bold">Username set</p>
              <p className="text-white/60 text-xs">@{otterUsername}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/Profile")}
          className="text-white/30 text-xs underline underline-offset-2 hover:text-white/50 transition-colors"
        >
          Go to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center max-w-md mx-auto px-1 py-8">
      {/* Hero banner */}
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-500 shadow-xl shadow-blue-600/30 p-6">
        {/* Flag accent stripes */}
        <div className="absolute top-0 right-0 h-full w-16 opacity-20" aria-hidden="true">
          <div className="absolute inset-y-0 right-8 w-2 bg-white -skew-x-12" />
          <div className="absolute inset-y-0 right-3 w-2 bg-white -skew-x-12" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Anchor size={18} className="text-white" />
          </div>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Corinthian Otters</p>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
          Welcome{otterUsername ? `, ${otterUsername}` : ""}!
        </h1>
        <p className="text-white/70 text-sm mt-1.5 max-w-[260px] leading-relaxed">
          Stay connected, check the calendar, and share moments on the water.
        </p>
        <div className="flex items-center gap-1 mt-4" aria-hidden="true">
          <Waves size={14} className="text-white/50" />
          <div className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-white/40 to-transparent" />
        </div>
      </div>

      {/* Username prompt for new users */}
      {user && !otterUsername && (
        <div className="mb-5 bg-blue-500/15 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-blue-100 text-sm mb-3 font-medium">Create your Otter username to get started!</p>
          <button
            onClick={() => navigate("/Profile")}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all"
          >
            Go to Profile
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Sailing today traffic light */}
      <SailingStatusBanner user={user} />

      {/* Next event at a glance */}
      <NextEventCard />

      {/* Quick actions grid */}
      <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.18em] mb-3 px-1">Quick Actions</p>
      <div className="grid grid-cols-2 gap-3">
        <Tilt3D>
          <ActionTile
            icon={MessageSquare}
            title="Group Feed"
            subtitle="Catch up with your team"
            gradient="from-sky-500 to-blue-600"
            shadow="shadow-blue-500/30"
            onClick={() => navigate("/Feed")}
          />
        </Tilt3D>
        <Tilt3D>
          <ActionTile
            icon={CalendarDays}
            title="Calendar"
            subtitle="See what's on"
            gradient="from-teal-500 to-emerald-600"
            shadow="shadow-teal-500/30"
            onClick={() => navigate("/Schedule")}
          />
        </Tilt3D>
        <Tilt3D>
          <ActionTile
            icon={Gem}
            title="Sponsors"
            subtitle="Our amazing supporters"
            gradient="from-purple-500 to-indigo-600"
            shadow="shadow-purple-500/30"
            onClick={() => navigate("/Sponsors")}
          />
        </Tilt3D>
        <Tilt3D>
            <ActionTile
              icon={Sailboat}
              title="Otter Week"
              subtitle="The big week's schedule"
              gradient="from-cyan-500 to-sky-600"
              shadow="shadow-cyan-500/30"
              onClick={() => navigate("/Schedule?otter_week=1")}
            />
        </Tilt3D>
      </div>
    </div>
  );
}