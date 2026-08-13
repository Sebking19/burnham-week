import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import NoticeComposer from "@/components/notices/NoticeComposer";

export default function Notices() {
  const [notices, setNotices] = useState(null);
  const [user, setUser] = useState(null);

  const load = () => base44.entities.Announcement.list("-created_date").then(setNotices);

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user && (user.role === "admin" || user.role === "owner");

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    await base44.entities.Announcement.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-[#1B2A5B]">Notices</h1>
        <p className="text-lg text-slate-600 mt-1">Announcements from the organisers</p>
      </div>

      {isAdmin && <NoticeComposer user={user} onPosted={load} />}

      {notices === null ? (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 flex items-center gap-3 text-lg text-slate-600">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-[#1B2A5B] rounded-full animate-spin" />
          Loading notices...
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-lg text-slate-600 text-center">
          No notices yet. Check back soon.
        </div>
      ) : (
        notices.map(n => (
          <div key={n.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold text-[#1B2A5B]">{n.title}</h2>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(n.id)}
                  aria-label="Delete notice"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                >
                  <Trash2 size={22} />
                </button>
              )}
            </div>
            <p className="text-lg whitespace-pre-wrap mt-2">{n.content}</p>
            <p className="text-base text-slate-500 mt-3">
              {n.author_name ? `${n.author_name} · ` : ""}{format(new Date(n.created_date), "EEEE d MMMM, HH:mm")}
            </p>
          </div>
        ))
      )}
    </div>
  );
}