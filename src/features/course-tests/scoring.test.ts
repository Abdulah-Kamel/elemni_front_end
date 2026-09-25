import { describe, expect, it } from "vitest";
import { aggregatePercent, isBlankResponse, normalizeShortAnswer, percentOf, scoreQuestion } from "./scoring";

describe("course-test scoring", () => {
  it("scores single and true/false all-or-nothing", () => {
    expect(scoreQuestion("single", 2, "a", { option_id: "a" })).toEqual({ status: "correct", points: 2 });
    expect(scoreQuestion("true_false", 1, "b", { option_id: "a" })).toEqual({ status: "wrong", points: 0 });
  });

  it("gives no partial credit for multi", () => {
    expect(scoreQuestion("multi", 2, ["a", "b"], { option_ids: ["a", "b", "d"] })).toEqual({ status: "wrong", points: 0 });
    expect(scoreQuestion("multi", 2, ["d", "b", "a"], { option_ids: ["a", "b", "d"] })).toEqual({ status: "correct", points: 2 });
  });

  it("requires the exact order for ordering", () => {
    expect(scoreQuestion("ordering", 2, ["a", "b", "c"], { option_ids: ["a", "b", "c"] }).status).toBe("correct");
    expect(scoreQuestion("ordering", 2, ["b", "a", "c"], { option_ids: ["a", "b", "c"] }).status).toBe("wrong");
  });

  it("matches pairs regardless of the order they were chosen in", () => {
    const key = { matches: { a: "x", b: "y" } };
    expect(scoreQuestion("matching", 2, { b: "y", a: "x" }, key).status).toBe("correct");
    expect(scoreQuestion("matching", 2, { a: "y", b: "x" }, key).status).toBe("wrong");
    expect(scoreQuestion("matching", 2, { a: "x" }, key).status).toBe("wrong");
  });

  it("normalizes short answers", () => {
    expect(normalizeShortAnswer("  أحمد   مدرسة ")).toBe("احمد مدرسه");
    expect(normalizeShortAnswer("٥")).toBe("5");
    expect(scoreQuestion("short_answer", 2, " DEF ", { accepted: ["def"] }).status).toBe("correct");
    expect(scoreQuestion("short_answer", 2, "DEF", { accepted: ["def"], case_sensitive: true }).status).toBe("wrong");
    expect(scoreQuestion("short_answer", 1, "على", { accepted: ["علي"] }).status).toBe("correct");
  });

  it("treats blanks as 0 and leaves answered essays for the teacher", () => {
    expect(isBlankResponse({ a: "" })).toBe(true);
    expect(scoreQuestion("single", 2, null, { option_id: "a" })).toEqual({ status: "blank", points: 0 });
    expect(scoreQuestion("essay", 4, "نص", { model_answer: "" })).toEqual({ status: "pending", points: null });
    expect(scoreQuestion("essay", 4, "  ", { model_answer: "" })).toEqual({ status: "blank", points: 0 });
  });

  it("aggregates attempts by grading policy", () => {
    expect(percentOf(17, 20)).toBe(85);
    expect(aggregatePercent("highest", [40, 85, 60])).toBe(85);
    expect(aggregatePercent("last", [40, 85, 60])).toBe(60);
    expect(aggregatePercent("average", [40, 85, 60])).toBe(62);
    expect(aggregatePercent("highest", [])).toBeNull();
  });
});
