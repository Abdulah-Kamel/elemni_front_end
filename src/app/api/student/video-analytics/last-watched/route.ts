import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { LastWatchedDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function GET() {
  const result = await authenticatedBackendFetch<LastWatchedDto>("/api/v1/video-analytics/last-watched", {
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
