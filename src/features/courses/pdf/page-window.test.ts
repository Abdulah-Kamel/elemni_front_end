import { describe, expect, it } from "vitest";
import { clampZoom, fitWidthScale, pagesToRender } from "./page-window";

describe("page window", () => {
  it("renders current ±2 pages, clamped", () => {
    expect(pagesToRender(1, 10)).toEqual([1, 2, 3]);
    expect(pagesToRender(5, 10)).toEqual([3, 4, 5, 6, 7]);
    expect(pagesToRender(10, 10)).toEqual([8, 9, 10]);
    expect(pagesToRender(1, 1)).toEqual([1]);
    expect(pagesToRender(50, 120)).toEqual([48, 49, 50, 51, 52]);
  });
  it("handles empty documents and out-of-range current pages", () => {
    expect(pagesToRender(1, 0)).toEqual([]);
    expect(pagesToRender(-10, 5)).toEqual([1, 2, 3]);
    expect(pagesToRender(20, 5)).toEqual([3, 4, 5]);
    expect(pagesToRender(3, 10, 1)).toEqual([2, 3, 4]);
  });
  it("clamps zoom to 0.5..3 and rounds to quarter steps", () => {
    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(9)).toBe(3);
    expect(clampZoom(1.13)).toBe(1.25);
  });
  it("fits phone widths without quarter-step rounding or a 50% minimum", () => {
    expect(fitWidthScale(430, 600)).toBeCloseTo(398 / 600, 6);
    expect(fitWidthScale(360, 842)).toBeCloseTo(328 / 842, 6);
  });
  it("fits page width to container minus padding", () => {
    expect(fitWidthScale(632, 600)).toBeCloseTo(1, 1);
    expect(fitWidthScale(332, 600)).toBe(0.5);
    expect(fitWidthScale(10, 600)).toBe(0.5);
  });
});
