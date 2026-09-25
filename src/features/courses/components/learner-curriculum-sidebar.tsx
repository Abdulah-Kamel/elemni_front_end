"use client";

import { CircleAlert } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";
import type {
  PublicChapterDto,
  PublicItemDto,
  PublicLessonDto,
} from "@/src/lib/student-api/contract";
import { useCourseTestsProgress } from "@/src/features/course-tests/hooks";
import { placeTestsInLessons } from "@/src/features/course-tests/sidebar/placement";
import { SidebarTestRow, SidebarTestSubRow } from "@/src/features/course-tests/sidebar/sidebar-test-row";
import CurriculumAccordion, { type LessonSlots } from "./curriculum-accordion";

export default function LearnerCurriculumSidebar({
  chapters,
  lessonsCount,
  activeContentId,
  activeTestId = null,
  expandedChapterId,
  expandedLessonId,
  onChapterToggle,
  onLessonToggle,
  onPlay,
  onOpen,
  completedItemIds,
  theaterMode = false,
  completionPercent = null,
  courseSummary,
  courseId,
}: {
  chapters: PublicChapterDto[];
  lessonsCount: number;
  activeContentId: number | null;
  /** The course test currently open in the main column, if any. */
  activeTestId?: number | null;
  expandedChapterId: number | null;
  expandedLessonId: number | null;
  onChapterToggle: (chapterId: number) => void;
  onLessonToggle: (lessonId: number) => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  completedItemIds: number[];
  theaterMode?: boolean;
  completionPercent?: number | null;
  courseSummary?: ReactNode;
  courseId: number;
}) {
  const t = useTranslations("courseDetail");
  const testsProgress = useCourseTestsProgress(courseId).data ?? null;
  const hasContent = chapters.some((chapter) => chapter.lessons.length);
  const itemIds = chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.items.map((item) => item.id)));
  const completedCount = itemIds.filter((id) => completedItemIds.includes(id)).length;

  // Tests count as course items once the backend reports them; without test
  // progress the header keeps its content-only behaviour.
  const totalWithTests = itemIds.length + (testsProgress?.total_count ?? 0);
  const completedWithTests = completedCount + (testsProgress?.completed_count ?? 0);
  const percent = testsProgress && totalWithTests
    ? Math.round((completedWithTests / totalWithTests) * 100)
    : Math.min(100, Math.max(0, Math.round(completionPercent ?? 0)));

  const placed = useMemo(
    () => placeTestsInLessons(chapters, testsProgress?.items ?? []),
    [chapters, testsProgress],
  );
  const lessonSlots = (lesson: PublicLessonDto): LessonSlots | undefined => {
    const entry = placed.get(lesson.id);
    if (!entry) return undefined;
    return {
      rows: entry.rows.map(({ index, test }) => ({
        index,
        key: `test-${test.id}`,
        node: <SidebarTestRow test={test} courseId={courseId} selected={test.id === activeTestId} />,
      })),
      subRows: new Map(
        [...entry.subRows].map(([itemId, tests]) => [
          itemId,
          tests.map((test) => (
            <SidebarTestSubRow key={test.id} test={test} courseId={courseId} selected={test.id === activeTestId} />
          )),
        ]),
      ),
    };
  };

  return (
    <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:pe-1">
      <aside
        data-testid="learner-curriculum-sidebar"
        data-layout={theaterMode ? "stacked" : "flat"}
        aria-label={t("curriculum")}
      >
        <section
          id="course-content"
          aria-labelledby="learner-curriculum-title"
          className="overflow-hidden rounded-[18px] border border-[#E4E2DC] bg-white shadow-[0_16px_38px_-30px_rgba(21,24,30,0.35)] dark:border-slate-800 dark:bg-slate-900"
        >
          <header className="border-b border-[#E4E2DC] px-4 py-4 sm:px-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0A5FB4] dark:text-brand-300">
                  {t("curriculum")}
                </p>
                <h2
                  id="learner-curriculum-title"
                  className="mt-1 text-xl font-black tracking-[-0.02em] text-[#15181E] dark:text-slate-50"
                >
                  {t("courseContent")}
                </h2>
              </div>
              <span data-testid="course-progress-percent" className="shrink-0 text-sm font-black tabular-nums text-[#15181E] dark:text-slate-100">
                {percent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECEAE4] dark:bg-slate-800" aria-hidden="true">
              <m.div
                className="h-full rounded-full bg-[#0A5FB4] dark:bg-brand-400"
                initial={false}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 tabular-nums text-[#5F6573] dark:text-slate-300">
              {testsProgress && totalWithTests
                ? t("completedItems", { completed: completedWithTests, total: totalWithTests })
                : itemIds.length
                  ? t("completedItems", { completed: completedCount, total: itemIds.length })
                  : lessonsCount
                    ? t("lessons", { count: lessonsCount })
                    : t("contentWillAppear")}
            </p>
          </header>

          <div className="p-0">
            {hasContent ? (
              <CurriculumAccordion
                chapters={chapters}
                enrolled
                variant="sidebar"
                activeContentId={activeContentId}
                expandedChapterId={expandedChapterId}
                expandedLessonId={expandedLessonId}
                onChapterToggle={onChapterToggle}
                onLessonToggle={onLessonToggle}
                onPlay={onPlay}
                onOpen={onOpen}
                completedItemIds={completedItemIds}
                lessonSlots={lessonSlots}
              />
            ) : (
              <div className="m-4 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[#D8E0E9] bg-[#FAF9F5] px-5 text-center dark:border-slate-700 dark:bg-slate-900">
                <CircleAlert className="mb-4 size-9 text-[#9AB4C5]" aria-hidden="true" />
                <h3 className="text-base font-black text-[#15181E] dark:text-slate-100">{t("noContent")}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5F6573] dark:text-slate-400">
                  {t("noContentDescription")}
                </p>
              </div>
            )}
          </div>
        </section>
      </aside>
      {courseSummary}
    </div>
  );
}
