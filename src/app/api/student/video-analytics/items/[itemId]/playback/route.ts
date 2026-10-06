import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { PlaybackDto } from "@/src/lib/student-api/contract";
import { invalidIdResponse, isNonNegativeFinite, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

const invalidPlayback = () => Response.json({ code: "INVALID_PLAYBACK" }, { status: 400 });

export async function POST(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const itemId = parsePositiveId((await params).itemId);
  if (itemId === null) return invalidIdResponse();

  // An absent body means "keep the backend checkpoint"; never inject position 0.
  const raw = await request.text();
  let body: string | undefined;
  if (raw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return invalidPlayback();
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return invalidPlayback();
    const position = (parsed as { position_sec?: unknown }).position_sec;
    if (!isNonNegativeFinite(position)) return invalidPlayback();
    body = JSON.stringify({ position_sec: position });
  }

  const result = await authenticatedBackendFetch<PlaybackDto>(
    `/api/v1/video-analytics/videos/${itemId}/playback`,
    { method: "POST", ...(body ? { body } : {}), cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
