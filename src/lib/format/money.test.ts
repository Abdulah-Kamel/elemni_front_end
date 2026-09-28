import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("uses Latin digits and the Egyptian pound symbol in Arabic", () => {
    expect(formatMoney(1000, "ar")).toBe("1,000 ج.م");
  });

  it("uses EGP and Latin digits in English", () => {
    expect(formatMoney(1000, "en")).toBe("EGP 1,000");
  });

  it("omits decimal places for integer values", () => {
    expect(formatMoney(42, "en")).toBe("EGP 42");
  });

  it("keeps two decimal places for decimal strings", () => {
    expect(formatMoney("42.67", "en")).toBe("EGP 42.67");
  });

  it("returns a dash for NaN", () => {
    expect(formatMoney(Number.NaN, "ar")).toBe("—");
  });
});
