const KEY = "bw_accessibility";

export const defaultSettings = { textSize: 18, highContrast: false, underlineLinks: false };

export function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  applySettings(settings);
}

export function applySettings(settings) {
  const root = document.documentElement;
  root.style.fontSize = `${settings.textSize}px`;
  root.dataset.contrast = settings.highContrast ? "high" : "normal";
  root.dataset.underlineLinks = settings.underlineLinks ? "true" : "false";
}