import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AttemptQuestion } from "../types";
import { canNavigateTo, moveItem, skippedUnanswered, summarize } from "./attempt-state";
import { crossedThreshold, isTimeWarning, useTimerAnnouncement } from "./timer";

describe("timer thresholds", () => {
  it("reports only the 5, 2 and 1 minute crossings", () => {
    expect(crossedThreshold(301, 300)).toBe(300);
    expect(crossedThreshold(300, 299)).toBeNull();
    expect(crossedThreshold(121, 120)).toBe(120);
    expect(crossedThreshold(61, 60)).toBe(60);
    expect(crossedThreshold(59, 58)).toBeNull();
    expect(crossedThreshold(200, 199)).toBeNull();
    // A throttled tab jumping over two marks announces the lower one.
    expect(crossedThreshold(310, 100)).toBe(120);
    expect(crossedThreshold(null, 300)).toBeNull();
    expect(crossedThreshold(290, 300)).toBeNull();
  });

  it("switches to the warning state under two minutes", () => {
    expect(isTimeWarning(120)).toBe(false);
    expect(isTimeWarning(119)).toBe(true);
    expect(isTimeWarning(null)).toBe(false);
  });

  it("announces once per threshold, not on every tick or on load", () => {
    const { result, rerender } = renderHook(({ seconds }) => useTimerAnnouncement(seconds), { initialProps: { seconds: 250 as number | null } });
    expect(result.current).toBeNull();
    const seen: (number | null)[] = [null];
    for (let seconds = 249; seconds >= 0; seconds--) {
      act(() => rerender({ seconds }));
      if (result.current !== seen.at(-1)) seen.push(result.current);
    }
    expect(seen).toEqual([null, 2, 1]);
  });
});

const q = (id: number): AttemptQuestion => ({ id, type: "single", text: "", code_snippet: null, image_url: null, points: 1, options: [], response: null, flagged: false, client_version: 0 });

describe("navigation rules", () => {
  it("locks backward jumps when back navigation is disabled", () => {
    expect(canNavigateTo(3, 2, 10, false)).toBe(false);
    expect(canNavigateTo(3, 0, 10, false)).toBe(false);
    expect(canNavigateTo(3, 4, 10, false)).toBe(true);
    expect(canNavigateTo(3, 9, 10, false)).toBe(true);
    expect(canNavigateTo(3, 2, 10, true)).toBe(true);
    expect(canNavigateTo(3, 3, 10, true)).toBe(false);
    expect(canNavigateTo(3, 10, 10, true)).toBe(false);
  });

  it("summarizes answered, unanswered and flagged questions", () => {
    const summary = summarize([q(1), q(2), q(3), q(4)], {
      1: { response: "a", flagged: false },
      2: { response: [], flagged: true },
      3: { response: { l: "r" }, flagged: true },
      4: { response: "   ", flagged: false },
    });
    expect(summary).toEqual({ total: 4, answered: 2, unanswered: [1, 3], flagged: [1, 2] });
    expect(skippedUnanswered(summary, 2)).toEqual([1]);
  });

  it("moves ordering items", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
  });
});
