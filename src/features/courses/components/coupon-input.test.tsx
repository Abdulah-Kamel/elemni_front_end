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
    render(<CouponInput applied={null} onApply={onApply} onRemove={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("couponPlaceholder"), { target: { value: "save20" } });
    fireEvent.click(screen.getByRole("button", { name: "couponApply" }));
    expect(onApply).toHaveBeenCalledWith("save20");
  });
  it("shows remove button when applied", () => {
    const applied = { ok: true, coupon: { code: "SAVE20" }, originalPrice: 500, discount: 100, finalPrice: 400, error: null } as never;
    render(<CouponInput applied={applied} onApply={() => {}} onRemove={() => {}} />);
    expect(screen.getByRole("button", { name: "couponRemove" })).toBeDefined();
  });
});
