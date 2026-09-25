import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AttemptResult } from "../types";
import { AttemptResultView, RESULT_POLL_MS } from "./attempt-result-view";
import { IntlWrapper, makeResult, testDetail } from "./test-utils";

const state = vi.hoisted(() => ({
  query: { isPending: false, data: undefined as AttemptResult | undefined, refetch: vi.fn() },
  invalidate: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useAttemptResult: () => state.query,
  useInvalidateCourseTests: () => state.invalidate,
}));

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function renderResult(result: AttemptResult | undefined, handlers = { onReview: vi.fn(), onRetry: vi.fn() }) {
  state.query.data = result;
  const view = render(
    <IntlWrapper>
      <AttemptResultView test={testDetail} attemptId={result?.id ?? 1} onReview={handlers.onReview} onRetry={handlers.onRetry} />
    </IntlWrapper>,
  );
  return { ...view, ...handlers };
}

describe("AttemptResultView", () => {
  beforeEach(() => {
    state.query = { isPending: false, data: undefined, refetch: vi.fn() };
    state.invalidate = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders a passed result with score, meta, stats and CTAs", () => {
    const { onReview } = renderResult(makeResult());

    expect(screen.getByRole("heading", { name: "أحسنت! اجتزت الاختبار" })).toBeInTheDocument();
    expect(screen.getByText("ناجح")).toBeInTheDocument();
    expect(screen.getByText("درجتك 85% · 17 من 20")).toBeInTheDocument();
    expect(screen.getByText("درجة النجاح 60% · المحاولة 2 من 3 · هذه أعلى درجة لك")).toBeInTheDocument();
    expect(screen.getByText("11:24")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /المتابعة إلى lesson 2/ })).toHaveAttribute("href", "/my-courses/7?item=88");

    fireEvent.click(screen.getByRole("button", { name: "مراجعة الإجابات" }));
    expect(onReview).toHaveBeenCalledWith(9001);

    expect(screen.getByText("تريد تحسين درجتك؟")).toBeInTheDocument();
    expect(screen.getByText("تبقّت لك محاولة واحدة · تُحتسب أعلى درجة")).toBeInTheDocument();
    expect(screen.queryByText(/سُلِّمت تلقائياً/)).not.toBeInTheDocument();
  });

  it("hides retry and review when not allowed", () => {
    renderResult(makeResult({ can_retry: false, can_review: false, attempts_left: 0 }));

    expect(screen.queryByRole("button", { name: "مراجعة الإجابات" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إعادة المحاولة" })).not.toBeInTheDocument();
    expect(screen.queryByText("تريد تحسين درجتك؟")).not.toBeInTheDocument();
  });

  it("renders a failed result with missing points, attempts left and review topics", () => {
    const { onRetry } = renderResult(
      makeResult({
        number: 1,
        percent: 40,
        passed: false,
        score_total: 8,
        points_to_pass: 4,
        attempts_left: 2,
        is_best: false,
        correct_count: 4,
        wrong_count: 5,
        auto_submitted: true,
        review_topics: [
          { id: 9101, title: "العمليات الحسابية", kind: "video", wrong_count: 2 },
          { id: 502, title: "أنواع البيانات", kind: "test", wrong_count: 3 },
        ],
      }),
    );

    expect(screen.getByRole("heading", { name: "لم تجتز الاختبار هذه المرة" })).toBeInTheDocument();
    expect(screen.getByText(/ينقصك 4 درجات فقط/)).toBeInTheDocument();
    expect(screen.getByText("المحاولة 1 من 3 · تبقّت محاولتان")).toBeInTheDocument();
    expect(screen.getByText("سُلِّمت تلقائياً عند انتهاء الوقت")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "راجع قبل المحاولة التالية" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /العمليات الحسابية/ })).toHaveAttribute("href", "/my-courses/7?item=9101");
    expect(screen.getByRole("link", { name: /أنواع البيانات/ })).toHaveAttribute("href", "/my-courses/7/tests/502");
    expect(screen.getByText("أخطأت في سؤالين · فيديو")).toBeInTheDocument();
    expect(screen.getByText("أخطأت في 3 أسئلة · اختبار")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the cooldown instead of retry while the next attempt is blocked", () => {
    renderResult(makeResult({ percent: 40, passed: false, score_total: 8, points_to_pass: 4, next_attempt_at: "2026-09-28T08:00:00.000Z" }));

    expect(screen.queryByRole("button", { name: "إعادة المحاولة" })).not.toBeInTheDocument();
    expect(screen.getByText(/المحاولة التالية متاحة/)).toBeInTheDocument();
  });

  it("shows the submitted state without a score when the score is hidden", () => {
    renderResult(makeResult({ score_visible: false }));

    expect(screen.getByRole("heading", { name: "تم تسليم إجاباتك" })).toBeInTheDocument();
    expect(screen.queryByText(/85%/)).not.toBeInTheDocument();
    expect(screen.queryByText("ناجح")).not.toBeInTheDocument();
    expect(screen.queryByText("إجابات صحيحة")).not.toBeInTheDocument();
  });

  it("renders the pending timeline, subtotal and essay counts, and polls until graded", () => {
    vi.useFakeTimers();
    renderResult(
      makeResult({
        status: "pending_grading",
        percent: null,
        passed: null,
        score_total: null,
        score_auto: 14,
        pending_essay_count: 2,
        pending_essay_points: 4,
      }),
    );

    expect(screen.getByRole("heading", { name: "تم تسليم إجاباتك" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "مراحل التصحيح" })).toBeInTheDocument();
    expect(screen.getByText(/قيد التصحيح/).closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("من 16 درجة")).toBeInTheDocument();
    expect(screen.getByText("أسئلة · 4 درجات")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عرض إجاباتي" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(RESULT_POLL_MS);
    });
    expect(state.query.refetch).toHaveBeenCalledTimes(1);
  });

  it("does not poll a graded result", () => {
    vi.useFakeTimers();
    renderResult(makeResult());
    act(() => {
      vi.advanceTimersByTime(RESULT_POLL_MS * 2);
    });
    expect(state.query.refetch).not.toHaveBeenCalled();
  });

  it("announces the final result and refreshes caches once grading lands", () => {
    const pending = makeResult({ status: "pending_grading", percent: null, passed: null, score_total: null, pending_essay_count: 1, pending_essay_points: 4 });
    const { rerender } = renderResult(pending);
    state.query.data = makeResult();
    rerender(
      <IntlWrapper>
        <AttemptResultView test={testDetail} attemptId={9001} onReview={vi.fn()} onRetry={vi.fn()} />
      </IntlWrapper>,
    );

    expect(screen.getByText("صدرت نتيجتك النهائية")).toBeInTheDocument();
    expect(state.invalidate).toHaveBeenCalled();
  });

  it("offers a retry when the result cannot be loaded", () => {
    renderResult(undefined);
    fireEvent.click(screen.getByRole("button", { name: "أعد المحاولة" }));
    expect(state.query.refetch).toHaveBeenCalled();
  });
});
