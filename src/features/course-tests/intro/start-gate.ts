// Whether the Start button is available, and why not. The backend decides the
// state; this only maps it (plus a live cooldown countdown) to UI.
import type { CourseTestDetail } from "../types";

export type StartBlock =
  | "in_progress"
  | "locked"
  | "scheduled"
  | "closed"
  | "pending_grading"
  | "attempts_exhausted"
  | "no_attempts_left"
  | "cooldown";

export function attemptsLeft(test: Pick<CourseTestDetail, "max_attempts" | "attempts">) {
  return test.max_attempts === null ? null : Math.max(0, test.max_attempts - test.attempts.length);
}

/**
 * @param cooldownRemaining seconds until `next_attempt_at` (null while unknown,
 * e.g. before hydration). The button re-enables when it reaches 0; the server
 * still validates the start request.
 */
export function startBlock(test: CourseTestDetail, cooldownRemaining: number | null): StartBlock | null {
  if (test.open_attempt || test.state === "in_progress") return "in_progress";
  if (test.state === "locked") return "locked";
  if (test.state === "scheduled") return "scheduled";
  if (test.state === "closed") return "closed";
  if (test.state === "pending_grading") return "pending_grading";
  if (test.state === "attempts_exhausted") return "attempts_exhausted";
  if (attemptsLeft(test) === 0) return "no_attempts_left";
  if (test.next_attempt_at && (cooldownRemaining === null || cooldownRemaining > 0)) return "cooldown";
  return null;
}
