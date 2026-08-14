import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NotificationsBell({ active }) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    base44.entities.Announcement.list("-created_date", 1).then((items) => {
      if (!items?.length) return;
      const lastSeen = localStorage.getItem("notifications_last_seen") || "";
      if (items[0].created_date > lastSeen) setHasNew(true);
    }).catch(() => {});
  }, []);

  return (
    <Link
      to="/Notifications"
      aria-label="Notifications"
      className={`relative w-11 h-11 rounded-lg flex items-center justify-center mr-2 ${active ? "bg-[#1B2A5B]" : "bg-[#4C7CF0] hover:bg-[#3E6BDB]"}`}
    >
      <Bell size={24} className="text-white" />
      {hasNew && !active && (
        <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
      )}
    </Link>
  );
}