"use client";

import { Check, Flag } from "lucide-react";
import { m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import type { AttemptSummary } from "./attempt-state";
import { canNavigateTo, skippedUnanswered } from "./attempt-state";
import { focusRing, inkEdge, inkShadow, muted } from "./styles";

/** Navigator grid + legend + unanswered hint + submit (Question.dc.html aside, Question-Warning.dc.html). */
export function QuestionNavigator({
  summary,
  current,
  furthestVisited,
  allowBack,
  onJump,
  onReview,
  headingId,
}: {
  summary: AttemptSummary;
  current: number;
  furthestVisited: number;
  allowBack: boolean;
  onJump: (index: number) => void;
  onReview: () => void;
  headingId: string;
}) {
  const t = useTranslations("courseTests.attempt");
  const locale = useLocale();
  const unanswered = new Set(summary.unanswered);
  const flagged = new Set(summary.flagged);
  const skipped = skippedUnanswered(summary, furthestVisited).filter((index) => allowBack || index > current);
  const listSeparator = locale === "ar" ? "، " : ", ";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="m-0 text-base font-bold">
          {t("navigator.title")}
        </h2>
        <span className={cn("text-[13px] tabular-nums", muted)}>{t("navigator.answeredOf", { answered: summary.answered, total: summary.total })}</span>
      </div>

      <ol aria-labelledby={headingId} className="m-0 grid list-none grid-cols-5 gap-2.5 p-0">
        {Array.from({ length: summary.total }, (_, index) => {
          const answered = !unanswered.has(index);
          const isCurrent = index === current;
          const isFlagged = flagged.has(index);
          const wasSkipped = !answered && index < furthestVisited && !isCurrent;
          const locked = !isCurrent && !canNavigateTo(current, index, summary.total, allowBack);
          const states = [
            answered ? t("navigator.stateAnswered") : t("navigator.stateUnanswered"),
            isCurrent ? t("navigator.stateCurrent") : null,
            isFlagged ? t("navigator.stateFlagged") : null,
            locked ? t("navigator.stateLocked") : null,
          ].filter(Boolean);
          return (
            <li key={index}>
              <button
                type="button"
                aria-label={`${t("navigator.cell", { n: index + 1 })} · ${states.join(" · ")}`}
                aria-current={isCurrent ? "step" : undefined}
                disabled={locked}
                onClick={() => onJump(index)}
                className={cn(
                  "relative isolate grid h-12 w-full place-items-center rounded-xl text-[15px] font-bold tabular-nums transition-[color,border-color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-45",
                  isCurrent
                    ? cn(inkEdge, inkShadow, answered ? "bg-sky-100 text-slate-900 dark:bg-sky-900/60 dark:text-white" : "bg-white text-slate-900 dark:bg-slate-900 dark:text-white")
                    : answered
                      ? "border-2 border-sky-700 text-white dark:border-sky-500 dark:text-slate-950"
                      : wasSkipped
                        ? "border-2 border-dashed border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-200"
                        : "border-2 border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
                  focusRing,
                )}
              >
                {!isCurrent ? (
                  <m.span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-[10px] bg-sky-700 dark:bg-sky-500"
                    initial={false}
                    animate={{ opacity: answered ? 1 : 0, scale: answered ? 1 : 0.5 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  />
                ) : null}
                {index + 1}
                {answered && !isCurrent ? <Check aria-hidden="true" strokeWidth={3} className="absolute bottom-1 end-1 size-2.5 opacity-80" /> : null}
                {isFlagged ? (
                  <m.span
                    aria-hidden="true"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 520, damping: 18 }}
                    className="absolute -end-1.5 -top-1.5 grid size-4 place-items-center rounded-full border-2 border-white bg-orange-500 text-white dark:border-slate-900"
                  >
                    <Flag className="size-2 fill-current" strokeWidth={3} />
                  </m.span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      <div className={cn("grid grid-cols-2 gap-x-3 gap-y-2 text-xs", "text-slate-600 dark:text-slate-400")}>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded bg-sky-700 dark:bg-sky-500" />
          {t("navigator.legendAnswered")}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded border-2 border-slate-900 dark:border-sky-300" />
          {t("navigator.legendCurrent")}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded border-2 border-dashed border-slate-300 dark:border-slate-600" />
          {t("navigator.legendUnanswered")}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="grid size-3.5 place-items-center rounded-full bg-orange-500 text-white">
            <Flag className="size-2 fill-current" strokeWidth={3} />
          </span>
          {t("navigator.legendFlagged")}
        </span>
      </div>

      {skipped.length ? (
        <p className="m-0 rounded-[10px] bg-amber-50 px-3 py-2 text-xs text-amber-800 tabular-nums dark:bg-amber-500/10 dark:text-amber-200">
          {t("navigator.unansweredHint", { count: skipped.length, list: skipped.map((index) => index + 1).join(listSeparator) })}
        </p>
      ) : null}

      {!allowBack ? <p className={cn("m-0 text-xs", muted)}>{t("nav.backLocked")}</p> : null}

      <button
        type="button"
        onClick={onReview}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-bold text-slate-900 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
          inkEdge,
          inkShadow,
          focusRing,
        )}
      >
        {t("nav.reviewAndSubmit")}
      </button>
    </div>
  );
}
