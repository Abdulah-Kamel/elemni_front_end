// src/lib/coupons/coupons.ts
export type CouponType = "percentage" | "fixed";
export type CouponError = "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  currency: "EGP";
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  description?: string;
  createdAt: string;
}

export interface CouponValidation {
  ok: boolean;
  coupon: Coupon | null;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  error: CouponError | null;
}

export const COUPON_STORAGE_KEY = "elemni.coupons.v1";

const iso = (d: string) => d;
export const SEED_COUPONS: Coupon[] = [
  { code: "SAVE20", type: "percentage", value: 20, currency: "EGP", active: true, expiresAt: iso("2026-12-11T00:00:00.000Z"), maxUses: 500, usedCount: 37, description: "20% off", createdAt: iso("2026-09-12T00:00:00.000Z") },
  { code: "WELCOME50", type: "fixed", value: 50, currency: "EGP", active: true, expiresAt: iso("2026-10-12T00:00:00.000Z"), maxUses: 200, usedCount: 12, description: "50 EGP off", createdAt: iso("2026-09-12T00:00:00.000Z") },
  { code: "EXPIRED10", type: "percentage", value: 10, currency: "EGP", active: true, expiresAt: iso("2026-09-11T00:00:00.000Z"), maxUses: null, usedCount: 3, description: "expired demo", createdAt: iso("2026-09-12T00:00:00.000Z") },
  { code: "OFF50", type: "percentage", value: 50, currency: "EGP", active: false, expiresAt: null, maxUses: null, usedCount: 0, description: "inactive demo", createdAt: iso("2026-09-12T00:00:00.000Z") },
];

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function loadCouponOverrides(): Coupon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COUPON_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Coupon[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getEffectiveCoupons(seeds: Coupon[] = SEED_COUPONS): Coupon[] {
  const overrides = loadCouponOverrides();
  if (overrides.length === 0) return seeds;
  const byCode = new Map(overrides.map((c) => [normalizeCode(c.code), c]));
  const merged = seeds.map((s) => byCode.get(normalizeCode(s.code)) ?? s);
  for (const o of overrides) {
    if (!merged.some((m) => normalizeCode(m.code) === normalizeCode(o.code))) merged.push(o);
  }
  return merged;
}

export function validateCoupon(
  code: string,
  originalPrice: number,
  now: Date = new Date(),
  coupons: Coupon[] = getEffectiveCoupons(),
): CouponValidation {
  const normalized = normalizeCode(code);
  const coupon = coupons.find((c) => normalizeCode(c.code) === normalized) ?? null;
  const base = { originalPrice, coupon, discount: 0, finalPrice: originalPrice };
  if (!coupon) return { ...base, ok: false, error: "NOT_FOUND" };
  if (!coupon.active) return { ...base, ok: false, error: "INACTIVE" };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime())
    return { ...base, ok: false, error: "EXPIRED" };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
    return { ...base, ok: false, error: "EXHAUSTED" };
  const discount =
    coupon.type === "percentage"
      ? Math.round((originalPrice * coupon.value) / 100)
      : Math.min(coupon.value, originalPrice);
  return { ok: true, coupon, originalPrice, discount, finalPrice: Math.max(0, originalPrice - discount), error: null };
}
