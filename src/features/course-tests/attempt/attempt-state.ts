// Pure helpers for the attempt player: answer state, navigation rules, counts.
import { isBlankResponse } from "../scoring";
import type { AnswerResponse, AttemptQuestion } from "../types";
import type { PendingAnswers } from "./autosave-queue";

export type LocalAnswer = { response: AnswerResponse; flagged: boolean };
export type LocalAnswers = Record<number, LocalAnswer>;

export const isAnswered = (answer: LocalAnswer | undefined) => !isBlankResponse(answer?.response ?? null);

/**
 * Server answers with unsent local changes on top. A pending entry is by
 * definition unacknowledged, so it wins — unless the server reports a newer
 * client_version for that question (e.g. saved from another tab).
 */
export function mergePending(questions: AttemptQuestion[], pending: PendingAnswers): LocalAnswers {
  const answers: LocalAnswers = {};
  for (const question of questions) {
    const local = pending[String(question.id)];
    const serverVersion = question.client_version;
    answers[question.id] = local && local.client_version > serverVersion
      ? { response: local.response, flagged: local.flagged }
      : { response: question.response, flagged: question.flagged };
  }
  return answers;
}

export type AttemptSummary = {
  total: number;
  answered: number;
  /** Zero-based indexes. */
  unanswered: number[];
  flagged: number[];
};

export function summarize(questions: AttemptQuestion[], answers: LocalAnswers): AttemptSummary {
  const unanswered: number[] = [];
  const flagged: number[] = [];
  questions.forEach((question, index) => {
    const answer = answers[question.id];
    if (!isAnswered(answer)) unanswered.push(index);
    if (answer?.flagged) flagged.push(index);
  });
  return { total: questions.length, answered: questions.length - unanswered.length, unanswered, flagged };
}

/** Backward jumps are blocked when the test disables back navigation. */
export function canNavigateTo(current: number, target: number, total: number, allowBack: boolean) {
  if (target < 0 || target >= total || target === current) return false;
  return allowBack || target > current;
}

/** Unanswered questions the student already moved past (the navigator hint). */
export function skippedUnanswered(summary: AttemptSummary, furthestVisited: number) {
  return summary.unanswered.filter((index) => index < furthestVisited);
}

/** Move one item; used by the ordering buttons and tests. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
