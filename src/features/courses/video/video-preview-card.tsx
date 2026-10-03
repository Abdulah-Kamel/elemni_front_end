"use client";

import type { ReactNode } from "react";
import { PlayCircle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { WHATSAPP_URL } from "@/src/features/contact/contact-details";
import type { VideoProgressDto } from "@/src/lib/student-api/contract";
import type { VideoErrorKind } from "@/src/lib/student-api/video-errors";
import { formatPlaybackTime } from "./format-playback-time";

export type PreviewVariant =
  | { kind: "watch-limit" }
  | { kind: "resume"; positionSec: number }
  | { kind: "completed" }
  | { kind: "start" };

export function resolvePreviewVariant(progress: VideoProgressDto): PreviewVariant {
  if (progress.allowance_remaining === 0 && progress.attempt_status !== "active") return { kind: "watch-limit" };
  if (progress.attempt_status === "active" && progress.last_position_sec > 0) {
    return { kind: "resume", positionSec: progress.last_position_sec };
  }
  if (progress.completed_attempts > 0) return { kind: "completed" };
  if (progress.last_position_sec > 0) return { kind: "resume", positionSec: progress.last_position_sec };
  return { kind: "start" };
}

export type PreviewCardState =
  | { kind: "loading" }
  | { kind: "error"; reason: VideoErrorKind | "player-timeout" | "player-error" }
  | { kind: "interrupted"; positionSec: number }
  | { kind: "ready"; progress: VideoProgressDto };

const primaryButton =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0A5FB4] px-5 text-sm font-bold text-white transition hover:bg-[#084A8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1015]";

function Time({ seconds }: { seconds: number }) {
  return <span dir="ltr" className="tabular-nums">{formatPlaybackTime(seconds)}</span>;
}

function WatchLimitBlock() {
  const tv = useTranslations("courseDetail.videoPlayback");
  return (
    <>
      <p className="text-lg font-black text-white">{tv("watchLimitTitle")}</p>
      <p className="max-w-sm text-sm leading-6 text-slate-300">{tv("watchLimitBody")}</p>
      <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm font-bold text-sky-300 underline">{tv("contactSupport")}</a>
    </>
  );
}

export default function VideoPreviewCard({
  state,
  onStart,
  onRetry,
}: {
  state: PreviewCardState;
  onStart: (positionSec: number) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("courseDetail");
  const tv = useTranslations("courseDetail.videoPlayback");

  let body: ReactNode;
  if (state.kind === "loading") {
    body = <div role="status" aria-label={tv("loadingPlayer")} className="h-11 w-40 animate-pulse rounded-xl bg-white/10" />;
  } else if (state.kind === "error" && state.reason === "watch-limit") {
    body = <WatchLimitBlock />;
  } else if (state.kind === "error") {
    const message = state.reason === "processing"
      ? tv("processing")
      : state.reason === "not-enrolled"
        ? tv("notEnrolled")
        : state.reason === "unavailable" || state.reason === "forbidden"
          ? tv("unavailable")
          : t("videoLoadError");
    body = (
      <>
        <p role="alert" className="max-w-sm text-sm leading-6 text-slate-200">{message}</p>
        {state.reason !== "not-enrolled" && (
          <button type="button" onClick={onRetry} className={primaryButton}>
            <RotateCcw className="size-4" aria-hidden="true" />{t("retry")}
          </button>
        )}
      </>
    );
  } else if (state.kind === "interrupted") {
    body = (
      <>
        <p className="text-lg font-black text-white">{tv("interruptedTitle")}</p>
        <p className="max-w-sm text-sm leading-6 text-slate-300">{tv("interruptedBody")}</p>
        <button type="button" onClick={() => onStart(state.positionSec)} className={primaryButton}>
          <PlayCircle className="size-4" aria-hidden="true" />{tv("resume")}
        </button>
      </>
    );
  } else {
    const variant = resolvePreviewVariant(state.progress);
    const remaining = state.progress.allowance_remaining;
    const footnote = remaining !== null && variant.kind !== "watch-limit"
      ? <p className="text-xs text-slate-400">{tv("viewsRemaining", { count: remaining })}</p>
      : null;
    if (variant.kind === "watch-limit") {
      body = <WatchLimitBlock />;
    } else if (variant.kind === "resume") {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv.rich("resumeFrom", { time: () => <Time seconds={variant.positionSec} /> })}</p>
          <button type="button" onClick={() => onStart(variant.positionSec)} className={primaryButton}>
            <PlayCircle className="size-4" aria-hidden="true" />{tv("resume")}
          </button>
          {footnote}
        </>
      );
    } else if (variant.kind === "completed") {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv("completedTitle")}</p>
          <button type="button" onClick={() => onStart(0)} className={primaryButton}>
            <RotateCcw className="size-4" aria-hidden="true" />{tv("watchAgain")}
          </button>
          {footnote}
        </>
      );
    } else {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv("startWatching")}</p>
          <button type="button" onClick={() => onStart(0)} className={primaryButton}>
            <PlayCircle className="size-4" aria-hidden="true" />{tv("play")}
          </button>
          {footnote}
        </>
      );
    }
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-[#0D1015] p-6 text-center">
      {body}
    </div>
  );
}
