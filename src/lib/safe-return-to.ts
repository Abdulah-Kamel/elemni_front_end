/** A same-origin path to return to after login, or undefined for anything that could leave the site. */
export function safeReturnTo(value: string | string[] | undefined): string | undefined {
  // A repeated ?next= arrives as an array.
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return undefined;
  try {
    return new URL(value, "http://x").origin === "http://x" ? value : undefined;
  } catch {
    return undefined;
  }
}
