export function formatMoney(
  value: number | string,
  locale: string,
  currency = "EGP",
): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "—";

  const normalizedLocale = locale.startsWith("ar")
    ? "ar-EG-u-nu-latn"
    : "en-EG-u-nu-latn";
  const isInteger = Number.isInteger(amount);

  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount).replace(/[\u200e\u200f]/g, "").replace(/ج\.م\.$/, "ج.م");
}
