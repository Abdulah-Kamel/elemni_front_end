"use client";

import { Fragment, useState, type ReactNode } from "react";
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
import { resolveAssetUrl } from "@/src/lib/asset-url";
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
  if (!path) return null;
  return resolveAssetUrl(path, "") || null;
}

/** Extra rows (course tests) placed inside a lesson's item list. */
export type LessonSlots = {
  /** Rendered before the content item at `index` (index ≥ items.length → after the last item). */
  rows: { index: number; key: string; node: ReactNode }[];
  /** Compact rows rendered inside / under the content item with that id. */
  subRows: Map<number, ReactNode>;
};

function LessonRow({
  lesson,
  enrolled,
  variant,
  expanded,
  activeContentId,
  onToggle,
  onPlay,
  onOpen,
  completedItemIds,
  slots,
}: {
  lesson: PublicLessonDto;
  enrolled: boolean;
  variant: "default" | "sidebar";
  expanded: boolean;
  activeContentId: number | null;
  onToggle: () => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  completedItemIds: number[];
  slots?: LessonSlots;
}) {
  const t = useTranslations("courseDetail");
  const reduced = useReducedMotion() === true;
  const hasVideo = lesson.items.some((item) => item.has_video);
  const hasDocument = lesson.items.some((item) => item.has_document);
  const hasExam = lesson.items.some((item) => item.has_exam) || Boolean(slots?.rows.length || slots?.subRows.size);
  const rowsAt = (index: number) =>
    (slots?.rows ?? []).filter((row) => (index >= lesson.items.length ? row.index >= index : row.index === index));

  return (
    <div
      className={
        variant === "sidebar"
          ? "border-b border-[#E4E2DC] last:border-b-0"
          : "border-b border-[#E4ECF2] last:border-b-0"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full cursor-pointer items-center text-start transition-colors hover:bg-brand-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 dark:hover:bg-slate-800/70 ${variant === "sidebar" ? "min-h-14 gap-3 px-3 py-3" : "min-h-16 gap-3 px-4 py-3.5 sm:px-5"}`}
      >
        <span className="sticker-badge flex size-9 shrink-0 items-center justify-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300">
          {hasVideo ? <PlayCircle className="size-5" /> : hasDocument ? <FileText className="size-5" /> : <BookOpen className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-black leading-6 text-ink sm:text-base dark:text-slate-50">
            {lesson.title}
          </strong>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted dark:text-slate-400">
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
            className={variant === "sidebar" ? "overflow-hidden bg-[#FAF9F5] px-3 py-3" : "overflow-hidden bg-[#FBFDFF] px-4 py-4 sm:ps-16"}
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {lesson.description && (
              <p className="pb-3 text-sm leading-6 text-[#6B7E8F]">{lesson.description}</p>
            )}
            {lesson.items.length || slots?.rows.length ? (
              <div className={variant === "sidebar" ? "space-y-0 border-t border-[#E4E2DC]" : "space-y-2"}>
                {lesson.items.map((item, index) => (
                  <Fragment key={item.id}>
                    {rowsAt(index).map((row) => <Fragment key={row.key}>{row.node}</Fragment>)}
                    <ItemRow
                      item={item}
                      lesson={lesson}
                      enrolled={enrolled}
                      variant={variant}
                      active={item.id === activeContentId}
                      completed={completedItemIds.includes(item.id)}
                      onPlay={onPlay}
                      onOpen={onOpen}
                      subRow={slots?.subRows.get(item.id)}
                    />
                  </Fragment>
                ))}
                {rowsAt(lesson.items.length).map((row) => <Fragment key={row.key}>{row.node}</Fragment>)}
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
  subRow,
}: {
  item: PublicItemDto;
  lesson: PublicLessonDto;
  enrolled: boolean;
  variant: "default" | "sidebar";
  active: boolean;
  completed: boolean;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  subRow?: ReactNode;
}) {
  const row = <ItemRowBody item={item} lesson={lesson} enrolled={enrolled} variant={variant} active={active} completed={completed} onPlay={onPlay} onOpen={onOpen} subRow={subRow} />;
  if (!subRow || (enrolled && item.bunny_stream_embed_url && absoluteDocumentUrl(item.document_path))) return row;
  // Items without an inline resource list get their test sub-row right underneath.
  return (
    <>
      {row}
      <div className={variant === "sidebar" ? "border-t border-[#E4E2DC] bg-[#FAF9F5] px-3 py-1.5 ps-8 dark:border-slate-800 dark:bg-slate-900/60" : "ms-6 mt-1"}>
        {subRow}
      </div>
    </>
  );
}

function ItemRowBody({
  item,
  lesson,
  enrolled,
  variant,
  active,
  completed,
  onPlay,
  onOpen,
  subRow,
}: {
  item: PublicItemDto;
  lesson: PublicLessonDto;
  enrolled: boolean;
  variant: "default" | "sidebar";
  active: boolean;
  completed: boolean;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  subRow?: ReactNode;
}) {
  const t = useTranslations("courseDetail");
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const documentUrl = absoluteDocumentUrl(item.document_path);
  const ItemIcon = item.has_video ? Video : item.has_document ? FileText : ClipboardList;
  const accentClass = variant === "sidebar" ? "text-[#0A5FB4]" : "text-[#0284C7]";
  const inkClass = variant === "sidebar" ? "text-[#15181E]" : "text-[#1C3345]";
  const itemMeta = [
    item.has_video ? t("video") : null,
    item.has_document ? t("document") : null,
    item.has_exam ? t("exam") : null,
    item.duration_minutes ? formatDuration(item.duration_minutes, t) : null,
  ].filter(Boolean).join(" · ");

  if (enrolled && item.bunny_stream_embed_url && documentUrl) {
    return (
      <div
        data-testid={variant === "sidebar" ? `learner-curriculum-item-${item.id}` : undefined}
        className={`flex w-full flex-col text-start transition ${variant === "sidebar" ? `rounded-none ${active ? "bg-[#E8F1FB] shadow-[inset_0_0_0_1px_#0A5FB4]" : "bg-white hover:bg-[#FAF9F5]"}` : `rounded-xl border ${active ? "border-[#0A5FB4] bg-[#E8F1FB]" : "border-[#D8E3EC] bg-white hover:border-[#7DD3FC]"}`}`}
      >
        <button
          type="button"
          aria-expanded={resourcesExpanded}
          aria-controls={`item-resources-${item.id}`}
          aria-label={resourcesExpanded ? t("collapseResources") : t("expandResources")}
          onClick={() => setResourcesExpanded((expanded) => !expanded)}
          className="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0284C7]"
        >
          <Video className={`size-5 shrink-0 ${accentClass}`} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <strong className={`block truncate text-sm ${inkClass}`}>{item.title}</strong>
            <span className="text-xs text-[#6B7E8F]">{itemMeta}</span>
          </span>
          {completed ? (
            <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${variant === "sidebar" ? "bg-[#E6F4EC] text-[#16784A]" : "bg-emerald-50 text-emerald-700"}`}>تم</span>
          ) : (
            <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${variant === "sidebar" ? "bg-[#E6F4EC] text-[#16784A]" : "bg-[#E8F6FE] text-[#087443]"}`}>{t("available")}</span>
          )}
          <ChevronDown className={`size-4 shrink-0 text-[#6B7E8F] transition-transform ${resourcesExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {resourcesExpanded && <div id={`item-resources-${item.id}`} role="list" aria-label={t("resourceList")} className="grid gap-1 border-t border-[#D8E3EC] px-3 py-2">
          <button
            type="button"
            onClick={() => onPlay(item, lesson)}
            aria-label={t("playVideo")}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start text-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
          >
            <Video className={`size-4 shrink-0 ${accentClass}`} aria-hidden="true" />
            <span className={`min-w-0 flex-1 font-bold ${inkClass}`}>{t("video")}</span>
            <Play className={`size-4 shrink-0 fill-current ${accentClass}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onOpen(item, lesson)}
            aria-label={t("viewDocument")}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start text-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
          >
            <FileText className={`size-4 shrink-0 ${variant === "sidebar" ? "text-[#16784A]" : "text-[#087443]"}`} aria-hidden="true" />
            <span className={`min-w-0 flex-1 font-bold ${inkClass}`}>{t("document")}</span>
            <ArrowLeft className="size-4 shrink-0 text-[#6B7E8F]" aria-hidden="true" />
          </button>
          {subRow}
        </div>}
      </div>
    );
  }

  if (enrolled && item.bunny_stream_embed_url) {
    return (
      <button
        type="button"
        onClick={() => onPlay(item, lesson)}
        data-testid={variant === "sidebar" ? `learner-curriculum-item-${item.id}` : undefined}
        className={`flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-start transition focus-visible:outline-none focus-visible:ring-2 ${variant === "sidebar" ? "focus-visible:ring-[#0A5FB4]" : "focus-visible:ring-[#0284C7]"} ${variant === "sidebar" ? `rounded-none ${active ? "bg-[#E8F1FB] shadow-[inset_0_0_0_1px_#0A5FB4]" : "bg-white hover:bg-[#FAF9F5]"}` : `rounded-xl border ${active ? "border-[#0284C7] bg-[#E8F6FE]" : "border-[#D8E3EC] bg-white hover:border-[#7DD3FC]"}`}`}
      >
        <ItemIcon className={`size-5 shrink-0 ${accentClass}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className={`block truncate text-sm ${inkClass}`}>{item.title}</strong>
          <span className="text-xs text-[#6B7E8F]">{itemMeta}</span>
        </span>
        {completed ? (
          <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${variant === "sidebar" ? "bg-[#E6F4EC] text-[#16784A]" : "bg-emerald-50 text-emerald-700"}`}>تم</span>
        ) : (
          <Play className={`size-4 shrink-0 fill-current ${accentClass}`} aria-hidden="true" />
        )}
      </button>
    );
  }

  if (enrolled && documentUrl) {
    return (
      <button
        type="button"
        onClick={() => onOpen(item, lesson)}
        data-testid={variant === "sidebar" ? `learner-curriculum-item-${item.id}` : undefined}
        className={`flex w-full items-center gap-3 px-3 py-3 text-start transition focus-visible:outline-none focus-visible:ring-2 ${variant === "sidebar" ? "focus-visible:ring-[#0A5FB4]" : "focus-visible:ring-[#0284C7]"} ${variant === "sidebar" ? `rounded-none ${active ? "bg-[#E8F1FB] shadow-[inset_0_0_0_1px_#0A5FB4]" : "bg-white hover:bg-[#FAF9F5]"}` : `rounded-xl border ${active ? "border-[#0284C7] bg-[#E8F6FE]" : "border-[#D8E3EC] bg-white hover:border-[#7DD3FC]"}`}`}
      >
        <ItemIcon className={`size-5 shrink-0 ${variant === "sidebar" ? "text-[#16784A]" : "text-[#087443]"}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className={`block truncate text-sm ${inkClass}`}>{item.title}</strong>
          <span className="text-xs text-[#6B7E8F]">{itemMeta}</span>
        </span>
        {completed ? <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${variant === "sidebar" ? "bg-[#E6F4EC] text-[#16784A]" : "bg-emerald-50 text-emerald-700"}`}>تم</span> : <ArrowLeft className="size-4 shrink-0 text-[#6B7E8F]" aria-hidden="true" />}
      </button>
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
  activeContentId,
  expandedChapterId,
  expandedLessonId,
  onChapterToggle,
  onLessonToggle,
  onPlay,
  onOpen,
  completedItemIds = [],
  lessonSlots,
}: {
  chapters: PublicChapterDto[];
  enrolled: boolean;
  variant?: "default" | "sidebar";
  activeContentId: number | null;
  expandedChapterId: number | null;
  expandedLessonId: number | null;
  onChapterToggle: (chapterId: number) => void;
  onLessonToggle: (lessonId: number) => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  onOpen: (item: PublicItemDto, lesson: PublicLessonDto) => void;
  completedItemIds?: number[];
  /** Places extra rows (course tests) inside each lesson's item list. */
  lessonSlots?: (lesson: PublicLessonDto) => LessonSlots | undefined;
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
            className={variant === "sidebar" ? "overflow-hidden border-b border-[#E4E2DC] bg-white last:border-b-0" : "sticker-tile overflow-hidden"}
            aria-labelledby={`chapter-${chapter.id}-${chapterIndex}`}
          >
            <button
              type="button"
              onClick={() => onChapterToggle(chapter.id)}
              aria-expanded={expanded}
              aria-controls={`chapter-content-${chapter.id}-${chapterIndex}`}
              className={`flex w-full cursor-pointer items-center text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 ${variant === "sidebar" ? "min-h-14 gap-3 px-3 py-3" : "min-h-16 gap-4 px-4 py-4 sm:px-5"} ${expanded && variant !== "sidebar" ? "border-b-2 border-ink bg-brand-50 dark:border-brand-300 dark:bg-slate-800" : ""} ${expanded && variant === "sidebar" ? "bg-[#E8F1FB]" : ""} ${!expanded && variant !== "sidebar" ? "hover:bg-brand-50/60 dark:hover:bg-slate-800/60" : ""} ${!expanded && variant === "sidebar" ? "hover:bg-[#FAF9F5]" : ""}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <h3
                  id={`chapter-${chapter.id}-${chapterIndex}`}
                  className={`truncate text-base font-black sm:text-lg ${expanded ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-slate-50"}`}
                >
                  {chapter.title || t("coursePlan")}
                </h3>
                <m.span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${expanded ? "border-ink bg-ink text-white dark:border-brand-300 dark:bg-brand-600" : "border-ink/20 text-muted dark:border-slate-600 dark:text-slate-400"}`}
                  initial={false}
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <ChevronDown
                    className="size-4"
                    aria-hidden="true"
                  />
                </m.span>
              </span>
              <span className="sticker-numeral shrink-0 text-xs font-black text-muted dark:text-slate-400">
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
                      activeContentId={activeContentId}
                      onToggle={() => onLessonToggle(lesson.id)}
                      onPlay={onPlay}
                      onOpen={onOpen}
                      completedItemIds={completedItemIds}
                      slots={lessonSlots?.(lesson)}
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
