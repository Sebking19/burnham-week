import { ExternalLink } from "lucide-react";

export default function LinkRow({ label, sublabel, url, icon: Icon = ExternalLink }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 py-4 border-b border-[#141B34]/10 dark:border-white/10 last:border-0 group"
    >
      <span className="w-11 h-11 rounded-lg bg-[#4C7CF0] flex items-center justify-center shrink-0">
        <Icon size={22} className="text-white" />
      </span>
      <span className="text-lg leading-snug">
        <span className="font-bold text-[#1B2A5B] dark:text-[#8FAEF7] group-hover:underline">{label}</span>
        {sublabel && <span className="block text-base text-[#141B34]/70 dark:text-white/70">{sublabel}</span>}
      </span>
    </a>
  );
}