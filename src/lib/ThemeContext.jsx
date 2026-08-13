import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  {
    id: "ocean",
    label: "Ocean",
    description: "Classic deep blue",
    preview: ["#0f172a", "#1e3a5f", "#22d3ee"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "6 14 30",        // deep navy
      "--theme-bg-via": "10 32 70",        // rich electric blue
      "--theme-bg-to": "5 18 40",
      "--theme-header-from": "14 165 233", // sky-500
      "--theme-header-to": "6 182 212",    // cyan-500
      "--theme-accent": "34 211 238",      // cyan-400
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Dark charcoal & grey",
    preview: ["#0a0a0a", "#1a1a1a", "#6b7280"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "10 10 10",
      "--theme-bg-via": "20 20 20",
      "--theme-bg-to": "10 10 10",
      "--theme-header-from": "55 65 81",   // gray-700
      "--theme-header-to": "31 41 55",     // gray-800
      "--theme-accent": "156 163 175",     // gray-400
    },
  },
  {
    id: "slate",
    label: "Flag Officer",
    description: "Digital lavender",
    preview: ["#1a1225", "#2d1f4a", "#c4b5fd"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "26 18 37",
      "--theme-bg-via": "45 31 74",
      "--theme-bg-to": "26 18 37",
      "--theme-header-from": "167 139 250", // violet-400
      "--theme-header-to": "192 132 252",   // purple-400
      "--theme-accent": "196 181 253",      // violet-300 (digital lavender)
    },
  },
  {
    id: "forest",
    label: "Forest",
    description: "Deep green & teal",
    preview: ["#0a1612", "#0d2d1e", "#34d399"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "10 22 18",
      "--theme-bg-via": "13 45 30",
      "--theme-bg-to": "10 22 18",
      "--theme-header-from": "5 150 105",  // emerald-600
      "--theme-header-to": "15 118 110",   // teal-600
      "--theme-accent": "52 211 153",      // emerald-400
    },
  },
  {
    id: "sunset",
    label: "Sunset Sail",
    description: "Warm orange & rose",
    preview: ["#241018", "#4a1e2a", "#fb923c"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "30 12 22",
      "--theme-bg-via": "62 24 38",
      "--theme-bg-to": "34 14 22",
      "--theme-header-from": "251 113 133", // rose-400
      "--theme-header-to": "249 115 22",    // orange-500
      "--theme-accent": "251 146 60",       // orange-400
    },
  },
  {
    id: "coral",
    label: "Coral Reef",
    description: "Vivid pink & magenta",
    preview: ["#1e0f24", "#3d1a4a", "#f472b6"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "28 12 32",
      "--theme-bg-via": "56 22 68",
      "--theme-bg-to": "30 12 34",
      "--theme-header-from": "236 72 153",  // pink-500
      "--theme-header-to": "217 70 239",    // fuchsia-500
      "--theme-accent": "244 114 182",      // pink-400
    },
  },
  {
    id: "arctic",
    label: "Arctic Waters",
    description: "Icy teal & silver",
    preview: ["#0a1a1e", "#123540", "#7dd3fc"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "9 24 28",
      "--theme-bg-via": "17 50 60",
      "--theme-bg-to": "9 26 30",
      "--theme-header-from": "45 212 191",  // teal-400
      "--theme-header-to": "125 211 252",   // sky-300
      "--theme-accent": "125 211 252",      // sky-300
    },
  },
  {
    id: "regatta",
    label: "Regatta",
    description: "Navy & signal red",
    preview: ["#0b1220", "#1a2440", "#f87171"],
    colorScheme: "dark",
    vars: {
      "--theme-bg-from": "9 14 28",
      "--theme-bg-via": "24 34 62",
      "--theme-bg-to": "10 15 30",
      "--theme-header-from": "239 68 68",   // red-500
      "--theme-header-to": "251 113 133",   // rose-400
      "--theme-accent": "248 113 113",      // red-400
    },
  },
];

const ThemeContext = createContext(null);

function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  // Apply data-theme attribute for CSS selectors
  root.setAttribute("data-theme", id);
}

// Detect platform and system color scheme preference
function getPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|mac/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

// Detect system color scheme preference and apply immediately to avoid flash
function getDefaultTheme() {
  const stored = localStorage.getItem("app_theme");
  if (stored) return stored;
  
  const platform = getPlatform();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  // Android: enforce dark mode for mandatory dark mode requirement
  if (platform === "android") {
    return "ocean";
  }
  
  // iOS & Web: default to ocean
  return "ocean";
}

applyTheme(getDefaultTheme());

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => getDefaultTheme());

  useEffect(() => {
    applyTheme(themeId);
    localStorage.setItem("app_theme", themeId);
  }, [themeId]);

  useEffect(() => {
    // Listen for system color scheme changes
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      // Only auto-switch if no manual theme override is stored
      if (!localStorage.getItem("app_theme")) {
        const platform = getPlatform();
        if (platform === "android") {
          // Android always stays dark
          setThemeId("ocean");
        } else {
          // iOS & Web respect system preference
          setThemeId("ocean");
        }
      }
    };
    darkModeQuery.addEventListener("change", handleChange);
    return () => darkModeQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}