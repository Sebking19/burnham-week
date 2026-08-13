import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Anchor, CalendarDays, CloudSun, Megaphone, UserCircle2, ChevronRight } from "lucide-react";

const WEEK_START = new Date("2026-08-29T00:00:00");
const WEEK_END = new Date("2026-09-05T23:59:59");

function countdownText() {
  const now = new Date();
  if (now < WEEK_START) {
    const days = Math.ceil((WEEK_START - now) / 86400000);
    return days === 1 ? "1 day to go" : `${days} days to go`;
  }
  if (now <= WEEK_END) {
    const dayNum = Math.floor((now - WEEK_START) / 86400000) + 1;
    return `Day ${dayNum} of Burnham Week`;
  }
  return "Burnham Week 2026 has finished — see you next year!";
}

const links = [
  { to: "/Schedule", icon: CalendarDays, title: "Week Schedule", desc: "What's on each day, 29 August to 5 September" },
  { to: "/Forecast", icon: CloudSun, title: "Weather, Wind & Tides", desc: "Forecast for the River Crouch" },
  { to: "/Notices", icon: Megaphone, title: "Notices", desc: "Announcements from the organisers" },
  { to: "/Profile", icon: UserCircle2, title: "My Profile", desc: "Your name, boat and helm or crew role" },
];

export default function Welcome() {
  const { isAuthenticated } = useAuth();
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    base44.auth.me().then(u => setFirstName((u.full_name || "").split(" ")[0])).catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#0E2A4E] text-white">
        <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center mb-6">
          <Anchor size={40} className="text-[#0E2A4E]" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Burnham Week 2026</h1>
        <p className="text-xl text-white/80 mb-2">Saturday 29 August – Saturday 5 September</p>
        <p className="text-lg text-white/60 mb-8">The East Coast's most challenging and friendly regatta — sailed on the River Crouch since 1893.</p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-amber-400 text-[#0E2A4E] text-xl font-bold px-10 py-4 rounded-2xl hover:bg-amber-300"
        >
          Sign in to continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-[#0E2A4E]">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
        <p className="text-lg text-slate-600 mt-1">Burnham Week · 29 August – 5 September 2026</p>
      </div>

      <div className="bg-[#0E2A4E] text-white rounded-2xl p-6 text-center">
        <p className="text-amber-300 text-lg font-bold uppercase tracking-wide">Countdown</p>
        <p className="text-3xl font-bold mt-1">{countdownText()}</p>
      </div>

      <div className="space-y-4">
        {links.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-[#0E2A4E] shadow-sm"
          >
            <div className="w-14 h-14 rounded-xl bg-[#0E2A4E] flex items-center justify-center shrink-0">
              <Icon size={28} className="text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-[#0E2A4E]">{title}</p>
              <p className="text-base text-slate-600">{desc}</p>
            </div>
            <ChevronRight size={28} className="text-slate-400 shrink-0" />
          </Link>
        ))}
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <h2 className="text-xl font-bold text-[#0E2A4E] mb-3">Regatta Office Opening Times</h2>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between gap-4"><span>Friday 28 August</span><span className="font-bold">15:00 – 20:00</span></div>
          <div className="flex justify-between gap-4"><span>Saturday 29 August</span><span className="font-bold">08:00 – 11:30</span></div>
          <div className="flex justify-between gap-4"><span>Sunday 30 August</span><span className="font-bold">09:30 – 11:30</span></div>
          <div className="flex justify-between gap-4"><span>Rest of the week</span><span className="font-bold">09:30 – 11:30</span></div>
        </div>
      </div>

      <p className="text-base text-slate-500 text-center px-4 pb-2">
        Organised by the Joint Clubs Committee: Royal Corinthian YC, Royal Burnham YC, Crouch YC and Burnham SC.
      </p>
    </div>
  );
}