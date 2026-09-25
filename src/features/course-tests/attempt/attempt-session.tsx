"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, LogOut, X } from "lucide-react";
import { AnimatePresence, m, type Variants } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { CourseTestsApiError, getCourseTestsClient } from "../client";
import { useInvalidateCourseTests } from "../hooks";
import type { AnswerResponse, Attempt, AttemptResult, CourseTestDetail } from "../types";
import { SaveErrorToast, SaveStatus, TimeWarningBanner, TimerCard, TimerPill } from "./attempt-chrome";
import { SubmitConfirmDialog, TimeUpDialog } from "./attempt-dialogs";
import { canNavigateTo, isAnswered, mergePending, summarize, type LocalAnswer, type LocalAnswers } from "./attempt-state";
import { Overlay } from "./overlay";
import { ProgressSegments, QuestionBody, type SegmentState } from "./question-card";
import { QuestionNavigator } from "./question-navigator";
import { card, focusRing, inkEdge, muted, primaryButton, secondaryButton } from "./styles";
import { isTimeWarning, useRemainingSeconds, useTimerAnnouncement } from "./timer";
import { useAutosave } from "./use-autosave";

type FinishReason = "manual" | "timeout" | "closed";
type TimeUpState = { answered: number; total: number; allSaved: boolean };

const positionKey = (attemptId: number) => `course-test:${attemptId}:position`;

function readPosition(attemptId: number): { current: number; furthest: number } | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(positionKey(attemptId)) ?? "null") as { current?: unknown; furthest?: unknown } | null;
    if (parsed && typeof parsed.current === "number" && typeof parsed.furthest === "number") return { current: parsed.current, furthest: parsed.furthest };
  } catch {
    /* ignore */
  }
  return null;
}

function writePosition(attemptId: number, value: { current: number; furthest: number } | null) {
  try {
    if (value) window.localStorage.setItem(positionKey(attemptId), JSON.stringify(value));
    else window.localStorage.removeItem(positionKey(attemptId));
  } catch {
    /* ignore */
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

/** Question slide: "next" enters from the reading direction's end (left in RTL). */
const slide: Variants = {
  enter: ({ direction, rtl }: { direction: number; rtl: boolean }) => ({ x: (rtl ? -1 : 1) * direction * 36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: ({ direction, rtl }: { direction: number; rtl: boolean }) => ({ x: (rtl ? 1 : -1) * direction * 36, opacity: 0 }),
};

export function AttemptSession({
  test,
  attempt,
  onExit,
  onShowResult,
}: {
  test: CourseTestDetail;
  attempt: Attempt;
  onExit: () => void;
  onShowResult: (attemptId: number) => void;
}) {
  const t = useTranslations("courseTests.attempt");
  const locale = useLocale();
  const rtl = locale === "ar";
  const invalidate = useInvalidateCourseTests();
  const questions = attempt.questions;
  const total = questions.length;
  const allowBack = attempt.allow_back_navigation;

  const finishRef = useRef<(reason: FinishReason) => Promise<void>>(async () => {});
  const { queue, snapshot } = useAutosave(
    attempt.id,
    questions.map((question) => question.id),
    useCallback(() => void finishRef.current("closed"), []),
  );

  const [answers, setAnswers] = useState<LocalAnswers>(() => mergePending(questions, queue.getPending()));
  const [position, setPosition] = useState(() => {
    const stored = readPosition(attempt.id);
    if (stored && stored.current >= 0 && stored.current < total) return { current: stored.current, furthest: Math.max(stored.current, Math.min(stored.furthest, total - 1)) };
    const firstOpen = questions.findIndex((question) => !isAnswered(answers[question.id]));
    const start = firstOpen === -1 ? 0 : firstOpen;
    return { current: start, furthest: start };
  });
  const [direction, setDirection] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [timeUp, setTimeUp] = useState<TimeUpState | null>(null);

  const remaining = useRemainingSeconds(attempt.deadline_at, attempt.server_now);
  const [initialRemaining] = useState(remaining);
  const announcedMinutes = useTimerAnnouncement(remaining);
  const warning = isTimeWarning(remaining);
  const totalSeconds = test.time_limit_minutes ? test.time_limit_minutes * 60 : (initialRemaining ?? 0);

  const current = position.current;
  const question = questions[current];
  const answer: LocalAnswer = answers[question.id] ?? { response: null, flagged: false };
  const summary = summarize(questions, answers);
  const segments: SegmentState[] = questions.map((item, index) => (index === current ? "current" : isAnswered(answers[item.id]) ? "answered" : "empty"));
  const isLast = current === total - 1;
  const locked = timeUp !== null;

  const navigatorHeadingId = useId();
  const sheetTitleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const focusHeadingNext = useRef(false);
  const headingRef = useCallback((node: HTMLHeadingElement | null) => {
    if (node && focusHeadingNext.current) {
      focusHeadingNext.current = false;
      node.focus({ preventScroll: true });
    }
  }, []);
  // After jumping from the confirm dialog / sheet, focus lands on the question
  // heading instead of returning to the button that opened the overlay.
  const restoreConfirmFocus = useRef(true);
  const restoreSheetFocus = useRef(true);

  // --- answers -------------------------------------------------------------
  const updateAnswer = (patch: Partial<LocalAnswer>) => {
    if (locked || queue.isClosed) return;
    const next = { ...answer, ...patch };
    setAnswers((previous) => ({ ...previous, [question.id]: next }));
    queue.enqueue(question.id, next);
  };
  const onResponse = (response: AnswerResponse) => updateAnswer({ response });
  const toggleFlag = () => updateAnswer({ flagged: !answer.flagged });

  // --- navigation ----------------------------------------------------------
  const goTo = (index: number, options: { focusQuestion?: boolean } = {}) => {
    if (!canNavigateTo(current, index, total, allowBack)) return;
    const next = { current: index, furthest: Math.max(position.furthest, index) };
    setDirection(index > current ? 1 : -1);
    setPosition(next);
    writePosition(attempt.id, next);
    focusHeadingNext.current = Boolean(options.focusQuestion);
    // Bring the new question's start into view (e.g. after "Next" in the mobile bottom bar).
    const cardNode = cardRef.current;
    if (cardNode && cardNode.getBoundingClientRect().top < 120 && typeof cardNode.scrollIntoView === "function") {
      cardNode.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  const jumpFromOverlay = (index: number) => {
    setConfirmOpen(false);
    setSheetOpen(false);
    if (index === current) return;
    restoreConfirmFocus.current = false;
    restoreSheetFocus.current = false;
    goTo(index, { focusQuestion: true });
  };

  const openConfirm = () => {
    restoreConfirmFocus.current = true;
    // Opening the confirm from the sheet: the dialog owns focus now.
    restoreSheetFocus.current = false;
    setSubmitError(null);
    setSheetOpen(false);
    setConfirmOpen(true);
  };

  // --- finishing -----------------------------------------------------------
  const finishing = useRef(false);
  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  const finish = async (reason: FinishReason) => {
    if (finishing.current) return;
    finishing.current = true;
    if (reason === "manual") {
      setSubmitting(true);
      setSubmitError(null);
    }
    const release = (message: string) => {
      finishing.current = false;
      setSubmitting(false);
      setSubmitError(message);
      if (remainingRef.current === 0) void finishRef.current("timeout");
    };

    const client = await getCourseTestsClient();
    const saved = reason === "closed" ? false : await withTimeout(queue.flush(), reason === "timeout" ? 4_000 : 15_000, false);
    if (reason === "manual" && !saved && !queue.isClosed) return release(t("confirm.saveFailed"));

    let result: AttemptResult | null = null;
    try {
      result = await client.submitAttempt(attempt.id);
    } catch (error) {
      if (reason === "manual" && !(error instanceof CourseTestsApiError && error.status === 409)) return release(t("confirm.submitFailed"));
      result = await client.getResult(attempt.id).catch(() => null);
    }

    const allSaved = queue.getSnapshot().pendingCount === 0;
    queue.clear();
    writePosition(attempt.id, null);

    const deadlinePassed = remainingRef.current === 0;
    if (reason === "manual" || (reason === "closed" && !deadlinePassed && !result?.auto_submitted)) {
      await invalidate();
      onShowResult(attempt.id);
      return;
    }
    setConfirmOpen(false);
    setSheetOpen(false);
    setSubmitting(false);
    const local = summarize(questions, answers);
    setTimeUp({ answered: result?.answered_count ?? local.answered, total: result?.question_count ?? total, allSaved });
  };
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (remaining === 0) void finishRef.current("timeout");
  }, [remaining]);

  const exit = async () => {
    setExiting(true);
    await withTimeout(queue.flush(), 5_000, false);
    onExit();
  };

  const showToast = snapshot.status === "error" || snapshot.status === "retrying";
  const prevDisabled = current === 0 || !allowBack || locked;

  const navigator = (headingId: string) => (
    <QuestionNavigator
      summary={summary}
      current={current}
      furthestVisited={position.furthest}
      allowBack={allowBack}
      headingId={headingId}
      onJump={(index) => (sheetOpen ? jumpFromOverlay(index) : goTo(index, { focusQuestion: true }))}
      onReview={openConfirm}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-4 pb-2 lg:gap-6" inert={locked}>
        {/* Desktop header (Question.dc.html) */}
        <header className="hidden items-center justify-between gap-4 lg:flex">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={cn("text-[13px]", muted)}>{test.lesson_title ? t("eyebrowWithLesson", { lesson: test.lesson_title }) : t("eyebrow")}</span>
            <h1 dir="auto" className="m-0 truncate text-2xl font-bold">
              {test.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <SaveStatus status={snapshot.status} />
            <button
              type="button"
              onClick={() => void exit()}
              disabled={exiting}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-[18px] text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
                focusRing,
              )}
            >
              {exiting ? t("exiting") : t("saveAndExit")}
              <LogOut aria-hidden="true" className="size-4 rtl:rotate-180" />
            </button>
          </div>
        </header>

        {/* Mobile sticky header (Mobile-Question.dc.html) */}
        <header className="sticky top-[72px] z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 pb-3 pt-3.5 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label={t("saveAndExit")}
              onClick={() => void exit()}
              disabled={exiting}
              className={cn("grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 dark:border-slate-700", focusRing)}
            >
              <X aria-hidden="true" className="size-[18px]" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 dir="auto" className="m-0 truncate text-[15px] font-bold">
                {test.title}
              </h1>
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("shrink-0 text-xs tabular-nums", muted)}>{t("question.position", { n: current + 1, total })}</span>
                <SaveStatus status={snapshot.status} className="min-w-0 overflow-hidden [&_span]:text-[11px]" />
              </div>
            </div>
            {remaining !== null ? <TimerPill remaining={remaining} warning={warning} /> : null}
          </div>
          <ProgressSegments segments={segments} />
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <AnimatePresence initial={false}>{warning ? <TimeWarningBanner key="warning" unansweredCount={summary.unanswered.length} /> : null}</AnimatePresence>

            <div ref={cardRef} className={cn(card, "scroll-mt-40 overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:scroll-mt-24 lg:px-8 lg:py-7")}>
              <AnimatePresence mode="wait" initial={false} custom={{ direction, rtl }}>
                <m.div
                  key={question.id}
                  custom={{ direction, rtl }}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <QuestionBody
                    question={question}
                    index={current}
                    total={total}
                    answer={answer}
                    segments={segments}
                    headingRef={headingRef}
                    onChange={onResponse}
                    onToggleFlag={toggleFlag}
                  />
                </m.div>
              </AnimatePresence>

              <div className="mt-6 hidden items-center justify-between gap-3 border-t border-slate-100 pt-[18px] lg:flex dark:border-slate-800">
                <button type="button" onClick={() => goTo(current - 1)} disabled={prevDisabled} className={cn(secondaryButton, "min-h-[46px]")}>
                  <ChevronLeft aria-hidden="true" className="size-[18px] rtl:rotate-180" />
                  {t("nav.prev")}
                </button>
                {isLast ? (
                  <button type="button" onClick={openConfirm} className={cn(primaryButton, "min-h-[46px]")}>
                    {t("nav.reviewAndSubmit")}
                  </button>
                ) : (
                  <button type="button" onClick={() => goTo(current + 1)} className={cn(primaryButton, "min-h-[46px]")}>
                    {t("nav.next")}
                    <ChevronRight aria-hidden="true" className="size-[18px] rtl:rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="sticky top-24 hidden flex-col gap-5 lg:flex">
            {remaining !== null ? <TimerCard remaining={remaining} totalSeconds={totalSeconds} warning={warning} /> : null}
            <div className={cn(card, "rounded-[20px] p-5")}>{navigator(navigatorHeadingId)}</div>
          </aside>
        </div>

        {/* Mobile bottom bar (Mobile-Question.dc.html) */}
        <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 p-3 backdrop-blur md:bottom-3 lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <button
            type="button"
            aria-label={t("nav.prevAria")}
            onClick={() => goTo(current - 1)}
            disabled={prevDisabled}
            className={cn("grid size-[50px] shrink-0 place-items-center rounded-full bg-white text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-900 dark:text-slate-100", inkEdge, focusRing)}
          >
            <ChevronLeft aria-hidden="true" className="size-[18px] rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label={`${t("navigator.open")} · ${t("navigator.answeredOf", { answered: summary.answered, total })}`}
            aria-haspopup="dialog"
            onClick={() => {
              restoreSheetFocus.current = true;
              setSheetOpen(true);
            }}
            className={cn(
              "inline-flex h-[50px] shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold tabular-nums dark:border-slate-700 dark:bg-slate-800",
              focusRing,
            )}
          >
            <LayoutGrid aria-hidden="true" className="size-4" />
            {summary.answered}/{total}
          </button>
          {isLast ? (
            <button type="button" onClick={openConfirm} className={cn(primaryButton, "h-[50px] flex-1 px-4")}>
              {t("nav.reviewAndSubmit")}
            </button>
          ) : (
            <button type="button" onClick={() => goTo(current + 1)} className={cn(primaryButton, "h-[50px] flex-1 px-4")}>
              {t("nav.next")}
              <ChevronRight aria-hidden="true" className="size-[18px] rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcedMinutes !== null ? t("timer.announce", { count: announcedMinutes }) : ""}
      </p>

      <SaveErrorToast open={showToast && !locked} retrying={snapshot.status === "retrying"} onRetry={() => void queue.flush()} />

      <AnimatePresence>
        {sheetOpen ? (
          <Overlay key="sheet" variant="sheet" labelledBy={sheetTitleId} restoreFocus={restoreSheetFocus} onClose={() => setSheetOpen(false)} className="gap-4 px-5 pt-3">
            <span aria-hidden="true" className="mx-auto h-1.5 w-12 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex justify-end">
              <button
                type="button"
                aria-label={t("navigator.close")}
                onClick={() => setSheetOpen(false)}
                className={cn("grid size-11 place-items-center rounded-xl border border-slate-200 dark:border-slate-700", focusRing)}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            {remaining !== null ? <TimerCard remaining={remaining} totalSeconds={totalSeconds} warning={warning} /> : null}
            {navigator(sheetTitleId)}
          </Overlay>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmOpen ? (
          <SubmitConfirmDialog
            key="confirm"
            summary={summary}
            remaining={remaining}
            current={current}
            allowBack={allowBack}
            submitting={submitting}
            error={submitError}
            restoreFocus={restoreConfirmFocus}
            onJump={jumpFromOverlay}
            onClose={() => setConfirmOpen(false)}
            onSubmit={() => void finish("manual")}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {timeUp ? <TimeUpDialog key="time-up" answered={timeUp.answered} total={timeUp.total} allSaved={timeUp.allSaved} onShowResult={() => onShowResult(attempt.id)} /> : null}
      </AnimatePresence>
    </>
  );
}
