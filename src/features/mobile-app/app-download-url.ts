/**
 * The Android APK link shown on the landing page and dashboard
 * (NEXT_PUBLIC_ANDROID_APP_URL). Only https links count; anything else hides the
 * download UI instead of rendering a dead or unsafe button.
 */
export function parseAppDownloadUrl(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

export const androidAppUrl = parseAppDownloadUrl(process.env.NEXT_PUBLIC_ANDROID_APP_URL);
