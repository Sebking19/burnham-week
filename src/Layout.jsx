import { Link, useNavigate, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { useNavigationStack } from "@/lib/NavigationStackContext";
import { createPageUrl } from "@/utils";
import { CalendarDays, MessageSquare, Settings, Anchor, Megaphone, Bell, Ticket, BarChart2, Phone, ScanLine, ChevronDown, User, CloudSun, Award, ThumbsUp, ClipboardList, Ship, Gem, ShieldCheck } from "lucide-react";
import { Anchor as AnchorIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBoats from "@/components/FloatingBoats";
import Underwater3DBackground from "@/components/Underwater3DBackground";

export default function Layout({ children, currentPageName }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { activeTab, setActiveTab, resetTab, saveScrollPosition, getScrollPosition, popPage } = useNavigationStack();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const mainRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const menuRef = useRef(null);

  const isRootPage = currentPageName === "Welcome" || !currentPageName;
  const showBackButton = isAuthenticated && !isRootPage;

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
    // Apply Simple Mode (bigger text & buttons) if enabled on this device
    if (localStorage.getItem("simple_mode") === "true") {
      document.documentElement.setAttribute("data-simple-mode", "true");
    }
  }, []);

  // Load OtterWeekConfig only once on mount
  useEffect(() => {
    base44.entities.OtterWeekConfig.list().then(records => {
      if (records.length > 0) {
        setShowAchievements(records[0].show_achievements === true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;

    // Set achievements fallback for owner if config not yet loaded
    setShowAchievements(prev => prev || user.role === "owner");

    let notificationsLoaded = false;
    
    const loadNotifications = async () => {
      if (notificationsLoaded) return;
      notificationsLoaded = true;
      const notifs = await base44.entities.Notification.filter(
        { user_email: user.email, read: false }
      );
      setUnreadCount(notifs.length);
    };

    loadNotifications();

    // Subscribe to real-time updates
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        if (event.type === 'create' && !event.data?.read) {
          setUnreadCount(prev => prev + 1);
        } else if (event.type === 'update' && event.data?.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (event.type === 'delete') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "admiral" || user?.role === "owner" || user?.role === "chairman";
  const isTrainerPlus = user && ["owner", "admin", "admiral", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"].includes(user.role);
  const hasVolunteerSubrole = user && (Array.isArray(user.roles) ? user.roles.includes("otter_volunteer") : user.role === "otter_volunteer");
  const isVolunteer = hasVolunteerSubrole || isTrainerPlus;
  const noRole = user && (!user.role || user.role === "user");
  const volunteerOnly = false; // otter_volunteer is now a subrole — never restricts page access

  // Redirect to Welcome page if on a non-existent or default route
  if (!isAuthenticated && currentPageName === undefined || currentPageName === "Home") {
    return <Navigate to="/Welcome" replace />;
  }

  // Handle role-based access control
  if (user) {
    const allowedPages = ["Welcome", "Profile", "PrivacyPolicy"];
    const volunteerAllowed = ["Welcome", "Profile", "Volunteering"];
    if (noRole && !allowedPages.includes(currentPageName)) {
      return <Navigate to="/Welcome" replace />;
    }
    if (volunteerOnly && !volunteerAllowed.includes(currentPageName)) {
      return <Navigate to="/Welcome" replace />;
    }
  }

  const navItems = noRole ? [] : volunteerOnly ? [
    { name: "Volunteer", icon: Ship, page: "Volunteering" },
  ] : [
    { name: "Schedule", icon: CalendarDays, page: "Schedule" },
    { name: "Feed", icon: MessageSquare, page: "Feed" },
    { name: "My Events", icon: Ticket, page: "MyEvents" },
    { name: "Notices", icon: Megaphone, page: "Announcements" },
    { name: "Sponsors", icon: Gem, page: "Sponsors" },
  ];

  const menuItems = noRole ? [] : [
    { name: "Profile", icon: User, page: "Profile" },
    { name: "Settings", icon: Settings, page: "Settings" },
    { name: "Forecast", icon: CloudSun, page: "Forecast" },
    { name: "Help", icon: Phone, page: "Help" },
    { name: "Privacy", icon: ShieldCheck, page: "PrivacyPolicy" },
    ...(showAchievements && user?.role !== "owner" ? [{ name: "Awards", icon: Award, page: "Achievements" }] : []),
    ...(showAchievements && user?.role !== "owner" ? [{ name: "Nominate", icon: ThumbsUp, page: "NominateTrophy" }] : []),
    ...(showAchievements && isAdmin && user?.role !== "owner" ? [{ name: "Queue", icon: BarChart2, page: "NominationQueue" }] : []),
    ...(isAdmin ? [{ name: "Stats", icon: BarChart2, page: "AdminStats" }] : []),
    ...(isAdmin ? [{ name: "Roles", icon: ShieldCheck, page: "RolesGuide" }] : []),
    ...(isAdmin ? [{ name: "Scan", icon: ScanLine, page: "ScanTicket" }] : []),
    ...(isTrainerPlus ? [{ name: "Roster", icon: ClipboardList, page: "DutyRoster" }] : []),
    ...(isVolunteer || hasVolunteerSubrole ? [{ name: "Volunteer", icon: Ship, page: "Volunteering" }] : []),
  ];

  const handleTabChange = (newPage) => {
    const mainEl = mainRef.current;
    if (activeTab === newPage) {
      resetTab(newPage);
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (mainEl && activeTab) {
        saveScrollPosition(activeTab, mainEl.scrollTop);
      }
      setActiveTab(newPage);
      if (mainEl) {
        const saved = getScrollPosition(newPage);
        requestAnimationFrame(() => { if (mainRef.current) mainRef.current.scrollTop = saved; });
      }
    }
  };

  const handleBackButton = () => {
    navigate("/");
  };



  return (
    <ThemeProvider>
    <div className="min-h-screen font-sans transition-colors" style={{ 
      color: "var(--theme-text, white)",
      background: "linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-via)), rgb(var(--theme-bg-to)))" 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 2px; }
        .nav-scroll::-webkit-scrollbar { display: none; }
        .nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Background boats — isolated layer to avoid paint thrashing */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, willChange: "transform", transform: "translateZ(0)" }}>
        <FloatingBoats />
      </div>
      <Underwater3DBackground />

      {/* Header */}
      {isAuthenticated && <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10 lg:relative" style={{paddingTop: 'env(safe-area-inset-top)', background: "linear-gradient(to bottom, rgba(var(--theme-header-from),0.1), rgba(var(--theme-header-to),0.05))"}}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {showBackButton && (
              <button
                onClick={handleBackButton}
                aria-label="Go back"
                className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                title="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap min-h-[44px]"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/40 animate-boat-bob">
                <AnchorIcon size={16} className="text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-lg">Otters</span>
              <ChevronDown size={14} className={`text-white/50 transition-transform duration-200 shrink-0 ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-slate-950/95 backdrop-blur-2xl border border-cyan-400/25 rounded-2xl shadow-[0_12px_40px_rgba(2,10,30,0.85),0_0_25px_rgba(34,211,238,0.12)] z-50 overflow-y-auto max-h-[70vh] p-1.5"
                >
                  <Link
                    to={createPageUrl("Welcome")}
                    onClick={() => setMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                      currentPageName === "Welcome"
                        ? "bg-gradient-to-r from-sky-500/25 to-cyan-400/10 text-white border-cyan-400/30"
                        : "text-white/60 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${currentPageName === "Welcome" ? "bg-gradient-to-br from-sky-500 to-cyan-400 shadow-md shadow-cyan-500/40 text-white" : "bg-white/5 text-white/50"}`}>
                      <AnchorIcon size={14} />
                    </span>
                    <span className="font-semibold">Home</span>
                  </Link>
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent my-1" />
                  {menuItems.map(({ name, icon: Icon, page }) => {
                    const active = currentPageName === page;
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          navigate(`/${page}`);
                          setMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                          active
                            ? "bg-gradient-to-r from-sky-500/25 to-cyan-400/10 text-white border-cyan-400/30"
                            : "text-white/60 hover:text-white hover:bg-white/5 border-transparent"
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-gradient-to-br from-sky-500 to-cyan-400 shadow-md shadow-cyan-500/40 text-white" : "bg-white/5 text-white/50"}`}>
                          <Icon size={14} />
                        </span>
                        <span className="font-semibold">{name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            </div>
            {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/Notifications")}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/30 transition-all"
                title="Notifications"
              >
                  <Bell size={18} className="text-white/70" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

            </div>
          )}
        </div>
      </header>}
      {/* Adjust padding when header is hidden */}
      <style>{isAuthenticated ? '' : '.pt-20 { padding-top: 0 !important; }'}</style>

      {/* Main Content */}
      <main ref={mainRef} className={`max-w-6xl mx-auto px-4 ${isAuthenticated ? 'pt-20 pb-28 lg:pt-6 lg:pb-24' : 'pt-0 pb-0'} relative z-10`} style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.995 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav - scrollable (mobile) / Top Nav (desktop) */}
      {isAuthenticated && <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-slate-950/80 border-t border-cyan-400/20 shadow-[0_-8px_30px_rgba(2,10,30,0.6)]" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <div className="absolute top-0 left-0 right-0 h-[2px] wave-hairline" aria-hidden="true" />
        <div className="h-16 flex items-center px-2 max-w-6xl mx-auto">
          {navItems.map(({ name, icon: Icon, page }) => {
            const isActive = currentPageName === page;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => handleTabChange(page)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors duration-300 flex-1 min-w-0 ${
                  isActive ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                <div className="relative w-9 h-9 flex items-center justify-center">
                  {isActive && (
                    <motion.div
                      layoutId="nav-bubble"
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/50"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap ${isActive ? "text-cyan-200" : ""}`}>
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>}
    </div>
    </ThemeProvider>
  );
}