"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { useVideoProgress } from "@/src/features/student/hooks/use-video-analytics-queries";
import type { PublicItemDto, PublicLessonDto } from "@/src/lib/student-api/contract";
import { classifyVideoError } from "@/src/lib/student-api/video-errors";
import { useTranslations } from "next-intl";
import VideoPreviewCard, { type PreviewCardState } from "./video-preview-card";
import { useVideoSession } from "./use-video-session";

export default function VideoLesson({
  item,
  lesson,
  courseId,
  completed,
  onCompleted,
}: {
  item: PublicItemDto;
  lesson: PublicLessonDto;
  courseId: number;
  completed: boolean;
  onCompleted: () => void;
}) {
  const tv = useTranslations("courseDetail.videoPlayback");
  const router = useRouter();
  const redirectedRef = useRef(false);
  const onUnauthenticated = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace("/login");
  }, [router]);
  const { status, embedUrl, isCompleted, lastPositionSec, start, iframeRef } = useVideoSession({
    itemId: item.id,
    courseId,
    durationSec: item.duration_seconds,
    initiallyCompleted: completed,
    onUnauthenticated,
  });
  const showPlayer = embedUrl !== null && (status.kind === "seeking" || status.kind === "playing");
  const progressQuery = useVideoProgress(showPlayer ? null : item.id);
  const progressErrorKind = progressQuery.isError ? classifyVideoError(progressQuery.error) : null;

  useEffect(() => {
    if (progressErrorKind === "unauthenticated") onUnauthenticated();
  }, [progressErrorKind, onUnauthenticated]);

  useEffect(() => {
    if (isCompleted) onCompleted();
  }, [isCompleted, onCompleted]);

  if (showPlayer) {
    return (
      <div className="relative size-full">
        <iframe
          ref={iframeRef}
          src={embedUrl ?? undefined}
          title={`${lesson.title} - ${item.title}`}
          className="size-full border-0 [color-scheme:light]"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {status.kind === "seeking" && (
          <div role="status" className="absolute inset-0 flex items-center justify-center bg-[#0D1015]/80 text-sm text-white">
            {tv("loadingPlayer")}
          </div>
        )}
      </div>
    );
  }

  let state: PreviewCardState;
  if (status.kind === "interrupted") state = { kind: "interrupted", positionSec: lastPositionSec };
  else if (status.kind === "error") state = { kind: "error", reason: status.reason };
  else if (status.kind === "starting" || progressQuery.isPending) state = { kind: "loading" };
  else if (progressQuery.isError) state = { kind: "error", reason: classifyVideoError(progressQuery.error) };
  else state = { kind: "ready", progress: progressQuery.data };

  return (
    <VideoPreviewCard
      state={state}
      onStart={start}
      // A failed progress load is refetched; any other failure starts a fresh session at the last position.
      onRetry={() => (progressQuery.isError ? void progressQuery.refetch() : start(lastPositionSec))}
    />
  );
}
