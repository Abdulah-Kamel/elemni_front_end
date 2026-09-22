"use client";

import { Download, FileText, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicItemDto, PublicLessonDto } from "@/src/lib/student-api/contract";
import { resolveAssetUrl } from "@/src/lib/asset-url";

export default function LearnerPlayer({
  activeContent,
}: {
  activeContent: {
    item: PublicItemDto;
    lesson: PublicLessonDto;
    type: "video" | "document";
  } | null;
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
      className="scroll-mt-24 overflow-hidden rounded-2xl bg-[#07131F] shadow-[0_22px_60px_-34px_rgba(2,132,199,0.9)]"
    >
      <div className={isDocument ? "bg-[#E5EDF3] p-2 sm:p-4" : "aspect-video bg-black"}>
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
      <div className="border-t border-white/10 px-5 py-4 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#7DD3FC]">
              {isDocument ? t("documentPreview") : t("lessonContent")}
            </p>
            <h2 id="player-title" className="mt-1 text-lg font-black">
              {activeContent.item.title}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#A9C0D2]">
              {isDocument ? <FileText className="size-3.5" aria-hidden="true" /> : <PlayCircle className="size-3.5" aria-hidden="true" />}
              {activeContent.lesson.title}
            </p>
          </div>
          {isDocument && assetUrl && (
            <a
              href={assetUrl}
              download
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC]"
            >
              <Download className="size-4" aria-hidden="true" />
              {t("downloadDocument")}
            </a>
          )}
        </div>
        {isDocument && assetUrl && (
          <p className="mt-3 text-xs leading-5 text-[#A9C0D2]">
            {t("documentPreviewFallback")} {" "}
            <a href={assetUrl} target="_blank" rel="noreferrer" className="font-bold text-[#7DD3FC] underline">
              {t("openDocument")}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
