import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AccessibilityOptions from "@/components/settings/AccessibilityOptions";
import AdminMonitorPanel from "@/components/settings/AdminMonitorPanel";
import UserRoleManager from "@/components/settings/UserRoleManager";
import WebsiteSyncPanel from "@/components/settings/WebsiteSyncPanel";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import { Link } from "react-router-dom";
import { ShieldQuestion } from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user && (user.role === "admin" || user.role === "owner");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#1B2A5B] dark:text-[#8FAEF7]">Settings</h1>
        <p className="text-lg text-[#141B34]/70 dark:text-white/70 mt-1">Make the app easier to read and use</p>
      </div>

      <AccessibilityOptions />

      <NotificationPreferences />

      {isAdmin && <UserRoleManager currentUserId={user.id} />}

      {isAdmin && <AdminMonitorPanel />}

      {isAdmin && <WebsiteSyncPanel />}

      <Link
        to="/PrivacyPolicy"
        className="flex items-center gap-3 bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-5 hover:bg-[#F4F7FC] dark:hover:bg-white/5"
      >
        <ShieldQuestion size={24} className="text-[#4C7CF0]" />
        <span className="text-lg font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">Privacy Policy</span>
      </Link>
    </div>
  );
}