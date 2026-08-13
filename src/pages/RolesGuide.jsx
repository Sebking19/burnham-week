import { ROLES_GUIDE } from "@/components/roles/rolesData";
import RoleCard from "@/components/roles/RoleCard";
import { ShieldCheck } from "lucide-react";

export default function RolesGuide() {
  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: "#BFEFFF", textShadow: "0 0 24px rgba(34,211,238,0.55)" }}>
          <ShieldCheck size={28} className="text-cyan-300" /> Roles Guide
        </h1>
        <p className="text-cyan-200/40 text-sm mt-0.5">What each role can do across the app</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ROLES_GUIDE.map(entry => (
          <RoleCard key={entry.role} entry={entry} />
        ))}
      </div>
    </div>
  );
}