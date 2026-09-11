import type { CheckoutRedirectDto } from "./contract";

export function isCheckoutRedirectDto(value: unknown): value is CheckoutRedirectDto {
  const redirectUrl =
    typeof value === "object" && value !== null
      ? (value as { redirect_url?: unknown }).redirect_url
      : null;

  return (
    typeof redirectUrl === "string" &&
    isSafeCheckoutRedirectUrl(redirectUrl)
  );
}

/**
 * Resolves a backend-owned checkout redirect for the browser.
 *
 * Absolute URLs (Kashier hosted checkout) are external and must be left
 * unchanged. Relative in-app paths (free-course "/my-courses") are localized:
 * the default Arabic locale keeps them as-is while English prefixes "/en".
 */
export function resolveCheckoutRedirect(redirectUrl: string, locale: string): string {
  if (/^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(redirectUrl)) return redirectUrl;
  if (!redirectUrl.startsWith("/")) return redirectUrl;
  if (locale === "en" && !redirectUrl.startsWith("/en/") && redirectUrl !== "/en") {
    return `/en${redirectUrl}`;
  }
  return redirectUrl;
}

function isSafeCheckoutRedirectUrl(redirectUrl: string) {
  const normalized = redirectUrl.trim();
  if (!normalized || normalized !== redirectUrl) return false;
  if (normalized.startsWith("/")) return !normalized.startsWith("//");

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
