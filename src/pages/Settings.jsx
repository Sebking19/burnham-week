import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AccessibilityOptions from "@/components/settings/AccessibilityOptions";
import AdminMonitorPanel from "@/components/settings/AdminMonitorPanel";

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user && (user.role === "admin" || user.role === "owner");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#1B2A5B]">Settings</h1>
        <p className="text-lg text-[#141B34]/70 mt-1">Make the app easier to read and use</p>
      </div>

      <AccessibilityOptions />

      {isAdmin && <AdminMonitorPanel />}
    </div>
  );
}