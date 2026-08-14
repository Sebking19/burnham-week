import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import EnablePushCard from "@/components/notifications/EnablePushCard";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const [announcements, setAnnouncements] = useState(null);

  useEffect(() => {
    base44.entities.Announcement.list("-created_date", 20).then(setAnnouncements);
    localStorage.setItem("notifications_last_seen", new Date().toISOString());
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-[#1B2A5B] dark:text-[#8FAEF7] mb-4">Notifications</h1>

      <EnablePushCard />

      <h2 className="font-display text-xl text-[#1B2A5B] dark:text-[#8FAEF7] mb-3">Recent notices</h2>

      {announcements === null && (
        <p className="text-[#141B34]/60 dark:text-white/60">Loading…</p>
      )}

      {announcements?.length === 0 && (
        <p className="text-[#141B34]/60 dark:text-white/60">No notices yet.</p>
      )}

      <div className="space-y-3">
        {announcements?.map((a) => (
          <div key={a.id} className="rounded-xl border-2 border-dotted border-[#141B34]/30 dark:border-white/15 p-4">
            <div className="flex items-start gap-3">
              <FileText size={22} className="text-[#4C7CF0] shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="font-bold text-lg text-[#141B34] dark:text-white">{a.title}</p>
                <p className="text-[#141B34]/80 dark:text-white/80 whitespace-pre-wrap">{a.content}</p>
                <p className="mt-2 text-sm text-[#141B34]/60 dark:text-white/60">
                  {a.author_name ? `${a.author_name} · ` : ""}{format(new Date(a.created_date), "EEE d MMM, HH:mm")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}