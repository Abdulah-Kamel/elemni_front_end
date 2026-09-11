import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { EnrollmentProgressDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId: rawCourseId } = await params;
  const courseId = Number(rawCourseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return Response.json({ detail: "معرّف الكورس غير صالح." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ detail: "بيانات التقدم غير صالحة." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Number.isInteger((body as { item_id?: unknown }).item_id) ||
    typeof (body as { completed?: unknown }).completed !== "boolean"
  ) {
    return Response.json({ detail: "بيانات التقدم غير مكتملة." }, { status: 400 });
  }

  const result = await authenticatedBackendFetch<EnrollmentProgressDto>(
    `/api/v1/my/courses/${courseId}/progress`,
    {
      method: "PUT",
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
