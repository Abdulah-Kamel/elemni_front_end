import { describe, expect, it } from "vitest";
import type { EnrollmentDto, LastWatchedDto } from "@/src/lib/student-api/contract";
import { resolveContinueWatching } from "./continue-watching";

const lw = (overrides: Partial<LastWatchedDto> = {}): LastWatchedDto => ({
  course_id: 5, course_title: "Physics 101", lesson_id: 12, lesson_title: "Kinematics",
  item_id: 42, item_title: "Lecture 1", last_position_sec: 872, watched_percent: 48,
  is_completed: false, last_watched_at: "2026-10-02T08:50:00Z", ...overrides,
});
const enrollment = (courseId: number) => ({ course_id: courseId, course: { id: courseId } }) as unknown as EnrollmentDto;

describe("resolveContinueWatching", () => {
  it("returns the enrollment for an unfinished, enrolled video", () => {
    const result = resolveContinueWatching(lw(), [enrollment(3), enrollment(5)]);
    expect(result?.enrollment.course_id).toBe(5);
    expect(result?.lastWatched.item_id).toBe(42);
  });
  it("ignores a course the student is not enrolled in", () => {
    expect(resolveContinueWatching(lw(), [enrollment(3)])).toBeNull();
  });
  it("ignores a completed video", () => {
    expect(resolveContinueWatching(lw({ is_completed: true }), [enrollment(5)])).toBeNull();
  });
  it("handles no data", () => {
    expect(resolveContinueWatching(undefined, [enrollment(5)])).toBeNull();
  });
});
