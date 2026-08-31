"use client";

import { PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicItemDto, PublicLessonDto } from "@/src/lib/student-api/contract";

export default function LearnerPlayer({
  activeVideo,
}: {
  activeVideo: { item: PublicItemDto; lesson: PublicLessonDto } | null;
}) {
  const t = useTranslations("courseDetail");
  if (!activeVideo?.item.bunny_stream_embed_url) return null;

  return (
    <section
      id="course-player"
      aria-labelledby="player-title"
      className="scroll-mt-24 overflow-hidden rounded-2xl bg-[#07131F] shadow-[0_22px_60px_-34px_rgba(2,132,199,0.9)]"
    >
      <div className="aspect-video bg-black">
        <iframe
          src={activeVideo.item.bunny_stream_embed_url}
          title={`${activeVideo.lesson.title} - ${activeVideo.item.title}`}
          className="size-full border-0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-white sm:px-6">
        <p className="text-xs font-bold text-[#7DD3FC]">{t("lessonContent")}</p>
        <h2 id="player-title" className="mt-1 text-lg font-black">
          {activeVideo.item.title}
        </h2>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#A9C0D2]">
          <PlayCircle className="size-3.5" aria-hidden="true" />
          {activeVideo.lesson.title}
        </p>
      </div>
    </section>
  );
}
