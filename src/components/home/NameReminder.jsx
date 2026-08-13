import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

export default function NameReminder() {
  return (
    <Link
      to="/Profile"
      className="block mb-6 bg-amber-100 dark:bg-amber-500/10 border-2 border-amber-400 dark:border-amber-500/40 rounded-2xl p-5 hover:bg-amber-200/70 dark:hover:bg-amber-500/20"
    >
      <div className="flex items-start gap-4">
        <span className="w-11 h-11 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
          <BadgeCheck size={22} className="text-[#141B34]" />
        </span>
        <span className="text-lg leading-snug text-[#141B34] dark:text-white">
          <span className="font-bold block">Please set your official name</span>
          Add the name you entered Burnham Week under, so results and notices match your entry.
        </span>
      </div>
    </Link>
  );
}