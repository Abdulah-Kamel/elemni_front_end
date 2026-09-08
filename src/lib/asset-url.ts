function isAbsoluteUrl(value: string): boolean {
  return value.startsWith("https://") || value.startsWith("http://");
}

function isRootRelative(value: string): boolean {
  return value.startsWith("/");
}

function getAssetsOrigin(): string | undefined {
  return process.env.ASSETS_URL || undefined;
}

/**
 * Resolve a course/asset image value to a usable URL.
 *
 * - Absolute URLs (https://, http://) are returned as-is.
 * - Root-relative paths (/images/foo.jpg) are returned as-is.
 * - Storage keys (courses/7, teachers/avatar.png) are resolved against ASSETS_URL.
 * - Empty/null/invalid values fall back to the provided fallback.
 */
export function resolveAssetUrl(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (isAbsoluteUrl(trimmed) || isRootRelative(trimmed)) {
    return trimmed;
  }

  const origin = getAssetsOrigin();
  if (origin) {
    const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    return `${base}/${trimmed}`;
  }

  return fallback;
}
