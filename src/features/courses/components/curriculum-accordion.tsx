"use client";

import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  FileText,
  LockKeyhole,
  Play,
  PlayCircle,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  PublicChapterDto,
  PublicItemDto,
  PublicLessonDto,
} from "@/src/lib/student-api/contract";

function formatDuration(
  minutes: number | null,
  t: ReturnType<typeof useTranslations<"courseDetail">>,
) {
  if (!minutes) return t("durationUnknown");
  if (minutes < 60) return t("minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder
    ? `${t("hours", { count: hours })} ${t("minutes", { count: remainder })}`
    : t("hours", { count: hours });
}

function lessonDuration(lesson: PublicLessonDto) {
  if (lesson.duration_minutes) return lesson.duration_minutes;
  const total = lesson.items.reduce((sum, item) => sum + (item.duration_minutes ?? 0), 0);
  return total || null;
}

function chapterDuration(lessons: PublicLessonDto[]) {
  const total = lessons.reduce((sum, lesson) => sum + (lessonDuration(lesson) ?? 0), 0);
  return total || null;
}

function absoluteDocumentUrl(path: string | null) {
  return path && /^https?:\/\//i.test(path) ? path : null;
}

function LessonRow({
  lesson,
  enrolled,
  variant,
  expanded,
  activeVideoId,
  onToggle,
  onPlay,
  onOpen,
  completedItemIds,
}: {
  lesson: PublicLessonDto;
  enrolled: boolean;
  variant: "default" | "sidebar";
  expanded: boolean;
  activeVideoId: number | null;
  onToggle: () => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  completedItemIds: number[];
}) {
  const t = useTranslations("courseDetail");
  const reduced = useReducedMotion() === true;
  const hasVideo = lesson.items.some((item) => item.has_video);
  const hasDocument = lesson.items.some((item) => item.has_document);
  const hasExam = lesson.items.some((item) => item.has_exam);

  return (
    <div className="border-b border-[#E4ECF2] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full cursor-pointer items-center text-start transition-colors hover:bg-[#F4FAFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0284C7] ${variant === "sidebar" ? "min-h-14 gap-3 px-3 py-3" : "min-h-16 gap-3 px-4 py-3.5 sm:px-5"}`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6FE] text-[#0284C7]">
          {hasVideo ? <PlayCircle className="size-5" /> : hasDocument ? <FileText className="size-5" /> : <BookOpen className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-bold leading-6 text-[#1C3345] sm:text-base">
            {lesson.title}
          </strong>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#6B7E8F]">
            <span>{formatDuration(lessonDuration(lesson), t)}</span>
            {hasVideo && <span>{t("video")}</span>}
            {hasDocument && <span>{t("document")}</span>}
            {hasExam && <span>{t("exam")}</span>}
          </span>
        </span>
        <ChevronLeft
          className={`size-4 shrink-0 text-[#8BA0B1] transition-transform motion-reduce:transition-none ${expanded ? "-rotate-90" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            className={variant === "sidebar" ? "overflow-hidden bg-[#FBFDFF] px-3 py-3" : "overflow-hidden bg-[#FBFDFF] px-4 py-4 sm:ps-16"}
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {lesson.description && (
              <p className="pb-3 text-sm leading-6 text-[#6B7E8F]">{lesson.description}</p>
            )}
            {lesson.items.length ? (
              <div className={variant === "sidebar" ? "space-y-0 border-t border-[#E4ECF2]" : "space-y-2"}>
                {lesson.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    lesson={lesson}
                    enrolled={enrolled}
                    variant={variant}
                    active={item.id === activeVideoId}
                    completed={completedItemIds.includes(item.id)}
                    onPlay={onPlay}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-[#6B7E8F]">{t("emptyLesson")}</p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemRow({
  item,
  lesson,
  enrolled,
  variant,
  active,
  completed,
  onPlay,
  onOpen,
}: {
  item: PublicItemDto;
  lesson: PublicLessonDto;
  enrolled: boolean;
  variant: "default" | "sidebar";
  active: boolean;
  completed: boolean;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
}) {
  const t = useTranslations("courseDetail");
  const documentUrl = absoluteDocumentUrl(item.document_path);
  const ItemIcon = item.has_video ? Video : item.has_document ? FileText : ClipboardList;
  const itemMeta = [
    item.has_video ? t("video") : null,
    item.has_document ? t("document") : null,
    item.has_exam ? t("exam") : null,
    item.duration_minutes ? formatDuration(item.duration_minutes, t) : null,
  ].filter(Boolean).join(" · ");

  if (enrolled && item.bunny_stream_embed_url) {
    return (
      <button
        type="button"
        onClick={() => onPlay(item, lesson)}
        data-testid={variant === "sidebar" ? `learner-curriculum-item-${item.id}` : undefined}
        className={`flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] ${variant === "sidebar" ? `rounded-none ${active ? "bg-[#E8F6FE] shadow-[inset_0_0_0_1px_#0284C7]" : "bg-white hover:bg-[#F4FAFD]"}` : `rounded-xl border ${active ? "border-[#0284C7] bg-[#E8F6FE]" : "border-[#D8E3EC] bg-white hover:border-[#7DD3FC]"}`}`}
      >
        <ItemIcon className="size-5 shrink-0 text-[#0284C7]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-[#1C3345]">{item.title}</strong>
          <span className="text-xs text-[#6B7E8F]">{itemMeta}</span>
        </span>
        {completed ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">تم</span>
        ) : (
          <Play className="size-4 shrink-0 fill-current text-[#0284C7]" aria-hidden="true" />
        )}
      </button>
    );
  }

  if (enrolled && documentUrl) {
    return (
      <a
        href={documentUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => onOpen(item, lesson)}
        data-testid={variant === "sidebar" ? `learner-curriculum-item-${item.id}` : undefined}
        className={`flex items-center gap-3 px-3 py-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] ${variant === "sidebar" ? "rounded-none bg-white hover:bg-[#F4FAFD]" : "rounded-xl border border-[#D8E3EC] bg-white hover:border-[#7DD3FC]"}`}
      >
        <ItemIcon className="size-5 shrink-0 text-[#087443]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-[#1C3345]">{item.title}</strong>
          <span className="text-xs text-[#6B7E8F]">{itemMeta}</span>
        </span>
        <ArrowLeft className="size-4 shrink-0 text-[#6B7E8F]" aria-hidden="true" />
      </a>
    );
  }

  return (
    <div
      data-testid={variant === "sidebar" ? `learner-curriculum-item-${item.id}` : undefined}
      className={`flex items-center gap-3 px-3 py-3 text-start ${variant === "sidebar" ? "rounded-none bg-white" : "rounded-xl border border-[#E4ECF2] bg-white"}`}
    >
      <ItemIcon className="size-5 shrink-0 text-[#8BA0B1]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm text-[#536A7C]">{item.title}</strong>
        <span className="text-xs text-[#8BA0B1]">{itemMeta || t("lessonContent")}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#8BA0B1]">
        {!enrolled && <LockKeyhole className="size-3.5" aria-hidden="true" />}
        {enrolled ? t("unavailable") : t("requiresEnrollment")}
      </span>
    </div>
  );
}

export default function CurriculumAccordion({
  chapters,
  enrolled,
  variant = "default",
  activeVideoId,
  expandedChapterId,
  expandedLessonId,
  onChapterToggle,
  onLessonToggle,
  onPlay,
  onOpen,
  completedItemIds = [],
}: {
  chapters: PublicChapterDto[];
  enrolled: boolean;
  variant?: "default" | "sidebar";
  activeVideoId: number | null;
  expandedChapterId: number | null;
  expandedLessonId: number | null;
  onChapterToggle: (chapterId: number) => void;
  onLessonToggle: (lessonId: number) => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  completedItemIds?: number[];
}) {
  const t = useTranslations("courseDetail");
  const reduced = useReducedMotion() === true;
  const [showAll, setShowAll] = useState(false);
  const visibleChapters = showAll ? chapters : chapters.slice(0, 8);

  if (!chapters.length) return null;

  return (
    <div className={variant === "sidebar" ? "space-y-0" : "space-y-3"}>
      {visibleChapters.map((chapter, chapterIndex) => {
        const expanded = expandedChapterId === chapter.id;
        return (
          <section
            key={`${chapter.id}-${chapterIndex}`}
            className={variant === "sidebar" ? "overflow-hidden border-b border-[#D8E3EC] bg-white last:border-b-0" : "overflow-hidden rounded-2xl border border-[#D8E3EC] bg-white"}
            aria-labelledby={`chapter-${chapter.id}-${chapterIndex}`}
          >
            <button
              type="button"
              onClick={() => onChapterToggle(chapter.id)}
              aria-expanded={expanded}
              aria-controls={`chapter-content-${chapter.id}-${chapterIndex}`}
              className={`flex w-full cursor-pointer items-center text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0284C7] ${variant === "sidebar" ? "min-h-14 gap-3 px-3 py-3" : "min-h-16 gap-4 px-4 py-4 sm:px-5"} ${expanded ? "bg-[#E8F6FE]" : "hover:bg-[#FBFDFF]"}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <h3
                  id={`chapter-${chapter.id}-${chapterIndex}`}
                  className={`truncate text-base font-black sm:text-lg ${expanded ? "text-[#075985]" : "text-[#1C3345]"}`}
                >
                  {chapter.title || t("coursePlan")}
                </h3>
                <ChevronDown
                  className={`size-4 shrink-0 text-[#6B7E8F] transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </span>
              <span className="shrink-0 text-xs font-medium text-[#6B7E8F]">
                {t("chapterLessons", { count: chapter.lessons.length })} · {formatDuration(chapterDuration(chapter.lessons), t)}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <m.div
                  key={`chapter-content-${chapter.id}-${chapterIndex}`}
                  id={`chapter-content-${chapter.id}-${chapterIndex}`}
                  className="overflow-hidden border-t border-[#D8E3EC]"
                  initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  {chapter.lessons.length ? chapter.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      enrolled={enrolled}
                      variant={variant}
                      expanded={expandedLessonId === lesson.id}
                      activeVideoId={activeVideoId}
                      onToggle={() => onLessonToggle(lesson.id)}
                      onPlay={onPlay}
                      onOpen={onOpen}
                      completedItemIds={completedItemIds}
                    />
                  )) : (
                    <p className="px-5 py-5 text-sm text-[#6B7E8F]">{t("noContentDescription")}</p>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}

      {chapters.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="w-full cursor-pointer rounded-xl border border-dashed border-[#B7CDDC] px-4 py-3 text-sm font-black text-[#075985] transition hover:border-[#0284C7] hover:bg-[#F4FAFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
        >
          {showAll ? t("courseContent") : `${t("courseContent")} +${chapters.length - 8}`}
        </button>
      )}
    </div>
  );
}
