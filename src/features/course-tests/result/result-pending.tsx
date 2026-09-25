"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { Check, Clock, Eye, PenLine, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { formatClock } from "../format";
import type { AttemptResult, CourseTestDetail } from "../types";
import { AutoSubmittedNote, type ResultActions } from "./result-graded";
import { cardClass, ContinueLink, formatDayTime, NextItemCard, secondaryButtonClass, staggerContainer, staggerItem } from "./result-ui";

function HeroIcon({ children, tone }: { children: ReactNode; tone: "sky" | "slate" }) {
  const reduce = useReducedMotion();
  return (
    <m.span
      aria-hidden="true"
      initial={reduce ? false : { scale: 0.6, rotate: 8, opacity: 0 }}
      animate={{ scale: 1, rotate: -4, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={cn(
        "grid size-20 place-items-center rounded-[26px] border-2 border-slate-900 shadow-[5px_5px_0_#0F172A] @xl:size-24 dark:border-slate-50 dark:shadow-[5px_5px_0_#020617]",
        tone === "sky" ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "bg-slate-100 text-slate-700 dark:bg-surface-muted dark:text-slate-200",
      )}
    >
      {children}
    </m.span>
  );
}

function Timeline({ result }: { result: AttemptResult }) {
  const t = useTranslations("courseTests.result.pending");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const connector = "mt-[17px] h-[3px] flex-[0.6] rounded-full";
  return (
    <ol aria-label={t("timelineLabel")} className="flex w-full max-w-[620px] items-start text-center">
      <li className="flex flex-1 flex-col items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-green-500 text-white dark:bg-green-400 dark:text-green-950">
          <Check className="size-[18px] stroke-3" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold">
          {t("submitted")}
          <span className="sr-only"> · {t("done")}</span>
        </span>
        {result.submitted_at ? (
          <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">{formatDayTime(result.submitted_at, locale)}</span>
        ) : null}
      </li>
      <li aria-hidden="true" className={cn(connector, "bg-green-500 dark:bg-green-400")} />
      <li className="flex flex-1 flex-col items-center gap-2" aria-current="step">
        <span className="relative grid size-9 place-items-center">
          {reduce ? null : (
            <m.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-sky-400/40"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <span className="relative grid size-9 place-items-center rounded-full border-2 border-slate-900 bg-white text-sky-700 shadow-[2px_2px_0_#0F172A] dark:border-slate-50 dark:bg-surface dark:text-sky-300 dark:shadow-[2px_2px_0_#020617]">
            <Clock className="size-[18px]" aria-hidden="true" />
          </span>
        </span>
        <span className="text-sm font-semibold">
          {t("grading")}
          <span className="sr-only"> · {t("current")}</span>
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t("gradingHint")}</span>
      </li>
      <li aria-hidden="true" className={cn(connector, "bg-slate-200 dark:bg-slate-700")} />
      <li className="flex flex-1 flex-col items-center gap-2">
        <span className="size-9 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t("result")}
          <span className="sr-only"> · {t("upcoming")}</span>
        </span>
      </li>
    </ol>
  );
}

function ResultButtons({ result, test, actions, reviewLabel }: { result: AttemptResult; test: CourseTestDetail; actions: ResultActions; reviewLabel: string }) {
  return (
    <div className="flex w-full flex-col gap-2.5 @xl:w-auto @xl:flex-row @xl:gap-3">
      {result.next_item ? <ContinueLink courseId={test.course_id} item={result.next_item} /> : null}
      {result.can_review ? (
        <button type="button" onClick={actions.onReview} className={cn(secondaryButtonClass, "w-full @xl:w-auto")}>
          <Eye className="size-[18px]" aria-hidden="true" />
          {reviewLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Result-Pending: essays wait for the teacher; the auto-graded part is shown when scores are visible. */
export function PendingResult({ result, test, actions }: { result: AttemptResult; test: CourseTestDetail; actions: ResultActions }) {
  const t = useTranslations("courseTests.result");
  const autoMax = Math.max(0, result.max_score - result.pending_essay_points);
  return (
    <section className={cn(cardClass, "flex flex-col items-center gap-6 px-4 py-8 text-center @xl:p-10")}>
      <HeroIcon tone="sky">
        <PenLine className="size-9 @xl:size-[42px]" />
      </HeroIcon>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-[22px] font-bold @xl:text-[26px]">{t("pending.title")}</h2>
        <p className="max-w-[520px] text-sm leading-[1.9] text-slate-600 @xl:text-[15px] dark:text-slate-400">{t("pending.body")}</p>
        {result.auto_submitted ? <AutoSubmittedNote /> : null}
      </div>
      <Timeline result={result} />
      <m.div variants={staggerContainer} initial="hidden" animate="show" className="grid w-full grid-cols-1 gap-3 text-start @xl:grid-cols-2">
        {result.score_visible ? (
          <m.div variants={staggerItem} className="flex flex-col gap-1.5 rounded-2xl bg-green-50 p-[18px] dark:border dark:border-border dark:bg-surface-muted">
            <span className="text-[13px] text-green-700 dark:text-green-300">{t("pending.autoLabel")}</span>
            <span className="text-[26px] font-bold tabular-nums">
              {result.score_auto} <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">{t("pending.autoOf", { max: autoMax })}</span>
            </span>
          </m.div>
        ) : null}
        <m.div
          variants={staggerItem}
          className={cn("flex flex-col gap-1.5 rounded-2xl bg-sky-50 p-[18px] dark:border dark:border-border dark:bg-surface-muted", !result.score_visible && "@xl:col-span-2")}
        >
          <span className="text-[13px] text-sky-700 dark:text-sky-300">{t("pending.essayLabel")}</span>
          <span className="text-[26px] font-bold tabular-nums">
            {result.pending_essay_count}{" "}
            <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">
              {t("pending.essayCount", { count: result.pending_essay_count })} · {t("pending.essayPoints", { count: result.pending_essay_points })}
            </span>
          </span>
        </m.div>
      </m.div>
      <p className="text-xs text-slate-500 dark:text-slate-400" role="status">
        {t("pending.checking")}
      </p>
      {result.next_item ? <NextItemCard item={result.next_item} /> : null}
      <ResultButtons result={result} test={test} actions={actions} reviewLabel={t("viewMyAnswers")} />
    </section>
  );
}

/** Graded but the teacher keeps the score hidden: confirm submission without numbers. */
export function SubmittedResult({ result, test, actions }: { result: AttemptResult; test: CourseTestDetail; actions: ResultActions }) {
  const t = useTranslations("courseTests.result");
  return (
    <section className={cn(cardClass, "flex flex-col items-center gap-6 px-4 py-8 text-center @xl:p-10")}>
      <HeroIcon tone="slate">
        <Send className="size-9 @xl:size-[42px]" />
      </HeroIcon>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-[22px] font-bold @xl:text-[26px]">{t("hidden.title")}</h2>
        <p className="max-w-[520px] text-sm leading-[1.9] text-slate-600 @xl:text-[15px] dark:text-slate-400">{t("hidden.body")}</p>
        <p className="text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-300">
          {t("hidden.answered", { answered: result.answered_count, total: result.question_count })} · {t("stats.time")} {formatClock(result.duration_seconds)}
        </p>
        {result.auto_submitted ? <AutoSubmittedNote /> : null}
      </div>
      {result.next_item ? <NextItemCard item={result.next_item} /> : null}
      <ResultButtons result={result} test={test} actions={actions} reviewLabel={t("viewMyAnswers")} />
    </section>
  );
}
