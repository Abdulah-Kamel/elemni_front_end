"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type {
  PublicChapterDto,
  PublicItemDto,
  PublicLessonDto,
} from "@/src/lib/student-api/contract";
import CurriculumAccordion from "./curriculum-accordion";

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
}) {
  const t = useTranslations("courseDetail");
  const hasContent = chapters.some((chapter) => chapter.lessons.length);
  const percent = Math.min(100, Math.max(0, Math.round(completionPercent ?? 0)));
  const itemIds = chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.items.map((item) => item.id)));
  const completedCount = itemIds.filter((id) => completedItemIds.includes(id)).length;

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
              <span className="shrink-0 text-sm font-black tabular-nums text-[#15181E]">
                {percent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECEAE4]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-[#0A5FB4] transition-[width] motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5F6573]">
              {itemIds.length
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
        </section>
      </aside>
      {courseSummary}
    </div>
  );
}
