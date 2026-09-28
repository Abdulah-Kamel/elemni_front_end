import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";
import type { CouponQuoteDto } from "@/src/lib/coupons/validate";

/** Forwards a coupon check to the backend, which owns coupons and prices. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const courseId = Number(body?.course_id);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase().slice(0, 20) : "";
  if (!Number.isInteger(courseId) || courseId <= 0 || !/^[A-Z0-9_-]{3,20}$/.test(code)) {
    return Response.json({ detail: "بيانات الكوبون غير صالحة." }, { status: 400 });
  }
  const result = await authenticatedBackendFetch<CouponQuoteDto>("/api/v1/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, course_id: courseId }),
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
