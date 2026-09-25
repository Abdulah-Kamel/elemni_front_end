"use client";

import type { ReactNode } from "react";
import { Check, MessageSquare, Minus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { isBlankResponse } from "../scoring";
import type { AnswerResponse, Option, ReviewQuestion } from "../types";

const AR_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

function optionLetter(index: number, locale: string) {
  return locale === "ar" ? (AR_LETTERS[index] ?? String(index + 1)) : String.fromCharCode(65 + index);
}

const asList = (value: AnswerResponse): string[] => (Array.isArray(value) ? value : typeof value === "string" && value ? [value] : []);
const asMap = (value: AnswerResponse): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asText = (value: AnswerResponse): string => (typeof value === "string" ? value : Array.isArray(value) ? value.join(" / ") : "");

type Mark = "yoursCorrect" | "yoursWrong" | "correct" | "missed" | "none";

const markStyles: Record<Mark, { row: string; badge: string; text: string }> = {
  yoursCorrect: {
    row: "border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-950/40",
    badge: "bg-green-500 text-white dark:bg-green-400 dark:text-green-950",
    text: "text-green-700 dark:text-green-300",
  },
  yoursWrong: {
    row: "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/40",
    badge: "bg-red-500 text-white dark:bg-red-400 dark:text-red-950",
    text: "text-red-700 dark:text-red-300",
  },
  correct: {
    row: "border-dashed border-green-500 bg-white dark:border-green-500 dark:bg-surface",
    badge: "border-2 border-dashed border-green-500 text-green-700 dark:text-green-300",
    text: "text-green-700 dark:text-green-300",
  },
  missed: {
    row: "border-dashed border-green-500 bg-white dark:border-green-500 dark:bg-surface",
    badge: "border-2 border-dashed border-green-500 text-green-700 dark:text-green-300",
    text: "text-green-700 dark:text-green-300",
  },
  none: {
    row: "border-slate-200 bg-white dark:border-border dark:bg-surface",
    badge: "bg-slate-100 text-slate-400 dark:bg-surface-muted dark:text-slate-500",
    text: "",
  },
};

function MarkIcon({ ok }: { ok: boolean }) {
  const Icon = ok ? Check : X;
  return <Icon className="size-4 stroke-3" aria-hidden="true" />;
}

function ChoiceOptions({ question }: { question: ReviewQuestion }) {
  const t = useTranslations("courseTests.result.reviewPage.markers");
  const locale = useLocale();
  const chosen = asList(question.response);
  const correct = asList(question.correct_response);
  const round = question.type !== "multi";
  return (
    <ul className="flex flex-col gap-2.5">
      {question.options.map((option, index) => {
        const isChosen = chosen.includes(option.id);
        const isCorrect = correct.includes(option.id);
        const mark: Mark = isChosen ? (isCorrect ? "yoursCorrect" : "yoursWrong") : isCorrect ? (question.type === "multi" ? "missed" : "correct") : "none";
        const style = markStyles[mark];
        return (
          <li key={option.id} className={cn("flex min-h-12 items-center gap-3.5 rounded-[14px] border-2 px-4 py-3", style.row)}>
            <span className={cn("grid size-[30px] shrink-0 place-items-center text-[13px] font-bold", round ? "rounded-full" : "rounded-lg", style.badge)}>
              {mark === "none" ? <span aria-hidden="true">{optionLetter(index, locale)}</span> : <MarkIcon ok={mark !== "yoursWrong"} />}
            </span>
            <span dir="auto" className={cn("grow text-start text-base font-medium", mark === "none" && "text-slate-600 dark:text-slate-400")}>
              {option.text}
            </span>
            {mark !== "none" ? (
              <span className={cn("shrink-0 text-xs font-semibold", style.text)}>
                {mark === "yoursWrong" ? (
                  <>
                    {t("yours")}
                    <span className="sr-only"> · {t("wrongSr")}</span>
                  </>
                ) : (
                  t(mark)
                )}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function AnswerBox({ label, tone, children }: { label: string; tone: "right" | "wrong" | "neutral" | "info"; children: ReactNode }) {
  const tones = {
    right: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
    wrong: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
    neutral: "border-slate-200 bg-slate-50 dark:border-border dark:bg-surface-muted",
    info: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30",
  };
  const labelTones = {
    right: "text-green-700 dark:text-green-300",
    wrong: "text-red-700 dark:text-red-300",
    neutral: "text-slate-600 dark:text-slate-400",
    info: "text-sky-700 dark:text-sky-300",
  };
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-2xl border px-4 py-3", tones[tone])}>
      <span className={cn("flex items-center gap-1.5 text-xs font-bold", labelTones[tone])}>
        {tone === "right" ? <Check className="size-3.5 stroke-3" aria-hidden="true" /> : null}
        {tone === "wrong" ? <X className="size-3.5 stroke-3" aria-hidden="true" /> : null}
        {tone === "info" ? <MessageSquare className="size-3.5" aria-hidden="true" /> : null}
        {label}
      </span>
      <div className="text-[15px] leading-[1.8]">{children}</div>
    </div>
  );
}

function YourAnswer({ question, text }: { question: ReviewQuestion; text: string }) {
  const t = useTranslations("courseTests.result.reviewPage");
  const blank = isBlankResponse(question.response);
  const tone = blank || question.status === "pending" ? "neutral" : question.status === "correct" ? "right" : question.status === "partial" ? "neutral" : "wrong";
  return (
    <AnswerBox label={t("yourAnswer")} tone={tone}>
      {blank ? (
        <span className="text-slate-500 dark:text-slate-400">{t("noAnswer")}</span>
      ) : (
        <p dir="auto" className="whitespace-pre-wrap text-start">
          {text}
        </p>
      )}
    </AnswerBox>
  );
}

function ShortAnswer({ question }: { question: ReviewQuestion }) {
  const t = useTranslations("courseTests.result.reviewPage");
  const accepted = question.accepted_answers?.length ? question.accepted_answers : asList(question.correct_response);
  return (
    <div className="grid gap-2.5 @2xl:grid-cols-2">
      <YourAnswer question={question} text={asText(question.response)} />
      {accepted.length ? (
        <AnswerBox label={t("accepted")} tone="right">
          <p dir="auto" className="text-start font-medium">
            {accepted.join(" · ")}
          </p>
        </AnswerBox>
      ) : null}
    </div>
  );
}

function Essay({ question }: { question: ReviewQuestion }) {
  const t = useTranslations("courseTests.result.reviewPage");
  return (
    <div className="flex flex-col gap-2.5">
      <YourAnswer question={question} text={asText(question.response)} />
      {question.feedback ? (
        <AnswerBox label={t("feedback")} tone="info">
          <p dir="auto" className="whitespace-pre-wrap text-start">
            {question.feedback}
          </p>
        </AnswerBox>
      ) : null}
      {question.model_answer ? (
        <AnswerBox label={t("modelAnswer")} tone="right">
          <p dir="auto" className="whitespace-pre-wrap text-start">
            {question.model_answer}
          </p>
        </AnswerBox>
      ) : null}
    </div>
  );
}

function optionText(options: Option[], id: string | undefined) {
  return options.find((option) => option.id === id)?.text;
}

function ListColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">{title}</h4>
      {children}
    </div>
  );
}

function Ordering({ question }: { question: ReviewQuestion }) {
  const t = useTranslations("courseTests.result.reviewPage");
  const given = asList(question.response);
  const expected = asList(question.correct_response);
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <ListColumn title={t("yourOrder")}>
        {given.length ? (
          <ol className="flex flex-col gap-2">
            {given.map((id, index) => {
              const ok = expected[index] === id;
              return (
                <li key={id} className={cn("flex min-h-11 items-center gap-3 rounded-xl border-2 px-3 py-2", ok ? markStyles.yoursCorrect.row : markStyles.yoursWrong.row)}>
                  <span className="w-5 text-center text-sm font-bold tabular-nums">{index + 1}</span>
                  <span dir="auto" className="grow text-start text-sm font-medium">
                    {optionText(question.options, id) ?? id}
                  </span>
                  <span className={cn("grid size-6 place-items-center rounded-full", ok ? markStyles.yoursCorrect.badge : markStyles.yoursWrong.badge)}>
                    <MarkIcon ok={ok} />
                    <span className="sr-only">{ok ? t("status.correct") : t("status.wrong")}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("noAnswer")}</p>
        )}
      </ListColumn>
      <ListColumn title={t("correctOrder")}>
        <ol className="flex flex-col gap-2">
          {expected.map((id, index) => (
            <li key={id} className="flex min-h-11 items-center gap-3 rounded-xl border-2 border-dashed border-green-500 px-3 py-2">
              <span className="w-5 text-center text-sm font-bold text-green-700 tabular-nums dark:text-green-300">{index + 1}</span>
              <span dir="auto" className="grow text-start text-sm font-medium">
                {optionText(question.options, id) ?? id}
              </span>
            </li>
          ))}
        </ol>
      </ListColumn>
    </div>
  );
}

function Matching({ question }: { question: ReviewQuestion }) {
  const t = useTranslations("courseTests.result.reviewPage");
  const given = asMap(question.response);
  const expected = asMap(question.correct_response);
  const rights = question.right_options ?? [];
  return (
    <div className="flex flex-col gap-2">
      <div className="hidden grid-cols-3 gap-3 px-3 text-xs font-bold text-slate-600 @2xl:grid dark:text-slate-400" aria-hidden="true">
        <span />
        <span>{t("yourPairs")}</span>
        <span>{t("correctPairs")}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {question.options.map((left) => {
          const chosen = given[left.id];
          const right = expected[left.id];
          const ok = Boolean(chosen) && chosen === right;
          const chosenText = chosen ? (optionText(rights, chosen) ?? chosen) : null;
          return (
            <li
              key={left.id}
              className={cn(
                "grid gap-2 rounded-xl border-2 px-3 py-2.5 text-sm @2xl:grid-cols-3 @2xl:items-center @2xl:gap-3",
                chosen ? (ok ? markStyles.yoursCorrect.row : markStyles.yoursWrong.row) : markStyles.none.row,
              )}
            >
              <span dir="auto" className="text-start font-semibold">
                {left.text}
              </span>
              <span className="flex items-center gap-2">
                {chosen ? (
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", ok ? markStyles.yoursCorrect.badge : markStyles.yoursWrong.badge)}>
                    <MarkIcon ok={ok} />
                  </span>
                ) : (
                  <Minus className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                )}
                <span className="text-xs font-semibold text-slate-600 @2xl:sr-only dark:text-slate-400">{t("yourPairs")}:</span>
                <span dir="auto" className={cn("text-start", !chosen && "text-slate-500 dark:text-slate-400")}>
                  {chosenText ?? t("notMatched")}
                </span>
                {chosen ? <span className="sr-only">· {ok ? t("status.correct") : t("status.wrong")}</span> : null}
              </span>
              <span className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <span className="text-xs font-semibold @2xl:sr-only">{t("correctPairs")}:</span>
                <span dir="auto" className="text-start font-medium">
                  {optionText(rights, right) ?? right}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReviewAnswerBody({ question }: { question: ReviewQuestion }) {
  switch (question.type) {
    case "single":
    case "multi":
    case "true_false":
      return <ChoiceOptions question={question} />;
    case "short_answer":
      return <ShortAnswer question={question} />;
    case "essay":
      return <Essay question={question} />;
    case "ordering":
      return <Ordering question={question} />;
    case "matching":
      return <Matching question={question} />;
    default:
      return null;
  }
}
