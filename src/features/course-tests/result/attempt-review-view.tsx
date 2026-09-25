"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowRight, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { scrollIntoViewById } from "@/src/features/courses/components/course-motion";
import { CourseTestsApiError } from "../client";
import { formatClock } from "../format";
import { useAttemptReview } from "../hooks";
import type { AttemptResult, CourseTestDetail, ReviewQuestion, ReviewStatus } from "../types";
import { countByFilter, matchesFilter, REVIEW_FILTERS, type ReviewFilter } from "./review-filter";
import { reviewCardId, ReviewQuestionCard, StatusIcon, statusStyles } from "./review-question-card";
import { cardClass, EASE_OUT, quietButtonClass, ScoreRing } from "./result-ui";

const filterTone: Record<ReviewFilter, string> = {
  all: "text-slate-900 dark:text-slate-50",
  correct: "text-green-700 dark:text-green-300",
  wrong: "text-red-700 dark:text-red-300",
  blank: "text-slate-600 dark:text-slate-400",
};

function FilterTabs({ value, counts, onChange }: { value: ReviewFilter; counts: Record<ReviewFilter, number>; onChange: (filter: ReviewFilter) => void }) {
  const t = useTranslations("courseTests.result.reviewPage.filters");
  const locale = useLocale();
  const reduce = useReducedMotion();

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const rtl = locale === "ar";
    const step = event.key === "ArrowLeft" ? (rtl ? 1 : -1) : event.key === "ArrowRight" ? (rtl ? -1 : 1) : 0;
    let next: ReviewFilter | null = null;
    if (step) next = REVIEW_FILTERS[(REVIEW_FILTERS.indexOf(value) + step + REVIEW_FILTERS.length) % REVIEW_FILTERS.length];
    if (event.key === "Home") next = REVIEW_FILTERS[0];
    if (event.key === "End") next = REVIEW_FILTERS[REVIEW_FILTERS.length - 1];
    if (!next) return;
    event.preventDefault();
    onChange(next);
    document.getElementById(`review-tab-${next}`)?.focus();
  };

  return (
    <div role="tablist" aria-label={t("label")} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {REVIEW_FILTERS.map((filter) => {
        const selected = filter === value;
        return (
          <button
            key={filter}
            id={`review-tab-${filter}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="review-question-list"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(filter)}
            onKeyDown={onKeyDown}
            className={cn(
              "relative isolate inline-flex min-h-11 shrink-0 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-600 motion-reduce:transition-none",
              selected
                ? "border-slate-900 text-white dark:border-slate-50 dark:text-slate-900"
                : cn("border-slate-200 bg-white hover:bg-slate-50 dark:border-border dark:bg-surface dark:hover:bg-surface-muted", filterTone[filter]),
            )}
          >
            {selected ? (
              <m.span
                layoutId="review-filter-indicator"
                aria-hidden="true"
                className="absolute -inset-px -z-10 rounded-full bg-slate-900 dark:bg-slate-50"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
            {t(filter)} · {counts[filter]}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCard({ attempt }: { attempt: AttemptResult }) {
  const t = useTranslations("courseTests.result");
  const graded = attempt.status === "graded";
  const showScore = attempt.score_visible && graded && attempt.percent !== null;
  const tone = !showScore ? "neutral" : attempt.passed ? "passed" : "failed";
  const title = !graded ? t("reviewPage.pendingStatus") : !showScore ? t("hidden.title") : attempt.passed ? t("pill.passed") : t("pill.failed");
  const time = formatClock(attempt.duration_seconds);
  return (
    <div className="flex items-center gap-4 rounded-[20px] border-2 border-slate-900 bg-white p-4 shadow-[5px_5px_0_#0F172A] @xl:p-5 dark:border-slate-50 dark:bg-surface dark:shadow-[5px_5px_0_#020617]">
      <ScoreRing percent={showScore ? (attempt.percent ?? 0) : 0} tone={tone} strokeWidth={18} className="size-[72px]">
        <span className="text-[17px] font-bold tabular-nums">{showScore ? `${attempt.percent}%` : "—"}</span>
      </ScoreRing>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-bold">{title}</span>
        <span className="text-[13px] text-slate-500 tabular-nums dark:text-slate-400">
          {showScore ? t("reviewPage.summaryTime", { score: attempt.score_total ?? 0, max: attempt.max_score, time }) : t("reviewPage.summaryTimeHidden", { time })}
        </span>
      </div>
    </div>
  );
}

const legendOrder: ReviewStatus[] = ["correct", "wrong", "partial", "blank", "pending"];

function Navigator({ questions, onJump }: { questions: ReviewQuestion[]; onJump: (question: ReviewQuestion) => void }) {
  const t = useTranslations("courseTests.result.reviewPage");
  const present = new Set(questions.map((question) => question.status));
  const legend = legendOrder.filter((status) => status === "correct" || status === "wrong" || status === "blank" || present.has(status));
  return (
    <nav aria-labelledby="review-navigator-title" className={cn(cardClass, "flex flex-col gap-4 rounded-[20px] p-4 @xl:p-5")}>
      <h2 id="review-navigator-title" className="text-base font-bold">
        {t("navigator")}
      </h2>
      <ol className="grid grid-cols-5 gap-2.5 tabular-nums @xl:grid-cols-10 @4xl:grid-cols-5">
        {questions.map((question, index) => {
          const status = t(`status.${question.status}`);
          return (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => onJump(question)}
                aria-label={t("navigatorItem", { number: index + 1, status })}
                className={cn(
                  "relative grid h-[46px] w-full place-items-center rounded-xl border-2 text-[15px] font-bold transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                  statusStyles[question.status].nav,
                )}
              >
                {index + 1}
                <StatusIcon status={question.status} className="absolute top-0.5 end-0.5 size-2.5 opacity-70" />
              </button>
            </li>
          );
        })}
      </ol>
      <ul aria-label={t("legend")} className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
        {legend.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span className={cn("size-3.5 rounded border-2", statusStyles[status].swatch)} aria-hidden="true" />
            {t(`status.${status}`)}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ReviewMessage({ title, body, action }: { title: string; body?: string; action: ReactNode }) {
  return (
    <div role="alert" className={cn(cardClass, "flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center")}>
      <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-surface-muted dark:text-slate-300" aria-hidden="true">
        <Lock className="size-6" />
      </span>
      <p className="text-lg font-bold">{title}</p>
      {body ? <p className="max-w-md text-sm leading-[1.8] text-slate-600 dark:text-slate-400">{body}</p> : null}
      {action}
    </div>
  );
}

// Answer-Review design.
export function AttemptReviewView({
  test,
  attemptId,
  onBackToResult,
}: {
  test: CourseTestDetail;
  attemptId: number;
  onBackToResult: (attemptId: number) => void;
}) {
  const t = useTranslations("courseTests.result.reviewPage");
  const tResult = useTranslations("courseTests.result");
  const tCommon = useTranslations("courseTests.common");
  const query = useAttemptReview(attemptId);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [toggled, setToggled] = useState<Record<number, boolean>>({});

  const backButton = (
    <button type="button" onClick={() => onBackToResult(attemptId)} className={quietButtonClass}>
      <ArrowRight className="size-[18px] ltr:rotate-180" aria-hidden="true" />
      {t("backToResult")}
    </button>
  );

  if (query.isPending) {
    return (
      <div role="status" className={cn(cardClass, "grid min-h-80 place-items-center text-sm font-semibold text-slate-500 dark:text-slate-400")}>
        <span className="animate-pulse motion-reduce:animate-none">{t("loading")}</span>
      </div>
    );
  }

  if (!query.data) {
    const forbidden = query.error instanceof CourseTestsApiError && query.error.status === 403;
    return forbidden ? (
      <ReviewMessage title={t("forbiddenTitle")} body={t("forbiddenBody")} action={backButton} />
    ) : (
      <ReviewMessage
        title={tResult("loadError")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => void query.refetch()} className={quietButtonClass}>
              {tCommon("retry")}
            </button>
            {backButton}
          </div>
        }
      />
    );
  }

  const { attempt, questions } = query.data;
  const counts = countByFilter(questions);
  const numbers = new Map(questions.map((question, index) => [question.id, index + 1]));
  const visible = questions.filter((question) => matchesFilter(question, filter));
  const isExpanded = (question: ReviewQuestion) => toggled[question.id] ?? question.status !== "blank";

  const jumpTo = (question: ReviewQuestion) => {
    flushSync(() => {
      if (!matchesFilter(question, filter)) setFilter("all");
      if (!isExpanded(question)) setToggled((current) => ({ ...current, [question.id]: true }));
    });
    scrollIntoViewById(reviewCardId(question.id), { block: "start" });
    document.getElementById(reviewCardId(question.id))?.focus({ preventScroll: true });
  };

  return (
    <div className="@container flex flex-col gap-5 text-slate-900 @xl:gap-6 dark:text-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[13px] text-slate-500 tabular-nums dark:text-slate-400">{t("eyebrow", { title: test.title, number: attempt.number })}</p>
          <h1 className="text-[22px] font-bold @xl:text-2xl">{t("title")}</h1>
        </div>
        {backButton}
      </header>

      <div className="grid items-start gap-5 @4xl:grid-cols-[minmax(0,1fr)_20rem] @4xl:gap-6">
        <aside className="flex flex-col gap-4 @4xl:sticky @4xl:top-24 @4xl:order-last @4xl:gap-5">
          <SummaryCard attempt={attempt} />
          <Navigator questions={questions} onJump={jumpTo} />
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <FilterTabs value={filter} counts={counts} onChange={setFilter} />
          <div id="review-question-list" role="tabpanel" aria-labelledby={`review-tab-${filter}`} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((question) => (
                <ReviewQuestionCard
                  key={question.id}
                  question={question}
                  number={numbers.get(question.id) ?? 0}
                  expanded={isExpanded(question)}
                  onToggle={() => setToggled((current) => ({ ...current, [question.id]: !isExpanded(question) }))}
                />
              ))}
              {visible.length === 0 ? (
                <m.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className={cn(cardClass, "p-8 text-center text-sm text-slate-500 dark:text-slate-400")}
                >
                  {t("emptyFilter")}
                </m.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
