import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Gem, Plus, Sparkles } from "lucide-react";
import SponsorCard from "@/components/sponsors/SponsorCard";
import SponsorForm from "@/components/sponsors/SponsorForm";

const ADMIN_ROLES = ["owner", "admin", "admiral", "chairman"];

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const canEdit = user && ADMIN_ROLES.includes(user.role);

  const load = async () => {
    const records = await base44.entities.Sponsor.list();
    setSponsors(records.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    load();
  }, []);

  const handleDelete = async (sponsor) => {
    if (!confirm(`Delete ${sponsor.name}?`)) return;
    await base44.entities.Sponsor.delete(sponsor.id);
    load();
  };

  const visible = sponsors.filter(s => s.active !== false || canEdit);

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Big bold hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 shadow-2xl shadow-purple-600/30 p-8 text-center"
        style={{ perspective: "800px" }}
      >
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-cyan-300/25 blur-3xl" aria-hidden="true" />
        <motion.div
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <Gem size={30} className="text-white" />
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">Our Sponsors</h1>
        <p className="text-white/80 text-sm font-semibold mt-2 flex items-center justify-center gap-1.5">
          <Sparkles size={14} /> The amazing supporters behind the Otters <Sparkles size={14} />
        </p>
      </motion.div>

      {canEdit && (
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/30"
        >
          <Plus size={16} /> Add Sponsor
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.04] border border-white/10 rounded-3xl">
          <Gem size={36} className="text-white/20 mx-auto mb-3 animate-gentle-drift" />
          <p className="text-white/50 font-bold">No sponsors yet</p>
          {canEdit && <p className="text-white/30 text-xs mt-1">Tap "Add Sponsor" to feature your first one!</p>}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {visible.map(sponsor => (
            <div key={sponsor.id} className={sponsor.active === false ? "opacity-50" : ""}>
              <SponsorCard
                sponsor={sponsor}
                canEdit={canEdit}
                onEdit={(s) => { setEditing(s); setShowForm(true); }}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SponsorForm
          sponsor={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}