"use client";

import { ChevronLeft, ChevronRight, Download, FileText, Maximize2, Minimize2, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicItemDto, PublicLessonDto } from "@/src/lib/student-api/contract";
import { resolveAssetUrl } from "@/src/lib/asset-url";

export default function LearnerPlayer({
  activeContent,
  itemPosition,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  theaterMode,
  onTheaterModeChange,
}: {
  activeContent: {
    item: PublicItemDto;
    lesson: PublicLessonDto;
    type: "video" | "document";
  } | null;
  itemPosition: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  theaterMode: boolean;
  onTheaterModeChange: (enabled: boolean) => void;
}) {
  const t = useTranslations("courseDetail");
  if (!activeContent) {
    return (
      <PlayerEmptyState
        kind="video"
        title={t("noContent")}
        description={t("noContentDescription")}
      />
    );
  }
  const isDocument = activeContent.type === "document";
  const assetUrl = isDocument
    ? resolveAssetUrl(activeContent.item.document_path, "")
    : activeContent.item.bunny_stream_embed_url;
  if (!assetUrl) {
    return (
      <PlayerEmptyState
        kind={isDocument ? "document" : "video"}
        title={t("unavailable")}
        description={t("playerUnavailableDescription")}
      />
    );
  }

  return (
    <section
      id="course-player"
      aria-labelledby="player-title"
      className="scroll-mt-24 space-y-3"
    >
      <div
        className={
          isDocument
            ? "overflow-hidden rounded-[18px] border border-[#E4E2DC] bg-[#ECEAE4] p-2 sm:p-4"
            : "aspect-video overflow-hidden rounded-[18px] bg-[#0D1015]"
        }
      >
        <iframe
          src={assetUrl}
          title={`${activeContent.lesson.title} - ${activeContent.item.title}`}
          className={isDocument ? "h-[min(75dvh,56rem)] w-full border-0 bg-white" : "size-full border-0"}
          allow={isDocument ? undefined : "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"}
          allowFullScreen={!isDocument}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="rounded-[18px] border border-[#E4E2DC] bg-white px-5 py-4 text-[#15181E] shadow-[0_16px_38px_-30px_rgba(21,24,30,0.35)] sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#5F6573]">{itemPosition}</p>
            <h2 id="player-title" className="mt-1 text-lg font-black text-[#15181E]">
              {activeContent.item.title}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#5F6573]">
              {isDocument ? (
                <FileText className="size-3.5 text-[#0A5FB4]" aria-hidden="true" />
              ) : (
                <PlayCircle className="size-3.5 text-[#0A5FB4]" aria-hidden="true" />
              )}
              {activeContent.lesson.title}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E4E2DC] bg-white px-3 py-2 text-xs font-semibold text-[#15181E] transition hover:bg-[#F4F3EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] disabled:cursor-not-allowed disabled:text-[#8B9099] disabled:hover:bg-white"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              {t("previousItem")}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E4E2DC] bg-white px-3 py-2 text-xs font-semibold text-[#15181E] transition hover:bg-[#F4F3EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] disabled:cursor-not-allowed disabled:text-[#8B9099] disabled:hover:bg-white"
            >
              {t("nextItem")}
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            {!isDocument && (
              <button
                type="button"
                aria-pressed={theaterMode}
                onClick={() => onTheaterModeChange(!theaterMode)}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E4E2DC] bg-white px-3 py-2 text-xs font-semibold text-[#15181E] transition hover:bg-[#F4F3EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4]"
              >
                {theaterMode ? (
                  <Minimize2 className="size-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="size-4" aria-hidden="true" />
                )}
                {theaterMode ? t("exitTheaterMode") : t("enterTheaterMode")}
              </button>
            )}
            {isDocument && assetUrl && (
              <a
                href={assetUrl}
                download
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0A5FB4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#084A8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Download className="size-4" aria-hidden="true" />
                {t("downloadDocument")}
              </a>
            )}
          </div>
        </div>
        {isDocument && assetUrl && (
          <p className="mt-3 text-xs leading-5 text-[#5F6573]">
            {t("documentPreviewFallback")} {" "}
            <a href={assetUrl} target="_blank" rel="noreferrer" className="font-bold text-[#0A5FB4] underline">
              {t("openDocument")}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

function PlayerEmptyState({
  kind,
  title,
  description,
}: {
  kind: "video" | "document";
  title: string;
  description: string;
}) {
  const isDocument = kind === "document";

  return (
    <section
      id="course-player"
      aria-labelledby="player-empty-title"
      className="scroll-mt-24"
    >
      <div
        className={`learner-player-empty relative isolate flex aspect-video min-h-64 items-center justify-center overflow-hidden rounded-[18px] border border-[#DCE7EF] px-5 py-8 text-center sm:min-h-80 ${
          isDocument ? "bg-[#ECEAE4]" : "bg-[#0D1015]"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 420 240"
          fill="none"
          className={`learner-player-empty__art pointer-events-none absolute inset-x-0 top-[2%] mx-auto w-[min(72%,27rem)] ${
            isDocument ? "text-[#0A5FB4]" : "text-[#7DD3FC]"
          }`}
        >
          {isDocument ? (
            <>
              <g className="learner-player-empty__float">
                <path d="M157 39h83l35 35v119H157z" fill="#fff" stroke="#0F172A" strokeWidth="4" />
                <path d="M240 40v35h35" fill="#E0F2FE" stroke="#0F172A" strokeWidth="4" strokeLinejoin="round" />
                <path d="M178 99h58M178 119h76M178 139h66" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
                <rect x="177" y="155" width="47" height="20" rx="10" fill="#0284C7" stroke="#0F172A" strokeWidth="3" />
                <path d="M195 161h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </g>
              <circle className="learner-player-empty__spark learner-player-empty__spark--one" cx="116" cy="81" r="7" fill="#F97316" />
              <circle className="learner-player-empty__spark learner-player-empty__spark--two" cx="305" cy="158" r="5" fill="#38BDF8" />
              <path d="m127 151 7 7-7 7-7-7z" fill="#0284C7" />
            </>
          ) : (
            <>
              <g className="learner-player-empty__float">
                <rect x="121" y="45" width="178" height="130" rx="18" fill="#17212C" stroke="#7DD3FC" strokeWidth="4" />
                <rect x="135" y="59" width="150" height="102" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                <circle cx="210" cy="110" r="27" fill="#0284C7" stroke="#E0F2FE" strokeWidth="4" />
                <path d="m204 98 19 12-19 12z" fill="#fff" />
                <path d="M158 187h104" stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round" />
                <path d="M183 175v12m54-12v12" stroke="#7DD3FC" strokeWidth="4" />
              </g>
              <circle className="learner-player-empty__spark learner-player-empty__spark--one" cx="92" cy="79" r="6" fill="#F97316" />
              <circle className="learner-player-empty__spark learner-player-empty__spark--two" cx="323" cy="111" r="8" fill="#0284C7" />
              <path d="m104 155 7 7-7 7-7-7z" fill="#7DD3FC" />
            </>
          )}
        </svg>
        <div className="absolute inset-x-5 bottom-6 z-10 mx-auto max-w-sm sm:bottom-8">
          <h2 id="player-empty-title" className={`text-lg font-black sm:text-xl ${isDocument ? "text-[#15181E]" : "text-white"}`}>
            {title}
          </h2>
          <p className={`mt-2 text-sm leading-6 ${isDocument ? "text-[#4A505C]" : "text-slate-300"}`}>
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
