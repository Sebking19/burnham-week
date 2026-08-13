import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullY(Math.min(delta * 0.4, 70));
    }
  };

  const handleTouchEnd = useCallback(async () => {
    if (pullY > 50) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    touchStartY.current = null;
  }, [pullY, onRefresh]);

  return { pullY, refreshing, handleTouchStart, handleTouchMove, handleTouchEnd };
}

export default function PullToRefreshIndicator({ pullY, refreshing }) {
  return (
    <>
      <AnimatePresence>
        {pullY > 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center mb-2"
            style={{ transform: `translateY(${pullY - 10}px)` }}
          >
            <div className={`flex items-center gap-2 text-white/40 text-xs ${pullY > 50 ? "text-blue-400" : ""}`}>
              <RefreshCw size={14} className={`transition-transform ${pullY > 50 ? "rotate-180 text-blue-400" : ""}`} />
              {pullY > 50 ? "Release to refresh" : "Pull to refresh"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {refreshing && (
        <div className="flex justify-center mb-3">
          <RefreshCw size={14} className="text-blue-400 animate-spin" />
        </div>
      )}
    </>
  );
}