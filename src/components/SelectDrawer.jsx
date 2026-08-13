import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Universal bottom-sheet select — replaces ALL native <select> and Radix Select elements.
 * Works identically on mobile WebView and desktop.
 */
export default function SelectDrawer({ options, value, onValueChange, label, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  const handleSelect = (optValue) => {
    onValueChange(optValue);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-left text-sm focus:outline-none focus:border-white/25 flex items-center justify-between"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span className={value ? "text-white" : "text-white/40"}>{selectedLabel}</span>
        <ChevronDown size={15} className="text-white/40 shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[998]"
              onClick={() => setOpen(false)}
              style={{ touchAction: "none" }}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[999] bg-[#161616] border-t border-white/10 rounded-t-3xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)", willChange: "transform" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {label && (
                <div className="px-5 py-3 border-b border-white/8">
                  <p className="text-white/60 text-sm font-semibold">{label}</p>
                </div>
              )}

              <div className="overflow-y-auto max-h-[80vh] px-3 py-2">
                {options.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors text-left mb-1"
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      background: value === option.value ? "rgba(255,255,255,0.12)" : "transparent",
                    }}
                  >
                    <span className={`text-sm font-medium ${value === option.value ? "text-white" : "text-white/70"}`}>
                      {option.label}
                    </span>
                    {value === option.value && <Check size={16} className="text-green-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="px-4 pb-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-white/8 text-white/60 text-sm font-semibold"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}