import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { authenticatedBackendFetch, getAccessToken } from "@/src/lib/student-api/session";

/** Saves the student's grade, stream and subjects on the backend. */
export async function PUT(request: Request) {
  if (!(await getAccessToken())) return Response.json({ detail: "سجّل الدخول أولاً." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const gradeId = Number(body?.grade_id);
  const streamId = Number(body?.stream_id);
  const subjectIds: unknown = body?.subject_ids;
  if (
    !Number.isInteger(gradeId) || gradeId <= 0 ||
    !Number.isInteger(streamId) || streamId <= 0 ||
    !Array.isArray(subjectIds) || subjectIds.length > 50 ||
    !subjectIds.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return Response.json({ detail: "بيانات الملف الدراسي غير صالحة." }, { status: 400 });
  }
  const result = await authenticatedBackendFetch<unknown>("/api/v1/students/me/profile", {
    method: "PUT",
    body: JSON.stringify({ grade_id: gradeId, stream_id: streamId, subject_ids: subjectIds }),
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data ?? { ok: true });
}
