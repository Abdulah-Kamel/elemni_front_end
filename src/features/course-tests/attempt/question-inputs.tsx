"use client";

import { useId } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { countWords } from "../format";
import type { AnswerResponse, AttemptQuestion } from "../types";
import { focusRing, idleSurface, muted, selectedSurface } from "./styles";

export type InputProps = {
  question: AttemptQuestion;
  value: AnswerResponse;
  onChange: (response: AnswerResponse) => void;
};

const AR_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];
const optionLetter = (index: number, locale: string) =>
  locale === "ar" ? AR_LETTERS[index] ?? String(index + 1) : String.fromCharCode(65 + index);

const pop = { type: "spring", stiffness: 520, damping: 22 } as const;
const labelFocus =
  "has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-sky-600 dark:has-[input:focus-visible]:outline-sky-400";

/** single + multi: option cards with أ ب ج د badges (Question.dc.html). */
export function ChoiceInput({ question, value, onChange, labelledBy }: InputProps & { labelledBy: string }) {
  const locale = useLocale();
  const multi = question.type === "multi";
  const selected = multi ? (Array.isArray(value) ? value : []) : typeof value === "string" ? [value] : [];
  const imageLayout = Boolean(question.image_url) && !multi;

  const toggle = (id: string) => {
    if (!multi) return onChange(id);
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    // Keep the teacher's option order so the saved response is stable.
    onChange(question.options.map((option) => option.id).filter((optionId) => next.includes(optionId)));
  };

  return (
    <div role={multi ? "group" : "radiogroup"} aria-labelledby={labelledBy} className={cn("grid gap-3", imageLayout && "sm:grid-cols-2")}>
      {question.options.map((option, index) => {
        const on = selected.includes(option.id);
        return (
          <m.label
            key={option.id}
            whileTap={{ scale: 0.985 }}
            className={cn(
              "relative flex min-h-14 cursor-pointer items-center gap-3.5 rounded-2xl px-4 py-2.5 transition-[background-color,border-color,box-shadow] duration-200 sm:min-h-[60px]",
              on ? selectedSurface : idleSurface,
              labelFocus,
            )}
          >
            <input
              type={multi ? "checkbox" : "radio"}
              name={`q-${question.id}`}
              value={option.id}
              checked={on}
              onChange={() => toggle(option.id)}
              className="sr-only"
            />
            <m.span
              key={on ? "on" : "off"}
              aria-hidden="true"
              initial={on ? { scale: 0.6 } : false}
              animate={{ scale: 1 }}
              transition={pop}
              className={cn(
                "grid size-8 shrink-0 place-items-center text-[15px] font-bold sm:size-[34px]",
                multi ? "rounded-[9px]" : "rounded-full",
                on ? "bg-sky-700 text-white dark:bg-sky-500 dark:text-slate-950" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {multi && on ? <Check className="size-[18px]" strokeWidth={3} /> : optionLetter(index, locale)}
            </m.span>
            <span dir="auto" className="min-w-0 break-words text-base font-medium">
              {option.text}
            </span>
          </m.label>
        );
      })}
    </div>
  );
}

/** true_false: two large cards with check / cross icons (Question-Types.dc.html). */
export function TrueFalseInput({ question, value, onChange, labelledBy }: InputProps & { labelledBy: string }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-3.5">
      {question.options.map((option, index) => {
        const on = value === option.id;
        const Icon = index === 0 ? Check : X;
        return (
          <m.label
            key={option.id}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] transition-[background-color,border-color,box-shadow] duration-200 sm:min-h-[110px]",
              on ? selectedSurface : idleSurface,
              labelFocus,
            )}
          >
            <input type="radio" name={`q-${question.id}`} value={option.id} checked={on} onChange={() => onChange(option.id)} className="sr-only" />
            <m.span
              key={on ? "on" : "off"}
              aria-hidden="true"
              initial={on ? { scale: 0.5, rotate: -20 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={pop}
              className={cn(
                "grid size-10 place-items-center rounded-full",
                on ? "bg-sky-700 text-white dark:bg-sky-500 dark:text-slate-950" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              <Icon className="size-5" strokeWidth={2.6} />
            </m.span>
            <span dir="auto" className="text-[17px] font-bold">
              {option.text}
            </span>
          </m.label>
        );
      })}
    </div>
  );
}

const fieldBase =
  "w-full rounded-[14px] border-2 bg-white text-base text-slate-900 transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-sky-600 focus:shadow-[0_0_0_4px_#E0F2FE] focus:outline-none dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:shadow-[0_0_0_4px_rgba(56,189,248,0.2)]";

export function ShortAnswerInput({ value, onChange }: Pick<InputProps, "value" | "onChange">) {
  const t = useTranslations("courseTests.attempt");
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
        {t("question.yourAnswer")}
      </label>
      <input
        id={id}
        type="text"
        dir="auto"
        autoComplete="off"
        spellCheck={false}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("short.placeholder")}
        aria-describedby={`${id}-hint`}
        className={cn(fieldBase, "h-[52px] border-slate-300 px-4 dark:border-slate-700")}
      />
      <span id={`${id}-hint`} className={cn("text-xs", muted)}>
        {t("hints.short_answer")}
      </span>
    </div>
  );
}

export function EssayInput({ question, value, onChange }: InputProps) {
  const t = useTranslations("courseTests.attempt");
  const id = useId();
  const text = typeof value === "string" ? value : "";
  const words = countWords(text);
  const limit = question.word_limit ?? null;
  const over = limit !== null && words > limit;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
        {t("question.yourAnswer")}
      </label>
      <textarea
        id={id}
        dir="auto"
        rows={6}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("essay.placeholder")}
        aria-describedby={`${id}-count`}
        aria-invalid={over || undefined}
        className={cn(
          fieldBase,
          "min-h-32 resize-y px-4 py-3.5 text-[15px] leading-[1.8]",
          over ? "border-red-500 focus:border-red-500 dark:border-red-400" : "border-slate-300 dark:border-slate-700",
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={muted}>{t("essay.autosave")}</span>
        <span id={`${id}-count`} className={cn("tabular-nums", over ? "font-semibold text-red-700 dark:text-red-300" : muted)}>
          {limit !== null ? t("essay.words", { count: words, limit }) : t("essay.wordsNoLimit", { count: words })}
          {over ? <span className="ms-1">· {t("essay.overLimit", { limit })}</span> : null}
        </span>
      </div>
    </div>
  );
}

/** matching: one select per left item; answer shape {left_id: right_id}. */
export function MatchingInput({ question, value, onChange }: InputProps) {
  const t = useTranslations("courseTests.attempt");
  const current = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const rights = question.right_options ?? [];

  const choose = (leftId: string, rightId: string) => {
    const next: Record<string, string> = { ...current };
    if (rightId) next[leftId] = rightId;
    else delete next[leftId];
    onChange(Object.keys(next).length ? next : null);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {question.options.map((left) => {
        const chosen = current[left.id] ?? "";
        return (
          <div key={left.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span
              dir="auto"
              className="min-w-[90px] rounded-xl bg-slate-900 px-3 py-2.5 text-center font-mono text-sm text-slate-200 sm:max-w-[45%] dark:bg-slate-950 dark:ring-1 dark:ring-slate-700"
            >
              {left.text}
            </span>
            <ArrowRight aria-hidden="true" className="hidden size-4 shrink-0 text-slate-400 sm:block rtl:rotate-180" />
            <select
              aria-label={t("matching.selectLabel", { item: left.text })}
              value={chosen}
              onChange={(event) => choose(left.id, event.target.value)}
              className={cn(
                "min-h-11 min-w-0 flex-1 rounded-xl px-3 text-sm transition-[background-color,border-color]",
                chosen
                  ? "border-2 border-slate-900 bg-sky-50 text-slate-900 dark:border-sky-300 dark:bg-sky-950/40 dark:text-slate-100"
                  : "border-[1.5px] border-dashed border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400",
                focusRing,
              )}
            >
              <option value="">{t("matching.placeholder")}</option>
              {rights.map((right) => (
                <option key={right.id} value={right.id}>
                  {right.text}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
