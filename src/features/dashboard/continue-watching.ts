import type { EnrollmentDto, LastWatchedDto } from "@/src/lib/student-api/contract";

export function resolveContinueWatching(
  lastWatched: LastWatchedDto | undefined,
  enrollments: EnrollmentDto[],
): { lastWatched: LastWatchedDto; enrollment: EnrollmentDto } | null {
  if (!lastWatched || lastWatched.is_completed) return null;
  const enrollment = enrollments.find((entry) => entry.course_id === lastWatched.course_id);
  return enrollment ? { lastWatched, enrollment } : null;
}
