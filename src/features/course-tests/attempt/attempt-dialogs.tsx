"use client";

import { useId, useRef, type RefObject } from "react";
import { CircleAlert, CloudCheck, Flag, Hourglass, LoaderCircle, Send } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { formatClock } from "../format";
import { canNavigateTo, type AttemptSummary } from "./attempt-state";
import { Overlay } from "./overlay";
import { focusRing, inkEdge, primaryButton, secondaryButton } from "./styles";

/** Submit-Confirm.dc.html. Render inside <AnimatePresence>. */
export function SubmitConfirmDialog({
  summary,
  remaining,
  current,
  allowBack,
  submitting,
  error,
  restoreFocus,
  onJump,
  onClose,
  onSubmit,
}: {
  summary: AttemptSummary;
  remaining: number | null;
  current: number;
  allowBack: boolean;
  submitting: boolean;
  error: string | null;
  restoreFocus?: RefObject<boolean>;
  onJump: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("courseTests.attempt.confirm");
  const titleId = useId();
  const unansweredCount = summary.unanswered.length;
  const canJump = (index: number) => index === current || canNavigateTo(current, index, summary.total, allowBack);
  const chipBase = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[34px]";

  return (
    <Overlay labelledBy={titleId} onClose={submitting ? undefined : onClose} restoreFocus={restoreFocus} className="gap-5 p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className={cn("grid size-[52px] shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", inkEdge)}>
          <Send aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="m-0 text-[22px] font-bold">
            {t("title")}
          </h2>
          <p className="m-0 text-sm leading-[1.8] text-slate-600 dark:text-slate-300">
            {t("body")}
            {remaining !== null ? (
              <>
                {" "}
                {t.rich("remaining", {
                  time: formatClock(remaining),
                  b: (chunks) => <span className="font-bold tabular-nums text-slate-900 dark:text-white">{chunks}</span>,
                })}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-1 rounded-[14px] bg-sky-50 p-3.5 dark:bg-sky-500/10">
          <dt className="text-xs text-sky-700 dark:text-sky-300">{t("answered")}</dt>
          <dd className="m-0 text-2xl font-bold tabular-nums">{summary.answered}</dd>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-amber-50 p-3.5 dark:bg-amber-500/10">
          <dt className="text-xs text-amber-700 dark:text-amber-300">{t("unanswered")}</dt>
          <dd className="m-0 text-2xl font-bold tabular-nums">{unansweredCount}</dd>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-orange-50 p-3.5 dark:bg-orange-500/10">
          <dt className="text-xs text-orange-700 dark:text-orange-300">{t("flagged")}</dt>
          <dd className="m-0 text-2xl font-bold tabular-nums">{summary.flagged.length}</dd>
        </div>
      </dl>

      {unansweredCount || summary.flagged.length ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{t("jumpHint")}</span>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {summary.unanswered.map((index) => (
              <li key={`u${index}`}>
                <button
                  type="button"
                  disabled={!canJump(index) || submitting}
                  onClick={() => onJump(index)}
                  className={cn(chipBase, "border-[1.5px] border-dashed border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200", focusRing)}
                >
                  {t("chipUnanswered", { n: index + 1 })}
                </button>
              </li>
            ))}
            {summary.flagged.map((index) => (
              <li key={`f${index}`}>
                <button
                  type="button"
                  disabled={!canJump(index) || submitting}
                  onClick={() => onJump(index)}
                  className={cn(chipBase, "border-[1.5px] border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-500/60 dark:bg-orange-500/10 dark:text-orange-300", focusRing)}
                >
                  <Flag aria-hidden="true" className="size-[13px] fill-current" />
                  {t("chipFlagged", { n: index + 1 })}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="m-0 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2.5 pt-1">
        <button type="button" onClick={onSubmit} disabled={submitting} aria-busy={submitting} className={cn(primaryButton, "min-h-12")}>
          {submitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {submitting ? t("submitting") : t("submit")}
        </button>
        <button type="button" onClick={onClose} disabled={submitting} className={cn(secondaryButton, "min-h-12")}>
          {t("back")}
        </button>
      </div>
    </Overlay>
  );
}

/** Time-Up.dc.html: shown after the automatic submission. Not dismissable. */
export function TimeUpDialog({ answered, total, allSaved, onShowResult }: { answered: number; total: number; allSaved: boolean; onShowResult: () => void }) {
  const t = useTranslations("courseTests.attempt.timeUp");
  const tc = useTranslations("courseTests.common");
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <Overlay labelledBy={titleId} role="alertdialog" initialFocus={buttonRef} className="max-w-[480px] items-center gap-[18px] p-6 text-center sm:p-8">
      <m.span
        aria-hidden="true"
        initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 6, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
        className={cn("grid size-[76px] place-items-center rounded-[22px] bg-amber-100 text-amber-700 shadow-[4px_4px_0_#0F172A] dark:bg-amber-500/15 dark:text-amber-300 dark:shadow-[4px_4px_0_#020617]", inkEdge)}
      >
        <Hourglass className="size-[34px]" />
      </m.span>
      <div className="flex flex-col gap-2">
        <h2 id={titleId} className="m-0 text-2xl font-bold">
          {t("title")}
        </h2>
        <p className="m-0 text-[15px] leading-[1.8] text-slate-600 tabular-nums dark:text-slate-300">
          {t("body", { answered, questions: tc("questions", { count: total }) })}
        </p>
      </div>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={cn(
          "flex items-center gap-2.5 rounded-[14px] px-4 py-3 text-sm font-semibold",
          allSaved ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
        )}
      >
        {allSaved ? <CloudCheck aria-hidden="true" className="size-[18px] shrink-0" /> : <CircleAlert aria-hidden="true" className="size-[18px] shrink-0" />}
        {allSaved ? t("saved") : t("unsaved")}
      </m.div>
      <button ref={buttonRef} type="button" onClick={onShowResult} className={cn(primaryButton, "min-h-[50px] px-7")}>
        {t("showResult")}
        <ArrowForward />
      </button>
    </Overlay>
  );
}

function ArrowForward() {
  // Points in the reading direction (left in RTL, right in LTR).
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round] rtl:rotate-180">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
