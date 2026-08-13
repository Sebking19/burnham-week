import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Bell, Trash2, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const typeColors = {
  post: "bg-blue-500/10 text-blue-400",
  role_change: "bg-purple-500/10 text-purple-400",
  announcement: "bg-yellow-500/10 text-yellow-400",
  event_mention: "bg-green-500/10 text-green-400",
};

const typeLabels = {
  post: "Post",
  role_change: "Role Change",
  announcement: "Announcement",
  event_mention: "Event Mention",
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadNotifications(u);
    }).catch(() => {});
  }, []);

  const loadNotifications = async (currentUser) => {
    setLoading(true);
    const data = await base44.entities.Notification.filter(
      { user_email: currentUser.email },
      "-created_date"
    );
    setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { read: true });
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = async (notificationId) => {
    await base44.entities.Notification.delete(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    for (const id of unreadIds) {
      await base44.entities.Notification.update(id, { read: true });
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const groupLabel = (d) => {
    const date = new Date(d);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date >= startToday) return "Today";
    if (date >= new Date(startToday.getTime() - 86400000)) return "Yesterday";
    if (date >= new Date(startToday.getTime() - 6 * 86400000)) return "This Week";
    return "Earlier";
  };

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-2"
    >
      <div className="flex items-center gap-3 mb-8">
        <Link
          to={createPageUrl("Feed")}
          aria-label="Back to feed"
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={16} className="text-white/60" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-cyan-200/40 text-sm mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "post", "role_change", "announcement", "event_mention"].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === type
                ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 shadow-lg shadow-cyan-500/40"
                : "bg-slate-900/60 border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {type === "all" ? "All" : typeLabels[type]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-white/40">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bell size={32} className="text-white/20 mb-3 animate-gentle-sway" />
          <p className="text-white/40 text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {["Today", "Yesterday", "This Week", "Earlier"].map(label => {
              const groupItems = filteredNotifications.filter(n => groupLabel(n.created_date) === label);
              if (groupItems.length === 0) return null;
              return (
                <div key={label} className="space-y-2">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-cyan-200/40 pt-3 pb-0.5">{label}</h2>
                  {groupItems.map(notif => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border transition-all ${
                  notif.read
                    ? "bg-slate-900/40 border-white/5"
                    : "bg-slate-900/70 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${typeColors[notif.type]}`}>
                    {typeLabels[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm">{notif.title}</h3>
                    <p className="text-white/60 text-xs mt-1">{notif.message}</p>
                    <p className="text-white/30 text-xs mt-2">
                      {new Date(notif.created_date).toLocaleDateString()} {new Date(notif.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        aria-label="Mark as read"
                        title="Mark as read"
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <CheckCircle2 size={16} className="text-white/40 hover:text-white/70" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      aria-label="Delete notification"
                      title="Delete"
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} className="text-white/40 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
                  ))}
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}