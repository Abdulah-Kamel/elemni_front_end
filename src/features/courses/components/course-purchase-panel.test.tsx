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
