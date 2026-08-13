import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Who we are",
    body: "This app is run by the Corinthian Otters, the junior sailing section of the Royal Corinthian Yacht Club, Burnham-on-Crouch. It helps members check schedules, share moments and manage club activities. If you have any questions about this policy or your data, please get in touch with a club contact listed on the Help page."
  },
  {
    title: "2. What information we collect",
    body: "When you use the app we collect: your name and email address (from your account); profile details you choose to add (such as your Otter username, avatar and accent colour); posts, photos, comments and reactions you share; event RSVPs, volunteering availability and duty roster assignments; ticket and booking details (such as names on tickets and vehicle registrations for car wash bookings); and notification preferences if you enable push notifications."
  },
  {
    title: "3. Device permissions we use",
    body: "Camera: the app requests camera access only when a club administrator uses the ticket scanner to check attendees in at an event — for example, scanning a member's QR code ticket at the door of an Otter Week event to mark them as arrived. Photos: the app requests access to your photo library only when you choose to attach a photo — for example, picking a picture from your library to share on the group feed or to add to a sponsor profile. We never access your camera or photos in the background, and you can decline these permissions and still use the rest of the app."
  },
  {
    title: "4. Payments",
    body: "Payments for tickets and bookings are processed securely by Stripe. We never see or store your card details — we only keep a record of what was purchased, who purchased it, and whether payment was completed."
  },
  {
    title: "5. How we use your information",
    body: "We use your information solely to run club activities: showing schedules and events, managing RSVPs and tickets, organising duty rosters and volunteering, sharing club announcements and community posts, and sending you notifications you have opted into. We do not sell your data or use it for advertising."
  },
  {
    title: "6. Who can see your information",
    body: "Your posts, photos, comments and RSVPs are visible to other registered club members within the app. Some information (such as booking and ticket records) is visible to club administrators and trainers so they can run events. Nothing in the app is visible to the general public without signing in."
  },
  {
    title: "7. How your data is stored",
    body: "Your data is stored securely on the Base44 platform, which hosts this app. Access is protected by your account login, and role-based permissions control what different members can see and change."
  },
  {
    title: "8. Children",
    body: "As a junior sailing section, some of our members are under 18. Accounts are created by invitation only, and parents or guardians should oversee their child's use of the app. Please only share photos of other members with their (or their parent's) permission."
  },
  {
    title: "9. Your rights",
    body: "You can view and update your profile details at any time from the Profile page, and delete your account from the Settings page. You may also ask us to correct or delete any information we hold about you by contacting a club administrator via the Help page."
  },
  {
    title: "10. Changes to this policy",
    body: "We may update this policy from time to time. Any significant changes will be shared through a club notice in the app."
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40 shrink-0">
          <ShieldCheck size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-white/50 text-sm">Last updated: 26 July 2026</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <motion.section
            key={s.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <h2 className="font-bold text-white mb-1.5">{s.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed">{s.body}</p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}