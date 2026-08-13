import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload } from "lucide-react";
import { compressGLB } from "@/utils/glbCompress";


const EMOJI_PRESETS = ["🏆","🥇","🥈","🥉","🎖️","⭐","🌟","💫","🎯","🏅","🌊","⛵","🚤","🎪","🔱","🦦","🐟","🌀","💪","🔥","❄️","🌈","👑","🎗️","🏴"];
const COLORS = ["#f59e0b","#3b82f6","#10b981","#8b5cf6","#ef4444","#06b6d4","#f97316","#ec4899","#84cc16","#6366f1"];

export default function CreateBadgeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", emoji: "🏆", category: "trophy", color: "#f59e0b" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [modelName, setModelName] = useState(null);
  const [compressionInfo, setCompressionInfo] = useState(null);

  const handleModelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setCompressionInfo(null);
    try {
      const { file: compressedBlob, originalSize, compressedSize, compressionRatio } = await compressGLB(file);
      setCompressionInfo({ originalSize, compressedSize, compressionRatio });
      
      // Create File object from blob
      const fileName = file.name.replace(/\.[^.]+$/, '.glb');
      const compressedFile = new File([compressedBlob], fileName, { type: 'model/gltf-binary' });
      
      // Upload with 30s timeout
      const uploadPromise = base44.integrations.Core.UploadFile({ file: compressedFile });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout - please try again')), 30000)
      );
      
      const { file_url } = await Promise.race([uploadPromise, timeoutPromise]);
      setModelUrl(file_url);
      setModelName(file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
      setModelUrl(null);
      setModelName(null);
      setCompressionInfo(null);
    }
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    await base44.entities.Badge.create({ ...form, ...(modelUrl ? { model_url: modelUrl } : {}) });
    setSaving(false);
    onCreated?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-[#161616] border border-white/10 rounded-3xl p-4 w-full max-w-sm max-h-[82vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">New Trophy / Badge</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        {/* Emoji picker */}
        <p className="text-white/40 text-xs font-semibold mb-1.5">Choose Icon</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EMOJI_PRESETS.map(e => (
            <button
              key={e}
              onClick={() => setForm(f => ({ ...f, emoji: e }))}
              className={`text-lg w-8 h-8 rounded-xl flex items-center justify-center transition-all ${form.emoji === e ? "bg-white/20 border border-white/40" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
            >
              {e}
            </button>
          ))}
          <input
            type="text"
            placeholder="✏️"
            maxLength={2}
            value={EMOJI_PRESETS.includes(form.emoji) ? "" : form.emoji}
            onChange={e => setForm(f => ({ ...f, emoji: e.target.value || "🏆" }))}
            className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl text-center text-white text-sm focus:outline-none"
          />
        </div>

        {/* 3D Model Upload */}
        <div className="mb-3">
          <p className="text-white/40 text-xs font-semibold mb-2">3D Model (optional · .glb)</p>
          <label className={`flex items-center gap-3 w-full bg-white/5 border border-dashed rounded-xl px-4 py-3 cursor-pointer hover:bg-white/10 transition-all ${modelUrl ? "border-green-500/40" : "border-white/15"}`}>
            <Upload size={15} className={modelUrl ? "text-green-400" : "text-white/30"} />
            <span className="text-sm truncate flex-1" style={{ color: modelUrl ? "#86efac" : "rgba(255,255,255,0.3)" }}>
              {uploading ? "Compressing & uploading…" : modelUrl ? modelName : "Upload .glb file"}
            </span>
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} />
          </label>
          {compressionInfo && (
            <p className="text-white/40 text-[10px] mt-1 ml-1">
              ✓ Compressed {(compressionInfo.originalSize / 1024 / 1024).toFixed(1)}MB → {(compressionInfo.compressedSize / 1024 / 1024).toFixed(1)}MB ({compressionInfo.compressionRatio}% reduction)
            </p>
          )}
          {modelUrl && !compressionInfo && <p className="text-white/25 text-[10px] mt-1 ml-1">✓ Model uploaded — rotate with mouse to inspect</p>}
        </div>

        <div className="space-y-3">
          <input
            placeholder="Trophy / Badge name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none resize-none"
          />
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
          >
            <option value="trophy">🏆 Trophy</option>
            <option value="badge">🎖️ Badge</option>
            <option value="medal">🥇 Medal</option>
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving || !form.name}
          className="w-full mt-4 py-3 rounded-2xl bg-white text-black font-bold text-sm disabled:opacity-40 hover:bg-white/90 transition-all"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </motion.div>
    </motion.div>
  );
}