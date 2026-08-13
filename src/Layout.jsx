import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Anchor, CalendarDays, CloudSun, Megaphone, Home as HomeIcon, UserCircle2 } from "lucide-react";

const tabs = [
  { name: "Home", icon: HomeIcon, page: "Welcome", path: "/" },
  { name: "Schedule", icon: CalendarDays, page: "Schedule", path: "/Schedule" },
  { name: "Weather", icon: CloudSun, page: "Forecast", path: "/Forecast" },
  { name: "Notices", icon: Megaphone, page: "Notices", path: "/Notices" },
];

export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
        * { font-family: 'Atkinson Hyperlegible', sans-serif; }
        html { font-size: 18px; }
      `}</style>

      {isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0E2A4E] text-white shadow-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                <Anchor size={22} className="text-[#0E2A4E]" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-lg">Burnham Week</p>
                <p className="text-amber-300 text-xs font-bold tracking-wide">29 AUG – 5 SEP 2026</p>
              </div>
            </Link>
            <Link
              to="/Profile"
              aria-label="My profile"
              className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${currentPageName === "Profile" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <UserCircle2 size={28} />
              <span className="text-[11px] font-bold">Profile</span>
            </Link>
          </div>
        </header>
      )}

      <main className={`max-w-3xl mx-auto px-4 ${isAuthenticated ? "pt-24 pb-32" : "pt-0 pb-0"}`}>
        {children}
      </main>

      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#0E2A4E]/15 shadow-[0_-4px_16px_rgba(14,42,78,0.12)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto h-20 flex items-stretch">
            {tabs.map(({ name, icon: Icon, page, path }) => {
              const active = currentPageName === page || (page === "Welcome" && !currentPageName);
              return (
                <Link
                  key={page}
                  to={path}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 ${active ? "text-[#0E2A4E]" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <span className={`w-12 h-8 rounded-full flex items-center justify-center ${active ? "bg-amber-300" : ""}`}>
                    <Icon size={26} strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <span className={`text-[13px] ${active ? "font-bold" : "font-semibold"}`}>{name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}