import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck } from "lucide-react";

export default function UserRoleManager({ currentUserId }) {
  const [users, setUsers] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = () => base44.entities.User.list().then(setUsers);

  useEffect(() => { load(); }, []);

  const setRole = async (user, role) => {
    setSavingId(user.id);
    await base44.entities.User.update(user.id, { role });
    setSavingId(null);
    load();
  };

  return (
    <div className="bg-white border-2 border-dotted border-[#141B34]/40 rounded-2xl p-6">
      <h2 className="font-display text-2xl text-[#1B2A5B]">People</h2>
      <p className="text-base text-[#141B34]/70 mt-1">Choose who can post notices and edit the schedule.</p>

      {users === null ? (
        <p className="text-lg text-[#141B34]/70 mt-4">Loading people...</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#141B34]/10">
          {users.map((u) => {
            const isAdmin = u.role === "admin";
            const isMe = u.id === currentUserId;
            return (
              <li key={u.id} className="py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-lg font-bold text-[#1B2A5B] flex items-center gap-2">
                    {u.full_name || u.email}
                    {isAdmin && <ShieldCheck size={18} className="text-[#4C7CF0]" />}
                  </p>
                  <p className="text-base text-[#141B34]/70">{u.email}</p>
                </div>
                {isMe ? (
                  <span className="text-base text-[#141B34]/60">You</span>
                ) : (
                  <button
                    onClick={() => setRole(u, isAdmin ? "user" : "admin")}
                    disabled={savingId === u.id}
                    className={`px-5 py-2.5 rounded-lg text-lg font-bold border-2 disabled:opacity-60 ${
                      isAdmin
                        ? "border-[#1B2A5B]/30 text-[#1B2A5B] hover:bg-[#1B2A5B]/5"
                        : "bg-[#4C7CF0] border-[#4C7CF0] text-white hover:bg-[#3E6BDB]"
                    }`}
                  >
                    {savingId === u.id ? "Saving..." : isAdmin ? "Remove admin" : "Make admin"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}