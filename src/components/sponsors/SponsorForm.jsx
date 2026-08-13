import { useState } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, Upload, Plus, Trash2, Loader2 } from "lucide-react";

const COLORS = ["#22d3ee", "#38bdf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#f97316"];

const inputCls = "w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none";

export default function SponsorForm({ sponsor, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: sponsor?.name || "",
    description: sponsor?.description || "",
    logo_url: sponsor?.logo_url || "",
    photos: sponsor?.photos || [],
    website: sponsor?.website || "",
    links: sponsor?.links || [],
    place: sponsor?.place || "",
    accent_color: sponsor?.accent_color || "#22d3ee",
    sort_order: sponsor?.sort_order ?? 0,
    active: sponsor?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const uploadImage = async (file, target) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (target === "logo") set("logo_url", file_url);
    else setForm(f => ({ ...f, photos: [...f.photos, file_url] }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (sponsor?.id) await base44.entities.Sponsor.update(sponsor.id, form);
    else await base44.entities.Sponsor.create(form);
    setSaving(false);
    onSaved();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-slate-900 border border-cyan-400/25 rounded-t-3xl sm:rounded-3xl max-h-[85dvh] flex flex-col p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white">{sponsor ? "Edit Sponsor" : "Add Sponsor"}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pb-2">
          <input className={inputCls} placeholder="Sponsor name *" value={form.name} onChange={e => set("name", e.target.value)} />
          <textarea className={inputCls} rows={3} placeholder="Description" value={form.description} onChange={e => set("description", e.target.value)} />
          <input className={inputCls} placeholder="Place / location (e.g. Burnham-on-Crouch)" value={form.place} onChange={e => set("place", e.target.value)} />
          <input className={inputCls} placeholder="Website URL (https://...)" value={form.website} onChange={e => set("website", e.target.value)} />

          {/* Logo / main photo */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Main Photo / Logo</p>
            <div className="flex items-center gap-3">
              {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-white/15" />}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white/70 text-xs font-bold cursor-pointer hover:bg-white/15">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {form.logo_url ? "Replace" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], "logo")} />
              </label>
              {form.logo_url && <button onClick={() => set("logo_url", "")} className="text-red-300 text-xs font-semibold">Remove</button>}
            </div>
          </div>

          {/* Extra photos */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Extra Photos</p>
            <div className="flex flex-wrap gap-2">
              {form.photos.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-14 h-14 rounded-xl object-cover border border-white/15" />
                  <button onClick={() => set("photos", form.photos.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label className="w-14 h-14 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 cursor-pointer hover:border-cyan-400/40 hover:text-cyan-300">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], "photo")} />
              </label>
            </div>
          </div>

          {/* Extra links */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Extra Links (pages, socials...)</p>
            <div className="space-y-2">
              {form.links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inputCls} !w-1/3`} placeholder="Label" value={link.label || ""} onChange={e => set("links", form.links.map((l, j) => j === i ? { ...l, label: e.target.value } : l))} />
                  <input className={inputCls} placeholder="https://..." value={link.url || ""} onChange={e => set("links", form.links.map((l, j) => j === i ? { ...l, url: e.target.value } : l))} />
                  <button onClick={() => set("links", form.links.filter((_, j) => j !== i))} aria-label="Remove link" className="shrink-0 w-10 rounded-xl bg-red-500/15 text-red-300 flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => set("links", [...form.links, { label: "", url: "" }])} className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                <Plus size={12} /> Add link
              </button>
            </div>
          </div>

          {/* Accent colour */}
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Accent Colour</p>
            <div className="flex flex-wrap gap-2 items-center">
              {COLORS.map(c => (
                <button key={c} onClick={() => set("accent_color", c)} aria-label={`Colour ${c}`} className={`w-8 h-8 rounded-full border-2 transition-transform ${form.accent_color === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
              ))}
              <input type="color" value={form.accent_color} onChange={e => set("accent_color", e.target.value)} aria-label="Custom colour" className="w-8 h-8 rounded-full bg-transparent border border-white/20 cursor-pointer" />
            </div>
          </div>

          {/* Order + visibility */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Display Order</p>
              <input type="number" className={inputCls} value={form.sort_order} onChange={e => set("sort_order", Number(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} className="w-4 h-4 accent-cyan-500" />
              <span className="text-white/70 text-sm font-semibold">Visible</span>
            </label>
          </div>

        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="w-full shrink-0 mt-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/30"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          {saving ? "Saving..." : sponsor ? "Save Changes" : "Add Sponsor"}
        </button>
      </motion.div>
    </div>,
    document.body
  );
}