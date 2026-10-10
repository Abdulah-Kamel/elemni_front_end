/** Return a bounded, ascending window of 1-based page numbers. */
export function pagesToRender(current: number, total: number, radius = 2): number[] {
  if (total < 1) return [];
  const page = Math.max(1, Math.min(total, Math.floor(current)));
  const start = Math.max(1, page - radius);
  const end = Math.min(total, page + radius);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function clampZoom(zoom: number): number {
  return Math.max(0.5, Math.min(3, Math.round(zoom * 4) / 4));
}

export function fitWidthScale(containerWidth: number, pageWidthAt1: number): number {
  if (containerWidth <= 32 || pageWidthAt1 <= 0) return 0.5;
  // Fit is continuous and may be below the manual zoom minimum: rounding up
  // or enforcing 50% would overflow narrow phones and landscape pages.
  return Math.min(3, (containerWidth - 32) / pageWidthAt1);
}
