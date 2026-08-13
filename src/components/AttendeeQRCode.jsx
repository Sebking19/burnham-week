import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AttendeeQRCode({ rsvpId, userName, eventTitle, guests = [], onClose }) {
  // tickets[0] = user themselves, tickets[1+] = guests
  const tickets = [
    { rsvpId, userName },
    ...guests.map(g => ({ rsvpId: g.id, userName: g.user_name }))
  ];

  const [index, setIndex] = useState(0);
  const current = tickets[index];
  const qrData = JSON.stringify({ rsvpId: current.rsvpId, userName: current.userName, eventTitle });

  return (
    <div role="dialog" aria-modal="true" aria-label="Ticket QR code" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#161616] border border-white/10 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-lg text-center">
          {tickets.length > 1 ? `Ticket ${index + 1} of ${tickets.length}` : "Your Ticket"}
        </h2>
        <p className="text-white/50 text-xs text-center">{eventTitle}</p>

        <div className="bg-white rounded-2xl p-4">
          <QRCodeSVG value={qrData} size={180} />
        </div>

        <div className="text-center">
          <p className="text-white font-semibold text-sm">{current.userName}</p>
          <p className="text-white/40 text-xs mt-0.5">Show this at the event</p>
        </div>

        {tickets.length > 1 && (
          <div className="flex items-center gap-3 w-full">
            <button
              aria-label="Previous ticket"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white/30 text-xs">{index + 1} / {tickets.length}</span>
            <button
              aria-label="Next ticket"
              onClick={() => setIndex(i => Math.min(tickets.length - 1, i + 1))}
              disabled={index === tickets.length - 1}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10 hover:bg-white/15 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}