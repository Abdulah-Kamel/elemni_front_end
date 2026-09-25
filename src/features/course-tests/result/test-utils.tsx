import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import arMessages from "@/src/messages/ar.json";
import { courseTestMessages } from "@/src/messages/course-tests";
import type { AttemptResult, CourseTestDetail, ReviewQuestion } from "../types";

export const arCourseTests = courseTestMessages("ar");

export function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="ar" messages={{ ...arMessages, courseTests: arCourseTests }} timeZone="Africa/Cairo">
      {children}
    </NextIntlClientProvider>
  );
}

export const testDetail: CourseTestDetail = {
  id: 501,
  course_id: 7,
  title: "اختبار الدرس الأول",
  description: null,
  lesson_title: "lesson 1",
  item_index: 3,
  item_count: 4,
  prev_item: null,
  next_item: { id: 88, title: "lesson 2", kind: "video" },
  question_count: 10,
  total_points: 20,
  time_limit_minutes: 15,
  max_attempts: 3,
  pass_percent: 60,
  grading_policy: "highest",
  cooldown_minutes: 0,
  allow_back_navigation: true,
  opens_at: null,
  closes_at: null,
  state: "passed",
  prerequisites: [],
  next_attempt_at: null,
  attempts: [],
  open_attempt: null,
  best_percent: 85,
  server_now: "2026-09-26T09:00:00Z",
};

export function makeResult(overrides: Partial<AttemptResult> = {}): AttemptResult {
  return {
    id: 9001,
    test_id: 501,
    number: 2,
    status: "graded",
    auto_submitted: false,
    submitted_at: "2026-09-25T09:42:00.000Z",
    score_visible: true,
    score_auto: 17,
    score_total: 17,
    max_score: 20,
    percent: 85,
    passed: true,
    pass_percent: 60,
    correct_count: 8,
    wrong_count: 1,
    blank_count: 1,
    answered_count: 9,
    question_count: 10,
    duration_seconds: 684,
    max_attempts: 3,
    attempts_left: 1,
    is_best: true,
    grading_policy: "highest",
    points_to_pass: null,
    pending_essay_count: 0,
    pending_essay_points: 0,
    can_review: true,
    can_retry: true,
    next_attempt_at: null,
    review_topics: [],
    next_item: { id: 88, title: "lesson 2", kind: "video" },
    ...overrides,
  };
}

export function makeQuestion(overrides: Partial<ReviewQuestion> & Pick<ReviewQuestion, "id">): ReviewQuestion {
  return {
    type: "single",
    text: `سؤال ${overrides.id}`,
    code_snippet: null,
    image_url: null,
    points: 2,
    points_awarded: 2,
    status: "correct",
    options: [
      { id: "a", text: "int" },
      { id: "b", text: "str" },
    ],
    response: "a",
    correct_response: "a",
    explanation: null,
    feedback: null,
    ...overrides,
  };
}
