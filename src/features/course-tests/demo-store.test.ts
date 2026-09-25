import { beforeEach, describe, expect, it } from "vitest";
import { getDemoAttempt, getDemoTest, resetDemoState, saveDemoAnswer, startDemoAttempt, submitDemoAttempt } from "./demo-store";

describe("student course-test local demo", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoState();
  });

  it("starts, saves, resumes, and submits a test using browser storage only", () => {
    const test = getDemoTest(12, 501);
    expect(test.student_test_state).toBe("not_started");
    const attempt = startDemoAttempt(501);
    expect(new Set(attempt.questions.map((question) => question.type))).toEqual(new Set(["single", "multi", "true_false", "short_answer", "essay", "ordering", "matching"]));
    expect(attempt.questions[0]).not.toHaveProperty("answer_key");
    saveDemoAnswer(attempt.id, attempt.questions[0].id, "a", true);

    const resumed = getDemoAttempt(attempt.id);
    expect(resumed?.questions[0]).toMatchObject({ response: "a", flagged: true });
    expect(submitDemoAttempt(attempt.id)).toMatchObject({ status: "pending_grading" });
    expect(getDemoTest(12, 501).attempts).toHaveLength(1);
  });
});
