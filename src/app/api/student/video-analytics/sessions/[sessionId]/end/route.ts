import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { invalidIdResponse, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

// Called by fetch(keepalive) and navigator.sendBeacon; the body is never read.
export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionId = parsePositiveId((await params).sessionId);
  if (sessionId === null) return invalidIdResponse();
  const result = await authenticatedBackendFetch<{ status: string }>(
    `/api/v1/video-analytics/sessions/${sessionId}/end`,
    { method: "POST", cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
