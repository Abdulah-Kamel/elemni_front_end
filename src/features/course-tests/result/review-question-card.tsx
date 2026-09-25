"use client";

import type { Ref } from "react";
import { m, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Clock, Lightbulb, Minus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import type { ReviewQuestion, ReviewStatus } from "../types";
import { ReviewAnswerBody } from "./review-answer-body";
import { statusLabelKey } from "./review-filter";
import { EASE_OUT } from "./result-ui";

export const reviewCardId = (questionId: number) => `review-question-${questionId}`;

export const statusStyles: Record<ReviewStatus, { pill: string; border: string; nav: string; swatch: string }> = {
  correct: {
    pill: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    border: "border-t-green-500",
    nav: "border-green-500 bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    swatch: "border-green-500 bg-green-100 dark:bg-green-950/60",
  },
  wrong: {
    pill: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    border: "border-t-red-500",
    nav: "border-red-500 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    swatch: "border-red-500 bg-red-100 dark:bg-red-950/60",
  },
  partial: {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    border: "border-t-amber-500",
    nav: "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    swatch: "border-amber-500 bg-amber-100 dark:bg-amber-950/60",
  },
  blank: {
    pill: "bg-slate-100 text-slate-600 dark:bg-surface-muted dark:text-slate-300",
    border: "border-t-slate-300 dark:border-t-slate-600",
    nav: "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-surface-muted dark:text-slate-400",
    swatch: "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-surface-muted",
  },
  pending: {
    pill: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    border: "border-t-sky-500",
    nav: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    swatch: "border-sky-500 bg-sky-50 dark:bg-sky-950/60",
  },
};

export function StatusIcon({ status, className }: { status: ReviewStatus; className?: string }) {
  const Icon = status === "correct" ? Check : status === "wrong" ? X : status === "pending" ? Clock : Minus;
  return <Icon className={cn("size-3.5 stroke-3", className)} aria-hidden="true" />;
}

export function useStatusPillText() {
  const t = useTranslations("courseTests.result.reviewPage");
  const tCommon = useTranslations("courseTests.common");
  return (question: ReviewQuestion) => {
    const label = t(`status.${statusLabelKey(question)}`);
    const points =
      question.status === "pending" || question.points_awarded === null
        ? tCommon("points", { count: question.points })
        : t("pointsOf", { awarded: question.points_awarded, points: question.points });
    return `${label} · ${points}`;
  };
}

type Props = { question: ReviewQuestion; number: number; expanded: boolean; onToggle: () => void; ref?: Ref<HTMLElement> };

export function ReviewQuestionCard({ question, number, expanded, onToggle, ref }: Props) {
  const t = useTranslations("courseTests.result.reviewPage");
  const tCommon = useTranslations("courseTests.common");
  const reduce = useReducedMotion();
  const pillText = useStatusPillText()(question);
  const style = statusStyles[question.status];
  const collapsible = question.status === "blank";
  const headingId = `${reviewCardId(question.id)}-title`;
  const bodyId = `${reviewCardId(question.id)}-body`;

  const pill = (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold tabular-nums", style.pill)}>
      <StatusIcon status={question.status} />
      {pillText}
    </span>
  );

  return (
    <m.article
      ref={ref}
      id={reviewCardId(question.id)}
      tabIndex={-1}
      aria-labelledby={headingId}
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 outline-none focus-visible:ring-3 focus-visible:ring-sky-500 dark:border-border dark:bg-surface dark:text-slate-50",
        expanded && "border-t-[6px]",
        expanded && style.border,
      )}
    >
      {collapsible && !expanded ? (
        <h3 id={headingId} className="m-0">
          <button
            type="button"
            aria-expanded={false}
            aria-controls={bodyId}
            onClick={onToggle}
            className="flex min-h-14 w-full flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-4 text-start @xl:px-7"
          >
            <span className="text-[15px] font-bold tabular-nums">{t("question", { number })}</span>
            <span className="min-w-0 grow truncate text-[15px] font-normal text-slate-600 dark:text-slate-400">{question.text}</span>
            {pill}
            <ChevronDown className="size-[18px] text-slate-500" aria-hidden="true" />
            <span className="sr-only">{t("expand")}</span>
          </button>
        </h3>
      ) : (
        <div id={bodyId} className="flex flex-col gap-4 px-4 py-5 @xl:gap-[18px] @xl:px-7 @xl:py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-bold tabular-nums">{t("question", { number })}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-surface-muted dark:text-slate-300">
                {tCommon(`types.${question.type}`)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {pill}
              {collapsible ? (
                <button
                  type="button"
                  aria-expanded
                  aria-controls={bodyId}
                  onClick={onToggle}
                  aria-label={t("collapse")}
                  className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-3 focus-visible:outline-sky-600 dark:hover:bg-surface-muted"
                >
                  <ChevronDown className="size-[18px] rotate-180" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
          <h3 id={headingId} dir="auto" className="text-start text-lg leading-[1.7] font-semibold @xl:text-xl">
            {question.text}
          </h3>
          {question.code_snippet ? (
            <pre dir="ltr" className="m-0 overflow-x-auto rounded-[14px] bg-slate-900 px-[18px] py-3.5 text-start font-mono text-sm leading-[1.7] text-slate-200 dark:bg-[#020617]">
              <code>{question.code_snippet}</code>
            </pre>
          ) : null}
          {question.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- question images come from the API (possibly data: URIs) with unknown dimensions.
            <img
              src={question.image_url}
              alt={t("imageAlt", { number })}
              className="h-auto max-h-80 w-full max-w-xl rounded-[14px] border border-slate-200 object-contain dark:border-border"
            />
          ) : null}
          <ReviewAnswerBody question={question} />
          {question.explanation ? (
            <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-[18px] py-4 dark:border-sky-900 dark:bg-sky-950/30">
              <Lightbulb className="mt-0.5 size-[18px] shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-sky-700 dark:text-sky-300">{t("explanation")}</h4>
                <p className="text-sm leading-[1.8] text-slate-700 dark:text-slate-300">{question.explanation}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </m.article>
  );
}
