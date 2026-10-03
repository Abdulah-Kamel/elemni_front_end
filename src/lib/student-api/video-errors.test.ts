import { describe, expect, it } from "vitest";
import { StudentApiError } from "./client";
import { classifyVideoError, isAmbiguousFailure } from "./video-errors";

const err = (status: number, detail?: string, code = `BACKEND_ERROR_${status}`) =>
  new StudentApiError(status, code, detail);

describe("classifyVideoError", () => {
  it.each([
    [err(401, undefined, "SESSION_EXPIRED"), "unauthenticated"],
    [err(403, "Watch limit reached (2)"), "watch-limit"],
    [err(403, "Not enrolled in this course"), "not-enrolled"],
    [err(403, "Not authorized"), "forbidden"],
    [err(403, "Account is disabled"), "forbidden"],
    [err(409, "Session is no longer active"), "session-lost"],
    [err(409, "Attempt has expired"), "attempt-ended"],
    [err(409, "Attempt is no longer active"), "attempt-ended"],
    [err(409, "Video stream is not ready"), "processing"],
    [err(409, "Video stream is not configured"), "unavailable"],
    [err(409, "Video duration is unavailable"), "unavailable"],
    [err(409, "Reserved grant is unavailable"), "unavailable"],
    [err(429, "Heartbeat throttled"), "transient"],
    [err(503, "Database transaction conflict; please retry"), "transient"],
    [err(503, undefined, "SERVICE_UNAVAILABLE"), "transient"],
    [err(404, "Video not found"), "unavailable"],
    [err(422, "Invalid playback position"), "unavailable"],
    [new TypeError("boom"), "transient"],
  ])("classifies %o as %s", (error, kind) => {
    expect(classifyVideoError(error)).toBe(kind);
  });
});

describe("isAmbiguousFailure", () => {
  it("is true only for the BFF/network SERVICE_UNAVAILABLE", () => {
    expect(isAmbiguousFailure(err(503, undefined, "SERVICE_UNAVAILABLE"))).toBe(true);
    expect(isAmbiguousFailure(err(503, "Database transaction conflict; please retry"))).toBe(false);
    expect(isAmbiguousFailure(err(429))).toBe(false);
    expect(isAmbiguousFailure(new TypeError("x"))).toBe(false);
  });
});
