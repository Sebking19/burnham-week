import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { base44 } from "@/api/base44Client";
import { X, CheckCircle, XCircle } from "lucide-react";

export default function QRScanner({ eventId, onClose }) {
  const html5QrCodeRef = useRef(null);
  const isStoppedRef = useRef(false);
  const [result, setResult] = useState(null);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && !isStoppedRef.current) {
      isStoppedRef.current = true;
      try {
        const state = html5QrCodeRef.current.getState();
        // state 2 = SCANNING
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        // ignore cleanup errors
      }
    }
  }, []);

  const processCode = useCallback(async (decodedText) => {
    await stopScanner();
    try {
      const data = JSON.parse(decodedText);
      const { rsvpId, userName } = data;

      const rsvps = await base44.entities.RSVP.filter({ event_id: eventId });
      const rsvp = rsvps.find(r => r.id === rsvpId);

      if (!rsvp) {
        setResult({ success: false, name: userName || "Unknown", message: "Ticket not found for this event." });
      } else if (rsvp.checked_in) {
        setResult({ success: false, name: rsvp.user_name, message: "Already checked in." });
      } else {
        await base44.entities.RSVP.update(rsvpId, { ...rsvp, checked_in: true });
        setResult({ success: true, name: rsvp.user_name, message: "Checked in!" });
      }
    } catch (e) {
      setResult({ success: false, name: "", message: "Invalid QR code." });
    }
  }, [eventId, stopScanner]);

  const startScanner = useCallback(async () => {
    isStoppedRef.current = false;
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    let handled = false;
    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (handled) return;
          handled = true;
          processCode(decodedText);
        },
        () => {}
      );
    } catch (e) {
      console.error("QR scanner failed to start:", e);
    }
  }, [processCode]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleScanAgain = async () => {
    setResult(null);
    await startScanner();
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Scan Ticket</h2>
          <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" />
            <p className="text-white/40 text-xs text-center">Point camera at attendee's QR code</p>
          </div>
        ) : (
          <div className={`rounded-3xl border p-6 flex flex-col items-center gap-4 text-center ${
            result.success
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            {result.success
              ? <CheckCircle size={52} className="text-green-400" />
              : <XCircle size={52} className="text-red-400" />
            }
            <div>
              <p className={`text-lg font-bold ${result.success ? "text-green-300" : "text-red-300"}`}>
                {result.message}
              </p>
              {result.name && <p className="text-white/60 text-sm mt-1">{result.name}</p>}
            </div>
            <button
              onClick={handleScanAgain}
              className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-white/10 text-white border border-white/15 hover:bg-white/15 transition-all"
            >
              Scan Next
            </button>
            <button
              onClick={handleClose}
              className="w-full py-2 rounded-2xl text-sm font-semibold bg-transparent text-white/40 hover:text-white transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}