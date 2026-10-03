import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { VideoProgressDto } from "@/src/lib/student-api/contract";
import { invalidIdResponse, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function GET(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const itemId = parsePositiveId((await params).itemId);
  if (itemId === null) return invalidIdResponse();
  const result = await authenticatedBackendFetch<VideoProgressDto>(
    `/api/v1/video-analytics/my-progress/${itemId}`,
    { cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
