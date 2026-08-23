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
      <span className="text-xs font-bold text-muted">الخطوة {active} من 3</span>
      <div className="flex w-32 gap-2" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <span key={item} className={`h-1 flex-1 rounded-full ${item <= active ? "bg-primary" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}

function SelectIndicator({ selected }: { selected: boolean }) {
  return (
    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-primary bg-primary text-white" : "border-slate-300 text-transparent"}`}>
      <Check className="size-3.5" strokeWidth={3} />
    </span>
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
      <div dir="rtl" className="min-h-screen bg-page px-4 py-7 font-cairo text-ink sm:px-6 sm:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col">
          <header className="mb-7 flex items-center justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                <GraduationCap className="size-6" />
              </span>
              <div>
                <p className="text-xl font-black text-primary">علمني</p>
                <p className="hidden text-xs text-muted sm:block">منصة تعليمية لطلاب الثانوية</p>
              </div>
            </div>
            {step !== "welcome" && <StepProgress step={step} />}
          </header>

          <div className="flex flex-1 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <m.section
                key={step}
                data-step={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="shadow-soft w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                {step === "welcome" && (
                  <div className="p-5 sm:p-8">
                    <div className="relative mx-auto mb-7 aspect-[16/7] w-full max-w-md overflow-hidden rounded-xl bg-primary-light">
                      <Image src={studyImage} alt="طالب يخطط لمذاكرته" fill loading="eager" sizes="(max-width: 640px) calc(100vw - 3rem), 448px" className="object-cover" />
                    </div>
                    <div className="mx-auto max-w-lg text-center">
                      <h1 className="text-2xl font-black text-primary sm:text-3xl">أهلاً بيك في علمني</h1>
                      <h2 className="mt-2 text-lg font-black">خلينا نجهز تجربتك التعليمية</h2>
                      <p className="mt-2 text-sm leading-6 text-muted">جاوب على كام سؤال بسيط عشان نعرضلك المدرسين والكورسات المناسبة ليك.</p>
                    </div>
                    <div className="mx-auto my-7 max-w-lg divide-y divide-slate-200 border-y border-slate-200 text-sm font-bold text-slate-700">
                      <p className="flex items-center gap-3 py-3"><UserRoundCheck className="size-5 text-primary" />مدرسين مناسبين لمستواك</p>
                      <p className="flex items-center gap-3 py-3"><BookOpen className="size-5 text-primary" />كورسات حسب سنتك الدراسية</p>
                      <p className="flex items-center gap-3 py-3"><Target className="size-5 text-primary" />تجربة مذاكرة منظمة</p>
                    </div>
                    <div className="mx-auto flex max-w-lg flex-col gap-2">
                      <button onClick={() => goTo("grade")} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white transition hover:bg-primary-hover">ابدأ الآن<ArrowLeft className="size-4" /></button>
                      <button onClick={skip} className="h-11 cursor-pointer rounded-xl text-sm font-bold text-primary transition hover:bg-primary-light">تخطي الآن</button>
                    </div>
                  </div>
                )}

                {step === "grade" && (
                  <div className="p-5 sm:p-8">
                    <div className="mb-7 text-center">
                      <h1 className="text-2xl font-black sm:text-3xl">أنت في سنة كام؟</h1>
                      <p className="mt-2 text-sm leading-6 text-muted">اختار سنتك الدراسية عشان نعرضلك الكورسات والمدرسين المناسبين.</p>
                    </div>
                    <div className="space-y-3">
                      {grades.map((grade, index) => {
                        const selected = gradeId === grade.id;
                        const Icon = index === 0 ? GraduationCap : index === 1 ? BookOpen : Award;
                        return <button key={grade.id} aria-pressed={selected} onClick={() => { setGradeId(grade.id); setStreamId(null); setSubjectIds([]); }} className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-start transition sm:p-5 ${selected ? "border-2 border-primary bg-primary/5" : "border-slate-200 hover:border-primary"}`}>
                          <span className={`flex size-11 items-center justify-center rounded-full ${selected ? "bg-primary text-white" : "bg-primary-light text-primary"}`}><Icon className="size-5" /></span>
                          <span className="min-w-0 flex-1"><strong className="block text-base font-black">{grade.name}</strong><span className="mt-0.5 block text-xs text-muted">{grade.level}</span></span>
                          <SelectIndicator selected={selected} />
                        </button>;
                      })}
                    </div>
                    {!grades.length && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">لا توجد صفوف دراسية متاحة حالياً.</p>}
                    <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5">
                      <button onClick={() => goTo("welcome")} className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-slate-600 transition hover:text-primary"><ArrowRight className="size-4" />العودة</button>
                      <button disabled={!gradeId} onClick={() => goTo("stream")} className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-7 font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">التالي<ArrowLeft className="size-4" /></button>
                    </div>
                  </div>
                )}

                {step === "stream" && (
                  <div>
                    <div className="border-b border-slate-200 p-5 text-center sm:p-7">
                      <h1 className="text-2xl font-black">اختار شعبتك</h1>
                      <p className="mt-2 text-sm text-muted">عشان نعرضلك المواد والكورسات المناسبة ليك</p>
                    </div>
                    <div className="p-5 sm:p-8">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {streams.map((stream) => {
                          const selected = streamId === stream.id;
                          const Icon = streamIcon(stream.name);
                          return <button key={stream.id} aria-pressed={selected} onClick={() => { setStreamId(stream.id); setSubjectIds([]); }} className={`relative min-h-36 cursor-pointer rounded-xl border p-4 text-start transition ${selected ? "border-2 border-primary bg-primary/5" : "border-slate-200 hover:border-primary"}`}>
                            <div className="mb-4 flex items-center justify-between"><span className={`flex size-10 items-center justify-center rounded-full ${selected ? "bg-primary text-white" : "bg-primary-light text-primary"}`}><Icon className="size-5" /></span><SelectIndicator selected={selected} /></div>
                            <strong className="block text-base font-black">{stream.name}</strong>
                            <span className="mt-1 block text-xs leading-5 text-muted">محتوى ومدرسون مناسبون للشعبة</span>
                          </button>;
                        })}
                      </div>
                      {!streams.length && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">لا توجد شعب دراسية متاحة حالياً.</p>}
                      <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-5">
                        <button onClick={() => goTo("grade")} className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-slate-600 transition hover:text-primary"><ArrowRight className="size-4" />العودة</button>
                        <button disabled={!streamId} onClick={continueToSubjects} className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-7 font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">التالي<ArrowLeft className="size-4" /></button>
                      </div>
                    </div>
                  </div>
                )}

                {step === "subjects" && (
                  <div className="p-5 sm:p-8">
                    <div className="mb-7 text-center">
                      <h1 className="text-2xl font-black sm:text-3xl">جهزنا موادك الدراسية</h1>
                      <p className="mt-2 text-sm text-muted">بناءً على اختيارك، اخترنا لك المواد المناسبة. تقدر تعدلها الآن.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {relevantSubjects.map((subject) => {
                        const selected = subjectIds.includes(subject.id);
                        const Icon = subjectIcon(subject.name);
                        return <button key={subject.id} aria-pressed={selected} onClick={() => toggleSubject(subject.id)} className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border p-4 transition ${selected ? "border-2 border-primary bg-primary/5" : "border-slate-200 hover:border-primary"}`}>
                          {selected && <CheckCircle2 className="absolute start-2.5 top-2.5 size-5 fill-primary text-white" />}
                          <Icon className={`mb-2 size-8 ${selected ? "text-primary" : "text-muted"}`} />
                          <span className="text-sm font-black">{subject.name}</span>
                        </button>;
                      })}
                    </div>
                    {!relevantSubjects.length && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">لم نجد مواد مرتبطة بهذه الاختيارات حالياً. ارجع واختر شعبة أخرى.</p>}
                    <div className="mt-7 flex flex-col gap-2 border-t border-slate-200 pt-5">
                      <button disabled={!subjectIds.length || saving} onClick={() => void finish()} className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40">{saving ? <><LoaderCircle className="size-5 animate-spin" />جاري التجهيز...</> : <>ابدأ رحلتي<ArrowLeft className="size-4" /></>}</button>
                      <button onClick={() => goTo("stream")} className="flex h-10 cursor-pointer items-center justify-center gap-1.5 text-sm font-bold text-slate-600 transition hover:text-primary"><ArrowRight className="size-4" />العودة</button>
                    </div>
                  </div>
                )}
              </m.section>
            </AnimatePresence>
          </div>

          <footer className="mt-7 flex justify-center gap-6 text-xs text-muted"><span>الشروط</span><span>الخصوصية</span><span>المساعدة</span></footer>
        </div>
      </div>
    </MotionProvider>
  );
}
