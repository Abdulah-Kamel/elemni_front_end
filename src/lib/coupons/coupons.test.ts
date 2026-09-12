// src/lib/coupons/coupons.test.ts
import { describe, expect, it } from "vitest";
import { validateCoupon, SEED_COUPONS } from "./coupons";

describe("validateCoupon", () => {
  it("applies SAVE20 as 20% off 500 EGP", () => {
    const r = validateCoupon("save20", 500, new Date("2026-09-12T00:00:00Z"), SEED_COUPONS);
    expect(r.ok).toBe(true);
    expect(r.discount).toBe(100);
    expect(r.finalPrice).toBe(400);
  });
  it("caps fixed discount at original price", () => {
    const r = validateCoupon("WELCOME50", 30, new Date("2026-09-12T00:00:00Z"), SEED_COUPONS);
    expect(r.ok).toBe(true);
    expect(r.discount).toBe(30);
    expect(r.finalPrice).toBe(0);
  });
  it("returns NOT_FOUND for unknown code", () => {
    const r = validateCoupon("NOPE", 500, new Date("2026-09-12T00:00:00Z"), SEED_COUPONS);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("NOT_FOUND");
  });
  it("returns EXPIRED for EXPIRED10", () => {
    const r = validateCoupon("EXPIRED10", 500, new Date("2026-09-12T00:00:00Z"), SEED_COUPONS);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("EXPIRED");
  });
  it("returns INACTIVE for OFF50", () => {
    const r = validateCoupon("OFF50", 500, new Date("2026-09-12T00:00:00Z"), SEED_COUPONS);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("INACTIVE");
  });
});
