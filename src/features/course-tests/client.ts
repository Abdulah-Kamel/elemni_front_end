import type { Attempt, AttemptResult, AttemptReview, CourseTestDetail, CourseTestsProgress, SaveAnswerInput } from "./types";

export class CourseTestsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Every course-test read/write the student UI makes. See docs/specs/course-tests-api.md. */
export interface CourseTestsClient {
  getProgress(courseId: number): Promise<CourseTestsProgress | null>;
  getTest(courseId: number, testId: number): Promise<CourseTestDetail>;
  startAttempt(testId: number): Promise<Attempt>;
  getAttempt(attemptId: number): Promise<Attempt>;
  saveAnswer(attemptId: number, questionId: number, input: SaveAnswerInput): Promise<void>;
  submitAttempt(attemptId: number): Promise<AttemptResult>;
  getResult(attemptId: number): Promise<AttemptResult>;
  getReview(attemptId: number): Promise<AttemptReview>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/student/course-tests/${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store",
    });
  } catch {
    throw new CourseTestsApiError("network", 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new CourseTestsApiError(typeof body?.detail === "string" ? body.detail : "request_failed", response.status);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const httpCourseTestsClient: CourseTestsClient = {
  async getProgress(courseId) {
    try {
      return await request<CourseTestsProgress>(`my/courses/${courseId}/tests`);
    } catch {
      return null;
    }
  },
  getTest: (courseId, testId) => request(`my/courses/${courseId}/tests/${testId}`),
  startAttempt: (testId) => request(`tests/${testId}/attempts`, { method: "POST" }),
  getAttempt: (attemptId) => request(`attempts/${attemptId}`),
  saveAnswer: (attemptId, questionId, input) =>
    request(`attempts/${attemptId}/answers/${questionId}`, { method: "PUT", body: JSON.stringify(input) }),
  submitAttempt: (attemptId) => request(`attempts/${attemptId}/submit`, { method: "POST" }),
  getResult: (attemptId) => request(`attempts/${attemptId}/result`),
  getReview: (attemptId) => request(`attempts/${attemptId}/review`),
};

/** Local demo data is opt-in for development only; production always talks to the API. */
export const isCourseTestsDemo = process.env.NEXT_PUBLIC_COURSE_TESTS_DEMO === "1";

let demoClient: Promise<CourseTestsClient> | null = null;

export function getCourseTestsClient(): Promise<CourseTestsClient> {
  if (!isCourseTestsDemo) return Promise.resolve(httpCourseTestsClient);
  demoClient ??= import("./demo-client").then((module) => module.demoCourseTestsClient);
  return demoClient;
}
