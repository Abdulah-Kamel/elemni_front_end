"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  CircleAlert,
  Dna,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  LoaderCircle,
  Microscope,
  PartyPopper,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import logoMark from "@/src/assets/logo-icon.png";
import studyImage from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import { Link, useRouter } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import type { GradeDto, StreamDto, SubjectDto } from "@/src/lib/student-api/contract";
import { readOnboardingDraft, saveStudentOnboarding, type SaveOutcome } from "../client";
import "@/src/features/portal/styles/sticker.css";

type Step = "welcome" | "grade" | "stream" | "subjects" | "done";
const QUESTION_STEPS = ["grade", "stream", "subjects"] as const;
type QuestionStep = (typeof QUESTION_STEPS)[number];

const popSpring = { type: "spring", stiffness: 260, damping: 24 } as const;

function subjectIcon(name: string) {
  const value = name.toLocaleLowerCase();
  if (value.includes("كيمي") || value.includes("chem")) return FlaskConical;
  if (value.includes("أحيا") || value.includes("احيا") || value.includes("bio")) return Dna;
  if (value.includes("فيز") || value.includes("phys")) return Microscope;
  if (value.includes("رياض") || value.includes("حساب") || value.includes("math")) return Calculator;
  if (value.includes("جغراف") || value.includes("geo")) return Globe2;
  if (value.includes("تاريخ") || value.includes("hist")) return Landmark;
  if (value.includes("إنج") || value.includes("انج") || value.includes("لغة") || value.includes("english") || value.includes("arab")) return Languages;
  return BookOpen;
}

function streamIcon(name: string) {
  const value = name.toLocaleLowerCase();
  if (value.includes("رياض") || value.includes("math")) return Calculator;
  if (value.includes("علوم") || value.includes("science")) return Microscope;
  if (value.includes("أدب") || value.includes("ادب") || value.includes("liter")) return BookOpen;
  return Sparkles;
}

/** "GRADE_10" → "10": the big numeral on grade cards. */
function gradeNumeral(grade: GradeDto) {
  return grade.level.match(/\d+/)?.[0] ?? grade.name.match(/\d+/)?.[0] ?? "";
}

export function subjectsFor(subjects: SubjectDto[], gradeId: number | null, streamId: number | null) {
  if (!gradeId || !streamId) return [];
  const exact = subjects.filter(
    (subject) => subject.grades.some((grade) => grade.id === gradeId) && subject.streams.some((stream) => stream.id === streamId),
  );
  return exact.length ? exact : subjects.filter((subject) => subject.grades.some((grade) => grade.id === gradeId));
}

/** Arrow-key navigation for a radio group of option cards (roving tabindex). */
function useRadioKeys<T extends { id: number }>(items: T[], value: number | null, onChange: (id: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const locale = useLocale();
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = locale === "ar" ? ["ArrowLeft", "ArrowDown"] : ["ArrowRight", "ArrowDown"];
    const backward = locale === "ar" ? ["ArrowRight", "ArrowUp"] : ["ArrowLeft", "ArrowUp"];
    let next = -1;
    if (forward.includes(event.key)) next = (index + 1) % items.length;
    else if (backward.includes(event.key)) next = (index - 1 + items.length) % items.length;
    if (next < 0) return;
    event.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };
  const tabIndexFor = (index: number) => {
    const selectedIndex = items.findIndex((item) => item.id === value);
    return (selectedIndex === -1 ? index === 0 : items[index].id === value) ? 0 : -1;
  };
  return { refs, onKeyDown, tabIndexFor };
}

function CheckDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
        selected ? "border-ink bg-white text-brand-700 dark:border-brand-300" : "border-ink/25 text-transparent dark:border-slate-600",
      )}
    >
      <m.span initial={false} animate={{ scale: selected ? 1 : 0.4, opacity: selected ? 1 : 0 }} transition={popSpring}>
        <Check className="size-4" strokeWidth={3} />
      </m.span>
    </span>
  );
}

function optionClass(selected: boolean) {
  return cn(
    "relative flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 text-start transition-colors outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:p-5",
    selected
      ? "border-ink bg-brand-600 text-white shadow-[3px_3px_0_0_var(--color-ink)] dark:border-brand-300 dark:shadow-[3px_3px_0_0_#020617]"
      : "border-ink/15 bg-surface hover:border-ink dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-300",
  );
}

export default function OnboardingFlow({ grades, streams, subjects }: { grades: GradeDto[]; streams: StreamDto[]; subjects: SubjectDto[] }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [direction, setDirection] = useState(1);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const NextIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  // Returning to onboarding (e.g. from the dashboard) starts from the saved answers.
  useEffect(() => {
    const draft = readOnboardingDraft();
    if (!draft) return;
    const timer = window.setTimeout(() => {
      setGradeId(draft.grade_id);
      setStreamId(draft.stream_id);
      setSubjectIds(draft.subject_ids);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    if (step !== "welcome") headingRef.current?.focus();
  }, [step]);

  const relevantSubjects = useMemo(() => subjectsFor(subjects, gradeId, streamId), [gradeId, streamId, subjects]);
  const grade = grades.find((item) => item.id === gradeId) ?? null;
  const stream = streams.find((item) => item.id === streamId) ?? null;
  const chosenSubjects = relevantSubjects.filter((subject) => subjectIds.includes(subject.id));

  const goTo = (next: Step) => {
    const order: Step[] = ["welcome", ...QUESTION_STEPS, "done"];
    setDirection(order.indexOf(next) >= order.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const chooseGrade = (id: number) => {
    if (id !== gradeId) { setStreamId(null); setSubjectIds([]); }
    setGradeId(id);
  };
  const chooseStream = (id: number) => {
    if (id !== streamId) setSubjectIds([]);
    setStreamId(id);
  };
  const continueToSubjects = () => {
    // Preselect every subject for the grade and stream; keep an earlier choice if it still fits.
    const available = subjectsFor(subjects, gradeId, streamId).map((subject) => subject.id);
    const kept = subjectIds.filter((id) => available.includes(id));
    setSubjectIds(kept.length ? kept : available);
    goTo("subjects");
  };
  const toggleSubject = (id: number) => setSubjectIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const finish = async () => {
    if (!gradeId || !streamId || (relevantSubjects.length > 0 && !chosenSubjects.length)) return;
    setSaving(true);
    setSaveError(false);
    try {
      setOutcome(await saveStudentOnboarding({ grade_id: gradeId, stream_id: streamId, subject_ids: chosenSubjects.map((subject) => subject.id) }));
      goTo("done");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const gradeKeys = useRadioKeys(grades, gradeId, chooseGrade);
  const streamKeys = useRadioKeys(streams, streamId, chooseStream);
  const questionIndex = QUESTION_STEPS.indexOf(step as QuestionStep);
  const canReach = (target: QuestionStep) => target === "grade" || (target === "stream" && Boolean(gradeId)) || (target === "subjects" && Boolean(gradeId && streamId));

  const heading = (text: ReactNode, body: string) => (
    <div className="mb-6">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-black tracking-tight text-ink outline-none sm:text-3xl dark:text-slate-50">
        <MarkerHighlight color="yellow" variant={1}>{text}</MarkerHighlight>
      </h1>
      <p className="mt-2 text-sm leading-6 font-medium text-muted dark:text-slate-400">{body}</p>
    </div>
  );

  const footerNav = (onNext: () => void, nextDisabled: boolean, nextLabel: string, busy = false) => (
    <div className="mt-8 flex items-center justify-between gap-3 border-t-2 border-dashed border-ink/10 pt-5 dark:border-white/10">
      <button
        type="button"
        onClick={() => goTo(step === "grade" ? "welcome" : step === "stream" ? "grade" : "stream")}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-muted transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
      >
        <BackIcon className="size-4" aria-hidden="true" />
        {t("back")}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || busy}
        aria-busy={busy || undefined}
        className="sticker-btn inline-flex min-h-12 items-center gap-2 px-7 font-black text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? <><LoaderCircle className="size-5 animate-spin" aria-hidden="true" />{t("saving")}</> : <>{nextLabel}<NextIcon className="size-4" aria-hidden="true" /></>}
      </button>
    </div>
  );

  const studyCard = (
    <aside aria-label={t("card.title")} className="sticker-tile relative overflow-hidden p-5">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-brand-600" />
      <p className="mt-1 text-xs font-black tracking-wide text-brand-700 dark:text-brand-300">{t("card.title")}</p>
      <dl className="mt-4 space-y-3 text-sm">
        {([
          ["grade", grade?.name],
          ["stream", stream?.name],
        ] as const).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 border-b-2 border-dashed border-ink/10 pb-3 dark:border-white/10">
            <dt className="font-bold text-muted dark:text-slate-400">{t(`card.${key}`)}</dt>
            <dd className="min-w-0 truncate font-black text-ink dark:text-slate-100">
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={value ?? "none"} className="inline-block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  {value ?? t("card.pending")}
                </m.span>
              </AnimatePresence>
            </dd>
          </div>
        ))}
        <div>
          <dt className="font-bold text-muted dark:text-slate-400">{t("card.subjects")}</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {step === "subjects" || step === "done" ? (
              chosenSubjects.length ? chosenSubjects.map((subject) => (
                <m.span key={subject.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={popSpring} className="sticker-badge bg-brand-100 px-2.5 py-1 text-[11px] font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">
                  {subject.name}
                </m.span>
              )) : <span className="font-black text-ink dark:text-slate-100">{t("card.pending")}</span>
            ) : <span className="font-black text-ink dark:text-slate-100">{t("card.pending")}</span>}
          </dd>
        </div>
      </dl>
    </aside>
  );

  return (
    <MotionProvider>
      <div className="student-portal-shell min-h-screen bg-page px-4 py-6 font-readex text-ink sm:px-6 sm:py-8 dark:text-slate-100">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[64rem] flex-col">
          <header className="flex items-center justify-between gap-4 border-b-2 border-ink pb-4 dark:border-brand-300">
            <div className="flex items-center gap-2.5">
              <span className="sticker-badge grid size-11 -rotate-3 place-items-center bg-brand-600">
                <Image src={logoMark} alt="" width={32} height={32} className="size-8 rounded-lg bg-white p-0.5 object-contain" />
              </span>
              <div>
                <p className="text-xl font-black text-brand-700 dark:text-brand-300">{t("brand")}</p>
                <p className="hidden text-xs font-medium text-muted sm:block dark:text-slate-400">{t("tagline")}</p>
              </div>
            </div>
            {step !== "done" && (
              <button type="button" onClick={() => router.replace("/dashboard")} className="min-h-11 rounded-xl px-3 text-sm font-bold text-brand-700 hover:underline dark:text-brand-300">
                {t("skip")}
              </button>
            )}
          </header>

          {questionIndex >= 0 && (
            <nav aria-label={t("steps.label")} className="mt-6">
              <p className="sr-only" aria-live="polite">{t("steps.progress", { current: questionIndex + 1, total: QUESTION_STEPS.length })}</p>
              <ol className="grid grid-cols-3 gap-2 sm:gap-3">
                {QUESTION_STEPS.map((item, index) => {
                  const state = index < questionIndex ? "done" : index === questionIndex ? "current" : "todo";
                  const reachable = index < questionIndex && canReach(item);
                  const content = (
                    <>
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-black tabular-nums", state === "todo" ? "border-ink/20 text-muted dark:border-slate-600" : "border-ink bg-brand-600 text-white dark:border-brand-300")}>
                        {state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
                      </span>
                      <span className={cn("truncate text-xs font-black sm:text-sm", state === "todo" ? "text-muted dark:text-slate-500" : "text-ink dark:text-slate-100")}>{t(`steps.${item}`)}</span>
                    </>
                  );
                  return (
                    <li key={item} className="relative">
                      {reachable ? (
                        <button type="button" onClick={() => goTo(item)} className="flex min-h-11 w-full items-center gap-2 rounded-xl text-start hover:underline">{content}</button>
                      ) : (
                        <span aria-current={state === "current" ? "step" : undefined} className="flex min-h-11 items-center gap-2">{content}</span>
                      )}
                      <span aria-hidden="true" className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                        <m.span className="block h-full rounded-full bg-brand-600" initial={false} animate={{ width: index <= questionIndex ? "100%" : "0%" }} transition={popSpring} />
                      </span>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          <main className={cn("flex-1 py-6 sm:py-8", step !== "welcome" && step !== "done" && "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]")}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <m.section
                key={step}
                data-step={step}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, x: (locale === "ar" ? -1 : 1) * dir * 40 }),
                  center: { opacity: 1, x: 0 },
                  exit: (dir: number) => ({ opacity: 0, x: (locale === "ar" ? 1 : -1) * dir * 30 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={cn("sticker-tile min-w-0 p-5 sm:p-8", (step === "welcome" || step === "done") && "mx-auto w-full max-w-[40rem]")}
              >
                {step === "welcome" && (
                  <div className="text-center">
                    <div className="relative mx-auto mb-7 aspect-[16/7] w-full max-w-[28rem] overflow-hidden rounded-xl border-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800">
                      <Image src={studyImage} alt={t("welcome.imageAlt")} fill priority sizes="(max-width: 640px) calc(100vw - 3rem), 448px" className="object-cover" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-brand-700 sm:text-4xl dark:text-brand-300"><MarkerHighlight color="yellow" variant={1}>{t("welcome.title")}</MarkerHighlight></h1>
                    <p className="mt-3 text-lg font-black text-ink dark:text-slate-50">{t("welcome.subtitle")}</p>
                    <p className="mx-auto mt-2 max-w-[30rem] text-sm leading-6 font-medium text-muted dark:text-slate-400">{t("welcome.body")}</p>
                    <ul className="mx-auto my-7 grid max-w-[30rem] gap-2 text-start text-sm font-black sm:grid-cols-3">
                      {([[UserRoundCheck, "perk1"], [BookOpen, "perk2"], [Target, "perk3"]] as const).map(([Icon, key], index) => (
                        <m.li key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...popSpring, delay: 0.1 + index * 0.06 }} className="flex items-center gap-2.5 rounded-xl border-2 border-ink/10 p-3 sm:flex-col sm:text-center dark:border-white/10">
                          <span className="sticker-badge grid size-9 shrink-0 place-items-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><Icon className="size-4" aria-hidden="true" /></span>
                          {t(`welcome.${key}`)}
                        </m.li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => goTo("grade")} className="sticker-btn inline-flex min-h-13 w-full max-w-[20rem] items-center justify-center gap-2 py-3.5 font-black text-white">
                      {t("welcome.start")}
                      <NextIcon className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {step === "grade" && (
                  <>
                    {heading(t("grade.title"), t("grade.body"))}
                    {grades.length ? (
                      <div role="radiogroup" aria-label={t("grade.title")} className="grid gap-3 sm:grid-cols-3">
                        {grades.map((item, index) => {
                          const selected = gradeId === item.id;
                          return (
                            <m.button
                              key={item.id}
                              ref={(node) => { gradeKeys.refs.current[index] = node; }}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              tabIndex={gradeKeys.tabIndexFor(index)}
                              onKeyDown={(event) => gradeKeys.onKeyDown(event, index)}
                              onClick={() => chooseGrade(item.id)}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ ...popSpring, delay: 0.05 * index }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(optionClass(selected), "sm:flex-col sm:items-start sm:gap-3")}
                            >
                              <span className={cn("sticker-numeral text-4xl font-black leading-none tabular-nums sm:text-5xl", selected ? "text-white" : "text-brand-700 dark:text-brand-300")}>{gradeNumeral(item)}</span>
                              <span className="min-w-0 flex-1 text-base font-black">{item.name}</span>
                              <span className="sm:absolute sm:end-4 sm:top-4"><CheckDot selected={selected} /></span>
                            </m.button>
                          );
                        })}
                      </div>
                    ) : (
                      <p role="alert" className="sticker-tile border-amber-500 bg-amber-50 p-4 text-sm font-black text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t("grade.empty")}</p>
                    )}
                    {footerNav(() => goTo("stream"), !gradeId, t("next"))}
                  </>
                )}

                {step === "stream" && (
                  <>
                    {heading(t("stream.title"), t("stream.body"))}
                    {streams.length ? (
                      <div role="radiogroup" aria-label={t("stream.title")} className="grid gap-3 sm:grid-cols-2">
                        {streams.map((item, index) => {
                          const selected = streamId === item.id;
                          const Icon = streamIcon(item.name);
                          const count = subjectsFor(subjects, gradeId, item.id).length;
                          return (
                            <m.button
                              key={item.id}
                              ref={(node) => { streamKeys.refs.current[index] = node; }}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              tabIndex={streamKeys.tabIndexFor(index)}
                              onKeyDown={(event) => streamKeys.onKeyDown(event, index)}
                              onClick={() => chooseStream(item.id)}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ ...popSpring, delay: 0.04 * index }}
                              whileTap={{ scale: 0.98 }}
                              className={optionClass(selected)}
                            >
                              <span className={cn("sticker-badge grid size-11 shrink-0 place-items-center", selected ? "bg-white text-brand-700" : "bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300")}><Icon className="size-5" aria-hidden="true" /></span>
                              <span className="min-w-0 flex-1">
                                <strong className="block text-base font-black">{item.name}</strong>
                                <span className={cn("mt-0.5 block text-xs font-bold", selected ? "text-brand-100" : "text-muted dark:text-slate-400")}>{t("stream.subjectCount", { count })}</span>
                              </span>
                              <CheckDot selected={selected} />
                            </m.button>
                          );
                        })}
                      </div>
                    ) : (
                      <p role="alert" className="sticker-tile border-amber-500 bg-amber-50 p-4 text-sm font-black text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t("stream.empty")}</p>
                    )}
                    {footerNav(continueToSubjects, !streamId, t("next"))}
                  </>
                )}

                {step === "subjects" && (
                  <>
                    {heading(t("subjects.title"), t("subjects.body"))}
                    {relevantSubjects.length ? (
                      <>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-black text-ink tabular-nums dark:text-slate-100" aria-live="polite">{t("subjects.selected", { count: chosenSubjects.length })}</p>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setSubjectIds(relevantSubjects.map((subject) => subject.id))} className="min-h-10 rounded-lg px-3 text-xs font-black text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800">{t("subjects.selectAll")}</button>
                            <button type="button" onClick={() => setSubjectIds([])} className="min-h-10 rounded-lg px-3 text-xs font-black text-muted hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">{t("subjects.clear")}</button>
                          </div>
                        </div>
                        <div role="group" aria-label={t("subjects.title")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {relevantSubjects.map((subject, index) => {
                            const selected = subjectIds.includes(subject.id);
                            const Icon = subjectIcon(subject.name);
                            return (
                              <m.button
                                key={subject.id}
                                type="button"
                                role="checkbox"
                                aria-checked={selected}
                                onClick={() => toggleSubject(subject.id)}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ ...popSpring, delay: 0.03 * index }}
                                whileTap={{ scale: 0.96 }}
                                className={cn(optionClass(selected), "min-h-28 flex-col justify-center gap-2 text-center")}
                              >
                                <span className="absolute end-3 top-3"><CheckDot selected={selected} /></span>
                                <Icon className={cn("size-8", selected ? "text-white" : "text-brand-600 dark:text-brand-300")} aria-hidden="true" />
                                <span className="text-sm font-black">{subject.name}</span>
                              </m.button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="sticker-tile border-amber-500 bg-amber-50 p-4 text-sm font-black text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t("subjects.empty")}</p>
                    )}
                    {relevantSubjects.length > 0 && !chosenSubjects.length && <p className="mt-4 text-sm font-bold text-amber-700 dark:text-amber-300">{t("subjects.needOne")}</p>}
                    {saveError && (
                      <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                        <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1">{t("errors.save")}</span>
                        <button type="button" onClick={() => void finish()} className="min-h-10 rounded-lg px-3 font-black underline">{t("errors.retry")}</button>
                      </div>
                    )}
                    {footerNav(() => void finish(), relevantSubjects.length > 0 && !chosenSubjects.length, t("finish"), saving)}
                  </>
                )}

                {step === "done" && (
                  <div className="text-center">
                    <m.span
                      className="sticker-badge mx-auto grid size-20 place-items-center bg-amber-300 text-ink"
                      initial={{ scale: 0.4, rotate: -20 }}
                      animate={{ scale: 1, rotate: -6 }}
                      transition={{ type: "spring", stiffness: 240, damping: 12 }}
                    >
                      <PartyPopper className="size-9" aria-hidden="true" />
                    </m.span>
                    <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl font-black tracking-tight text-ink outline-none sm:text-4xl dark:text-slate-50">
                      <MarkerHighlight color="yellow" variant={1}>{t("done.title")}</MarkerHighlight>
                    </h1>
                    <p className="mx-auto mt-3 max-w-[30rem] text-sm leading-6 font-medium text-muted dark:text-slate-400">
                      {t("done.body", { profile: [grade?.name, stream?.name].filter(Boolean).join(" · ") })}
                    </p>
                    {outcome === "saved_locally" && <p className="mt-2 text-xs font-bold text-muted dark:text-slate-500">{t("done.local")}</p>}
                    <div className="mx-auto mt-7 flex max-w-[34rem] flex-col gap-3 sm:flex-row">
                      <Link href={`/explore?grade=${gradeId ?? ""}&stream=${streamId ?? ""}`} className="sticker-btn inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-5 font-black whitespace-nowrap text-white">
                        {t("done.explore")}
                        <NextIcon className="size-4" aria-hidden="true" />
                      </Link>
                      <Link href="/dashboard" className="sticker-btn-outline inline-flex min-h-12 flex-1 items-center justify-center px-5 font-black whitespace-nowrap text-ink dark:text-slate-100">
                        {t("done.dashboard")}
                      </Link>
                    </div>
                  </div>
                )}
              </m.section>
            </AnimatePresence>
            {step !== "welcome" && step !== "done" && <div className="hidden lg:block lg:sticky lg:top-8">{studyCard}</div>}
          </main>

          <footer className="flex justify-center gap-6 pb-2 text-xs font-bold text-muted dark:text-slate-500">
            <Link href="/legal" className="min-h-11 content-center hover:text-brand-700 hover:underline">{t("footer.terms")}</Link>
            <Link href="/contact" className="min-h-11 content-center hover:text-brand-700 hover:underline">{t("footer.help")}</Link>
          </footer>
        </div>
      </div>
    </MotionProvider>
  );
}
