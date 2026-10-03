import { studentApiFetch } from "./client";
import type {
  HeartbeatDto,
  HeartbeatRequestDto,
  LastWatchedDto,
  PlaybackDto,
  VideoProgressDto,
} from "./contract";

const BASE = "/api/student/video-analytics";

export const getLastWatched = () => studentApiFetch<LastWatchedDto>(`${BASE}/last-watched`);

export const getVideoProgress = (itemId: number) =>
  studentApiFetch<VideoProgressDto>(`${BASE}/items/${itemId}/progress`);

export function requestPlayback(itemId: number, positionSec?: number) {
  return studentApiFetch<PlaybackDto>(`${BASE}/items/${itemId}/playback`, {
    method: "POST",
    ...(positionSec === undefined ? {} : { body: JSON.stringify({ position_sec: positionSec }) }),
  });
}

export function sendHeartbeat(sessionId: number, body: HeartbeatRequestDto) {
  return studentApiFetch<HeartbeatDto>(`${BASE}/sessions/${sessionId}/heartbeat`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const endSessionUrl = (sessionId: number) => `${BASE}/sessions/${sessionId}/end`;

/** Best effort; never throws. `beacon` is for pagehide, where fetch may be cancelled. */
export async function endSession(sessionId: number, { beacon = false }: { beacon?: boolean } = {}) {
  const url = endSessionUrl(sessionId);
  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    if (navigator.sendBeacon(url)) return;
  }
  await fetch(url, { method: "POST", keepalive: true, cache: "no-store" }).catch(() => undefined);
}
