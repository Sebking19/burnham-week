import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function NotificationPreferences() {
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setEnabled(u?.notify_announcements !== false)).catch(() => {});
  }, []);

  const toggle = async (value) => {
    setEnabled(value);
    setSaving(true);
    await base44.auth.updateMe({ notify_announcements: value }).catch(() => {});
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <Bell size={24} className="text-[#4C7CF0]" />
        <h2 className="text-lg font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">Notifications</h2>
      </div>
      <label className="flex items-start justify-between gap-4 cursor-pointer">
        <span>
          <span className="block text-lg text-[#141B34] dark:text-white">Notices & updates</span>
          <span className="block text-base text-[#141B34]/70 dark:text-white/70">
            Get an alert on your phone when a new notice is posted
          </span>
        </span>
        <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} aria-label="Notices and updates" />
      </label>
    </div>
  );
}