"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { getCourseTestsClient } from "../client";
import { useAttempt } from "../hooks";
import type { Attempt, CourseTestDetail } from "../types";
import { AttemptSession } from "./attempt-session";
import { TimeUpDialog } from "./attempt-dialogs";
import { readPending, writePending } from "./autosave-queue";
import { card, secondaryButton } from "./styles";

/**
 * Renders an in-progress attempt (Question, Question-Warning, Question-Types,
 * Submit-Confirm, Time-Up and Mobile-Question designs).
 */
export function AttemptPlayer({
  test,
  attemptId,
  onExit,
  onShowResult,
}: {
  test: CourseTestDetail;
  attemptId: number;
  /** Save & exit: back to the test start screen / course. */
  onExit: () => void;
  /** Go to the result screen for this attempt. */
  onShowResult: (attemptId: number) => void;
}) {
  const t = useTranslations("courseTests.attempt");
  const query = useAttempt(attemptId);
  const attempt = query.data;
  // Decide once: a session that started in progress stays mounted through its
  // own submission even if the attempt query refetches as "submitted".
  const [mode, setMode] = useState<"session" | "closed" | null>(null);
  if (mode === null && attempt) setMode(attempt.status === "in_progress" ? "session" : "closed");

  if (attempt && mode === "session") {
    return <AttemptSession test={test} attempt={attempt} onExit={onExit} onShowResult={onShowResult} />;
  }
  if (attempt && mode === "closed") {
    return <ClosedAttempt attempt={attempt} onShowResult={onShowResult} />;
  }
  if (query.isError) {
    return (
      <div role="alert" className={`${card} grid min-h-80 place-items-center gap-3 p-8 text-center`}>
        <p className="m-0 font-semibold text-red-700 dark:text-red-300">{t("loadError")}</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <button type="button" onClick={() => void query.refetch()} className={secondaryButton}>
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }
  return <AttemptSkeleton label={t("loading")} />;
}

function AttemptSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <span className="h-3.5 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <span className="h-7 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
      <div aria-hidden="true" className="flex gap-6">
        <div className={`${card} flex min-h-[28rem] flex-1 flex-col gap-4 p-6 sm:p-8`}>
          <span className="h-5 w-2/5 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <span className="h-1.5 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
          <span className="h-7 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          {[0, 1, 2, 3].map((item) => (
            <span key={item} className="h-[60px] w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          ))}
        </div>
        <div className="hidden w-[340px] shrink-0 flex-col gap-5 lg:flex">
          <span className="h-36 animate-pulse rounded-[20px] border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900" />
          <span className={`${card} h-80 animate-pulse`} />
        </div>
      </div>
    </div>
  );
}

/**
 * The attempt was already closed when we loaded it: show Time-Up when the
 * server auto-submitted it, otherwise go straight to the result.
 */
function ClosedAttempt({ attempt, onShowResult }: { attempt: Attempt; onShowResult: (attemptId: number) => void }) {
  const [timeUp, setTimeUp] = useState<{ answered: number; total: number; allSaved: boolean } | null>(null);
  const [hadUnsent] = useState(() => Object.keys(readPending(attempt.id)).length > 0);
  const onShowResultRef = useRef(onShowResult);
  useEffect(() => {
    onShowResultRef.current = onShowResult;
  }, [onShowResult]);

  useEffect(() => {
    let cancelled = false;
    // The attempt is over: unsent local answers can never be saved now.
    writePending(attempt.id, {});
    void (async () => {
      try {
        const result = await (await getCourseTestsClient()).getResult(attempt.id);
        if (cancelled) return;
        if (result.auto_submitted) setTimeUp({ answered: result.answered_count, total: result.question_count, allSaved: !hadUnsent });
        else onShowResultRef.current(attempt.id);
      } catch {
        if (!cancelled) onShowResultRef.current(attempt.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt.id, hadUnsent]);

  return (
    <>
      <AttemptSkeleton label="" />
      <AnimatePresence>
        {timeUp ? <TimeUpDialog answered={timeUp.answered} total={timeUp.total} allSaved={timeUp.allSaved} onShowResult={() => onShowResult(attempt.id)} /> : null}
      </AnimatePresence>
    </>
  );
}
