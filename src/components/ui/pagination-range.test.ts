import { describe, expect, it } from "vitest";
import { clampPage, pageCount, pageRange } from "./pagination-range";

describe("pageRange", () => {
  it("lists every page when there are few", () => {
    expect(pageRange(1, 1)).toEqual([1]);
    expect(pageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses long ranges around the current page", () => {
    expect(pageRange(5, 12)).toEqual([1, "gap-start", 4, 5, 6, "gap-end", 12]);
    expect(pageRange(1, 12)).toEqual([1, 2, "gap-end", 12]);
    expect(pageRange(12, 12)).toEqual([1, "gap-start", 11, 12]);
  });

  it("shows a single skipped page instead of a gap", () => {
    expect(pageRange(4, 12)).toEqual([1, 2, 3, 4, 5, "gap-end", 12]);
    expect(pageRange(9, 12)).toEqual([1, "gap-start", 8, 9, 10, 11, 12]);
  });
});

describe("page helpers", () => {
  it("counts and clamps pages", () => {
    expect(pageCount(0, 9)).toBe(1);
    expect(pageCount(19, 9)).toBe(3);
    expect(clampPage(5, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
  });
});
