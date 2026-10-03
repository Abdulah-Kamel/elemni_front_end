import { StudentApiError } from "./client";

export type VideoErrorKind =
  | "unauthenticated"
  | "watch-limit"
  | "not-enrolled"
  | "forbidden"
  | "session-lost"
  | "attempt-ended"
  | "processing"
  | "unavailable"
  | "transient";

// Detail strings come from elemni/src/video_analytics/service.py.
export function classifyVideoError(error: unknown): VideoErrorKind {
  if (!(error instanceof StudentApiError)) return "transient";
  const detail = error.detail ?? "";
  switch (error.status) {
    case 401:
      return "unauthenticated";
    case 403:
      if (detail.startsWith("Watch limit reached")) return "watch-limit";
      if (detail === "Not enrolled in this course") return "not-enrolled";
      return "forbidden";
    case 409:
      if (detail === "Session is no longer active") return "session-lost";
      if (detail === "Attempt has expired" || detail === "Attempt is no longer active") return "attempt-ended";
      if (detail === "Video stream is not ready") return "processing";
      return "unavailable";
    case 429:
    case 503:
      return "transient";
    default:
      return "unavailable";
  }
}

/** The request may or may not have reached the backend (network error or BFF timeout). */
export function isAmbiguousFailure(error: unknown) {
  return error instanceof StudentApiError && error.status === 503 && error.code === "SERVICE_UNAVAILABLE";
}
