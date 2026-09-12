"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Dna,
  FlaskConical,
  Globe2,
  GraduationCap,
  Languages,
  LoaderCircle,
  Microscope,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import type { GradeDto, StreamDto, SubjectDto } from "@/src/lib/student-api/contract";
import { useRouter } from "@/src/i18n/navigation";
import studyImage from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import { saveStudentOnboarding } from "../client";

type Step = "welcome" | "grade" | "stream" | "subjects";

const orderedSteps: Step[] = ["welcome", "grade", "stream", "subjects"];

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function subjectIcon(name: string) {
  if (name.includes("كيمي")) return FlaskConical;
  if (name.includes("أحيا") || name.includes("احيا")) return Dna;
  if (name.includes("فيز")) return Microscope;
  if (name.includes("رياض") || name.includes("حساب")) return Calculator;
  if (name.includes("إنج") || name.includes("انج") || name.includes("لغة")) return Languages;
  if (name.includes("جغراف")) return Globe2;
  return BookOpen;
}

function streamIcon(name: string) {
  if (name.includes("رياض")) return Calculator;
  if (name.includes("علوم")) return Microscope;
  if (name.includes("أدب") || name.includes("ادب")) return BookOpen;
  return Sparkles;
}

function StepProgress({ step }: { step: Exclude<Step, "welcome"> }) {
  const active = orderedSteps.indexOf(step);
  return (
    <div className="flex flex-col items-center gap-2" aria-label={`الخطوة ${active} من 3`}>
      <span className="sticker-numeral text-xs font-black text-ink dark:text-slate-200">الخطوة {active} من 3</span>
      <div className="flex w-36 gap-2" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <span key={item} className="h-2.5 flex-1 overflow-hidden rounded-full border border-ink bg-surface dark:border-brand-300">
            <m.span
              className="block h-full rounded-full bg-brand-600"
              initial={{ width: 0 }}
              animate={{ width: item <= active ? "100%" : "0%" }}
              transition={popSpring}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function SelectIndicator({ selected }: { selected: boolean }) {
  return (
    <m.span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-ink bg-brand-600 text-white shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300" : "border-ink/30 text-transparent dark:border-slate-600"}`}
      initial={false}
      animate={{ scale: selected ? [1, 1.25, 1] : 1 }}
      transition={popSpring}
    >
      <Check className="size-4" strokeWidth={3} />
    </m.span>
  );
}

export default function OnboardingFlow({ grades, streams, subjects }: { grades: GradeDto[]; streams: StreamDto[]; subjects: SubjectDto[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const relevantSubjects = useMemo(() => {
    if (!gradeId || !streamId) return [];
    const exact = subjects.filter(
      (subject) =>
        subject.grades.some((grade) => grade.id === gradeId) &&
        subject.streams.some((stream) => stream.id === streamId),
    );
    if (exact.length) return exact;
    return subjects.filter(
      (subject) =>
        subject.grades.some((grade) => grade.id === gradeId) ||
        subject.streams.some((stream) => stream.id === streamId),
    );
  }, [gradeId, streamId, subjects]);

  const goTo = (next: Step) => setStep(next);
  const skip = () => router.replace("/dashboard");

  const continueToSubjects = () => {
    setSubjectIds(relevantSubjects.map((subject) => subject.id));
    goTo("subjects");
  };

  const finish = async () => {
    if (!gradeId || !streamId || !subjectIds.length) return;
    setSaving(true);
    await saveStudentOnboarding({ grade_id: gradeId, stream_id: streamId, subject_ids: subjectIds });
    router.replace("/dashboard");
  };

  const toggleSubject = (id: number) => {
    setSubjectIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <MotionProvider>
      <div dir="rtl" className="student-portal-shell min-h-screen px-4 py-7 font-readex text-ink sm:px-6 sm:py-10 dark:text-slate-100">
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col">
          <m.header
            className="mb-7 flex items-center justify-between border-b-2 border-ink pb-5 dark:border-brand-300"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={popSpring}
          >
            <div className="flex items-center gap-2.5">
              <m.span
                className="sticker-badge flex size-11 -rotate-3 items-center justify-center bg-brand-600 text-white"
                whileHover={{ rotate: 3, scale: 1.06 }}
                transition={popSpring}
              >
                <GraduationCap className="size-6" />
              </m.span>
              <div>
                <p className="text-xl font-black text-brand-700 dark:text-brand-300">علمني</p>
                <p className="hidden text-xs font-medium text-muted sm:block dark:text-slate-400">منصة تعليمية لطلاب الثانوية</p>
              </div>
            </div>
            {step !== "welcome" && <StepProgress step={step} />}
          </m.header>

          <div className="flex flex-1 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <m.section
                key={step}
                data-step={step}
                initial={{ opacity: 0, x: 64, rotate: 0.5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -48 }}
                transition={popSpring}
                className="sticker-tile w-full max-w-2xl overflow-hidden"
              >
                {step === "welcome" && (
                  <div className="p-5 sm:p-8">
                    <div className="relative mx-auto mb-7 aspect-[16/7] w-full max-w-md overflow-hidden rounded-xl border-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800">
                      <Image src={studyImage} alt="طالب يخطط لمذاكرته" fill loading="eager" sizes="(max-width: 640px) calc(100vw - 3rem), 448px" className="object-cover" />
                    </div>
                    <div className="mx-auto max-w-lg text-center">
                      <h1 className="text-3xl font-black tracking-tight text-brand-700 sm:text-4xl dark:text-brand-300">أهلاً بيك في علمني</h1>
                      <h2 className="mt-2 text-lg font-black text-ink dark:text-slate-50">خلينا نجهز تجربتك التعليمية</h2>
                      <p className="mt-2 text-sm leading-6 font-medium text-muted dark:text-slate-400">جاوب على كام سؤال بسيط عشان نعرضلك المدرسين والكورسات المناسبة ليك.</p>
                    </div>
                    <div className="mx-auto my-7 max-w-lg divide-y-2 divide-ink/10 border-y-2 border-ink/10 text-sm font-black text-ink dark:divide-white/10 dark:border-white/10 dark:text-slate-100">
                      <p className="flex items-center gap-3 py-3"><span className="sticker-badge flex size-8 items-center justify-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><UserRoundCheck className="size-4" /></span>مدرسين مناسبين لمستواك</p>
                      <p className="flex items-center gap-3 py-3"><span className="sticker-badge flex size-8 items-center justify-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><BookOpen className="size-4" /></span>كورسات حسب سنتك الدراسية</p>
                      <p className="flex items-center gap-3 py-3"><span className="sticker-badge flex size-8 items-center justify-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><Target className="size-4" /></span>تجربة مذاكرة منظمة</p>
                    </div>
                    <div className="mx-auto flex max-w-lg flex-col gap-3">
                      <m.button onClick={() => goTo("grade")} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={popSpring} className="sticker-btn flex h-13 cursor-pointer items-center justify-center gap-2 py-3.5 font-black">ابدأ الآن<ArrowLeft className="size-4" /></m.button>
                      <button onClick={skip} className="h-11 cursor-pointer rounded-xl text-sm font-bold text-brand-700 transition hover:underline dark:text-brand-300">تخطي الآن</button>
                    </div>
                  </div>
                )}

                {step === "grade" && (
                  <div className="p-5 sm:p-8">
                    <div className="mb-7 text-center">
                      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">أنت في سنة كام؟</h1>
                      <p className="mt-2 text-sm leading-6 font-medium text-muted dark:text-slate-400">اختار سنتك الدراسية عشان نعرضلك الكورسات والمدرسين المناسبين.</p>
                    </div>
                    <div className="space-y-3">
                      {grades.map((grade, index) => {
                        const selected = gradeId === grade.id;
                        const Icon = index === 0 ? GraduationCap : index === 1 ? BookOpen : Award;
                        return <m.button key={grade.id} aria-pressed={selected} onClick={() => { setGradeId(grade.id); setStreamId(null); setSubjectIds([]); }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...popSpring, delay: 0.05 * index }} whileTap={{ scale: 0.98 }} className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 text-start transition sm:p-5 ${selected ? "border-ink bg-brand-600 text-white shadow-[3px_3px_0_0_var(--color-ink)] dark:border-brand-300" : "border-ink/20 bg-surface hover:border-ink dark:border-slate-700 dark:hover:border-brand-300"}`}>
                          <span className={`sticker-badge flex size-11 items-center justify-center ${selected ? "bg-white text-brand-700" : "bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"}`}><Icon className="size-5" /></span>
                          <span className="min-w-0 flex-1"><strong className="block text-base font-black">{grade.name}</strong><span className={`mt-0.5 block text-xs font-medium ${selected ? "text-brand-100" : "text-muted dark:text-slate-400"}`}>{grade.level}</span></span>
                          <SelectIndicator selected={selected} />
                        </m.button>;
                      })}
                    </div>
                    {!grades.length && <p className="sticker-tile border-amber-500 bg-amber-50 p-4 text-center text-sm font-black text-amber-800">لا توجد صفوف دراسية متاحة حالياً.</p>}
                    <div className="mt-7 flex items-center justify-between border-t-2 border-ink/10 pt-5 dark:border-white/10">
                      <button onClick={() => goTo("welcome")} className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-700 dark:text-slate-400"><ArrowRight className="size-4" />العودة</button>
                      <button disabled={!gradeId} onClick={() => goTo("stream")} className="sticker-btn flex h-12 cursor-pointer items-center gap-2 px-8 font-black disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">التالي<ArrowLeft className="size-4" /></button>
                    </div>
                  </div>
                )}

                {step === "stream" && (
                  <div>
                    <div className="border-b-2 border-ink/10 p-5 text-center sm:p-7 dark:border-white/10">
                      <h1 className="text-3xl font-black tracking-tight">اختار شعبتك</h1>
                      <p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">عشان نعرضلك المواد والكورسات المناسبة ليك</p>
                    </div>
                    <div className="p-5 sm:p-8">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {streams.map((stream, index) => {
                          const selected = streamId === stream.id;
                          const Icon = streamIcon(stream.name);
                          return <m.button key={stream.id} aria-pressed={selected} onClick={() => { setStreamId(stream.id); setSubjectIds([]); }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...popSpring, delay: 0.05 * index }} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} className={`relative min-h-36 cursor-pointer rounded-2xl border-2 p-4 text-start transition ${selected ? "border-ink bg-brand-600 text-white shadow-[3px_3px_0_0_var(--color-ink)] dark:border-brand-300" : "border-ink/20 bg-surface hover:border-ink dark:border-slate-700 dark:hover:border-brand-300"}`}>
                            <div className="mb-4 flex items-center justify-between"><span className={`sticker-badge flex size-10 items-center justify-center ${selected ? "bg-white text-brand-700" : "bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"}`}><Icon className="size-5" /></span><SelectIndicator selected={selected} /></div>
                            <strong className="block text-base font-black">{stream.name}</strong>
                            <span className={`mt-1 block text-xs leading-5 font-medium ${selected ? "text-brand-100" : "text-muted dark:text-slate-400"}`}>محتوى ومدرسون مناسبون للشعبة</span>
                          </m.button>;
                        })}
                      </div>
                      {!streams.length && <p className="sticker-tile border-amber-500 bg-amber-50 p-4 text-center text-sm font-black text-amber-800">لا توجد شعب دراسية متاحة حالياً.</p>}
                      <div className="mt-7 flex items-center justify-between border-t-2 border-ink/10 pt-5 dark:border-white/10">
                        <button onClick={() => goTo("grade")} className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-700 dark:text-slate-400"><ArrowRight className="size-4" />العودة</button>
                        <button disabled={!streamId} onClick={continueToSubjects} className="sticker-btn flex h-12 cursor-pointer items-center gap-2 px-8 font-black disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">التالي<ArrowLeft className="size-4" /></button>
                      </div>
                    </div>
                  </div>
                )}

                {step === "subjects" && (
                  <div className="p-5 sm:p-8">
                    <div className="mb-7 text-center">
                      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">جهزنا موادك الدراسية</h1>
                      <p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">بناءً على اختيارك، اخترنا لك المواد المناسبة. تقدر تعدلها الآن.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {relevantSubjects.map((subject, index) => {
                        const selected = subjectIds.includes(subject.id);
                        const Icon = subjectIcon(subject.name);
                        return <m.button key={subject.id} aria-pressed={selected} onClick={() => toggleSubject(subject.id)} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...popSpring, delay: 0.04 * index }} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 transition ${selected ? "border-ink bg-brand-600 text-white shadow-[3px_3px_0_0_var(--color-ink)] dark:border-brand-300" : "border-ink/20 bg-surface hover:border-ink dark:border-slate-700 dark:hover:border-brand-300"}`}>
                          {selected && <CheckCircle2 className="absolute start-2.5 top-2.5 size-5 fill-white text-brand-600" />}
                          <Icon className={`mb-2 size-8 ${selected ? "text-white" : "text-muted dark:text-slate-400"}`} />
                          <span className="text-sm font-black">{subject.name}</span>
                        </m.button>;
                      })}
                    </div>
                    {!relevantSubjects.length && <p className="sticker-tile border-amber-500 bg-amber-50 p-4 text-center text-sm font-black text-amber-800">لم نجد مواد مرتبطة بهذه الاختيارات حالياً. ارجع واختر شعبة أخرى.</p>}
                    <div className="mt-7 flex flex-col gap-3 border-t-2 border-ink/10 pt-5 dark:border-white/10">
                      <m.button disabled={!subjectIds.length || saving} onClick={() => void finish()} whileTap={!subjectIds.length || saving ? undefined : { scale: 0.98 }} className="sticker-btn flex h-13 w-full cursor-pointer items-center justify-center gap-2 py-3.5 font-black disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">{saving ? <><LoaderCircle className="size-5 animate-spin" />جاري التجهيز...</> : <>ابدأ رحلتي<ArrowLeft className="size-4" /></>}</m.button>
                      <button onClick={() => goTo("stream")} className="flex h-10 cursor-pointer items-center justify-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-700 dark:text-slate-400"><ArrowRight className="size-4" />العودة</button>
                    </div>
                  </div>
                )}
              </m.section>
            </AnimatePresence>
          </div>

          <footer className="mt-7 flex justify-center gap-6 text-xs font-medium text-muted dark:text-slate-500"><span>الشروط</span><span>الخصوصية</span><span>المساعدة</span></footer>
        </div>
      </div>
    </MotionProvider>
  );
}
