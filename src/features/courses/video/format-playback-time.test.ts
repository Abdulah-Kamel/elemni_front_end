import { describe, expect, it } from "vitest";
import { formatPlaybackTime } from "./format-playback-time";

describe("formatPlaybackTime", () => {
  it.each([
    [0, "0:00"], [5.9, "0:05"], [65, "1:05"], [872, "14:32"],
    [3600, "1:00:00"], [3725, "1:02:05"], [-3, "0:00"], [Number.NaN, "0:00"],
  ])("%s → %s", (input, expected) => {
    expect(formatPlaybackTime(input)).toBe(expected);
  });
});
