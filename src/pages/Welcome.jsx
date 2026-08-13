import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Anchor, CalendarDays, CloudSun, Megaphone, UserCircle2 } from "lucide-react";

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
  return "Burnham Week 2026 has finished";
}

const links = [
  { to: "/Schedule", icon: CalendarDays, title: "Week Schedule", desc: "What's on each day, 29 August to 5 September" },
  { to: "/Forecast", icon: CloudSun, title: "Weather, Wind & Tides", desc: "Forecast for the River Crouch" },
  { to: "/Notices", icon: Megaphone, title: "Notices", desc: "Announcements from the organisers" },
  { to: "/Profile", icon: UserCircle2, title: "My Profile", desc: "Your name, boat and helm or crew role" },
];

const OFFICE_TIMES = [
  ["Friday 28 August", "15:00 – 20:00"],
  ["Saturday 29 August", "08:00 – 11:30"],
  ["Sunday 30 August", "09:30 – 11:30"],
  ["Rest of the week", "09:30 – 11:30"],
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#0B1F44] text-[#F4EFE3]">
        <div className="w-20 h-20 rounded-full bg-[#C8A24A] flex items-center justify-center mb-6">
          <Anchor size={40} className="text-[#0B1F44]" />
        </div>
        <h1 className="font-display text-5xl mb-3">Burnham Week 2026</h1>
        <p className="text-xl mb-2">Saturday 29 August – Saturday 5 September</p>
        <p className="text-lg text-[#F4EFE3]/70 mb-8 max-w-md">The East Coast's most challenging and friendly regatta — sailed on the River Crouch since 1893.</p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-[#C8A24A] text-[#0B1F44] text-xl font-bold px-10 py-4 rounded-sm hover:bg-[#D8B662]"
        >
          Sign in to continue
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h1 className="font-display text-4xl md:text-5xl text-[#0B1F44]">
        {firstName ? `Welcome, ${firstName}` : "Welcome"}
      </h1>
      <p className="text-lg text-[#0B1F44]/75 mt-1">Burnham Week · 29 August – 5 September 2026</p>

      {/* Countdown */}
      <div className="mt-6 border-y-[3px] border-[#C8A24A] py-[3px]">
        <div className="bg-[#0B1F44] text-center py-5 px-4">
          <p className="text-[#C8A24A] text-base font-bold uppercase tracking-[0.2em]">Countdown</p>
          <p className="font-display text-4xl text-[#F4EFE3] mt-1">{countdownText()}</p>
        </div>
      </div>

      {/* Links as ruled rows */}
      <div className="mt-8">
        {links.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 py-4 border-b border-[#0B1F44]/20 group"
          >
            <span className="w-11 h-11 rounded-full bg-[#C8A24A] flex items-center justify-center shrink-0">
              <Icon size={22} className="text-[#0B1F44]" />
            </span>
            <span className="text-lg leading-snug">
              <span className="font-bold text-[#0B1F44] group-hover:underline">{title}</span>
              <span className="text-[#0B1F44]/70"> — {desc}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Office times */}
      <div className="mt-8">
        <h2 className="font-display text-3xl text-[#0B1F44]">Regatta Office Opening Times</h2>
        <div className="mt-3">
          {OFFICE_TIMES.map(([day, time]) => (
            <div key={day} className="flex justify-between gap-4 py-2.5 border-b border-[#0B1F44]/15 text-lg text-[#0B1F44]">
              <span>{day}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-base text-[#0B1F44]/60 mt-8">
        Organised by the Joint Clubs Committee: Royal Corinthian YC, Royal Burnham YC, Crouch YC and Burnham SC.
      </p>
    </div>
  );
}