export type PageToken = number | "gap-start" | "gap-end";

/**
 * Page buttons to render: always the first and last page, a window around
 * the current page, and gaps ("…") where pages are skipped.
 * pageRange(5, 12) → [1, "gap-start", 4, 5, 6, "gap-end", 12]
 */
export function pageRange(current: number, total: number, siblings = 1): PageToken[] {
  if (total <= 0) return [];
  // Show every page when collapsing would not save any buttons.
  if (total <= 5 + siblings * 2) return Array.from({ length: total }, (_, index) => index + 1);
  const start = Math.max(2, current - siblings);
  const end = Math.min(total - 1, current + siblings);
  const tokens: PageToken[] = [1];
  if (start > 2) tokens.push(start === 3 ? 2 : "gap-start");
  for (let page = start; page <= end; page++) tokens.push(page);
  if (end < total - 1) tokens.push(end === total - 2 ? total - 1 : "gap-end");
  tokens.push(total);
  return tokens;
}

export function pageCount(items: number, perPage: number) {
  return Math.max(1, Math.ceil(items / perPage));
}

/** Clamp a requested page into range, e.g. after filters shrink the list. */
export function clampPage(page: number, total: number) {
  return Math.min(Math.max(1, page), Math.max(1, total));
}
