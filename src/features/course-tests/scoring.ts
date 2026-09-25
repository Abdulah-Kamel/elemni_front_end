// Scoring used by the local demo client only. In production the backend
// scores attempts; this mirrors the spec rules so the demo behaves the same.
import type { AnswerResponse, QuestionType } from "./types";

export type AnswerKey =
  | { option_id: string }
  | { option_ids: string[] }
  | { accepted: string[]; case_sensitive?: boolean }
  | { matches: Record<string, string> }
  | { model_answer: string; rubric?: { criterion: string; points: number }[] | string };

export type ScoreOutcome = { status: "correct" | "wrong" | "blank" | "pending"; points: number | null };

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeShortAnswer(value: string, caseSensitive = false) {
  const text = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
  return caseSensitive ? text : text.toLocaleLowerCase();
}

export function isBlankResponse(value: AnswerResponse | undefined) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return Object.values(value).every((item) => !item);
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function isCorrect(type: QuestionType, response: AnswerResponse, key: AnswerKey): boolean {
  switch (type) {
    case "single":
    case "true_false":
      return "option_id" in key && response === key.option_id;
    case "multi":
      return "option_ids" in key && Array.isArray(response) && sameSet(response, key.option_ids);
    case "ordering":
      return "option_ids" in key && Array.isArray(response) && response.length === key.option_ids.length && response.every((id, index) => id === key.option_ids[index]);
    case "short_answer":
      if (!("accepted" in key) || typeof response !== "string") return false;
      return key.accepted.some((accepted) => normalizeShortAnswer(accepted, key.case_sensitive) === normalizeShortAnswer(response, key.case_sensitive));
    case "matching": {
      if (!("matches" in key) || !response || typeof response !== "object" || Array.isArray(response)) return false;
      const given = response as Record<string, string>;
      const expected = Object.entries(key.matches);
      return expected.length === Object.keys(given).length && expected.every(([left, right]) => given[left] === right);
    }
    default:
      return false;
  }
}

/** All-or-nothing per question; essays wait for the teacher. */
export function scoreQuestion(type: QuestionType, points: number, response: AnswerResponse, key: AnswerKey): ScoreOutcome {
  if (type === "essay") return isBlankResponse(response) ? { status: "blank", points: 0 } : { status: "pending", points: null };
  if (isBlankResponse(response)) return { status: "blank", points: 0 };
  return isCorrect(type, response, key) ? { status: "correct", points } : { status: "wrong", points: 0 };
}

export function percentOf(score: number, max: number) {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

export function aggregatePercent(policy: "highest" | "last" | "average", percents: number[]) {
  if (!percents.length) return null;
  if (policy === "last") return percents[percents.length - 1];
  if (policy === "average") return Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);
  return Math.max(...percents);
}
