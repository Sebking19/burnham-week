import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { fetchWithCache } from "@/lib/offlineCache";
import OfflineBanner from "@/components/OfflineBanner";
import { Plus, X, Trash2, Pencil, Megaphone, Pin, FileText, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { usePullToRefresh } from "@/components/PullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefresh";
import Tilt3D from "@/components/Tilt3D";

const CAN_POST_ROLES = ["admin", "owner", "viewer", "chairman", "pond_trainer", "river1_trainer", "river2_trainer", "race_trainer", "cadet_trainer", "fast_trainer"];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", requires_ack: false, attachments: [] });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [acks, setAcks] = useState([]);
  const [otterUsernames, setOtterUsernames] = useState({});

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.OtterUsername.list().then(records => {
        const map = {};
        records.forEach(r => { if (r.user_email) map[r.user_email] = r.username || ""; });
        setOtterUsernames(map);
      }).catch(() => {});
    }).catch(() => {});
    load();
  }, []);

  const [fromCache, setFromCache] = useState(false);

  const load = async () => {
    const { data, fromCache: cached } = await fetchWithCache(
      'announcements',
      () => base44.entities.Announcement.list("-created_date", 100)
    );
    if (data) setAnnouncements(data);
    setFromCache(cached);
    base44.entities.AnnouncementAck.list(null, 500).then(setAcks).catch(() => {});
  };

  const { pullY, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(load);

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const canPost = user && CAN_POST_ROLES.includes(user.role);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", content: "", requires_ack: false, attachments: [] });
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, requires_ack: a.requires_ack || false, attachments: a.attachments || [] });
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    setForm(f => ({ ...f, attachments: [...(f.attachments || []), ...uploaded] }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editing) {
      const updated = await base44.entities.Announcement.update(editing.id, { title: form.title, content: form.content, requires_ack: form.requires_ack || false, attachments: form.attachments || [] });
      setAnnouncements(prev => prev.map(a => a.id === editing.id ? { ...a, ...updated } : a));
    } else {
      const created = await base44.entities.Announcement.create({
        title: form.title,
        content: form.content,
        requires_ack: form.requires_ack || false,
        attachments: form.attachments || [],
        author_name: otterUsernames[user?.email] || user?.full_name || "Staff",
      });
      setAnnouncements(prev => [created, ...prev]);
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Announcement.delete(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const canEdit = (a) => isAdmin || a.created_by === user?.email;

  const togglePin = async (a) => {
    const updated = await base44.entities.Announcement.update(a.id, { pinned: !a.pinned });
    setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, ...updated } : x));
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => (b.pinned === true) - (a.pinned === true));

  const handleAck = async (a) => {
    if (!user) return;
    const created = await base44.entities.AnnouncementAck.create({
      announcement_id: a.id,
      user_email: user.email,
      user_name: otterUsernames[user.email] || user.full_name || user.email,
    });
    setAcks(prev => [...prev, created]);
  };

  return (
    <div className="py-2" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <OfflineBanner />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Announcements</h1>
          <p className="text-cyan-200/40 text-sm mt-0.5">Club-wide updates</p>
        </div>
        {canPost && (
          <button
            onClick={openNew}
            aria-label="New announcement"
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/40 hover:opacity-90 active:scale-95 flex items-center justify-center transition-all duration-200 text-white"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {sortedAnnouncements.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
            <Tilt3D max={5}>
            <div className={`bg-slate-900/50 border rounded-3xl p-5 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-200 cursor-default ${a.pinned ? "border-amber-400/40" : "border-white/10"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/30 shrink-0 animate-gentle-sway"><Megaphone size={13} className="text-white" /></span>
                    <span className="font-bold text-white text-sm">{a.title}</span>
                    {a.pinned && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-300 bg-amber-500/15 border border-amber-400/40 px-1.5 py-0.5 rounded-md">
                        <Pin size={9} /> Pinned
                      </span>
                    )}
                    {Date.now() - new Date(a.created_date).getTime() < 48 * 3600 * 1000 && (
                      <span className="text-[9px] font-black uppercase text-cyan-300 bg-cyan-500/15 border border-cyan-400/40 px-1.5 py-0.5 rounded-md">New</span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>
                  {(a.attachments || []).length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-3">
                      {a.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/30 px-3 py-2 rounded-xl hover:bg-cyan-500/20 transition-colors w-fit max-w-full"
                        >
                          <FileText size={13} className="shrink-0" />
                          <span className="truncate">{att.name || "Attachment"}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-white/30 text-xs">{a.author_name || "Staff"}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/30 text-xs">
                      {formatDistanceToNow(new Date(a.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  {a.requires_ack && (() => {
                    const aAcks = acks.filter(x => x.announcement_id === a.id);
                    const mine = user && aAcks.some(x => x.user_email === user.email);
                    return (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        {mine ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-300 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-xl">✓ Acknowledged</span>
                        ) : (
                          <button
                            onClick={() => handleAck(a)}
                            className="text-xs font-bold text-slate-900 bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-1.5 rounded-xl shadow-lg shadow-cyan-500/30 hover:opacity-90 transition-all"
                          >
                            Got it 👍
                          </button>
                        )}
                        {canPost && (
                          <span className="text-xs text-white/40" title={aAcks.map(x => x.user_name || x.user_email).join(", ")}>
                            {aAcks.length} acknowledged
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {canEdit(a) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && (
                      <button aria-label={a.pinned ? "Unpin announcement" : "Pin announcement"} onClick={() => togglePin(a)} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors ${a.pinned ? "text-amber-300" : "text-white/20 hover:text-amber-300"}`}>
                        <Pin size={14} />
                      </button>
                    )}
                    <button aria-label="Edit announcement" onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors">
                      <Pencil size={14} />
                    </button>
                    {isAdmin && (
                      <button aria-label="Delete announcement" onClick={() => handleDelete(a.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            </Tilt3D>
            </motion.div>
          ))}
        </AnimatePresence>
        {announcements.length === 0 && (
          <p className="text-center text-white/20 text-sm py-12">No announcements yet.</p>
        )}
      </div>

      {createPortal(
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-[#161616] border-t border-white/10 rounded-t-3xl p-6 w-full max-w-lg"
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{editing ? "Edit Announcement" : "New Announcement"}</h2>
                <button aria-label="Close form" onClick={() => setShowForm(false)} className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/25"
                  placeholder="Title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/25 resize-none"
                  placeholder="Announcement details..."
                  rows={4}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                />
                <label className="flex items-center gap-2.5 text-sm text-white/70 cursor-pointer px-1 py-1">
                  <input
                    type="checkbox"
                    checked={form.requires_ack || false}
                    onChange={e => setForm({ ...form, requires_ack: e.target.checked })}
                    className="w-4 h-4 accent-cyan-400"
                  />
                  Require members to acknowledge ("Got it")
                </label>
                {/* PDF attachments */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {(form.attachments || []).length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {form.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <FileText size={13} className="text-cyan-300 shrink-0" />
                        <span className="text-xs text-white/70 truncate flex-1">{att.name}</span>
                        <button
                          aria-label={`Remove ${att.name}`}
                          onClick={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, idx) => idx !== i) }))}
                          className="text-white/30 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 text-white/60 hover:text-white hover:border-cyan-400/40 font-semibold py-3 rounded-2xl transition-all text-sm disabled:opacity-50"
                >
                  <Paperclip size={14} />
                  {uploading ? "Uploading..." : "Attach PDF"}
                </button>
                <button
                  onClick={handleSave}
                  className="w-full bg-white text-black font-bold py-3 rounded-2xl hover:bg-white/90 transition-all text-sm"
                >
                  {editing ? "Save Changes" : "Post Announcement"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}