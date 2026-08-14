import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCircle2 } from "lucide-react";

export default function EnablePushCard() {
  const [status, setStatus] = useState("idle"); // idle | working | enabled | blocked

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      setStatus("enabled");
    }
  }, []);

  const enable = async () => {
    setStatus("working");
    // Turn on both alert preferences on the account
    await base44.auth.updateMe({ notify_announcements: true, notify_results: true });

    // Ask the device for notification permission
    if (typeof Notification !== "undefined" && Notification.requestPermission) {
      const result = await Notification.requestPermission();
      setStatus(result === "granted" ? "enabled" : "blocked");
    } else {
      setStatus("enabled");
    }
  };

  if (status === "enabled") {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-dotted border-green-700/40 bg-green-50 dark:bg-green-900/20 p-4 mb-6">
        <CheckCircle2 size={26} className="text-green-700 dark:text-green-400 shrink-0" />
        <p className="text-green-900 dark:text-green-200 font-semibold">
          Notifications are switched on for this device.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dotted border-[#141B34]/30 dark:border-white/15 p-4 mb-6">
      <p className="mb-3 text-[#141B34]/80 dark:text-white/80">
        Get an alert on your phone when a notice is posted or race results come in.
      </p>
      <button
        onClick={enable}
        disabled={status === "working"}
        className="w-full flex items-center justify-center gap-2 bg-[#4C7CF0] hover:bg-[#3E6BDB] text-white font-bold text-lg rounded-lg py-3.5 disabled:opacity-60"
      >
        <Bell size={22} />
        {status === "working" ? "Enabling…" : "Enable notifications"}
      </button>
      {status === "blocked" && (
        <p className="mt-3 text-red-700 dark:text-red-400 font-semibold">
          Notifications are blocked for this app. Please open your phone's Settings, find this app, and allow Notifications.
        </p>
      )}
    </div>
  );
}