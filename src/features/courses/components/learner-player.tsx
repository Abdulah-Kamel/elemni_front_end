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
  if (!activeContent) return null;
  const isDocument = activeContent.type === "document";
  const assetUrl = isDocument
    ? resolveAssetUrl(activeContent.item.document_path, "")
    : activeContent.item.bunny_stream_embed_url;
  if (!assetUrl) return null;

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
