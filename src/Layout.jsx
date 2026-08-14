import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStack } from "@/lib/NavigationStackContext";
import { CalendarDays, CloudSun, FileText, Home as HomeIcon, Info, User } from "lucide-react";
import { loadSettings, applySettings } from "@/lib/accessibility";
import BackButton from "@/components/BackButton";
import NotificationsBell from "@/components/NotificationsBell";

const SUB_PAGES = ["Profile", "Help", "Settings", "PrivacyPolicy", "MyResults", "Notifications"];

const tabs = [
  { name: "Home", icon: HomeIcon, page: "Welcome", path: "/" },
  { name: "Schedule", icon: CalendarDays, page: "Schedule", path: "/Schedule" },
  { name: "Weather", icon: CloudSun, page: "Forecast", path: "/Forecast" },
  { name: "Notices", icon: FileText, page: "Notices", path: "/Notices" },
  { name: "Info", icon: Info, page: "Info", path: "/Info" },
];

export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { activeTab, setActiveTab, resetTab, saveScrollPosition, getScrollPosition } = useNavigationStack();
  const prevTab = useRef(activeTab);

  useEffect(() => {
    applySettings(loadSettings());
  }, []);

  // Track page entry in the tab's stack and restore that tab's scroll position
  useEffect(() => {
    if (!currentPageName) return;
    const tab = tabs.find(t => t.page === currentPageName);
    if (tab) {
      if (prevTab.current !== tab.page) {
        saveScrollPosition(prevTab.current, window.scrollY);
        prevTab.current = tab.page;
        setActiveTab(tab.page);
        window.scrollTo(0, getScrollPosition(tab.page));
      }
    } else {
      // Sub-page (Profile, Help, Settings, Privacy): never becomes a tab's resume target
      window.scrollTo(0, 0);
    }
  }, [currentPageName]);

  const handleTabClick = (tab) => {
    const isActive = currentPageName === tab.page;
    if (isActive) {
      // Double-tap on the active tab: reset its stack to the root page
      resetTab(tab.page);
      window.scrollTo(0, 0);
      navigate(tab.path);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#141B34] dark:bg-[#121212] dark:text-white">
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
        <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#121212]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="max-w-3xl mx-auto px-4 h-[78px] flex items-center justify-between border-b-2 border-dotted border-[#141B34]/40 dark:border-white/10">
            {SUB_PAGES.includes(currentPageName) && <BackButton />}
            <Link to="/" className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src="https://www.burnhamweek.com/wp-content/themes/burnham-week-2026/img/burnham-week-logo-2026.png"
                alt="Burnham Week 2026"
                className="h-14 w-auto shrink-0 object-contain"
              />
              <div className="leading-tight">
                <p className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">Burnham Week</p>
                <p className="text-[0.8rem] text-[#141B34]/70 dark:text-white/70">Sat 29 Aug – Sun 5 Sep 2026</p>
              </div>
            </Link>
            <NotificationsBell active={currentPageName === "Notifications"} />
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

      <main
        className={`max-w-3xl mx-auto px-4 overflow-x-hidden ${isAuthenticated ? "pb-32" : "pb-0"}`}
        style={isAuthenticated ? { paddingTop: "calc(6.5rem + env(safe-area-inset-top))" } : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPageName || "root"}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            style={{ willChange: "transform" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-dotted border-[#141B34]/40 dark:bg-[#121212] dark:border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="max-w-3xl mx-auto h-[74px] flex items-stretch">
            {tabs.map(({ name, icon: Icon, page, path }) => {
              const active = currentPageName === page || (page === "Welcome" && !currentPageName);
              return (
                <Link
                  key={page}
                  to={path}
                  onClick={() => handleTabClick({ page, path })}
                  className="flex-1 flex items-center justify-center px-1"
                >
                  <span className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${active ? "bg-[#4C7CF0] text-white font-bold" : "text-[#1B2A5B] dark:text-[#8FAEF7] hover:bg-[#4C7CF0]/10"}`}>
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