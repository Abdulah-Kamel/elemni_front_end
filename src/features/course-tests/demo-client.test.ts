import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoCourseTestsClient as client, resetCourseTestsDemo } from "./demo-client";

describe("course-test demo client", () => {
  beforeEach(() => {
    localStorage.clear();
    resetCourseTestsDemo();
    vi.useRealTimers();
  });

  async function passLessonOne() {
    const attempt = await client.startAttempt(501);
    const answers: Record<number, string | string[]> = { 5011: "b", 5012: "a", 5013: "a", 5014: ["a", "b", "d"], 5015: "b", 5016: "b", 5017: "a" };
    for (const [id, response] of Object.entries(answers)) {
      await client.saveAnswer(attempt.id, Number(id), { response, flagged: false, client_version: 1 });
    }
    return client.submitAttempt(attempt.id);
  }

  it("runs the full passed flow and unlocks the final exam", async () => {
    expect((await client.getTest(12, 502)).state).toBe("locked");
    const result = await passLessonOne();
    expect(result).toMatchObject({ status: "graded", percent: 70, passed: true, correct_count: 7, blank_count: 3 });
    expect((await client.getTest(12, 501)).state).toBe("passed");
    expect((await client.getTest(12, 502)).state).toBe("not_started");
    // Submitting twice is idempotent.
    expect((await client.submitAttempt(result.id)).percent).toBe(70);
  });

  it("never exposes answer keys or explanations before submission", async () => {
    await passLessonOne();
    const attempt = await client.startAttempt(502);
    const payload = JSON.stringify(attempt);
    for (const leaked of ["answer_key", "key", "explanation", "accepted", "model_answer", "matches", "is_correct", "rubric"]) {
      expect(payload).not.toContain(`"${leaked}"`);
    }
    expect(attempt.questions.find((question) => question.type === "matching")?.right_options).toHaveLength(3);
  });

  it("holds essay attempts in pending grading", async () => {
    await passLessonOne();
    const attempt = await client.startAttempt(502);
    await client.saveAnswer(attempt.id, 5024, { response: "list قابلة للتعديل و tuple ثابتة", flagged: false, client_version: 1 });
    const result = await client.submitAttempt(attempt.id);
    expect(result).toMatchObject({ status: "pending_grading", percent: null, pending_essay_count: 1, pending_essay_points: 4 });
    expect((await client.getTest(12, 502)).state).toBe("pending_grading");
  });

  it("ignores stale autosaves and rejects a second open attempt", async () => {
    const attempt = await client.startAttempt(501);
    await client.saveAnswer(attempt.id, 5011, { response: "b", flagged: true, client_version: 5 });
    await client.saveAnswer(attempt.id, 5011, { response: "a", flagged: false, client_version: 3 });
    expect((await client.getAttempt(attempt.id)).questions[0]).toMatchObject({ response: "b", flagged: true });
    await expect(client.startAttempt(501)).rejects.toMatchObject({ status: 409 });
  });

  it("enforces max attempts and reports review topics on failure", async () => {
    for (let index = 0; index < 3; index++) {
      const attempt = await client.startAttempt(501);
      const result = await client.submitAttempt(attempt.id);
      expect(result.passed).toBe(false);
      expect(result.review_topics.length).toBeGreaterThan(0);
      expect(result.points_to_pass).toBe(12);
    }
    expect((await client.getTest(12, 501)).state).toBe("attempts_exhausted");
    await expect(client.startAttempt(501)).rejects.toMatchObject({ status: 403 });
  });

  it("keeps the scheduled test closed", async () => {
    const test = await client.getTest(12, 503);
    expect(test.state).toBe("scheduled");
    await expect(client.startAttempt(503)).rejects.toMatchObject({ status: 403 });
  });

  it("auto-submits an expired attempt on the next read", async () => {
    const attempt = await client.startAttempt(501);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(Date.now() + 16 * 60_000);
    const result = await client.getResult(attempt.id);
    expect(result).toMatchObject({ status: "graded", auto_submitted: true });
    await expect(client.saveAnswer(attempt.id, 5011, { response: "b", flagged: false, client_version: 9 })).rejects.toMatchObject({ status: 409 });
  });
});
