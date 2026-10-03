import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { HeartbeatDto, HeartbeatRequestDto } from "@/src/lib/student-api/contract";
import { invalidIdResponse, isNonNegativeFinite, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

const STATES = new Set(["playing", "paused", "ended"]);
const invalidHeartbeat = () => Response.json({ code: "INVALID_HEARTBEAT" }, { status: 400 });

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionId = parsePositiveId((await params).sessionId);
  if (sessionId === null) return invalidIdResponse();

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return invalidHeartbeat();
  }
  const candidate = (parsed ?? {}) as Partial<Record<keyof HeartbeatRequestDto, unknown>>;
  if (
    !Number.isSafeInteger(candidate.sequence) ||
    (candidate.sequence as number) < 1 ||
    !isNonNegativeFinite(candidate.position_sec) ||
    typeof candidate.state !== "string" ||
    !STATES.has(candidate.state)
  ) {
    return invalidHeartbeat();
  }
  const body: HeartbeatRequestDto = {
    sequence: candidate.sequence as number,
    position_sec: candidate.position_sec,
    state: candidate.state as HeartbeatRequestDto["state"],
  };

  const result = await authenticatedBackendFetch<HeartbeatDto>(
    `/api/v1/video-analytics/sessions/${sessionId}/heartbeat`,
    { method: "POST", body: JSON.stringify(body), cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
