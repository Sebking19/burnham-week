import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useEffect } from "react";
import { CalendarDays, CloudSun, FileText, Home as HomeIcon, Info, User } from "lucide-react";
import { loadSettings, applySettings } from "@/lib/accessibility";

const tabs = [
  { name: "Home", icon: HomeIcon, page: "Welcome", path: "/" },
  { name: "Schedule", icon: CalendarDays, page: "Schedule", path: "/Schedule" },
  { name: "Weather", icon: CloudSun, page: "Forecast", path: "/Forecast" },
  { name: "Notices", icon: FileText, page: "Notices", path: "/Notices" },
  { name: "Info", icon: Info, page: "Info", path: "/Info" },
];

export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    applySettings(loadSettings());
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#141B34]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap');
        * { font-family: 'Source Sans 3', sans-serif; }
        .font-display { font-family: 'Playfair Display', serif; }
        html { font-size: 18px; }
        html[data-contrast="high"] .bg-white, html[data-contrast="high"] .bg-\\[\\#F4F7FC\\] { color: #000000; }
        html[data-contrast="high"] .bg-white *:not(svg):not(path):not([class*="bg-["]),
        html[data-contrast="high"] .bg-\\[\\#F4F7FC\\] *:not(svg):not(path) { color: #000000 !important; }
        html[data-contrast="high"] .border-dotted { border-color: #000000 !important; }
        html[data-underline-links="true"] a { text-decoration: underline; }
      `}</style>

      {isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="max-w-3xl mx-auto px-4 h-[78px] flex items-center justify-between border-b-2 border-dotted border-[#141B34]/40">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="https://www.burnhamweek.com/wp-content/themes/burnham-week-2026/img/burnham-week-logo-2026.png"
                alt="Burnham Week 2026"
                className="h-14 w-auto shrink-0 object-contain"
              />
              <div className="leading-tight">
                <p className="font-display text-2xl text-[#1B2A5B]">Burnham Week</p>
                <p className="text-[0.8rem] text-[#141B34]/70">Sat 29 Aug – Sun 5 Sep 2026</p>
              </div>
            </Link>
            <Link
              to="/Profile"
              aria-label="My profile"
              className={`w-11 h-11 rounded-lg flex items-center justify-center ${currentPageName === "Profile" ? "bg-[#1B2A5B]" : "bg-[#4C7CF0] hover:bg-[#3E6BDB]"}`}
            >
              <User size={24} className="text-white" />
            </Link>
          </div>
        </header>
      )}

      <main className={`max-w-3xl mx-auto px-4 ${isAuthenticated ? "pt-28 pb-32" : "pt-0 pb-0"}`}>
        {children}
      </main>

      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-dotted border-[#141B34]/40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto h-[74px] flex items-stretch">
            {tabs.map(({ name, icon: Icon, page, path }) => {
              const active = currentPageName === page || (page === "Welcome" && !currentPageName);
              return (
                <Link key={page} to={path} className="flex-1 flex items-center justify-center px-1">
                  <span className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${active ? "bg-[#4C7CF0] text-white font-bold" : "text-[#1B2A5B] hover:bg-[#4C7CF0]/10"}`}>
                    <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                    <span className="text-base hidden sm:inline">{name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}