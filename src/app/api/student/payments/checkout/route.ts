import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { isCheckoutRedirectDto } from "@/src/lib/student-api/checkout";
import type { CheckoutRedirectDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const courseId = Number(body?.course_id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return Response.json({ detail: "معرّف الكورس غير صالح." }, { status: 400 });
  }

  const result = await authenticatedBackendFetch<CheckoutRedirectDto>(
    "/api/v1/payments/checkout",
    { method: "POST", body: JSON.stringify({ course_id: courseId }) },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  // The backend owns the payment contract: paid courses return a Kashier
  // hosted checkout URL, free courses return the relative "/my-courses".
  // Never trust or reshape anything else here.
  if (!isCheckoutRedirectDto(result.data)) {
    return Response.json({ detail: "تعذر بدء عملية الدفع حالياً." }, { status: 502 });
  }
  return Response.json(result.data);
}
