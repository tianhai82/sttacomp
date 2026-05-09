/**
 * Formats a filename for draw export.
 * Pattern: draw-{eventName}-{YYYY-MM-DD HH-mm}.json
 * If eventName is empty: draw-{YYYY-MM-DD HH-mm}.json
 * Special characters in eventName are replaced; whitespace is collapsed.
 */
export function formatExportFilename(eventName: string): string {
  const now = new Date();
  const date = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "2026-05-09" (sv-SE uses ISO format)
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now); // "14:30"
  const timeSafe = time.replace(":", "-");

  const prefix = "draw";
  if (!eventName.trim()) {
    return `${prefix}-${date} ${timeSafe}.json`;
  }

  const sanitized = eventName
    .replace(/[^a-zA-Z0-9\s\-_]/g, "") // remove special chars
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();

  return `${prefix}-${sanitized}-${date} ${timeSafe}.json`;
}
