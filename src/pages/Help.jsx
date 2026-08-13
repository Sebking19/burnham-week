import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, Trash2 } from "lucide-react";
import HelpContactForm from "@/components/help/HelpContactForm";

export default function Help() {
  const [contacts, setContacts] = useState(null);
  const [user, setUser] = useState(null);

  const load = () => base44.entities.HelpContact.list("order").then(setContacts);

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user && (user.role === "admin" || user.role === "owner");

  const remove = async (id) => {
    if (!window.confirm("Remove this contact?")) return;
    await base44.entities.HelpContact.delete(id);
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#1B2A5B] dark:text-[#8FAEF7]">Help</h1>
        <p className="text-lg text-[#141B34]/70 mt-1">Who to call if you need a hand with the app or the week</p>
      </div>

      {contacts === null ? (
        <p className="text-lg text-[#141B34]/70 dark:text-white/70">Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6 text-lg text-[#141B34]/70 dark:text-white/70">
          No contacts added yet.
        </div>
      ) : (
        contacts.map((c) => (
          <div key={c.id} className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xl font-bold text-[#1B2A5B] dark:text-[#8FAEF7]">{c.name}</p>
              {c.role && <p className="text-lg text-[#141B34]/70 dark:text-white/70">{c.role}</p>}
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 mt-3 bg-[#4C7CF0] text-white text-lg font-bold px-5 py-2.5 rounded-lg hover:bg-[#3E6BDB]">
                <Phone size={20} /> {c.phone}
              </a>
            </div>
            {isAdmin && (
              <button onClick={() => remove(c.id)} aria-label="Remove contact" className="p-2 rounded-lg text-[#141B34]/40 hover:text-red-600 hover:bg-red-50">
                <Trash2 size={22} />
              </button>
            )}
          </div>
        ))
      )}

      {isAdmin && <HelpContactForm onSaved={load} />}

      <div className="bg-white dark:bg-[#1A1A1A] border-2 border-dotted border-[#141B34]/40 dark:border-white/10 rounded-2xl p-6">
        <h2 className="font-display text-2xl text-[#1B2A5B] dark:text-[#8FAEF7]">On the water</h2>
        <p className="text-lg text-[#141B34]/85 dark:text-white/85 mt-2">
          In an emergency afloat, call the Coastguard on 999 and ask for the Coastguard. Follow the
          Emergency Procedures and Competitor Safety Plan on the Information page.
        </p>
      </div>
    </div>
  );
}