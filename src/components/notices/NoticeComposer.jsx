import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Megaphone } from "lucide-react";

export default function NoticeComposer({ user, onPosted }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const post = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await base44.entities.Announcement.create({
      title: title.trim(),
      content: content.trim(),
      author_name: user?.full_name || "",
    });
    setTitle("");
    setContent("");
    setOpen(false);
    setSaving(false);
    onPosted();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#0E2A4E] text-white text-lg font-bold py-4 rounded-2xl hover:bg-[#173B6B]"
      >
        <Megaphone size={22} /> Post a notice
      </button>
    );
  }

  return (
    <div className="bg-white border-2 border-[#0E2A4E] rounded-2xl p-5 space-y-3">
      <h2 className="text-xl font-bold text-[#0E2A4E]">New notice</h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-lg border-2 border-slate-300 rounded-xl px-4 py-3 focus:border-[#0E2A4E] outline-none"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write your notice here..."
        rows={4}
        className="w-full text-lg border-2 border-slate-300 rounded-xl px-4 py-3 focus:border-[#0E2A4E] outline-none"
      />
      <div className="flex gap-3">
        <button
          onClick={post}
          disabled={saving || !title.trim() || !content.trim()}
          className="flex-1 bg-[#0E2A4E] text-white text-lg font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {saving ? "Posting..." : "Post notice"}
        </button>
        <button onClick={() => setOpen(false)} className="flex-1 border-2 border-slate-300 text-lg font-bold py-3 rounded-xl text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
}