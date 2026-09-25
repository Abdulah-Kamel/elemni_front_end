"use client";

import { m, useReducedMotion } from "motion/react";
import { BookOpen, ChevronLeft, Clock, Eye, RotateCcw, TimerOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import { formatClock, formatTestDate } from "../format";
import { courseItemHref } from "../routes";
import type { AttemptResult, CourseTestDetail } from "../types";
import {
  cardClass,
  ContinueLink,
  CountUp,
  EASE_OUT,
  ItemKindIcon,
  NextItemCard,
  OutcomePill,
  PassSparkles,
  primaryButtonClass,
  quietButtonClass,
  ScoreRing,
  secondaryButtonClass,
  StatTiles,
  staggerContainer,
  staggerItem,
} from "./result-ui";

export type ResultActions = {
  onReview: () => void;
  onRetry: () => void;
  retrying: boolean;
};

export function AutoSubmittedNote() {
  const t = useTranslations("courseTests.result");
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
      <TimerOff className="size-3.5" aria-hidden="true" />
      {t("autoSubmitted")}
    </p>
  );
}

export function CooldownNote({ at }: { at: string }) {
  const t = useTranslations("courseTests.result");
  const locale = useLocale();
  return (
    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 tabular-nums dark:text-slate-300">
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      {t("nextAttemptAt", { date: formatTestDate(at, locale) })}
    </p>
  );
}

function useTiles(result: AttemptResult) {
  const t = useTranslations("courseTests.result.stats");
  return [
    { key: "correct", label: t("correct"), shortLabel: t("correctShort"), value: String(result.correct_count), tone: "correct" as const },
    { key: "wrong", label: t("wrong"), shortLabel: t("wrongShort"), value: String(result.wrong_count), tone: "wrong" as const },
    { key: "blank", label: t("blank"), shortLabel: t("blank"), value: String(result.blank_count), tone: "neutral" as const },
    { key: "time", label: t("time"), shortLabel: t("timeShort"), value: formatClock(result.duration_seconds), tone: "neutral" as const },
  ];
}

function RingScore({ result, big }: { result: AttemptResult; big: boolean }) {
  const t = useTranslations("courseTests.result");
  const percent = result.percent ?? 0;
  const score = result.score_total ?? 0;
  return (
    <>
      <span className={cn("font-bold leading-none tabular-nums", big ? "text-[40px] @xl:text-[44px]" : "text-[40px]")}>
        <CountUp value={percent} suffix="%" />
      </span>
      <span className="text-[13px] text-slate-500 tabular-nums dark:text-slate-400" aria-hidden="true">
        {t("scoreOf", { score, max: result.max_score })}
      </span>
      <span className="sr-only">{t("scoreRingLabel", { percent, score, max: result.max_score })}</span>
    </>
  );
}

function AttemptDots({ result }: { result: AttemptResult }) {
  const t = useTranslations("courseTests.result");
  if (result.max_attempts === null || result.max_attempts > 10 || result.attempts_left === null) return null;
  const used = result.max_attempts - result.attempts_left;
  return (
    <span className="flex gap-1.5" role="img" aria-label={t("attemptDotsLabel", { used, max: result.max_attempts })}>
      {Array.from({ length: result.max_attempts }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-3 rounded-full",
            index < used ? "bg-red-500 dark:bg-red-400" : "border-2 border-slate-300 dark:border-slate-600",
          )}
        />
      ))}
    </span>
  );
}

function ReviewTopics({ result, courseId }: { result: AttemptResult; courseId: number }) {
  const t = useTranslations("courseTests.result.topics");
  if (!result.review_topics.length) return null;
  return (
    <m.section
      variants={staggerItem}
      aria-labelledby="review-topics-title"
      className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-amber-200 bg-amber-50 p-4 @xl:p-5 dark:border-amber-900/70 dark:bg-amber-950/30"
    >
      <h3 id="review-topics-title" className="flex items-center gap-2 text-[15px] font-bold text-amber-800 dark:text-amber-200">
        <BookOpen className="size-[18px]" aria-hidden="true" />
        {t("title")}
      </h3>
      <ul className="flex flex-col gap-2">
        {result.review_topics.map((topic) => (
          <li key={topic.id}>
            <Link
              href={courseItemHref(courseId, topic)}
              className="group flex min-h-11 items-center gap-3 rounded-xl border border-amber-200 bg-white px-3.5 py-3 text-slate-900 no-underline transition-colors hover:border-amber-300 hover:bg-amber-50/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-amber-900/60 dark:bg-surface dark:text-slate-50 dark:hover:bg-surface-muted"
            >
              <span className={cn("flex", topic.kind === "file" ? "text-green-600 dark:text-green-400" : "text-sky-600 dark:text-sky-400")}>
                <ItemKindIcon kind={topic.kind} />
              </span>
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">{topic.title}</span>
                <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {t("wrong", { count: topic.wrong_count })} · {t(`kind.${topic.kind}`)}
                </span>
              </span>
              <ChevronLeft className="size-[18px] shrink-0 text-slate-500 transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </m.section>
  );
}

function ImproveCard({ result, actions }: { result: AttemptResult; actions: ResultActions }) {
  const t = useTranslations("courseTests.result");
  const left = result.attempts_left;
  const detail = left === null ? t("improve.unlimited") : t("improve.left", { count: left });
  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease: EASE_OUT }}
      className={cn(cardClass, "flex flex-col gap-3 rounded-[20px] px-5 py-4 @xl:flex-row @xl:items-center @xl:justify-between @xl:px-6")}
    >
      <div className="flex items-center gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-surface-muted dark:text-slate-300">
          <RotateCcw className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">{t("improve.title")}</h3>
          <p className="text-[13px] text-slate-500 tabular-nums dark:text-slate-400">
            {detail} · {t(`policy.${result.grading_policy}`)}
          </p>
        </div>
      </div>
      {result.next_attempt_at ? (
        <CooldownNote at={result.next_attempt_at} />
      ) : (
        <button type="button" onClick={actions.onRetry} disabled={actions.retrying} aria-busy={actions.retrying} className={cn(quietButtonClass, "self-start @xl:self-auto")}>
          {t("retry")}
        </button>
      )}
    </m.section>
  );
}

export function GradedResult({ result, test, actions }: { result: AttemptResult; test: CourseTestDetail; actions: ResultActions }) {
  const t = useTranslations("courseTests.result");
  const reduce = useReducedMotion();
  const tiles = useTiles(result);
  const passed = result.passed === true;
  const canRetryNow = result.can_retry && !result.next_attempt_at;
  const attemptLabel =
    result.max_attempts === null ? t("meta.attempt", { number: result.number }) : t("meta.attemptOf", { number: result.number, max: result.max_attempts });
  const reviewButton = result.can_review ? (
    <button type="button" onClick={actions.onReview} className={cn(secondaryButtonClass, "w-full @xl:w-auto")}>
      <Eye className="size-[18px]" aria-hidden="true" />
      {t("review")}
    </button>
  ) : null;

  if (passed) {
    const meta = [t("meta.passPercent", { percent: result.pass_percent }), attemptLabel, ...(result.is_best ? [t("meta.best")] : [])];
    return (
      <div className="flex flex-col gap-4">
        <section className={cn(cardClass, "flex flex-col items-center gap-5 px-4 py-7 text-center @xl:gap-[22px] @xl:p-10")}>
          <m.div
            className="relative"
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <ScoreRing percent={result.percent ?? 0} tone="passed" className="size-[170px] @xl:size-[190px]">
              <RingScore result={result} big />
            </ScoreRing>
            <OutcomePill passed label={t("pill.passed")} className="top-1.5 -end-4" />
            <PassSparkles />
          </m.div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-[22px] font-bold @xl:text-[28px]">{t("headline.passed")}</h2>
            <p className="text-sm text-slate-600 tabular-nums @xl:text-[15px] dark:text-slate-400">{meta.join(" · ")}</p>
            {result.auto_submitted ? <AutoSubmittedNote /> : null}
          </div>
          <StatTiles tiles={tiles} label={t("stats.label")} />
          {result.next_item ? <NextItemCard item={result.next_item} /> : null}
          <div className="flex w-full flex-col gap-2.5 pt-1.5 @xl:w-auto @xl:flex-row @xl:gap-3">
            {result.next_item ? <ContinueLink courseId={test.course_id} item={result.next_item} /> : null}
            {reviewButton}
          </div>
        </section>
        {result.can_retry ? <ImproveCard result={result} actions={actions} /> : null}
      </div>
    );
  }

  const exhausted = result.attempts_left === 0;
  return (
    <section className={cn(cardClass, "flex flex-col gap-6 px-4 py-7 @xl:gap-[26px] @xl:px-10 @xl:py-9")}>
      <div className="flex flex-col items-center gap-5 text-center @xl:flex-row @xl:gap-8 @xl:text-start">
        <m.div
          className="relative"
          initial={reduce ? false : { scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <ScoreRing percent={result.percent ?? 0} tone="failed" className="size-[170px]">
            <RingScore result={result} big={false} />
          </ScoreRing>
          <OutcomePill passed={false} label={t("pill.failed")} className="top-1 -end-3 text-xs" />
        </m.div>
        <div className="flex flex-col items-center gap-2.5 @xl:items-start">
          <h2 className="text-[22px] font-bold @xl:text-[26px]">{t("headline.failed")}</h2>
          <p className="text-sm leading-[1.8] text-slate-600 tabular-nums @xl:text-[15px] dark:text-slate-400">
            {result.points_to_pass ? `${t("failedNeed", { percent: result.pass_percent, count: result.points_to_pass })} ` : `${t("meta.passPercent", { percent: result.pass_percent })} · `}
            {exhausted ? t("attemptsExhaustedHint") : t("failedAdvice")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <AttemptDots result={result} />
            <span className="text-[13px] font-semibold text-slate-700 tabular-nums dark:text-slate-300">
              {attemptLabel} · {result.attempts_left === null ? t("attemptsUnlimited") : t("attemptsLeft", { count: result.attempts_left })}
            </span>
          </div>
          {result.auto_submitted ? <AutoSubmittedNote /> : null}
        </div>
      </div>

      <StatTiles tiles={tiles} label={t("stats.label")} />

      <m.div variants={staggerContainer} initial="hidden" animate="show" className="contents">
        <ReviewTopics result={result} courseId={test.course_id} />
      </m.div>

      <div className="flex flex-col gap-3">
        <div className="flex w-full flex-col gap-2.5 @xl:flex-row @xl:flex-wrap @xl:gap-3">
          {canRetryNow ? (
            <button type="button" onClick={actions.onRetry} disabled={actions.retrying} aria-busy={actions.retrying} className={cn(primaryButtonClass, "w-full @xl:w-auto")}>
              <RotateCcw className="size-[18px]" aria-hidden="true" />
              {t("retry")}
            </button>
          ) : null}
          {reviewButton}
          {!canRetryNow && result.next_item ? <ContinueLink courseId={test.course_id} item={result.next_item} variant="secondary" /> : null}
        </div>
        {result.can_retry && result.next_attempt_at ? <CooldownNote at={result.next_attempt_at} /> : null}
      </div>
    </section>
  );
}
