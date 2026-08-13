import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Anchor, CalendarDays, CloudSun, FileText, Home as HomeIcon, User } from "lucide-react";

const tabs = [
  { name: "Home", icon: HomeIcon, page: "Welcome", path: "/" },
  { name: "Schedule", icon: CalendarDays, page: "Schedule", path: "/Schedule" },
  { name: "Weather", icon: CloudSun, page: "Forecast", path: "/Forecast" },
  { name: "Notices", icon: FileText, page: "Notices", path: "/Notices" },
];

export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#0B1F44]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap');
        * { font-family: 'Source Sans 3', sans-serif; }
        .font-display { font-family: 'Playfair Display', serif; }
        html { font-size: 18px; }
      `}</style>

      {isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0B1F44] text-[#F4EFE3]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="max-w-3xl mx-auto px-4 h-[76px] flex items-center justify-between relative">
            <Link to="/" className="flex items-center gap-3">
              <Anchor size={30} className="text-[#C8A24A] shrink-0" />
              <div className="leading-tight">
                <p className="font-display text-2xl text-[#C8A24A]">Burnham Week</p>
                <p className="text-sm tracking-wide">29 AUG – 5 SEP 2026</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/Profile"
                aria-label="My profile"
                className={`w-11 h-11 rounded-sm flex items-center justify-center ${currentPageName === "Profile" ? "bg-[#D8B662]" : "bg-[#C8A24A] hover:bg-[#D8B662]"}`}
              >
                <User size={24} className="text-[#0B1F44]" />
              </Link>
              {/* Burgee pennant */}
              <svg width="54" height="34" viewBox="0 0 54 34" aria-hidden="true" className="hidden sm:block">
                <polygon points="2,2 52,17 2,32" fill="#0B1F44" stroke="#C8A24A" strokeWidth="1.6" strokeDasharray="3 2" />
                <path d="M14 12v9m-3-9h6m-3 9c-3 0-5-2-5-4m5 4c3 0 5-2 5-4" stroke="#C8A24A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-3xl mx-auto px-4 ${isAuthenticated ? "pt-28 pb-32" : "pt-0 pb-0"}`}>
        {children}
      </main>

      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#F4EFE3] border-t-2 border-[#0B1F44]/25" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto h-[74px] flex items-stretch">
            {tabs.map(({ name, icon: Icon, page, path }) => {
              const active = currentPageName === page || (page === "Welcome" && !currentPageName);
              return (
                <Link
                  key={page}
                  to={path}
                  className="flex-1 flex items-center justify-center px-1"
                >
                  <span className={`flex items-center gap-2 px-4 py-2.5 rounded-sm ${active ? "bg-[#C8A24A] text-[#0B1F44] font-bold" : "text-[#0B1F44]/80 hover:text-[#0B1F44]"}`}>
                    <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                    <span className="text-base">{name}</span>
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