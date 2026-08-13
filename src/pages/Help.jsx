import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, Pencil, Check, X } from "lucide-react";

export default function Help() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null); // { id, name, phone, role }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const data = await base44.entities.HelpContact.list("order", 10);
    setContacts(data);
    setLoading(false);
  };

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const startEdit = (contact) => {
    setEditing({ ...contact });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (editing.id) {
      await base44.entities.HelpContact.update(editing.id, {
        name: editing.name,
        phone: editing.phone,
        role: editing.role,
      });
    } else {
      await base44.entities.HelpContact.create({
        name: editing.name,
        phone: editing.phone,
        role: editing.role,
        order: contacts.length,
      });
    }
    setEditing(null);
    loadContacts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>Help</h1>
        <p className="text-cyan-200/40 text-sm mt-1">Get in touch with the club</p>
      </div>

      <div className="space-y-3">
        {contacts.map(contact => (
          <div key={contact.id} className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-200">
            {editing?.id === contact.id ? (
              <div className="flex-1 space-y-2">
                <input
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/40"
                  value={editing.name}
                  onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                  placeholder="Name"
                />
                <input
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/40"
                  value={editing.role || ""}
                  onChange={e => setEditing(p => ({ ...p, role: e.target.value }))}
                  placeholder="Role (e.g. Club Captain)"
                />
                <input
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/40"
                  value={editing.phone}
                  onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone number"
                />
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-semibold">
                    <Check size={12} /> Save
                  </button>
                  <button onClick={() => setEditing(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 border border-white/20 text-xs font-semibold">
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-md shadow-cyan-500/30 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">{contact.name}</p>
                    {contact.role && <p className="text-white/40 text-xs">{contact.role}</p>}
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-blue-300 text-sm font-mono hover:text-blue-200 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
                {isAdmin && (
                  <button aria-label={`Edit ${contact.name}`} onClick={() => startEdit(contact)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-all">
                    <Pencil size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {contacts.length === 0 && !isAdmin && (
          <div className="text-center py-12 text-white/30 text-sm">
            <Phone size={36} className="mx-auto mb-3 opacity-30" />
            No contacts added yet.
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => setEditing({ name: "", phone: "", role: "" })}
            className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-white/40 text-sm hover:border-white/30 hover:text-white/60 transition-all"
          >
            + Add Contact
          </button>
        )}

        {editing && !editing.id && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/40"
              value={editing.name}
              onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
              placeholder="Name"
            />
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/40"
              value={editing.role || ""}
              onChange={e => setEditing(p => ({ ...p, role: e.target.value }))}
              placeholder="Role (e.g. Club Captain)"
            />
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-white/40"
              value={editing.phone}
              onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))}
              placeholder="Phone number"
            />
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-semibold">
                <Check size={12} /> Save
              </button>
              <button onClick={() => setEditing(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 border border-white/20 text-xs font-semibold">
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}