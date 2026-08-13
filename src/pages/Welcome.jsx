import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Anchor, CalendarDays, CloudSun, Cog, LifeBuoy, Megaphone, Trophy, UserCircle2 } from "lucide-react";
import NoticeBoardCard from "@/components/home/NoticeBoardCard";
import LatestNews from "@/components/home/LatestNews";
import NameReminder from "@/components/home/NameReminder";

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
  { to: "/MyResults", icon: Trophy, title: "My Results", desc: "Your place in the standings, found by your name" },
  { to: "/Profile", icon: UserCircle2, title: "My Profile", desc: "Your name, boat and helm or crew role" },
  { to: "/Help", icon: LifeBuoy, title: "Help", desc: "Who to call if you need a hand" },
  { to: "/Settings", icon: Cog, title: "Settings", desc: "Text size and accessibility options" },
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
  const [needsName, setNeedsName] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    base44.auth.me().then(u => {
      setFirstName(((u.display_name || u.full_name || "").split(" ")[0]));
      setNeedsName(!u.display_name);
    }).catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#141A35] text-white">
        <div className="w-20 h-20 rounded-full border-[3px] border-dotted border-white/70 flex items-center justify-center mb-6">
          <Anchor size={38} className="text-[#4C7CF0]" />
        </div>
        <h1 className="font-display text-5xl mb-3">Burnham Week 2026</h1>
        <p className="text-xl mb-2">Sat 29 Aug – Sun 5 Sep 2026</p>
        <p className="text-lg text-white/70 mb-8 max-w-md">The East Coast's most challenging and friendly regatta.</p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-[#4C7CF0] text-white text-xl font-bold px-10 py-4 rounded-lg hover:bg-[#3E6BDB]"
        >
          Sign in to continue
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      {/* Hero band, as on the website */}
      <div className="-mx-4 bg-[#141A35] text-white px-6 py-10 mb-8">
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          {firstName ? `Welcome, ${firstName}` : "Burnham Week 2026"}
        </h1>
        <p className="text-lg text-white/80 mt-2">Sat 29 Aug – Sun 5 Sep 2026</p>
        <p className="font-display text-2xl text-[#8FAEF7] mt-4">{countdownText()}</p>
        <a
          href="https://www.burnhamweek.com/enter-here/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 bg-[#4C7CF0] text-white font-bold px-8 py-3.5 rounded-lg hover:bg-[#3E6BDB]"
        >
          Enter here
        </a>
      </div>

      {needsName && <NameReminder />}

      <NoticeBoardCard />

      {/* Links as ruled rows */}
      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl px-5 py-2">
        {links.map(({ to, icon: Icon, title, desc }, i) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-4 py-4 group ${i < links.length - 1 ? "border-b border-[#141B34]/10 dark:border-white/10" : ""}`}
          >
            <span className="w-11 h-11 rounded-lg bg-[#4C7CF0] flex items-center justify-center shrink-0">
              <Icon size={22} className="text-white" />
            </span>
            <span className="text-lg leading-snug">
              <span className="font-bold text-[#1B2A5B] dark:text-[#8FAEF7] group-hover:underline">{title}</span>
              <span className="text-[#141B34]/70 dark:text-white/70"> — {desc}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Office times */}
      <div className="mt-6 bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6">
        <h2 className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">Office Opening Times 2026</h2>
        <div className="mt-4">
          <div className="flex justify-between gap-4 pb-2 text-base font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">
            <span>Date</span>
            <span>Times</span>
          </div>
          {OFFICE_TIMES.map(([day, time], i) => (
            <div key={day} className={`flex justify-between gap-4 py-3 px-2 -mx-2 text-lg text-[#141B34]/85 dark:text-white/85 ${i % 2 === 0 ? "bg-[#F4F7FC] dark:bg-white/5" : ""}`}>
              <span>{day}</span>
              <span>{time}</span>
            </div>
          ))}
        </div>
      </div>

      <LatestNews />

      <p className="text-base text-[#141B34]/60 dark:text-white/60 mt-8">
        Organised by the Joint Clubs Committee: Royal Corinthian YC, Royal Burnham YC and Burnham SC.
      </p>
    </div>
  );
}