import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import arBaseMessages from "@/src/messages/ar.json";
import { courseTestMessages } from "@/src/messages/course-tests";
import type { CourseTestDetail } from "../types";
import { startBlock } from "./start-gate";
import { TestStartScreen } from "./test-start-screen";

const messages = { ...arBaseMessages, courseTests: courseTestMessages("ar") };

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const NOW = new Date("2026-09-26T09:00:00Z");

function makeTest(overrides: Partial<CourseTestDetail> = {}): CourseTestDetail {
  return {
    id: 501,
    course_id: 12,
    title: "اختبار الدرس الأول",
    description: "اختبار قصير يغطي أساسيات بايثون.",
    lesson_title: "lesson 1",
    item_index: 3,
    item_count: 3,
    prev_item: { id: 102, title: "test", kind: "video" },
    next_item: null,
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
    state: "not_started",
    prerequisites: [],
    next_attempt_at: null,
    attempts: [],
    open_attempt: null,
    best_percent: null,
    server_now: NOW.toISOString(),
    ...overrides,
  };
}

const failedAttempt = {
  id: 1, number: 1, status: "graded" as const, started_at: "2026-09-20T09:00:00Z", submitted_at: "2026-09-20T09:12:30Z",
  duration_seconds: 750, score_total: 8, max_score: 20, percent: 40, passed: false, can_review: true,
};

function renderScreen(test: CourseTestDetail, extra: { starting?: boolean; startError?: string | null } = {}) {
  const handlers = { onStart: vi.fn(), onResume: vi.fn(), onOpenResult: vi.fn(), onOpenReview: vi.fn() };
  render(
    <NextIntlClientProvider locale="ar" messages={messages} timeZone="Africa/Cairo">
      <QueryClientProvider client={new QueryClient()}>
        <TestStartScreen test={test} starting={extra.starting ?? false} startError={extra.startError ?? null} {...handlers} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
  return handlers;
}

describe("TestStartScreen", () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW, toFake: ["Date"] }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the first-attempt intro with tiles, rules and an enabled Start", () => {
    const handlers = renderScreen(makeTest());
    expect(screen.getByRole("heading", { name: "اختبار الدرس الأول" })).toBeInTheDocument();
    expect(screen.getByText("العنصر 3 من 3 · lesson 1")).toBeInTheDocument();
    expect(screen.getByText("10 أسئلة")).toBeInTheDocument();
    expect(screen.getByText("15 دقيقة")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("3 محاولات")).toBeInTheDocument();
    expect(screen.getByText("يبدأ المؤقت عند الضغط على «ابدأ الاختبار» ولا يتوقف إذا غادرت الصفحة.")).toBeInTheDocument();
    expect(screen.getByText("تُحتسب أعلى درجة من بين محاولاتك.")).toBeInTheDocument();
    expect(screen.getByText("المحاولة الأولى من 3")).toBeInTheDocument();

    const start = screen.getByRole("button", { name: "ابدأ الاختبار" });
    expect(start).not.toHaveAttribute("aria-disabled");
    fireEvent.click(start);
    expect(handlers.onStart).toHaveBeenCalledTimes(1);

    const footer = screen.getByRole("navigation", { name: "العنصر 3 من 3" });
    expect(within(footer).getByRole("link", { name: "العنصر السابق: test" })).toHaveAttribute("href", "/my-courses/12?item=102");
    expect(within(footer).getByRole("button", { name: "التالي" })).toBeDisabled();
  });

  it("hides timer rules without a time limit and words other grading policies", () => {
    renderScreen(makeTest({ time_limit_minutes: null, grading_policy: "last", allow_back_navigation: false, max_attempts: null }));
    expect(screen.queryByText(/يبدأ المؤقت/)).not.toBeInTheDocument();
    expect(screen.queryByText(/عند انتهاء الوقت/)).not.toBeInTheDocument();
    expect(screen.getByText("بلا حد زمني")).toBeInTheDocument();
    expect(screen.getByText("غير محدودة")).toBeInTheDocument();
    expect(screen.getByText("تُحتسب درجة آخر محاولة لك.")).toBeInTheDocument();
    expect(screen.getByText(/لا يمكنك الرجوع إلى سؤال سابق/)).toBeInTheDocument();
  });

  it("offers Resume (and no Start) while an attempt is open", () => {
    const test = makeTest({
      state: "in_progress",
      attempts: [failedAttempt, { id: 2, number: 2, status: "in_progress", started_at: "2026-09-25T09:00:00Z", submitted_at: null, duration_seconds: null, score_total: null, max_score: 20, percent: null, passed: null, can_review: false }],
      open_attempt: { id: 2, answered_count: 4, deadline_at: new Date(NOW.getTime() + 492_000).toISOString(), server_now: NOW.toISOString() },
    });
    const handlers = renderScreen(test);
    expect(screen.getByText("لديك محاولة لم تكتمل بعد")).toBeInTheDocument();
    expect(screen.getByText(/أجبت على 4 من 10 · متبقي 08:12/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ابدأ/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "استكمل الاختبار" }));
    expect(handlers.onResume).toHaveBeenCalledWith(2);

    // History: newest first, review + result links, attempt dots.
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("المحاولة 2");
    expect(rows[1]).toHaveTextContent("قيد الحل");
    expect(rows[2]).toHaveTextContent("8 / 20");
    expect(rows[2]).toHaveTextContent("راسب · 40%");
    expect(rows[2]).toHaveTextContent("12:30 د");
    fireEvent.click(within(rows[2]).getByRole("button", { name: "مراجعة المحاولة 1" }));
    expect(handlers.onOpenReview).toHaveBeenCalledWith(1);
    expect(handlers.onOpenResult).not.toHaveBeenCalled();
    fireEvent.click(within(rows[2]).getByRole("button", { name: "عرض نتيجة المحاولة 1" }));
    expect(handlers.onOpenResult).toHaveBeenCalledWith(1);
    expect(screen.getByText("2 من 3")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /المحاولة 1: راسب، المحاولة 2: قيد الحل، المحاولة 3: لم تُستخدم/ })).toBeInTheDocument();
  });

  it("shows the locked checklist with links and a disabled Start", () => {
    const handlers = renderScreen(makeTest({
      state: "locked",
      prerequisites: [
        { id: 101, title: "item video and doucment", kind: "video", met: true, hint: null },
        { id: 102, title: "test", kind: "video", met: false, hint: "شاهد الفيديو حتى النهاية" },
      ],
    }));
    expect(screen.getByRole("heading", { name: "اختبار الدرس الأول مقفل حالياً" })).toBeInTheDocument();
    expect(screen.getByText("مكتمل")).toBeInTheDocument();
    expect(screen.getByText("شاهد الفيديو حتى النهاية")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "انتقل إلى «test»" })).toHaveAttribute("href", "/my-courses/12?item=102");
    expect(screen.getByRole("link", { name: "الذهاب إلى «test»" })).toHaveAttribute("href", "/my-courses/12?item=102");
    const start = screen.getByRole("button", { name: "ابدأ الاختبار" });
    expect(start).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(start);
    expect(handlers.onStart).not.toHaveBeenCalled();
  });

  it("shows the scheduled window and countdown", () => {
    renderScreen(makeTest({
      state: "scheduled",
      opens_at: new Date(NOW.getTime() + 3 * 3_600_000).toISOString(),
      closes_at: new Date(NOW.getTime() + 7 * 86_400_000).toISOString(),
    }));
    expect(screen.getByRole("heading", { name: "اختبار الدرس الأول يُفتح قريباً" })).toBeInTheDocument();
    expect(screen.getByText(/متاح من/)).toBeInTheDocument();
    expect(screen.getByText(/ويُغلق/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ابدأ الاختبار" })).toHaveAttribute("aria-disabled", "true");
  });

  it.each([
    ["cooldown", { state: "failed", attempts: [failedAttempt], next_attempt_at: new Date(NOW.getTime() + 60_000).toISOString() }, /المحاولة التالية متاحة/],
    ["exhausted", { state: "attempts_exhausted", max_attempts: 1, attempts: [failedAttempt] }, /تواصل مع المدرّس/],
    ["pending", { state: "pending_grading", attempts: [{ ...failedAttempt, status: "pending_grading", percent: null, passed: null }] }, /قيد التصحيح/],
    ["closed", { state: "closed" }, /أُغلق هذا الاختبار/],
  ] as const)("disables Start with a reason when %s", (_name, overrides, reason) => {
    const handlers = renderScreen(makeTest(overrides as Partial<CourseTestDetail>));
    const start = screen.getByRole("button", { name: /ابدأ/ });
    expect(start).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toHaveTextContent(reason);
    fireEvent.click(start);
    expect(handlers.onStart).not.toHaveBeenCalled();
  });

  it("labels a retry as a new attempt and shows start errors", () => {
    renderScreen(makeTest({ state: "failed", attempts: [failedAttempt] }), { startError: "المحاولة التالية لم تُتح بعد." });
    expect(screen.getByRole("button", { name: "ابدأ محاولة جديدة" })).not.toHaveAttribute("aria-disabled");
    expect(screen.getByText("المحاولة 2 من 3")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("المحاولة التالية لم تُتح بعد.");
  });
});

describe("startBlock", () => {
  it("re-enables Start once the cooldown countdown reaches zero", () => {
    const test = makeTest({ state: "failed", attempts: [failedAttempt], next_attempt_at: "2026-09-26T09:01:00Z" });
    expect(startBlock(test, null)).toBe("cooldown");
    expect(startBlock(test, 30)).toBe("cooldown");
    expect(startBlock(test, 0)).toBeNull();
  });

  it("blocks when every attempt is used even if the test is passed", () => {
    const test = makeTest({ state: "passed", max_attempts: 1, attempts: [{ ...failedAttempt, percent: 90, passed: true }] });
    expect(startBlock(test, null)).toBe("no_attempts_left");
  });
});
