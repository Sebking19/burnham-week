import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Bell, BellOff, UserPlus, CreditCard, Loader2, QrCode, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import AttendeeQRCode from "@/components/AttendeeQRCode";
import QRScanner from "@/components/QRScanner";

export default function EventRSVP({ eventId, user, event }) {
  const [rsvps, setRsvps] = useState([]);
  const [userRsvp, setUserRsvp] = useState(null);
  const [hasReminder, setHasReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optimisticStatus, setOptimisticStatus] = useState(null);
  const [optimisticReminder, setOptimisticReminder] = useState(false);
  const [otterUsername, setOtterUsername] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const canViewResponses = user?.role === "owner" || user?.role === "admin";

  useEffect(() => {
    loadRsvpData();
    if (user?.email) loadOtterUsername();
  }, [eventId, user]);

  // On return from Stripe, mark RSVP as paid
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1" && params.get("eventId") === eventId && user?.email) {
      // Remove params from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      url.searchParams.delete("eventId");
      window.history.replaceState({}, "", url.toString());

      // Mark this user's RSVP and their guests as paid
      base44.entities.RSVP.filter({ event_id: eventId }).then(allRsvps => {
        const hostRsvp = allRsvps.find(r => r.user_email === user.email);
        const guestRsvps = allRsvps.filter(r => r.user_email?.startsWith("guest_") && r.created_by === user.email);
        const toMark = [...(hostRsvp ? [hostRsvp] : []), ...guestRsvps];
        Promise.all(toMark.map(r => base44.entities.RSVP.update(r.id, { ...r, paid: true }))).then(loadRsvpData);
      });
    }
  }, [user, eventId]);

  const loadOtterUsername = async () => {
    const records = await base44.entities.OtterUsername.filter({ user_email: user.email });
    if (records.length > 0) setOtterUsername(records[0].username);
  };

  const loadRsvpData = async () => {
    setLoading(true);
    const eventRsvps = await base44.entities.RSVP.filter({ event_id: eventId });
    setRsvps(eventRsvps);

    if (user?.email) {
      const userRsvpData = eventRsvps.find(r => r.user_email === user.email);
      setUserRsvp(userRsvpData || null);

      const reminder = await base44.entities.EventReminder.filter(
        { event_id: eventId, user_email: user.email }
      );
      setHasReminder(reminder.length > 0);
    }
    setLoading(false);
  };

  const handleRsvp = async (status) => {
    if (!user?.email) return;
    setOptimisticStatus(status);
    const displayName = otterUsername || user.full_name || user.email;
    const bookingRef = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (userRsvp) {
      await base44.entities.RSVP.update(userRsvp.id, { status, quantity });
    } else {
      await base44.entities.RSVP.create({
        event_id: eventId,
        user_email: user.email,
        status,
        user_name: displayName,
        quantity,
        booking_reference: bookingRef,
      });
    }
    // Update all guests to match the host's status
    const guests = rsvps.filter(r => r.user_email?.startsWith("guest_") && r.created_by === user.email);
    await Promise.all(guests.map(g => base44.entities.RSVP.update(g.id, { status })));
    loadRsvpData();
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) return;
    const currentStatus = optimisticStatus || userRsvp?.status || "attending";
    await base44.entities.RSVP.create({
      event_id: eventId,
      user_email: `guest_${Date.now()}@guest`,
      status: currentStatus,
      user_name: `${guestName.trim()} (guest)`,
    });
    setGuestName("");
    setShowGuestInput(false);
    loadRsvpData();
  };

  const handlePay = async () => {
    setPaymentLoading(true);
    try {
      const currentUrl = window.location.href;
      const response = await base44.functions.invoke('createStripeCheckout', {
        eventId,
        eventTitle: event?.title,
        totalAmount: totalDue,
        attendeeCount: attendingCount,
        successUrl: currentUrl,
        cancelUrl: currentUrl,
      });
      if (response.data?.url) {
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
          window.open(response.data.url, '_blank');
        } else {
          window.location.href = response.data.url;
        }
      } else {
        alert("Failed to start payment. Please try again.");
      }
    } catch (err) {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        alert("Payments don't work in the preview. Please open the published app to pay.");
      } else {
        alert("Failed to start payment: " + (err?.message || "Unknown error"));
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReminder = async () => {
    if (!user?.email) return;
    setOptimisticReminder(!optimisticReminder);
    if (hasReminder || optimisticReminder) {
      const reminders = await base44.entities.EventReminder.filter(
        { event_id: eventId, user_email: user.email }
      );
      if (reminders.length > 0) await base44.entities.EventReminder.delete(reminders[0].id);
    } else {
      await base44.entities.EventReminder.create({ event_id: eventId, user_email: user.email });
    }
    setHasReminder(!hasReminder);
  };

  const attending = rsvps.filter(r => r.status === "attending");
  const notAttending = rsvps.filter(r => r.status === "not_attending");
  const maybe = rsvps.filter(r => r.status === "maybe");

  // Count guests added by this user (guest emails tied to created_by)
  const userGuests = rsvps.filter(r => r.user_email?.startsWith("guest_") && r.created_by === user?.email);
  const paymentEnabled = event?.payment_enabled && event?.payment_amount > 0;
  const pricePerPerson = event?.payment_amount || 0;
  const isAttending = optimisticStatus === "attending" || (!optimisticStatus && userRsvp?.status === "attending");
  const attendingCount = isAttending ? (userRsvp?.quantity || quantity) + userGuests.length : 0;
  const totalDue = attendingCount * pricePerPerson;

  if (loading) return <div className="text-white/40 text-xs">Loading...</div>;

  const displayName = otterUsername || user?.full_name || user?.email;

  return (
    <div className="space-y-3">
      {/* QR modals */}
      {showQR && userRsvp && (
        <AttendeeQRCode
          rsvpId={userRsvp.id}
          userName={displayName}
          eventTitle={event?.title}
          guests={userGuests}
          onClose={() => setShowQR(false)}
        />
      )}
      {showScanner && (
        <QRScanner eventId={eventId} onClose={() => { setShowScanner(false); loadRsvpData(); }} />
      )}
      {/* Quantity Selector */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <label className="block text-xs text-white/50 font-semibold mb-2">Number of Spots</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-2 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-all text-sm"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={e => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-center text-sm"
          />
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            className="px-2 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-all text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* RSVP Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleRsvp("attending")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            (optimisticStatus === "attending" || (!optimisticStatus && userRsvp?.status === "attending"))
              ? "bg-green-500/30 text-green-300 border border-green-500/50"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          ✓ Attending
        </button>
        <button
          onClick={() => handleRsvp("maybe")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            (optimisticStatus === "maybe" || (!optimisticStatus && userRsvp?.status === "maybe"))
              ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          ? Maybe
        </button>
        <button
          onClick={() => handleRsvp("not_attending")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            (optimisticStatus === "not_attending" || (!optimisticStatus && userRsvp?.status === "not_attending"))
              ? "bg-red-500/30 text-red-300 border border-red-500/50"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          ✗ Can't Attend
        </button>
      </div>

      {/* Payment summary */}
      {paymentEnabled && isAttending && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-3 text-sm space-y-1">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-1">Booking Summary</p>
          {/* Self */}
          <div className="flex justify-between text-white/70">
            <span>{otterUsername || user?.full_name || "You"} {quantity > 1 ? `(×${quantity})` : ""}</span>
            <span>£{(pricePerPerson * quantity).toFixed(2)}</span>
          </div>
          {/* Guests */}
          {userGuests.map(g => (
            <div key={g.id} className="flex justify-between text-white/50 text-xs">
              <span>{g.user_name}</span>
              <span>£{pricePerPerson.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-yellow-300 pt-1.5 border-t border-yellow-500/20 mt-1">
            <span>Total ({attendingCount} {attendingCount === 1 ? "person" : "people"})</span>
            <span>£{totalDue.toFixed(2)}</span>
          </div>

          {!confirmed ? (
            <button
              onClick={() => setConfirmed(true)}
              className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all"
            >
              Confirm &amp; Proceed to Payment
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              <p className="text-[11px] text-white/50 text-center">Ready to pay £{totalDue.toFixed(2)} for {attendingCount} {attendingCount === 1 ? "person" : "people"}?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmed(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handlePay}
                  disabled={paymentLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <><Loader2 size={12} className="animate-spin" /> Processing...</>
                  ) : (
                    <><CreditCard size={12} /> Pay £{totalDue.toFixed(2)}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Guest */}
      {!showGuestInput ? (
        <button
          onClick={() => setShowGuestInput(true)}
          className="w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
        >
          <UserPlus size={12} />
          Add a Guest
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddGuest()}
            placeholder="Guest name..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            autoFocus
          />
          <button
            onClick={handleAddGuest}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all"
          >
            Add
          </button>
          <button
            onClick={() => { setShowGuestInput(false); setGuestName(""); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      {/* QR Ticket button — only show if paid (or free event) */}
      {isAttending && userRsvp && (!paymentEnabled || userRsvp.paid) && (
        <button
          onClick={() => setShowQR(true)}
          className="w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30"
        >
          <QrCode size={12} />
          My Ticket QR Code
        </button>
      )}
      {isAttending && userRsvp && paymentEnabled && !userRsvp.paid && (
        <p className="text-center text-xs text-yellow-300/60">Complete payment to unlock your QR ticket</p>
      )}

      {/* Scanner button for admins/owners */}
      {canViewResponses && (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30"
        >
          <ScanLine size={12} />
          Scan Attendee Tickets
        </button>
      )}

      {/* Reminder Button */}
      <button
        onClick={handleReminder}
        className={`w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border ${
          (hasReminder || optimisticReminder)
            ? "bg-blue-500/30 text-blue-300 border-blue-500/50"
            : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
        }`}
      >
        {(hasReminder || optimisticReminder) ? (
          <><Bell size={12} /> Reminder Set (1 hour before)</>
        ) : (
          <><BellOff size={12} /> Set Reminder</>
        )}
      </button>

      {/* Attendee List - Only visible to owner/admin */}
      {canViewResponses && (attending.length > 0 || maybe.length > 0 || notAttending.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/50 text-xs font-semibold">
            <Users size={12} />
            Total: {rsvps.length}
          </div>

          {attending.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.33, 0.66, 0.66, 1] }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-2"
            >
              <p className="text-green-300 text-xs font-semibold mb-1">Attending ({attending.length})</p>
              <div className="space-y-0.5">
                {attending.map(r => (
                  <div key={r.id} className="flex items-center justify-between">
                    <p className="text-green-300/70 text-[10px]">{r.user_name}</p>
                    {r.checked_in && <span className="text-[9px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full">✓ In</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {maybe.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.33, 0.66, 0.66, 1] }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2"
            >
              <p className="text-yellow-300 text-xs font-semibold mb-1">Maybe ({maybe.length})</p>
              <div className="space-y-0.5">
                {maybe.map(r => (
                  <p key={r.id} className="text-yellow-300/70 text-[10px]">{r.user_name}</p>
                ))}
              </div>
            </motion.div>
          )}

          {notAttending.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.33, 0.66, 0.66, 1] }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-2"
            >
              <p className="text-red-300 text-xs font-semibold mb-1">Not Attending ({notAttending.length})</p>
              <div className="space-y-0.5">
                {notAttending.map(r => (
                  <p key={r.id} className="text-red-300/70 text-[10px]">{r.user_name}</p>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}