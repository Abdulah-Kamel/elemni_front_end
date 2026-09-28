export function formatDate(value: string | number | Date, locale: string, style: "short" | "long"): string {
  const normalizedLocale = locale.startsWith("ar") ? "ar-EG-u-nu-latn" : "en-GB-u-nu-latn";
  const formatted = new Intl.DateTimeFormat(normalizedLocale, {
    day: "numeric",
    month: style === "short" ? "short" : "long",
    year: "numeric",
  }).format(new Date(value));
  return formatted.replace(/[\u200e\u200f]/g, "");
}

export function formatRelativeDays(value: string | number | Date, locale: string): string {
  const target = new Date(value).getTime();
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.ceil((target - today.getTime()) / day);
  const normalizedLocale = locale.startsWith("ar") ? "ar-EG-u-nu-latn" : "en-GB-u-nu-latn";
  return new Intl.RelativeTimeFormat(normalizedLocale, { numeric: "auto" }).format(days, "day").replace(/[\u200e\u200f]/g, "");
}
