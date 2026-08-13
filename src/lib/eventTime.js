// Parse free-text time strings (e.g. "6pm", "18:30", "9:00 am") to minutes since midnight.
// Returns -1 when no time is set (all-day events sort first within a day).
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return -1;
  const str = String(timeStr).toLowerCase().trim();
  const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  if (hours > 23 || mins > 59) return -1;
  return hours * 60 + mins;
}

// Combined sort key: date + minutes. Lower = earlier. Use with localeCompare.
export function eventSortKey(event) {
  const mins = parseTimeToMinutes(event.time);
  return `${event.date || ""}|${String(mins).padStart(5, "0")}`;
}

// Whether an event is still upcoming relative to "now".
export function isUpcoming(event, now = new Date()) {
  if (!event.date) return false;
  const [y, m, d] = event.date.split("-").map(Number);
  const eventDate = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (eventDate > today) return true;
  if (eventDate < today) return false;
  // Same day — only upcoming if time hasn't passed (no time = all-day, keep)
  const mins = parseTimeToMinutes(event.time);
  if (mins < 0) return true;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  return mins >= currentMins;
}