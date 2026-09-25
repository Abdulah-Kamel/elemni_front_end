"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { useAttemptResult, useInvalidateCourseTests } from "../hooks";
import type { AttemptResult, CourseTestDetail } from "../types";
import { GradedResult, type ResultActions } from "./result-graded";
import { PendingResult, SubmittedResult } from "./result-pending";
import { cardClass, EASE_OUT, quietButtonClass } from "./result-ui";

/** How often a not-yet-graded result is re-checked. */
export const RESULT_POLL_MS = 15_000;
/** Longest cooldown we schedule a refetch for (setTimeout caps at ~24.8 days anyway). */
const MAX_COOLDOWN_REFETCH_MS = 6 * 60 * 60 * 1000;

type ResultKind = "pending" | "submitted" | "graded";

export function resultKind(result: AttemptResult): ResultKind {
  if (result.status !== "graded") return "pending";
  if (!result.score_visible || result.percent === null) return "submitted";
  return "graded";
}

// Result-Passed / Result-Failed / Result-Pending / Mobile-Result.
export function AttemptResultView({
  test,
  attemptId,
  onReview,
  onRetry,
  retrying = false,
  retryError = null,
}: {
  test: CourseTestDetail;
  attemptId: number;
  onReview: (attemptId: number) => void;
  onRetry: () => void;
  /** Owned by the panel, which starts the new attempt and navigates on success. */
  retrying?: boolean;
  retryError?: string | null;
}) {
  const t = useTranslations("courseTests.result");
  const tCommon = useTranslations("courseTests.common");
  const reduce = useReducedMotion();
  const query = useAttemptResult(attemptId);
  const invalidate = useInvalidateCourseTests();
  const [sawPending, setSawPending] = useState(false);
  const result = query.data;
  const kind = result ? resultKind(result) : null;

  // Remember that this attempt was still being graded while the student watched,
  // so the graded view can announce the transition.
  if (kind === "pending" && !sawPending) setSawPending(true);
  const justGraded = sawPending && kind !== null && kind !== "pending";

  const { refetch } = query;

  useEffect(() => {
    if (kind !== "pending") return;
    const id = window.setInterval(() => void refetch(), RESULT_POLL_MS);
    return () => window.clearInterval(id);
  }, [kind, refetch]);

  // Once grading lands, refresh the sidebar/start screen/review caches.
  useEffect(() => {
    if (justGraded) void invalidate();
  }, [justGraded, invalidate]);

  // Re-read the result when a cooldown ends so "retry" appears on time.
  const nextAttemptAt = result?.next_attempt_at ?? null;
  useEffect(() => {
    if (!nextAttemptAt) return;
    const wait = new Date(nextAttemptAt).getTime() - Date.now();
    if (wait > MAX_COOLDOWN_REFETCH_MS) return;
    const id = window.setTimeout(() => void refetch(), Math.max(0, wait) + 1000);
    return () => window.clearTimeout(id);
  }, [nextAttemptAt, refetch]);

  if (query.isPending) {
    return (
      <div role="status" className={cn(cardClass, "grid min-h-80 place-items-center text-sm font-semibold text-slate-500 dark:text-slate-400")}>
        <span className="animate-pulse motion-reduce:animate-none">{t("loading")}</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div role="alert" className={cn(cardClass, "grid min-h-80 place-items-center gap-3 border-red-200 p-8 text-center dark:border-red-900")}>
        <p className="font-semibold text-red-700 dark:text-red-300">{t("loadError")}</p>
        <button type="button" onClick={() => void refetch()} className={quietButtonClass}>
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  const actions: ResultActions = {
    onReview: () => onReview(result.id),
    onRetry: () => {
      if (!retrying) onRetry();
    },
    retrying,
  };

  return (
    <div className="@container flex flex-col gap-4 text-slate-900 dark:text-slate-50">
      {retryError ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
          {retryError}
        </p>
      ) : null}
      <AnimatePresence initial={false}>
        {justGraded ? (
          <m.p
            key="graded-banner"
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
          >
            <CircleCheck className="size-[18px] shrink-0" aria-hidden="true" />
            {t("graded")}
          </m.p>
        ) : null}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={kind}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          {kind === "pending" ? (
            <PendingResult result={result} test={test} actions={actions} />
          ) : kind === "submitted" ? (
            <SubmittedResult result={result} test={test} actions={actions} />
          ) : (
            <GradedResult result={result} test={test} actions={actions} />
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
