# Student Coupons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students apply percentage/fixed coupon codes in the purchase panel and confirm discounted totals in the checkout modal (dummy data, backend-pending).

**Architecture:** New pure domain lib `src/lib/coupons/coupons.ts` (same contract as admin spec) with seeds + `validateCoupon()`; new `coupon-input.tsx` component; wire state through `course-detail.tsx` into `course-purchase-panel.tsx` and `checkout-confirmation.tsx`; forward `coupon_code` in checkout API route.

**Tech Stack:** Next.js 16 + React 19, next-intl (ar default, en), Tailwind v4 custom tokens, vitest.

## Global Constraints

- Coupon model is `{code, type: percentage|fixed, value, currency: EGP, active, expiresAt ISO|null, maxUses number|null, usedCount, description?, createdAt ISO}` — exact field names from spec.
- Discount math: percentage → `round(original * value / 100)`; fixed → `min(value, original)`; `finalPrice = max(0, original - discount)`.
- Error codes are `NOT_FOUND | INACTIVE | EXPIRED | EXHAUSTED` mapped to `courseDetail.coupon*` i18n keys, shown with `role=alert`.
- Normalize codes by trim + uppercase before validation.
- Checkout route keeps strict `{redirect_url}` passthrough; only adds optional `coupon_code` forwarding.
- Bilingual ar + en required; RTL-safe; no new dependencies.
- TDD: failing test first for every task; commit per task.

---

### Task 1: Coupon domain lib + seeds + validation

**Files:**
- Create: `src/lib/coupons/coupons.ts`
- Test: `src/lib/coupons/coupons.test.ts`

**Interfaces:**
- Consumes: nothing (pure, no imports except types).
- Produces: `Coupon`, `CouponType`, `CouponValidation`, `CouponError`, `SEED_COUPONS: Coupon[]`, `COUPON_STORAGE_KEY = "elemni.coupons.v1"`, `normalizeCode(code: string): string`, `validateCoupon(code: string, originalPrice: number, now?: Date, coupons?: Coupon[]): CouponValidation`, `loadCouponOverrides(): Coupon[]`, `getEffectiveCoupons(): Coupon[]`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/coupons/coupons.test.ts`
Expected: FAIL with "Failed to resolve import ./coupons" (file does not exist).

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/coupons/coupons.test.ts`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/coupons/coupons.ts src/lib/coupons/coupons.test.ts
git commit -m "feat(student): add coupon domain with dummy seeds and validation"
```

### Task 2: Coupon input component

**Files:**
- Create: `src/features/courses/components/coupon-input.tsx`
- Test: `src/features/courses/components/coupon-input.test.tsx`

**Interfaces:**
- Consumes: `validateCoupon`, `CouponValidation` from Task 1; `useTranslations("courseDetail")`.
- Produces: `CouponInput({ price: number; applied: CouponValidation | null; onApply(code: string): void; onRemove(): void; disabled?: boolean })` — renders input + Apply/Remove + `role=alert` error.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/courses/components/coupon-input.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CouponInput from "./coupon-input";

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
  useLocale: () => "ar",
}));

describe("CouponInput", () => {
  it("calls onApply with typed code", () => {
    const onApply = vi.fn();
    render(<CouponInput price={500} applied={null} onApply={onApply} onRemove={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("couponPlaceholder"), { target: { value: "save20" } });
    fireEvent.click(screen.getByRole("button", { name: "couponApply" }));
    expect(onApply).toHaveBeenCalledWith("save20");
  });
  it("shows remove button when applied", () => {
    const applied = { ok: true, coupon: { code: "SAVE20" }, originalPrice: 500, discount: 100, finalPrice: 400, error: null } as never;
    render(<CouponInput price={500} applied={applied} onApply={() => {}} onRemove={() => {}} />);
    expect(screen.getByRole("button", { name: "couponRemove" })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/courses/components/coupon-input.test.tsx`
Expected: FAIL with "Failed to resolve import ./coupon-input".

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/courses/components/coupon-input.tsx
"use client";
import { useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CouponValidation } from "@/src/lib/coupons/coupons";

export default function CouponInput({ price: _price, applied, error, onApply, onRemove, disabled }: {
  price: number | string; applied: CouponValidation | null; error?: string;
  onApply: (code: string) => void; onRemove: () => void; disabled?: boolean;
}) {
  void _price;
  const t = useTranslations("courseDetail");
  const [code, setCode] = useState("");
  if (applied?.ok && applied.coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="inline-flex items-center gap-1.5"><TicketPercent className="size-4" aria-hidden="true" />{applied.coupon.code}</span>
        <button type="button" aria-label={t("couponRemove")} onClick={() => { setCode(""); onRemove(); }} disabled={disabled} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-black hover:underline disabled:opacity-50"><X className="size-4" aria-hidden="true" /></button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("couponPlaceholder")} disabled={disabled} aria-label={t("couponLabel")} className="h-11 min-w-0 flex-1 rounded-xl border-2 border-ink/10 bg-white px-3 text-sm font-bold uppercase placeholder:normal-case dark:border-white/10 dark:bg-slate-900" />
        <button type="button" onClick={() => onApply(code)} disabled={disabled || !code.trim()} className="sticker-btn-outline h-11 shrink-0 cursor-pointer px-4 text-sm font-black disabled:opacity-50">{t("couponApply")}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/courses/components/coupon-input.test.tsx`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add src/features/courses/components/coupon-input.tsx src/features/courses/components/coupon-input.test.tsx
git commit -m "feat(student): add coupon input component"
```

### Task 3: Purchase panel shows discounted price

**Files:**
- Modify: `src/features/courses/components/course-purchase-panel.tsx:23-95`
- Test: `src/features/courses/components/course-purchase-panel.test.tsx` (new)

**Interfaces:**
- Consumes: `CouponInput` (Task 2), `CouponValidation` (Task 1), existing props `course, enrollment, isAuthenticated, loading, onPurchase, onContinue`.
- Produces: extended props `couponApplied: CouponValidation | null; couponError: string; onCouponApply(code: string): void; onCouponRemove(): void`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/courses/components/course-purchase-panel.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CoursePurchasePanel from "./course-purchase-panel";

vi.mock("next-intl", () => ({ useTranslations: () => (k: string, v?: never) => k, useLocale: () => "en" }));

describe("CoursePurchasePanel coupon", () => {
  it("shows discounted total when coupon applied", () => {
    const applied = { ok: true, coupon: { code: "SAVE20", type: "percentage", value: 20 }, originalPrice: 500, discount: 100, finalPrice: 400, error: null } as never;
    render(<CoursePurchasePanel course={{ price: 500 } as never} enrollment={null} isAuthenticated loading={false} onPurchase={() => {}} onContinue={() => {}} couponApplied={applied} couponError="" onCouponApply={() => {}} onCouponRemove={() => {}} />);
    expect(screen.getByText("400.00")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/courses/components/course-purchase-panel.test.tsx`
Expected: FAIL (props `couponApplied` do not exist / total 400 not shown).

- [ ] **Step 3: Write minimal implementation**

Edit `course-purchase-panel.tsx`: add import + props + render block between price header (line 51) and benefits list (line 65):

```tsx
import CouponInput from "./coupon-input";
import type { CouponValidation } from "@/src/lib/coupons/coupons";
// props add:
couponApplied: CouponValidation | null;
couponError: string;
onCouponApply: (code: string) => void;
onCouponRemove: () => void;
// after price </div>, before benefits:
{!enrolled && (
  <div className="border-b-2 border-ink/10 py-4 dark:border-white/10">
    <CouponInput price={Number(enrollment?.course_price ?? course.price)} applied={couponApplied} error={couponError} onApply={onCouponApply} onRemove={onCouponRemove} disabled={loading} />
    {couponApplied?.ok && (
      <div className="mt-3 space-y-1 text-sm font-bold">
        <p className="flex justify-between text-muted"><span>{t("couponOriginal")}</span><span className="line-through">{formatPrice(couponApplied.originalPrice, locale)}</span></p>
        <p className="flex justify-between text-emerald-600"><span>{t("couponDiscount", { code: couponApplied.coupon!.code })}</span><span>-{formatPrice(couponApplied.discount, locale)}</span></p>
        <p className="flex justify-between text-base font-black text-ink dark:text-slate-50"><span>{t("couponTotal")}</span><span>{formatPrice(couponApplied.finalPrice, locale)}</span></p>
      </div>
    )}
  </div>
)}
```

Keep existing price header unchanged (shows base price); discounted block adds strikethrough + total.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/courses/components/course-purchase-panel.test.tsx src/features/courses/components/coupon-input.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/courses/components/course-purchase-panel.tsx src/features/courses/components/course-purchase-panel.test.tsx
git commit -m "feat(student): show coupon discount in purchase panel"
```

### Task 4: Checkout state + modal summary + API forwarding

**Files:**
- Modify: `src/features/courses/components/course-detail.tsx:178-229,390-416`
- Modify: `src/features/courses/components/checkout-confirmation.tsx:20-160`
- Modify: `src/app/api/student/payments/checkout/route.ts:6-25`

**Interfaces:**
- Consumes: `validateCoupon, getEffectiveCoupons, CouponValidation` (Task 1).
- Produces: checkout modal shows Original/Discount/Total lines; `POST /api/student/payments/checkout` accepts optional `coupon_code: string`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/student/payments/checkout/route.test.ts (append new case in existing file)
import { describe, expect, it } from "vitest";
// new test: invalid course_id still 400; valid forwards coupon_code — assert via mocked authenticatedBackendFetch
```

Concrete new test (add to existing route test file):

```ts
it("rejects empty coupon_code with 400 only when course_id invalid", async () => {
  const { POST } = await import("./route");
  const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ course_id: 0, coupon_code: "SAVE20" }) }));
  expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/student/payments/checkout/route.test.ts`
Expected: FAIL only if file lacks the new case (first run: new assertion missing → add it, watch it pass after impl; route currently drops coupon_code silently).

- [ ] **Step 3: Write minimal implementation**

1. `course-detail.tsx`: add state + handlers:

```tsx
import { useMemo, useState } from "react";
import { getEffectiveCoupons, validateCoupon, type CouponValidation } from "@/src/lib/coupons/coupons";
const [couponCode, setCouponCode] = useState("");
const [couponApplied, setCouponApplied] = useState<CouponValidation | null>(null);
const [couponError, setCouponError] = useState("");
const basePrice = Number(detail?.enrollment?.course_price ?? course?.price ?? 0);
const applyCoupon = (raw: string) => {
  const r = validateCoupon(raw, basePrice, new Date(), getEffectiveCoupons());
  if (r.ok) { setCouponApplied(r); setCouponCode(r.coupon!.code); setCouponError(""); }
  else { setCouponApplied(null); setCouponError(t(`couponError_${r.error}` as never) || t("couponInvalid")); }
};
const removeCoupon = () => { setCouponApplied(null); setCouponCode(""); setCouponError(""); };
// pass to panel: couponApplied couponError onCouponApply={applyCoupon} onCouponRemove={removeCoupon}
// pass to modal: coupon={couponApplied}
// startCheckout body: JSON.stringify(couponApplied?.ok ? { course_id: courseId, coupon_code: couponApplied.coupon!.code } : { course_id: courseId })
```

Note: import from `@/src/lib/coupons/coupons` (Task 1 path). Map error codes to i18n keys `couponError_NOT_FOUND` etc. (Task 5 defines them).

2. `checkout-confirmation.tsx`: add prop `coupon: CouponValidation | null`; replace price `<p>` block (lines 114-116) with:

```tsx
{coupon?.ok ? (
  <div className="mt-2 space-y-0.5 text-sm font-bold text-[#075985]">
    <p className="flex justify-between"><span>{t("couponOriginal")}</span><span className="line-through opacity-70">{formatPrice(coupon.originalPrice, locale)}</span></p>
    <p className="flex justify-between text-emerald-600"><span>{t("couponDiscount", { code: coupon.coupon!.code })}</span><span>-{formatPrice(coupon.discount, locale)}</span></p>
    <p className="flex justify-between text-lg font-black"><span>{t("couponTotal")}</span><span>{formatPrice(coupon.finalPrice, locale)} <span className="text-xs">{t("currency")}</span></span></p>
  </div>
) : (
  <p className="mt-2 text-lg font-black text-[#075985]">{formatPrice(course.price, locale)} <span className="text-xs">{t("currency")}</span></p>
)}
```

Confirm button label: `{loading ? t("redirecting") : coupon?.ok ? t("continueToPaymentWithTotal", { total: formatPrice(coupon.finalPrice, locale) }) : t("continueToPayment")}` — fallback to plain key if i18n missing (Task 5 adds it).

3. `route.ts`: accept and forward coupon:

```ts
const rawCode = typeof body?.coupon_code === "string" ? body.coupon_code.trim().toUpperCase().slice(0, 20) : "";
// forward:
body: JSON.stringify(rawCode ? { course_id: courseId, coupon_code: rawCode } : { course_id: courseId }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/student/payments/checkout/route.test.ts src/lib/coupons/coupons.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/courses/components/course-detail.tsx src/features/courses/components/checkout-confirmation.tsx src/app/api/student/payments/checkout/route.ts
git commit -m "feat(student): apply coupon in checkout with discounted total"
```

### Task 5: Bilingual copy (ar/en) + full verification

**Files:**
- Modify: `src/messages/ar.json` (`courseDetail` block ~line 630)
- Modify: `src/messages/en.json` (mirror keys)
- Test: none new (verify existing suites)

**Interfaces:**
- Consumes: keys used in Tasks 2-4.
- Produces: all coupon keys present in both locales.

- [ ] **Step 1: Write the failing test**

```bash
python3 -c "import json; ar=json.load(open('src/messages/ar.json')); en=json.load(open('src/messages/en.json')); keys=['couponLabel','couponPlaceholder','couponApply','couponRemove','couponOriginal','couponDiscount','couponTotal','couponInvalid','couponError_NOT_FOUND','couponError_INACTIVE','couponError_EXPIRED','couponError_EXHAUSTED','continueToPaymentWithTotal']; missing=[k for k in keys if k not in ar.get('courseDetail',{}) or k not in en.get('courseDetail',{})]; print('MISSING:',missing); assert not missing"
```

Expected: FAIL with MISSING list (keys do not exist yet).

- [ ] **Step 2: Run test to verify it fails**

Run: the python command above.
Expected: FAIL, prints MISSING keys.

- [ ] **Step 3: Write minimal implementation**

Add to `courseDetail` in both files:

```json
"couponLabel": "كود الخصم" / "Coupon code",
"couponPlaceholder": "ادخل كود الخصم" / "Enter coupon code",
"couponApply": "تطبيق" / "Apply",
"couponRemove": "إزالة الكوبون" / "Remove coupon",
"couponOriginal": "السعر الأصلي" / "Original",
"couponDiscount": "خصم ({code})" / "Discount ({code})",
"couponTotal": "الإجمالي" / "Total",
"couponInvalid": "كود غير صالح" / "Invalid code",
"couponError_NOT_FOUND": "الكود غير موجود" / "Code not found",
"couponError_INACTIVE": "هذا الكود متوقف حالياً" / "This code is inactive",
"couponError_EXPIRED": "انتهت صلاحية هذا الكود" / "This code has expired",
"couponError_EXHAUSTED": "تم استنفاد استخدامات هذا الكود" / "This code has reached its usage limit",
"continueToPaymentWithTotal": "المتابعة إلى الدفع ({total})" / "Continue to payment ({total})"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit` then re-run the python keys check.
Expected: PASS (all suites green, MISSING: []).

- [ ] **Step 5: Commit**

```bash
git add src/messages/ar.json src/messages/en.json
git commit -m "feat(student): add coupon i18n copy ar/en"
```
