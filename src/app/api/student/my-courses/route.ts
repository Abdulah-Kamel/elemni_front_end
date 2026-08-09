import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { MyCoursesDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function GET() {
  const result = await authenticatedBackendFetch<MyCoursesDto>("/api/v1/my/courses", {
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
