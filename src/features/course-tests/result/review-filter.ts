import { isBlankResponse } from "../scoring";
import type { ReviewQuestion, ReviewStatus } from "../types";

export type ReviewFilter = "all" | "correct" | "wrong" | "blank";

export const REVIEW_FILTERS: ReviewFilter[] = ["all", "correct", "wrong", "blank"];

/**
 * Which tab a status belongs to besides "all". Partial credit counts as
 * "wrong" (the student lost points there); pending essays only show under "all".
 */
export function filterForStatus(status: ReviewStatus): Exclude<ReviewFilter, "all"> | null {
  if (status === "correct") return "correct";
  if (status === "wrong" || status === "partial") return "wrong";
  if (status === "blank") return "blank";
  return null;
}

export function matchesFilter(question: ReviewQuestion, filter: ReviewFilter) {
  return filter === "all" || filterForStatus(question.status) === filter;
}

export function countByFilter(questions: ReviewQuestion[]): Record<ReviewFilter, number> {
  const counts: Record<ReviewFilter, number> = { all: questions.length, correct: 0, wrong: 0, blank: 0 };
  for (const question of questions) {
    const filter = filterForStatus(question.status);
    if (filter) counts[filter]++;
  }
  return counts;
}

/** A multi-select answer that picked only correct options but missed some. */
export function isIncompleteAnswer(question: ReviewQuestion) {
  if (question.type !== "multi" || question.status !== "wrong") return false;
  const given = question.response;
  const expected = question.correct_response;
  if (!Array.isArray(given) || !Array.isArray(expected) || isBlankResponse(given)) return false;
  return given.every((id) => expected.includes(id)) && given.length < expected.length;
}

export type StatusLabelKey = "correct" | "wrong" | "incomplete" | "partial" | "blank" | "pending";

export function statusLabelKey(question: ReviewQuestion): StatusLabelKey {
  return isIncompleteAnswer(question) ? "incomplete" : question.status;
}
