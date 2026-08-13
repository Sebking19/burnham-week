import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-200 text-xs font-semibold px-4 py-2.5 rounded-2xl mb-4">
      <WifiOff size={14} className="shrink-0" />
      You're offline — showing cached data
    </div>
  );
}