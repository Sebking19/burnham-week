import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function HelpContactForm({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    await base44.entities.HelpContact.create({ name, role, phone });
    setSaving(false);
    setName(""); setRole(""); setPhone("");
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-[#4C7CF0] text-white text-lg font-bold py-3.5 rounded-lg hover:bg-[#3E6BDB]"
      >
        Add a contact
      </button>
    );
  }

  const field = "w-full text-lg border-2 border-[#141B34]/20 dark:border-white/10 bg-white dark:bg-[#121212] text-slate-900 dark:text-white rounded-lg px-4 py-3";

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-5 space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={field} />
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. App support)" className={field} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={field} />
      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="flex-1 bg-[#4C7CF0] text-white text-lg font-bold py-3 rounded-lg disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setOpen(false)} className="px-6 text-lg font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">Cancel</button>
      </div>
    </div>
  );
}