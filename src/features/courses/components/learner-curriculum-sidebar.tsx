"use client";

import { CircleAlert, CircleCheck, CircleX, Clock3, ClipboardCheck, LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import type {
  PublicChapterDto,
  PublicItemDto,
  PublicLessonDto,
} from "@/src/lib/student-api/contract";
import CurriculumAccordion from "./curriculum-accordion";
import { Link } from "@/src/i18n/navigation";
import type { CourseTestSidebarItemDto, CourseTestsProgressDto } from "@/src/lib/student-api/contract";
import { getDemoSidebarData } from "@/src/features/course-tests/demo-store";

export default function LearnerCurriculumSidebar({
  chapters,
  lessonsCount,
  activeContentId,
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
  courseTests,
  courseId,
}: {
  chapters: PublicChapterDto[];
  lessonsCount: number;
  activeContentId: number | null;
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
  courseTests?: CourseTestsProgressDto | null;
  courseId: number;
}) {
  const t = useTranslations("courseDetail");
  const [localDemoTests, setLocalDemoTests] = useState<CourseTestsProgressDto | null>(null);
  const hasContent = chapters.some((chapter) => chapter.lessons.length);
  const itemIds = chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.items.map((item) => item.id)));
  const completedCount = itemIds.filter((id) => completedItemIds.includes(id)).length;
  useEffect(() => {
    if (courseTests) return;
    const update = () => setLocalDemoTests(getDemoSidebarData(courseId, itemIds.length, completedCount));
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, [courseId, courseTests, completedCount, itemIds.length]);
  const visibleCourseTests = courseTests ?? localDemoTests;
  const percent = Math.min(100, Math.max(0, Math.round(visibleCourseTests?.completion_percent ?? completionPercent ?? 0)));

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
          className="overflow-hidden rounded-[18px] border border-[#E4E2DC] bg-white shadow-[0_16px_38px_-30px_rgba(21,24,30,0.35)]"
        >
          <header className="border-b border-[#E4E2DC] px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0A5FB4]">
                  {t("curriculum")}
                </p>
                <h2
                  id="learner-curriculum-title"
                  className="mt-1 text-xl font-black tracking-[-0.02em] text-[#15181E]"
                >
                  {t("courseContent")}
                </h2>
              </div>
          <span className="shrink-0 text-sm font-black tabular-nums text-[#15181E] dark:text-slate-100">
                {percent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECEAE4]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-[#0A5FB4] transition-[width] motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5F6573] dark:text-slate-300">
              {visibleCourseTests?.total_count
                ? t("completedItems", { completed: visibleCourseTests.completed_count, total: visibleCourseTests.total_count })
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
              />
            ) : (
              <div className="m-4 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[#D8E0E9] bg-[#FAF9F5] px-5 text-center">
                <CircleAlert className="mb-4 size-9 text-[#9AB4C5]" aria-hidden="true" />
                <h3 className="text-base font-black text-[#15181E]">{t("noContent")}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5F6573]">
                  {t("noContentDescription")}
                </p>
              </div>
            )}
          </div>
          {visibleCourseTests?.items.length ? (
            <section aria-label="اختبارات الكورس" className="border-t border-[#E4E2DC] p-3 dark:border-slate-800">
              <h3 className="mb-2 px-2 text-sm font-black text-[#15181E] dark:text-slate-100">الاختبارات</h3>
              <div className="space-y-1">
                {visibleCourseTests.items.map((test) => <TestRow key={test.id} test={test} courseId={courseId} />)}
              </div>
            </section>
          ) : null}
        </section>
      </aside>
      {courseSummary}
    </div>
  );
}

function TestRow({ test, courseId }: { test: CourseTestSidebarItemDto; courseId: number }) {
  const stateText: Record<string, string> = {
    not_started: "لم يبدأ", locked: "مغلق حتى إكمال المتطلب", scheduled: "قريباً", in_progress: "قيد الحل",
    passed: "ناجح", failed: "لم تجتزه", attempts_exhausted: "استنفدت المحاولات", pending_grading: "قيد التصحيح", closed: "مغلق",
  };
  const StateIcon = test.state === "locked" || test.state === "closed" ? LockKeyhole : test.state === "passed" ? CircleCheck : test.state === "failed" || test.state === "attempts_exhausted" ? CircleX : test.state === "pending_grading" || test.state === "scheduled" ? Clock3 : ClipboardCheck;
  const href = `/my-courses/${courseId}/tests/${test.id}${test.open_attempt_id ? `?attemptId=${test.open_attempt_id}` : ""}`;
  return (
    <Link href={href} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-start transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:hover:bg-slate-800 ${test.placement === "inside_item" ? "ms-5 border-s border-slate-200 ps-4 dark:border-slate-700" : ""}`}>
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><StateIcon className="size-4" /></span>
      <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-bold text-ink dark:text-slate-100">{test.title}</strong><span className="block truncate text-xs text-muted dark:text-slate-400">{test.subtitle || `اختبار · ${test.question_count} أسئلة${test.time_limit_minutes ? ` · ${test.time_limit_minutes} دقيقة` : ""}`}</span></span>
      <span className="shrink-0 text-xs font-bold text-muted dark:text-slate-400">{test.percent != null ? `${test.percent}%` : stateText[test.state] ?? "اختبار"}</span>
    </Link>
  );
}
