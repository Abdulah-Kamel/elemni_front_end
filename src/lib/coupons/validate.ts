// Coupon checks for the student checkout. The backend owns coupons: it
// validates the code for this student and course and returns the discount
// and final price, and it applies the same coupon again at checkout.
import { getEffectiveCoupons, normalizeCode, validateCoupon, type CouponError, type CouponValidation } from "./coupons";

/** Local seed coupons are a development demo only. */
export const isCouponsDemo =
  process.env.NEXT_PUBLIC_COUPONS_DEMO === "1" || process.env.NEXT_PUBLIC_COURSE_TESTS_DEMO === "1";

/** POST /api/v1/coupons/validate response (spec: elemni_dashboard/docs/coupons-api.md). */
export interface CouponQuoteDto {
  valid: boolean;
  code: string;
  original_price: string;
  discount_amount: string;
  final_price: string;
  currency: string;
  error_code: CouponError | null;
}

const KNOWN_ERRORS: CouponError[] = ["NOT_FOUND", "INACTIVE", "EXPIRED", "EXHAUSTED", "NOT_APPLICABLE", "ALREADY_USED", "MIN_PRICE", "UNAVAILABLE"];

function failure(originalPrice: number, error: CouponError): CouponValidation {
  return { ok: false, coupon: null, originalPrice, discount: 0, finalPrice: originalPrice, error };
}

export function quoteToValidation(quote: CouponQuoteDto, fallbackPrice: number): CouponValidation {
  const originalPrice = Number(quote.original_price);
  const price = Number.isFinite(originalPrice) ? originalPrice : fallbackPrice;
  if (!quote.valid) {
    const error = quote.error_code && KNOWN_ERRORS.includes(quote.error_code) ? quote.error_code : "NOT_FOUND";
    return failure(price, error);
  }
  const discount = Number(quote.discount_amount);
  const finalPrice = Number(quote.final_price);
  if (!Number.isFinite(discount) || !Number.isFinite(finalPrice)) return failure(price, "UNAVAILABLE");
  return { ok: true, coupon: { code: quote.code }, originalPrice: price, discount, finalPrice, error: null };
}

export async function checkCoupon(code: string, courseId: number, displayedPrice: number): Promise<CouponValidation> {
  const normalized = normalizeCode(code);
  if (isCouponsDemo) return validateCoupon(normalized, displayedPrice, new Date(), getEffectiveCoupons());

  let response: Response;
  try {
    response = await fetch("/api/student/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalized, course_id: courseId }),
    });
  } catch {
    return failure(displayedPrice, "UNAVAILABLE");
  }
  if (!response.ok) return failure(displayedPrice, response.status === 400 || response.status === 422 ? "NOT_FOUND" : "UNAVAILABLE");
  const body = (await response.json().catch(() => null)) as CouponQuoteDto | null;
  return body && typeof body.valid === "boolean" ? quoteToValidation(body, displayedPrice) : failure(displayedPrice, "UNAVAILABLE");
}
