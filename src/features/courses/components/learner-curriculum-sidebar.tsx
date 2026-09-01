"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  PublicChapterDto,
  PublicItemDto,
  PublicLessonDto,
} from "@/src/lib/student-api/contract";
import CurriculumAccordion from "./curriculum-accordion";

export default function LearnerCurriculumSidebar({
  chapters,
  lessonsCount,
  activeVideoId,
  expandedChapterId,
  expandedLessonId,
  onChapterToggle,
  onLessonToggle,
  onPlay,
}: {
  chapters: PublicChapterDto[];
  lessonsCount: number;
  activeVideoId: number | null;
  expandedChapterId: number | null;
  expandedLessonId: number | null;
  onChapterToggle: (chapterId: number) => void;
  onLessonToggle: (lessonId: number) => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
}) {
  const t = useTranslations("courseDetail");
  const hasContent = chapters.some((chapter) => chapter.lessons.length);

  return (
    <aside
      data-testid="learner-curriculum-sidebar"
      aria-label={t("curriculum")}
      className="order-2 min-w-0 overflow-y-auto overscroll-contain lg:order-1 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:pe-1"
    >
      <section
        id="course-content"
        aria-labelledby="learner-curriculum-title"
        className="overflow-hidden rounded-2xl border border-[#D8E3EC] bg-white shadow-[0_16px_38px_-30px_rgba(15,38,56,0.8)]"
      >
        <header className="border-b border-[#D8E3EC] bg-[#F4FAFD] px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0284C7]">
                {t("curriculum")}
              </p>
              <h2
                id="learner-curriculum-title"
                className="mt-1 text-xl font-black tracking-[-0.02em] text-[#0F2638]"
              >
                {t("courseContent")}
              </h2>
            </div>
            <span className="shrink-0 rounded-full border border-[#C7E8F8] bg-white px-2.5 py-1 text-xs font-bold text-[#075985]">
              {lessonsCount ? t("lessons", { count: lessonsCount }) : t("contentWillAppear")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6B7E8F]">
            {t("curriculumDescription")}
          </p>
        </header>

        <div className="p-3 sm:p-4">
          {hasContent ? (
            <CurriculumAccordion
              chapters={chapters}
              enrolled
              activeVideoId={activeVideoId}
              expandedChapterId={expandedChapterId}
              expandedLessonId={expandedLessonId}
              onChapterToggle={onChapterToggle}
              onLessonToggle={onLessonToggle}
              onPlay={onPlay}
            />
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-[#B7CDDC] bg-[#FBFDFF] px-5 text-center">
              <CircleAlert className="mb-4 size-9 text-[#9AB4C5]" aria-hidden="true" />
              <h3 className="text-base font-black text-[#1C3345]">{t("noContent")}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7E8F]">
                {t("noContentDescription")}
              </p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
