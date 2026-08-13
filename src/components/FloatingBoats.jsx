import { useEffect, useRef } from "react";
import { useTheme, THEMES } from "@/lib/ThemeContext";

const WIND_LINES = [
  { id: 1, y: "8%",  width: 60, duration: 12, delay: 0,   opacity: 0.25 },
  { id: 2, y: "22%", width: 40, duration: 15, delay: 1.5, opacity: 0.18 },
  { id: 3, y: "35%", width: 80, duration: 11, delay: 0.7, opacity: 0.22 },
  { id: 4, y: "50%", width: 50, duration: 14, delay: 2.2, opacity: 0.16 },
  { id: 5, y: "63%", width: 70, duration: 13, delay: 3.1, opacity: 0.20 },
  { id: 6, y: "75%", width: 45, duration: 16, delay: 0.4, opacity: 0.16 },
  { id: 7, y: "88%", width: 65, duration: 12, delay: 1.8, opacity: 0.20 },
  { id: 8, y: "18%", width: 35, duration: 14, delay: 4,   opacity: 0.14 },
];

function WindLine({ width, id, windColor }) {
  const animId = `wind-wave-${id}`;
  const path1 = `M0,6 Q${width * 0.25},0 ${width * 0.5},6 Q${width * 0.75},12 ${width},6`;
  const path2 = `M0,6 Q${width * 0.25},12 ${width * 0.5},6 Q${width * 0.75},0 ${width},6`;
  return (
    <svg width={width} height={14} viewBox={`0 0 ${width} 14`} fill="none">
      <path stroke={windColor} strokeWidth="2" strokeLinecap="round" opacity="1" d={path1}>
        <animate
          attributeName="d"
          values={`${path1};${path2};${path1}`}
          dur="1.2s"
          repeatCount="indefinite"
          id={animId}
        />
      </path>
    </svg>
  );
}

const BOATS = [
  { id: 1, y: "15%", size: 28, duration: 28, delay: 0, opacity: 0.28 },
  { id: 2, y: "42%", size: 20, duration: 38, delay: 6, opacity: 0.22 },
  { id: 3, y: "68%", size: 34, duration: 22, delay: 12, opacity: 0.25 },
  { id: 4, y: "28%", size: 16, duration: 45, delay: 3, opacity: 0.20 },
  { id: 5, y: "80%", size: 24, duration: 32, delay: 18, opacity: 0.23 },
];

function Boat({ size, hullColor, sailColor1, sailColor2, mastColor, rippleColor }) {
  return (
    <svg width={size * 2.5} height={size} viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hull */}
      <path d="M4 18 Q30 26 56 18 L52 22 Q30 30 8 22 Z" fill={hullColor} opacity="1" />
      {/* Sail */}
      <path d="M28 3 L28 18 L14 18 Z" fill={sailColor1} opacity="0.95" />
      <path d="M30 2 L30 18 L46 16 Z" fill={sailColor2} opacity="0.85" />
      {/* Mast */}
      <line x1="29" y1="1" x2="29" y2="19" stroke={mastColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Water ripple */}
      <ellipse cx="30" cy="24" rx="20" ry="2" fill={rippleColor} opacity="0.3" />
    </svg>
  );
}

export default function FloatingBoats() {
  const { themeId } = useTheme();
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  
  // Parse theme accent color from CSS variables
  const accentRgb = theme.vars["--theme-accent"];
  const accentHex = accentRgb ? `rgb(${accentRgb})` : "#22d3ee";
  
  // Derive complementary colors from theme for boats
  const boatColors = {
    ocean: { hull: "#0284c7", sail1: "#0ea5e9", sail2: "#06b6d4", mast: "#22d3ee" },
    midnight: { hull: "#6b7280", sail1: "#9ca3af", sail2: "#d1d5db", mast: "#f3f4f6" },
    slate: { hull: "#8b5cf6", sail1: "#a78bfa", sail2: "#ddd6fe", mast: "#e9d5ff" },
    forest: { hull: "#059669", sail1: "#10b981", sail2: "#34d399", mast: "#6ee7b7" },
  }[themeId] || { hull: "#0ea5e9", sail1: "#06b6d4", sail2: "#22d3ee", mast: "#67e8f9" };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {WIND_LINES.map((line) => (
        <div
          key={`wind-${line.id}`}
          className="absolute"
          style={{
            top: line.y,
            opacity: line.opacity,
            animation: `windLine${line.id} ${line.duration}s linear ${line.delay}s infinite`,
          }}
        >
          <WindLine width={line.width} id={line.id} windColor={accentHex} />
        </div>
      ))}
      {BOATS.map((boat) => (
        <div
          key={boat.id}
          className="absolute"
          style={{
            top: boat.y,
            opacity: boat.opacity,
            animation: `floatBoat${boat.id} ${boat.duration}s linear ${boat.delay}s infinite`,
          }}
        >
          <div style={{ animation: `bobBoat ${3 + boat.id * 0.4}s ease-in-out infinite` }}>
            <Boat 
              size={boat.size} 
              hullColor={boatColors.hull}
              sailColor1={boatColors.sail1}
              sailColor2={boatColors.sail2}
              mastColor={boatColors.mast}
              rippleColor={boatColors.hull}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes windLine1 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine2 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine3 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine4 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine5 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine6 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine7 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes windLine8 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes floatBoat1 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes floatBoat2 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes floatBoat3 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes floatBoat4 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes floatBoat5 { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
        @keyframes bobBoat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}