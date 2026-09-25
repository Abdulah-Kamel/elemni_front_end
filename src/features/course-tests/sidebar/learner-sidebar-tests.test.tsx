import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicChapterDto } from "@/src/lib/student-api/contract";
import arBaseMessages from "@/src/messages/ar.json";
import { courseTestMessages } from "@/src/messages/course-tests";
import LearnerCurriculumSidebar from "@/src/features/courses/components/learner-curriculum-sidebar";
import type { CourseTestsProgress, SidebarTestItem } from "../types";
import { placeTestsInLessons } from "./placement";

const messages = { ...arBaseMessages, courseTests: courseTestMessages("ar") };

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

let progress: CourseTestsProgress | null = null;
vi.mock("@/src/features/course-tests/hooks", () => ({
  useCourseTestsProgress: () => ({ data: progress }),
}));

const NOW = new Date("2026-09-26T09:00:00Z");

const chapters: PublicChapterDto[] = [
  {
    id: 1,
    title: "عام",
    order: 1,
    lessons: [
      {
        id: 11,
        title: "lesson 1",
        description: null,
        order: 1,
        duration_minutes: null,
        items: [
          { id: 101, title: "item video and doucment", order: 1, duration_minutes: null, has_video: true, has_document: true, has_exam: false, bunny_stream_embed_url: "https://iframe.mediadelivery.net/play/1", document_path: "https://cdn.elemni.test/a.pdf", exam_id: null },
          { id: 102, title: "ملخص", order: 2, duration_minutes: null, has_video: false, has_document: true, has_exam: false, bunny_stream_embed_url: null, document_path: "https://cdn.elemni.test/b.pdf", exam_id: null },
        ],
      },
    ],
  },
] as PublicChapterDto[];

function testItem(overrides: Partial<SidebarTestItem>): SidebarTestItem {
  return {
    grading_policy: "highest",
    id: 501,
    title: "اختبار الدرس الأول",
    lesson_id: null,
    position: 99,
    placement: "standalone_item",
    parent_item_id: null,
    question_count: 10,
    time_limit_minutes: 15,
    state: "not_started",
    percent: null,
    attempt_count: 0,
    max_attempts: 3,
    opens_at: null,
    open_attempt: null,
    prerequisite_title: null,
    ...overrides,
  };
}

function renderSidebar(options: { activeTestId?: number | null; completedItemIds?: number[]; completionPercent?: number | null } = {}) {
  return render(
    <NextIntlClientProvider locale="ar" messages={messages} timeZone="Africa/Cairo">
      <LearnerCurriculumSidebar
        chapters={chapters}
        lessonsCount={1}
        activeContentId={null}
        activeTestId={options.activeTestId ?? null}
        expandedChapterId={1}
        expandedLessonId={11}
        onChapterToggle={() => {}}
        onLessonToggle={() => {}}
        onPlay={() => {}}
        onOpen={() => {}}
        completedItemIds={options.completedItemIds ?? []}
        completionPercent={options.completionPercent ?? null}
        courseId={12}
      />
    </NextIntlClientProvider>,
  );
}

const row = (id: number) => screen.getByTestId(`learner-curriculum-test-${id}`);

describe("course tests in the learner sidebar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    progress = null;
  });

  it("keeps the content-only header when there is no test progress", () => {
    progress = null;
    renderSidebar({ completedItemIds: [101], completionPercent: 50 });
    expect(screen.getByTestId("course-progress-percent")).toHaveTextContent("50%");
    expect(screen.getByText("أكملت 1 من 2 عناصر")).toBeInTheDocument();
    expect(screen.queryByTestId(/learner-curriculum-test-/)).not.toBeInTheDocument();
  });

  it("counts tests in the course progress", () => {
    progress = {
      items: [testItem({ state: "passed", percent: 85, attempt_count: 2 }), testItem({ id: 502, state: "not_started" })],
      completed_count: 1,
      total_count: 2,
      completion_percent: 50,
    };
    renderSidebar({ completedItemIds: [101] });
    expect(screen.getByText("أكملت 2 من 4 عناصر")).toBeInTheDocument();
    expect(screen.getByTestId("course-progress-percent")).toHaveTextContent("50%");
  });

  it("renders every state with the designed copy and badge", () => {
    progress = {
      items: [
        testItem({ id: 1, state: "not_started" }),
        testItem({ id: 2, state: "locked" }),
        testItem({ id: 3, state: "locked", prerequisite_title: "اختبار الدرس الأول" }),
        testItem({ id: 4, state: "scheduled", opens_at: new Date(2026, 8, 27, 10, 0).toISOString() }),
        testItem({ id: 5, state: "passed", percent: 85, attempt_count: 2 }),
        testItem({ id: 6, state: "failed", percent: 40, attempt_count: 1 }),
        testItem({ id: 7, state: "attempts_exhausted", percent: 40, attempt_count: 3 }),
        testItem({ id: 8, state: "pending_grading", attempt_count: 1 }),
        testItem({ id: 9, state: "closed" }),
      ],
      completed_count: 1,
      total_count: 9,
      completion_percent: 11,
    };
    renderSidebar();

    expect(row(1)).toHaveTextContent("اختبار · 10 أسئلة · 15 دقيقة");
    expect(row(1)).toHaveTextContent("لم يبدأ");
    expect(row(2)).toHaveTextContent("أكمل العنصر السابق لفتحه");
    expect(row(2)).toHaveTextContent("مقفل");
    expect(row(3)).toHaveTextContent("يُفتح بعد اجتياز اختبار الدرس الأول");
    // formatTestDate's Intl output carries invisible bidi marks (U+200F) around "/".
    expect(row(4).textContent?.replace(/\u200f/g, "")).toContain("يُفتح الأحد 27/09 · 10:00 ص");
    expect(row(4)).toHaveTextContent("قريباً");
    expect(row(5)).toHaveTextContent("ناجح · أعلى درجة من محاولتين");
    expect(within(row(5)).getByLabelText("ناجح بنسبة 85%")).toHaveTextContent("85%");
    expect(row(6)).toHaveTextContent("لم تجتزه · تبقّت محاولتان");
    expect(within(row(6)).getByLabelText("لم تجتزه بنسبة 40%")).toBeInTheDocument();
    expect(row(7)).toHaveTextContent("3 من 3 محاولات · تواصل مع المدرّس");
    expect(row(7)).toHaveTextContent("40%");
    expect(row(8)).toHaveTextContent("تم التسليم · النتيجة قريباً");
    expect(row(8)).toHaveTextContent("قيد التصحيح");
    expect(row(9)).toHaveTextContent("مغلق");
  });

  it("uses ICU plurals for attempts", () => {
    progress = {
      items: [
        testItem({ id: 1, state: "failed", percent: 40, attempt_count: 2, max_attempts: 3 }),
        testItem({ id: 2, state: "passed", percent: 90, attempt_count: 1 }),
        testItem({ id: 3, state: "passed", percent: 90, attempt_count: 3 }),
        testItem({ id: 4, state: "failed", percent: 20, attempt_count: 1, max_attempts: null }),
      ],
      completed_count: 2,
      total_count: 4,
      completion_percent: 50,
    };
    renderSidebar();
    expect(row(1)).toHaveTextContent("لم تجتزه · تبقّت محاولة واحدة");
    expect(row(2)).toHaveTextContent("ناجح · من المحاولة الأولى");
    expect(row(3)).toHaveTextContent("ناجح · أعلى درجة من 3 محاولات");
    expect(row(4)).toHaveTextContent("لم تجتزه · يمكنك المحاولة مجدداً");
  });

  it("shows the in-progress bar with the server-synced countdown and links to resume", () => {
    progress = {
      items: [
        testItem({
          state: "in_progress",
          attempt_count: 1,
          open_attempt: { id: 77, answered_count: 4, deadline_at: new Date(NOW.getTime() + 492_000).toISOString(), server_now: NOW.toISOString() },
        }),
      ],
      completed_count: 0,
      total_count: 1,
      completion_percent: 0,
    };
    renderSidebar({ activeTestId: 501 });
    const test = row(501);
    expect(test).toHaveTextContent("4/10 · متبقي 08:12");
    expect(test).toHaveTextContent("قيد الحل");
    expect(within(test).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4");
    expect(test).toHaveAttribute("href", "/my-courses/12/tests/501?attempt=77&view=attempt");
    expect(test).toHaveAttribute("aria-current", "page");
  });

  it("places standalone tests in the lesson list and inside_item tests as a compact sub-row", () => {
    progress = {
      items: [
        testItem({ id: 504, title: "اختبار قصير", placement: "inside_item", position: 0, question_count: 5, time_limit_minutes: null }),
        testItem({ id: 501 }),
      ],
      completed_count: 0,
      total_count: 2,
      completion_percent: 0,
    };
    renderSidebar();
    const parent = screen.getByTestId("learner-curriculum-item-101");
    const compact = within(parent).getByTestId("learner-curriculum-test-504");
    expect(compact).toHaveAttribute("data-compact");
    expect(compact).toHaveTextContent("5 أسئلة");
    expect(compact).toHaveAttribute("href", "/my-courses/12/tests/504");

    const standalone = row(501);
    const lastItem = screen.getByTestId("learner-curriculum-item-102");
    expect(lastItem.compareDocumentPosition(standalone) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(standalone).not.toHaveAttribute("aria-current");
  });
});

describe("placeTestsInLessons", () => {
  it("matches lesson and parent ids, falling back to the last lesson and its first item", () => {
    const twoLessons = [
      { ...chapters[0], lessons: [chapters[0].lessons[0], { ...chapters[0].lessons[0], id: 12, items: [{ ...chapters[0].lessons[0].items[1], id: 201 }] }] },
    ] as PublicChapterDto[];
    const placed = placeTestsInLessons(twoLessons, [
      testItem({ id: 1, lesson_id: 11, position: 1 }),
      testItem({ id: 2, lesson_id: 999 }),
      testItem({ id: 3, lesson_id: 11, placement: "inside_item", parent_item_id: 102 }),
      testItem({ id: 4, lesson_id: null, placement: "inside_item", parent_item_id: 999 }),
    ]);
    expect(placed.get(11)?.rows).toEqual([{ index: 1, test: expect.objectContaining({ id: 1 }) }]);
    expect(placed.get(11)?.subRows.get(102)?.map((test) => test.id)).toEqual([3]);
    expect(placed.get(12)?.rows.map((row) => [row.index, row.test.id])).toEqual([[1, 2]]);
    expect(placed.get(12)?.subRows.get(201)?.map((test) => test.id)).toEqual([4]);
  });
});
