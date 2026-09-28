import { afterEach, describe, expect, it, vi } from "vitest";
import { checkCoupon, quoteToValidation } from "./validate";

const quote = { valid: true, code: "SAVE20", original_price: "200.00", discount_amount: "40.00", final_price: "160.00", currency: "EGP", error_code: null };

describe("coupon quotes from the backend", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the server's numbers, not a local calculation", () => {
    expect(quoteToValidation(quote, 999)).toEqual({ ok: true, coupon: { code: "SAVE20" }, originalPrice: 200, discount: 40, finalPrice: 160, error: null });
  });

  it("maps server rejections to known errors", () => {
    expect(quoteToValidation({ ...quote, valid: false, error_code: "ALREADY_USED" }, 200)).toMatchObject({ ok: false, error: "ALREADY_USED", finalPrice: 200 });
    expect(quoteToValidation({ ...quote, valid: false, error_code: "SOMETHING_NEW" as never }, 200)).toMatchObject({ ok: false, error: "NOT_FOUND" });
  });

  it("calls the BFF route with the normalised code and course", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(quote), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await checkCoupon(" save20 ", 12, 200);
    expect(fetchMock).toHaveBeenCalledWith("/api/student/coupons/validate", expect.objectContaining({ method: "POST", body: JSON.stringify({ code: "SAVE20", course_id: 12 }) }));
    expect(result).toMatchObject({ ok: true, finalPrice: 160 });
  });

  it("reports coupons as unavailable when the backend has no coupon service", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    await expect(checkCoupon("SAVE20", 12, 200)).resolves.toMatchObject({ ok: false, error: "UNAVAILABLE", finalPrice: 200 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(checkCoupon("SAVE20", 12, 200)).resolves.toMatchObject({ ok: false, error: "UNAVAILABLE" });
  });
});
