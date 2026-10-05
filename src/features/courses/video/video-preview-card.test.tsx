import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/src/messages/en.json";
import ar from "@/src/messages/ar.json";
import type { VideoProgressDto } from "@/src/lib/student-api/contract";
import VideoPreviewCard, { resolvePreviewVariant } from "./video-preview-card";

afterEach(cleanup);

const progress = (overrides: Partial<VideoProgressDto> = {}): VideoProgressDto => ({
  item_id: 42, attempt_id: null, attempt_status: "none", last_position_sec: 0, watched_percent: 0,
  completed_attempts: 0, allowance_remaining: null, allowance_source: null,
  last_watched_at: null, completed_at: null, ...overrides,
});

function renderCard(state: Parameters<typeof VideoPreviewCard>[0]["state"], locale: "en" | "ar" = "en", durationSec?: number) {
  const onStart = vi.fn();
  const onRetry = vi.fn();
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      <VideoPreviewCard state={state} onStart={onStart} onRetry={onRetry} durationSec={durationSec} />
    </NextIntlClientProvider>,
  );
  return { onStart, onRetry };
}

describe("resolvePreviewVariant", () => {
  it.each([
    [75, 0, { kind: "start" }],
    [72, 0, { kind: "start" }],
    [75, 1, { kind: "completed" }],
    [60, 0, { kind: "resume", positionSec: 60 }],
    [71, 0, { kind: "resume", positionSec: 71 }],
  ])("uses duration to resolve position %s with %s completed attempts", (position, completed, expected) => {
    expect(resolvePreviewVariant(progress({ attempt_status: "active", last_position_sec: position, completed_attempts: completed }), 75))
      .toEqual(expected);
  });

  it.each([
    [progress({ allowance_remaining: 0, attempt_status: "completed", completed_attempts: 2 }), { kind: "watch-limit" }],
    [progress({ allowance_remaining: 0, attempt_status: "active", last_position_sec: 50 }), { kind: "resume", positionSec: 50 }],
    [progress({ attempt_status: "active", last_position_sec: 872 }), { kind: "resume", positionSec: 872 }],
    [progress({ attempt_status: "completed", completed_attempts: 1, last_position_sec: 95 }), { kind: "completed" }],
    [progress({ attempt_status: "expired", last_position_sec: 40 }), { kind: "resume", positionSec: 40 }],
    [progress(), { kind: "start" }],
  ])("%o → %o", (input, expected) => {
    expect(resolvePreviewVariant(input)).toEqual(expected);
  });
});

describe("VideoPreviewCard", () => {
  it("plays from zero when the saved position is at the end", () => {
    const { onStart } = renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 75 }) }, "en", 75);
    expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onStart).toHaveBeenCalledWith(0);
  });

  it("resumes from the saved position", () => {
    const { onStart } = renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 872 }) });
    expect(screen.getByText((_, el) => el?.tagName === "P" && el.textContent === "Resume from 14:32")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(onStart).toHaveBeenCalledWith(872);
  });

  it("shows the watch-limit card without a play action", () => {
    renderCard({ kind: "ready", progress: progress({ allowance_remaining: 0, attempt_status: "none" }) });
    expect(screen.getByText("Watch limit reached")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /play|resume|watch again/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Contact us on WhatsApp" })).toBeInTheDocument();
  });

  it("shows the full watch-limit card after playback is denied", () => {
    renderCard({ kind: "error", reason: "watch-limit" });
    expect(screen.getByText("Watch limit reached")).toBeInTheDocument();
    expect(screen.getByText("Contact your teacher to request extra views.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact us on WhatsApp" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.courseDetail.retry })).toBeNull();
  });

  it("offers watch again from zero after completion, with remaining views", () => {
    const { onStart } = renderCard({ kind: "ready", progress: progress({ attempt_status: "completed", completed_attempts: 1, allowance_remaining: 1 }) });
    expect(screen.getByText("1 more view available")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Watch again" }));
    expect(onStart).toHaveBeenCalledWith(0);
  });

  it("shows processing copy with retry", () => {
    const { onRetry } = renderCard({ kind: "error", reason: "processing" });
    expect(screen.getByText(/still being processed/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: en.courseDetail.retry }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("offers resume from an interruption", () => {
    const { onStart } = renderCard({ kind: "interrupted", positionSec: 61 });
    expect(screen.getByText("Playback paused here")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(onStart).toHaveBeenCalledWith(61);
  });

  it("renders Arabic resume time and plurals", () => {
    renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 872, allowance_remaining: 2 }) }, "ar");
    const time = screen.getByText("14:32");
    expect(time.closest("[dir='ltr']")).not.toBeNull();
    expect(screen.getByText("متبقي مشاهدتين")).toBeInTheDocument();
  });

  it.each([[0, "مفيش مشاهدات إضافية"], [1, "متبقي مشاهدة واحدة"], [11, "متبقي 11 مشاهدة"]])("Arabic plural for %s", (count, text) => {
    renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 5, allowance_remaining: count === 0 ? 0 : count }) }, "ar");
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
