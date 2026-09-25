"use client";

import { useId, useRef, useState, type ReactNode, type Ref } from "react";
import { Flag, UserPen, X, ZoomIn } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import type { AnswerResponse, AttemptQuestion } from "../types";
import type { LocalAnswer } from "./attempt-state";
import { OrderingInput } from "./ordering-input";
import { Overlay } from "./overlay";
import { ChoiceInput, EssayInput, MatchingInput, ShortAnswerInput, TrueFalseInput } from "./question-inputs";
import { chip, focusRing, muted } from "./styles";

export type SegmentState = "current" | "answered" | "empty";

export function ProgressSegments({ segments, className }: { segments: SegmentState[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex gap-[3px] sm:gap-1", className)}>
      {segments.map((state, index) => (
        <span key={index} className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-slate-200 sm:h-1.5 dark:bg-slate-800">
          <m.span
            className={cn("absolute inset-0 rounded-full", state === "current" ? "bg-slate-900 dark:bg-slate-100" : "bg-sky-600 dark:bg-sky-400")}
            initial={false}
            animate={{ opacity: state === "empty" ? 0 : 1, scaleX: state === "empty" ? 0.3 : 1 }}
            transition={{ duration: 0.3 }}
          />
        </span>
      ))}
    </div>
  );
}

/** Icon-only below `sm` (Mobile-Question.dc.html), pill with text above. */
export function FlagToggle({ flagged, onToggle }: { flagged: boolean; onToggle: () => void }) {
  const t = useTranslations("courseTests.attempt.question");
  return (
    <button
      type="button"
      aria-pressed={flagged}
      onClick={onToggle}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 border-[1.5px] text-[13px] font-semibold transition-colors",
        "size-11 rounded-xl sm:size-auto sm:min-h-[38px] sm:rounded-full sm:px-3.5",
        flagged
          ? "border-orange-500 bg-orange-100 text-orange-700 dark:border-orange-400 dark:bg-orange-500/15 dark:text-orange-300"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
        focusRing,
      )}
    >
      <m.span
        key={flagged ? "on" : "off"}
        aria-hidden="true"
        initial={flagged ? { scale: 0.4, rotate: -25 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 16 }}
        className="grid"
      >
        <Flag className={cn("size-4", flagged && "fill-current")} />
      </m.span>
      <span className="sr-only sm:not-sr-only">{flagged ? t("flagged") : t("flag")}</span>
    </button>
  );
}

function QuestionImage({ src }: { src: string }) {
  const t = useTranslations("courseTests.attempt.question");
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="relative overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
      {/* eslint-disable-next-line @next/next/no-img-element -- question images are teacher uploads or data: URLs from the API; next/image can't optimise data URLs or unknown hosts */}
      <img src={src} alt={t("image")} className="mx-auto max-h-80 w-auto object-contain" />
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("zoomImage")}
        onClick={() => setOpen(true)}
        className={cn(
          "absolute end-2.5 top-2.5 grid size-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm sm:size-9 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
          focusRing,
        )}
      >
        <ZoomIn aria-hidden="true" className="size-4" />
      </button>
      <AnimatePresence>
        {open ? (
          <Overlay labelledBy={titleId} onClose={() => setOpen(false)} className="max-w-4xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id={titleId} className="text-base font-bold">
                {t("image")}
              </h3>
              <button
                type="button"
                aria-label={t("closeImage")}
                onClick={() => setOpen(false)}
                className={cn("grid size-11 place-items-center rounded-xl border border-slate-200 dark:border-slate-700", focusRing)}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- same source as above */}
            <img src={src} alt={t("image")} className="mx-auto max-h-[75dvh] w-auto object-contain" />
          </Overlay>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AnswerInput({ question, value, onChange, labelledBy }: { question: AttemptQuestion; value: AnswerResponse; onChange: (response: AnswerResponse) => void; labelledBy: string }) {
  switch (question.type) {
    case "single":
    case "multi":
      return <ChoiceInput question={question} value={value} onChange={onChange} labelledBy={labelledBy} />;
    case "true_false":
      return <TrueFalseInput question={question} value={value} onChange={onChange} labelledBy={labelledBy} />;
    case "short_answer":
      return <ShortAnswerInput value={value} onChange={onChange} />;
    case "essay":
      return <EssayInput question={question} value={value} onChange={onChange} />;
    case "ordering":
      return <OrderingInput question={question} value={value} onChange={onChange} labelledBy={labelledBy} />;
    case "matching":
      return <MatchingInput question={question} value={value} onChange={onChange} />;
  }
}

/** Question header, text, code, image, hint and the per-type input (Question.dc.html + Question-Types.dc.html). */
export function QuestionBody({
  question,
  index,
  total,
  answer,
  segments,
  headingRef,
  onChange,
  onToggleFlag,
  footer,
}: {
  question: AttemptQuestion;
  index: number;
  total: number;
  answer: LocalAnswer;
  segments: SegmentState[];
  headingRef: Ref<HTMLHeadingElement>;
  onChange: (response: AnswerResponse) => void;
  onToggleFlag: () => void;
  footer?: ReactNode;
}) {
  const t = useTranslations("courseTests.attempt");
  const tc = useTranslations("courseTests.common");
  const headingId = useId();
  const showHintAbove = question.type !== "short_answer" && question.type !== "essay";

  return (
    <div className="flex flex-col gap-4 sm:gap-[22px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="hidden text-[15px] font-bold tabular-nums lg:inline">{t("question.position", { n: index + 1, total })}</span>
          <span className={chip}>{tc(`types.${question.type}`)}</span>
          <span className={cn(chip, "tabular-nums")}>{tc("points", { count: question.points })}</span>
          {question.type === "essay" ? (
            <span className={cn(chip, "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300")}>
              <UserPen aria-hidden="true" className="size-3" />
              {t("question.teacherGraded")}
            </span>
          ) : null}
        </div>
        <FlagToggle flagged={answer.flagged} onToggle={onToggleFlag} />
      </div>

      <ProgressSegments segments={segments} className="hidden lg:flex" />

      <div className="flex flex-col gap-3.5">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          dir="auto"
          className="m-0 text-[19px] font-semibold leading-[1.7] outline-none sm:text-[22px]"
        >
          <span className="sr-only">{t("question.position", { n: index + 1, total })}: </span>
          {question.text}
        </h2>
        {question.code_snippet ? (
          <pre
            dir="ltr"
            aria-label={t("question.code")}
            className="m-0 overflow-x-auto rounded-[14px] bg-slate-900 px-4 py-3.5 text-start font-mono text-sm leading-[1.7] text-slate-200 sm:px-5 sm:py-4 sm:text-[15px] dark:bg-slate-950 dark:ring-1 dark:ring-slate-800"
          >
            <code>{question.code_snippet}</code>
          </pre>
        ) : null}
        {question.image_url ? <QuestionImage src={question.image_url} /> : null}
        {showHintAbove ? <span className={cn("text-[13px]", muted)}>{t(`hints.${question.type}`)}</span> : null}
        {question.type === "essay" ? <span className={cn("text-[13px]", muted)}>{t("hints.essay")}</span> : null}
      </div>

      <AnswerInput question={question} value={answer.response} onChange={onChange} labelledBy={headingId} />

      {footer}
    </div>
  );
}
