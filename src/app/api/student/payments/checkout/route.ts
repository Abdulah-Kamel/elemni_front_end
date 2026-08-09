import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const courseId = Number(body?.course_id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return Response.json({ detail: "معرّف الكورس غير صالح." }, { status: 400 });
  }

  const result = await authenticatedBackendFetch<{ redirect_url: string }>(
    "/api/v1/payments/checkout",
    { method: "POST", body: JSON.stringify({ course_id: courseId }) },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
