// Display helpers shared by every course-test screen. Numbers stay in Latin
// digits (tabular) to match the design; dates use the viewer's timezone.

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "الأحد 28/09 · 10:00 ص" */
export function formatTestDate(iso: string, locale = "ar") {
  const date = new Date(iso);
  const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  const weekday = new Intl.DateTimeFormat(tag, { weekday: "long" }).format(date);
  const day = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit" }).format(date);
  const time = new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  return `${weekday} ${day} · ${time}`.replace(/\u200f/g, "");
}

/** "28/09/2026" */
export function formatShortDate(iso: string, locale = "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso)).replace(/\u200f/g, "");
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Offset (ms) to add to Date.now() to get the server clock. */
export function serverClockOffset(serverNow: string) {
  return new Date(serverNow).getTime() - Date.now();
}

export function secondsUntil(deadline: string, offsetMs: number) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - (Date.now() + offsetMs)) / 1000));
}
