import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteAccountDialog({ user }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await base44.entities.User.delete(user.id);
      await base44.auth.logout();
    } catch {
      setDeleting(false);
      setError("We could not delete your account automatically. Please contact an organiser on the Help page.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-300 text-red-700 text-xl font-bold py-4 rounded-2xl hover:bg-red-50"
      >
        <Trash2 size={24} /> Delete my account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => !deleting && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={28} className="text-red-600 shrink-0" />
              <h2 className="text-2xl font-bold text-[#0E2A4E]">Delete your account?</h2>
            </div>
            <p className="text-lg text-slate-700 mt-3">
              This permanently removes your account and profile details from the Burnham Week app.
              It cannot be undone. You can sign up again at any time.
            </p>
            {error && <p className="text-lg text-red-700 mt-3">{error}</p>}
            <div className="flex flex-col gap-3 mt-5">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full bg-red-600 text-white text-xl font-bold py-4 rounded-2xl disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="w-full border-2 border-slate-300 text-slate-700 text-xl font-bold py-4 rounded-2xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}