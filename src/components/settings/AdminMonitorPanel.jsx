import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, CalendarDays, Megaphone, Phone } from "lucide-react";

export default function AdminMonitorPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.WeekEvent.list(),
      base44.entities.Announcement.list("-created_date"),
      base44.entities.HelpContact.list(),
    ]).then(([users, events, notices, contacts]) => {
      setStats({
        users: users.length,
        admins: users.filter((u) => u.role === "admin").length,
        events: events.length,
        notices: notices.length,
        contacts: contacts.length,
        latestNotice: notices[0] || null,
      });
    });
  }, []);

  if (!stats) {
    return (
      <div className="bg-white border-2 border-dotted border-[#141B34]/40 rounded-2xl p-6 text-lg text-[#141B34]/70">
        Loading admin panel...
      </div>
    );
  }

  const tiles = [
    { icon: Users, label: "Registered users", value: `${stats.users} (${stats.admins} admin)` },
    { icon: CalendarDays, label: "Schedule entries", value: stats.events },
    { icon: Megaphone, label: "Notices posted", value: stats.notices },
    { icon: Phone, label: "Help contacts", value: stats.contacts },
  ];

  return (
    <div className="bg-white border-2 border-dotted border-[#141B34]/40 rounded-2xl p-6">
      <h2 className="font-display text-2xl text-[#1B2A5B]">Admin monitor</h2>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#F4F7FC] rounded-lg p-4">
            <Icon size={22} className="text-[#4C7CF0]" />
            <p className="font-display text-3xl text-[#1B2A5B] mt-2">{value}</p>
            <p className="text-base text-[#141B34]/70">{label}</p>
          </div>
        ))}
      </div>
      {stats.latestNotice && (
        <p className="text-base text-[#141B34]/70 mt-4">
          Latest notice: <span className="font-bold text-[#1B2A5B]">{stats.latestNotice.title}</span>
        </p>
      )}
    </div>
  );
}