import { useRef, useState, useEffect } from "react";

// Shared device-tilt state (one listener for all Tilt3D instances)
let gyro = { active: false, beta: 0, gamma: 0 };
let gyroListenerAdded = false;
const addGyroListener = () => {
  if (gyroListenerAdded || typeof window === "undefined") return;
  gyroListenerAdded = true;
  window.addEventListener("deviceorientation", (e) => {
    if (e.beta === null || e.gamma === null) return;
    gyro = { active: true, beta: e.beta, gamma: e.gamma };
  });
};

// Reusable 3D tilt wrapper — pointer tilt on desktop, phone-motion tilt on mobile,
// and a gentle synced underwater sway when idle
export default function Tilt3D({ children, max = 10, className = "" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const hovering = useRef(false);

  const handleMove = (e) => {
    hovering.current = true;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - y) * max, ry: (x - 0.5) * max });
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    addGyroListener();
    let raf;
    const loop = () => {
      if (!hovering.current) {
        if (gyro.active) {
          // Phone movement: tilt toward how the device is held (clamped, damped)
          const ry = Math.max(-1, Math.min(1, gyro.gamma / 45)) * max * 0.6;
          const rx = Math.max(-1, Math.min(1, (gyro.beta - 40) / 45)) * -max * 0.6;
          setTilt(prev => ({ rx: prev.rx + (rx - prev.rx) * 0.08, ry: prev.ry + (ry - prev.ry) * 0.08 }));
        } else {
          // Idle: gentle synced sway (time-based, so all cards move together)
          const t = Date.now() / 1000;
          setTilt({ rx: Math.sin(t * 0.5) * max * 0.18, ry: Math.sin(t * 0.35 + 1) * max * 0.22 });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [max]);

  return (
    <div style={{ perspective: "900px" }} className={className}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={() => { hovering.current = false; }}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: hovering.current ? "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}