"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, Link } from "@/src/i18n/navigation";
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, LoaderCircle, LockKeyhole, WifiOff } from "lucide-react";
import { CourseTestAttempt, CourseTestDetail, CourseTestQuestion } from "./types";
import { saveDemoAnswer, startDemoAttempt, submitDemoAttempt } from "./demo-store";

const arabicDigits = new Intl.NumberFormat("ar-EG");
const labels: Record<CourseTestQuestion["type"], string> = {
  single: "اختيار واحد", multi: "اختيار متعدد", true_false: "صح / خطأ", short_answer: "إجابة قصيرة", essay: "مقالي", ordering: "ترتيب", matching: "توصيل",
};

function formatTime(total: number) {
  const seconds = Math.max(0, total);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function cachedAttemptValues(attempt: CourseTestAttempt | null) {
  const responses = Object.fromEntries((attempt?.questions ?? []).map((question) => [question.id, question.response]));
  const flags = Object.fromEntries((attempt?.questions ?? []).map((question) => [question.id, question.flagged]));
  if (attempt && typeof window !== "undefined") {
    try {
      const pending = JSON.parse(localStorage.getItem(`course-test:${attempt.id}`) ?? "{}");
      for (const [id, value] of Object.entries(pending)) {
        responses[Number(id)] = (value as { response: unknown }).response;
        flags[Number(id)] = Boolean((value as { flagged: boolean }).flagged);
      }
    } catch { /* The saved attempt remains available if the retry cache is unreadable. */ }
  }
  return { responses, flags };
}

export function CourseTestFlow({ test, initialAttempt, initialResult }: { test: CourseTestDetail; initialAttempt: CourseTestAttempt | null; initialResult: Record<string, unknown> | null }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(initialAttempt);
  const [result, setResult] = useState(initialResult);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, unknown>>(() => cachedAttemptValues(initialAttempt).responses);
  const [flags, setFlags] = useState<Record<number, boolean>>(() => cachedAttemptValues(initialAttempt).flags);
  const [time, setTime] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "failed">("saved");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMobileNavigator, setShowMobileNavigator] = useState(false);
  const [saveRetry, setSaveRetry] = useState(0);
  const [reviewFilter, setReviewFilter] = useState("all");
  const submitLock = useRef(false);
  const questions = useMemo(() => attempt?.questions ?? [], [attempt?.questions]);
  const question = questions[current];
  const remaining = useMemo(() => questions.filter((q) => isBlank(answers[q.id])).length, [answers, questions]);
  const flaggedCount = Object.values(flags).filter(Boolean).length;
  const answeredCount = questions.length - remaining;

  const submit = useCallback(async (automatic = false) => {
    if (!attempt || submitLock.current) return;
    submitLock.current = true;
    setLoading(true);
    try {
      const score = submitDemoAttempt(attempt.id, automatic);
      setResult(score); setAttempt({ ...attempt, status: score.status ?? "submitted" }); setConfirm(false);
      localStorage.removeItem(`course-test:${attempt.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تسليم الإجابات."); }
    finally { setLoading(false); submitLock.current = false; }
  }, [attempt]);

  useEffect(() => {
    if (!attempt?.deadline_at) return;
    const offset = new Date(attempt.server_now).getTime() - Date.now();
    const deadline = new Date(attempt.deadline_at).getTime();
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - (Date.now() + offset)) / 1000));
      setTime(seconds);
      if (!seconds && attempt.status === "in_progress") void submit(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [attempt, submit]);

  useEffect(() => {
    if (!attempt || !question) return;
    const key = `course-test:${attempt.id}`;
    const next = { response: answers[question.id] ?? null, flagged: Boolean(flags[question.id]), client_version: Date.now() };
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        saveDemoAnswer(attempt.id, question.id, next.response, next.flagged);
        const pending = JSON.parse(localStorage.getItem(key) ?? "{}");
        delete pending[question.id];
        localStorage.setItem(key, JSON.stringify(pending));
        setSaveState("saved");
      } catch {
        const pending = JSON.parse(localStorage.getItem(key) ?? "{}");
        pending[question.id] = next;
        localStorage.setItem(key, JSON.stringify(pending));
        setSaveState("failed");
        setError("تعذّر حفظ إجابتك الأخيرة. أعد المحاولة، وإجابتك محفوظة على هذا الجهاز.");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [answers, attempt, flags, question, saveRetry]);

  const start = async () => {
    setLoading(true); setError("");
    try {
      const data = startDemoAttempt(test.id);
      setAttempt(data); setAnswers(Object.fromEntries(data.questions.map((q: CourseTestQuestion) => [q.id, q.response]))); setFlags({});
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر بدء الاختبار."); }
    finally { setLoading(false); }
  };

  const updateAnswer = (value: unknown) => { if (question) setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value })); };
  const toggleFlag = () => { if (question) setFlags((currentFlags) => ({ ...currentFlags, [question.id]: !currentFlags[question.id] })); };

  if (result && Array.isArray(result.questions)) {
    const entries = result.questions as { id: number; text: string; response: unknown; answer_key: Record<string, unknown>; options: { id: string; text: string }[]; points_awarded: number | null; points: number; is_correct: boolean | null; explanation: string | null; feedback: string | null }[];
    const visible = entries.filter((entry) => reviewFilter === "all" || (reviewFilter === "correct" && entry.is_correct === true) || (reviewFilter === "wrong" && entry.is_correct === false && !isBlank(entry.response)) || (reviewFilter === "blank" && isBlank(entry.response)));
    return <main dir="rtl" className="mx-auto min-h-screen max-w-6xl px-4 py-7 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Link href={`/my-courses/${test.course_id}`} className="inline-flex min-h-11 items-center gap-2 font-bold text-sky-700 dark:text-sky-300"><ArrowRight size={18} /> العودة للكورس</Link>
      <h1 className="mt-5 text-3xl font-black">مراجعة الإجابات</h1>
      <div role="tablist" aria-label="تصفية الأسئلة" className="mt-5 flex flex-wrap gap-2">{[["all", "الكل"], ["correct", "صحيحة"], ["wrong", "خاطئة"], ["blank", "بدون إجابة"]].map(([key, label]) => <button key={key} role="tab" aria-selected={reviewFilter === key} onClick={() => setReviewFilter(key)} className={`min-h-11 rounded-xl border px-4 font-bold ${reviewFilter === key ? "border-sky-700 bg-sky-50 text-sky-800 dark:bg-sky-950" : "border-slate-200 dark:border-slate-700"}`}>{label} ({entries.filter((entry) => key === "all" || (key === "correct" && entry.is_correct) || (key === "wrong" && entry.is_correct === false && !isBlank(entry.response)) || (key === "blank" && isBlank(entry.response))).length})</button>)}</div>
      <div className="mt-5 space-y-4">{visible.map((entry, index) => {
        const key = entry.answer_key;
        const correctIds = [key.option_id, ...(Array.isArray(key.option_ids) ? key.option_ids as string[] : [])].filter(Boolean);
        const selected = Array.isArray(entry.response) ? entry.response : [entry.response];
        return <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-extrabold">السؤال {index + 1}: {entry.text}</h2><span className="font-bold">{entry.points_awarded ?? "بانتظار التصحيح"} / {entry.points}</span></div><div className="mt-3 space-y-2">{entry.options.map((option) => <p key={option.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">{option.text}{selected.includes(option.id) ? " · إجابتك" : ""}{correctIds.includes(option.id) ? " · الإجابة الصحيحة" : ""}{correctIds.includes(option.id) && !selected.includes(option.id) ? " · إجابة صحيحة لم تخترها" : ""}</p>)}</div>{typeof entry.response === "string" && <p className="mt-3 rounded-xl bg-sky-50 p-3 dark:bg-sky-950/50">إجابتك: {entry.response}</p>}{entry.explanation && <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">التوضيح: {entry.explanation}</p>}{entry.feedback && <p className="mt-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">ملاحظة المدرّس: {entry.feedback}</p>}</article>;
      })}</div>
    </main>;
  }
  if (result) {
    const pending = result.status === "pending_grading";
    return <main dir="rtl" className="mx-auto min-h-screen max-w-5xl px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <Link href={`/my-courses/${test.course_id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-bold text-sky-700 hover:bg-sky-50 dark:text-sky-300"><ArrowRight size={18} /> العودة للكورس</Link>
      <section className="mx-auto mt-10 max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        {result.automatic ? <Clock3 className="mx-auto size-12 text-amber-500" /> : pending ? <Clock3 className="mx-auto size-12 text-amber-500" /> : <Check className="mx-auto size-12 text-emerald-500" />}
        <h1 className="mt-4 text-3xl font-black">{result.automatic ? "سلّمنا إجاباتك تلقائياً" : pending ? "تم التسليم · النتيجة قريباً" : "نتيجة الاختبار"}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{pending ? `أُرسلت إجاباتك للتصحيح. نقاط الأسئلة الموضوعية: ${result.score_auto ?? 0}.` : result.percent == null ? "تم استلام إجاباتك." : `${result.percent}% · ${result.score_total} من ${result.max_score} درجة`}</p>
        {result.percent != null && <p className="mt-2 text-lg font-extrabold">{result.passed ? "ناجح" : "لم تجتز الاختبار"}</p>}
        {attempt && <button onClick={() => router.push(`/my-courses/${test.course_id}/tests/${test.id}?attemptId=${attempt.id}&review=true`)} className="mt-6 min-h-12 rounded-xl border border-slate-300 px-5 font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">مراجعة الإجابات</button>}
      </section>
    </main>;
  }

  if (!attempt) {
    const locked = test.student_test_state === "locked";
    const scheduled = test.student_test_state === "scheduled";
    const closed = test.student_test_state === "closed";
    const retry = test.open_attempt_id !== null;
    const startDisabled = locked || scheduled || closed || test.student_test_state === "attempts_exhausted" || test.student_test_state === "passed" || loading;
    return <main dir="rtl" className="mx-auto min-h-screen max-w-5xl px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <Link href={`/my-courses/${test.course_id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-bold text-sky-700 hover:bg-sky-50 dark:text-sky-300"><ArrowRight size={18} /> العودة لمحتوى الكورس</Link>
      <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <p className="text-sm font-bold text-sky-700 dark:text-sky-300">اختبار · {arabicDigits.format(test.question_count)} أسئلة</p>
        <h1 className="mt-2 text-3xl font-black">{test.title}</h1>
        {test.description && <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{test.description}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["الأسئلة", test.question_count], ["المدة", test.time_limit_minutes ? `${test.time_limit_minutes} دقيقة` : "بلا حد"], ["نسبة النجاح", `${test.pass_percent}%`], ["المحاولات", test.max_attempts ?? "غير محدودة"]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-black tabular-nums">{value}</p></div>)}</div>
        {locked && <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40"><h2 className="flex items-center gap-2 font-extrabold"><LockKeyhole size={18} /> أكمل المتطلبات لفتح الاختبار</h2><ul className="mt-3 space-y-2">{test.unmet_prerequisites.map((item) => <li key={`${item.type}-${item.id}`}><Link className="underline" href={`/my-courses/${test.course_id}#item-${item.id}`}>اذهب إلى: {item.title}</Link></li>)}</ul></div>}
        {(scheduled || closed) && <p className="mt-6 rounded-xl bg-slate-100 p-4 font-bold dark:bg-slate-800">{scheduled ? `يُفتح ${test.opens_at ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "full", timeStyle: "short" }).format(new Date(test.opens_at)) : "قريباً"}` : "الاختبار مغلق"}</p>}
        <h2 className="mt-7 font-extrabold">قبل أن تبدأ</h2><ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-slate-600 dark:text-slate-300"><li>تأكد من اتصالك بالإنترنت قبل البدء.</li>{test.time_limit_minutes && <li>يبدأ احتساب الوقت فور الضغط على ابدأ.</li>}<li>تُحتسب {test.grading_policy === "highest" ? "أعلى" : test.grading_policy === "last" ? "آخر" : "متوسط"} درجة من محاولاتك.</li></ul>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
        <button disabled={startDisabled} onClick={start} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-6 font-extrabold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" /> : retry ? "استئناف الاختبار" : test.student_test_state === "attempts_exhausted" ? "استنفدت المحاولات" : "ابدأ الاختبار"}</button>
        <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800"><h2 className="font-extrabold">محاولاتك السابقة</h2>{test.attempts.length ? <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{test.attempts.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>المحاولة {item.number} · {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(item.started_at))}</span><span>{item.status === "pending_grading" ? "قيد التصحيح" : item.percent == null ? "قيد الحل" : `${item.percent}%`}</span>{item.status !== "in_progress" && <Link href={`/my-courses/${test.course_id}/tests/${test.id}/review?attemptId=${item.id}&review=true`} className="font-bold text-sky-700 underline dark:text-sky-300">مراجعة</Link>}</div>)}</div> : <p className="mt-2 text-sm text-slate-500">لا توجد محاولات سابقة.</p>}</div>
      </section>
    </main>;
  }

  if (!question) return <main dir="rtl" className="p-8">لا توجد أسئلة في هذه المحاولة.</main>;
  const lowTime = Boolean(test.time_limit_minutes && time < 120);
  const setMulti = (optionId: string) => {
    const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
    updateAnswer(selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId]);
  };
  return <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4"><div className="min-w-0"><p className="truncate font-extrabold">{test.title}</p><p className="text-xs text-slate-500">السؤال {current + 1} من {questions.length}</p></div>{test.time_limit_minutes ? <div role="timer" aria-live="off" className={`rounded-xl px-3 py-2 font-mono text-lg font-black tabular-nums ${lowTime ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-slate-100 dark:bg-slate-800"}`}><Clock3 className="me-1 inline size-4" />{formatTime(time)}</div> : <span className="text-sm font-bold text-slate-500">بلا حد زمني</span>}<Link href={`/my-courses/${test.course_id}`} className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-bold text-sky-700 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-600 dark:text-sky-300 sm:inline-flex">حفظ وخروج</Link></div></header>
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:py-8">
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {lowTime && <p className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">تبقّى أقل من دقيقتين — ستُسلَّم إجاباتك تلقائياً عند انتهاء الوقت.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm font-bold text-slate-500">{labels[question.type]} · {question.points} درجات</span><button onClick={toggleFlag} aria-pressed={Boolean(flags[question.id])} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-amber-50 dark:border-slate-700"><Flag size={16} />{flags[question.id] ? "مُعلَّم للمراجعة" : "علّم للمراجعة"}</button></div>
        <h1 className="mt-6 text-xl font-black leading-9 sm:text-2xl">{question.text}</h1>
        {question.code_snippet && <pre dir="ltr" className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-start font-mono text-sm text-slate-100"><code>{question.code_snippet}</code></pre>}
        {question.image_url && <img src={question.image_url} alt="صورة السؤال" className="mt-4 max-h-72 rounded-xl object-contain" />}
        {question.type === "single" || question.type === "true_false" || question.type === "multi" ? <fieldset className="mt-6 space-y-3"><legend className="mb-3 text-sm text-slate-500">{question.type === "multi" ? "اختر كل الإجابات الصحيحة" : question.type === "true_false" ? "حدّد: صح أم خطأ؟" : "اختر إجابة واحدة"}</legend>{question.options.map((option, index) => {const selected = question.type === "multi" ? Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option.id) : answers[question.id] === option.id; return <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-4 font-semibold transition ${selected ? "border-sky-700 bg-sky-50 dark:border-sky-400 dark:bg-sky-950/40" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}><input type={question.type === "multi" ? "checkbox" : "radio"} name={`q-${question.id}`} checked={Boolean(selected)} onChange={() => question.type === "multi" ? setMulti(option.id) : updateAnswer(option.id)} className="size-5 accent-sky-700" /><span className="grid size-8 place-items-center rounded-full bg-slate-100 text-sm font-black dark:bg-slate-800">{question.type === "true_false" ? "✓" : ["أ", "ب", "ج", "د"][index] ?? index + 1}</span><span>{option.text}</span></label>;})}</fieldset> : null}
        {question.type === "short_answer" && <label className="mt-6 block"><span className="text-sm font-bold">اكتب إجابتك</span><input value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={(e) => updateAnswer(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-950" /></label>}
        {question.type === "essay" && <label className="mt-6 block"><span className="text-sm font-bold">اكتب إجابتك</span><textarea value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={(e) => updateAnswer(e.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 leading-7 dark:border-slate-700 dark:bg-slate-950" /><span className="mt-2 block text-end text-xs text-slate-500">{String(answers[question.id] ?? "").trim().split(/\s+/).filter(Boolean).length} كلمة</span></label>}
        {question.type === "ordering" && <ol className="mt-6 space-y-2">{(Array.isArray(answers[question.id]) ? answers[question.id] as string[] : question.options.map((o) => o.id)).map((id, index, list) => {const option = question.options.find((o) => o.id === id);return <li key={id} className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700"><span>{index + 1}. {option?.text}</span><span className="flex gap-2"><button aria-label="تحريك لأعلى" disabled={!index} onClick={() => updateAnswer(list.map((v, i) => i === index ? list[index - 1] : i === index - 1 ? list[index] : v))} className="size-10 rounded-lg border disabled:opacity-40">↑</button><button aria-label="تحريك لأسفل" disabled={index === list.length - 1} onClick={() => updateAnswer(list.map((v, i) => i === index ? list[index + 1] : i === index + 1 ? list[index] : v))} className="size-10 rounded-lg border disabled:opacity-40">↓</button></span></li>;})}</ol>}
        {question.type === "matching" && <div className="mt-6 space-y-3">{question.options.map((option) => <label key={option.id} className="grid gap-2 sm:grid-cols-2 sm:items-center"><span>{option.text}</span><select value={(answers[question.id] as Record<string, string> | undefined)?.[option.id] ?? ""} onChange={(e) => updateAnswer({ ...(answers[question.id] as Record<string, string> ?? {}), [option.id]: e.target.value })} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"><option value="">اختر الإجابة</option>{(question as CourseTestQuestion & { right_options?: { id: string; text: string }[] }).right_options?.map((right) => <option key={right.id} value={right.id}>{right.text}</option>)}</select></label>)}</div>}
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800"><span className="text-xs text-slate-500" role="status">{saveState === "saving" ? "جارٍ الحفظ…" : saveState === "failed" ? <button onClick={() => setSaveRetry((value) => value + 1)} className="text-red-700 underline"><WifiOff className="me-1 inline size-4" />تعذّر الحفظ · أعد المحاولة</button> : "تم الحفظ تلقائياً"}</span><div className="flex gap-2"><button disabled={!current || !test.allow_back_navigation} onClick={() => setCurrent((n) => n - 1)} className="min-h-11 rounded-xl border px-4 font-bold disabled:opacity-40">السابق</button><button disabled={current === questions.length - 1} onClick={() => setCurrent((n) => n + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-700 px-4 font-bold text-white disabled:opacity-40">التالي <ArrowLeft size={16} /></button></div></div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
      </section>
      <aside className="hidden h-fit rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:block"><div className="flex justify-between font-bold"><span>خريطة الأسئلة</span><span>{answeredCount}/{questions.length}</span></div><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((q, index) => <button key={q.id} disabled={!test.allow_back_navigation && index < current} onClick={() => setCurrent(index)} aria-label={`السؤال ${index + 1}${flags[q.id] ? " معلّم للمراجعة" : ""}`} className={`relative min-h-11 rounded-lg border font-bold disabled:opacity-40 ${index === current ? "border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white" : isBlank(answers[q.id]) ? "border-slate-300 dark:border-slate-700" : "border-sky-700 bg-sky-700 text-white"}`}>{index + 1}{flags[q.id] && <Flag className="absolute -top-1 -end-1 size-3 fill-amber-500 text-amber-600" />}</button>)}</div><div className="mt-5 space-y-2 text-xs text-slate-500"><p>تمت الإجابة</p><p>بدون إجابة</p><p>معلّم للمراجعة</p></div><button onClick={() => setConfirm(true)} className="mt-6 min-h-12 w-full rounded-xl bg-slate-900 px-3 font-extrabold text-white dark:bg-slate-100 dark:text-slate-900">مراجعة وتسليم</button></aside>
    </div>
    <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden"><span className="text-sm font-bold tabular-nums">{answeredCount} / {questions.length} تمت الإجابة</span><div className="flex gap-2"><button onClick={() => setShowMobileNavigator(true)} className="min-h-11 rounded-xl border px-3 font-bold">الأسئلة</button><button disabled={current === questions.length - 1} onClick={() => setCurrent((n) => n + 1)} className="min-h-11 rounded-xl border px-3 font-bold disabled:opacity-40">التالي</button><button onClick={() => setConfirm(true)} className="min-h-11 rounded-xl bg-slate-900 px-4 font-bold text-white dark:bg-slate-100 dark:text-slate-900">مراجعة</button></div></div>
    {showMobileNavigator && <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setShowMobileNavigator(false)}><section role="dialog" aria-modal="true" aria-label="خريطة الأسئلة" onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="font-black">خريطة الأسئلة</h2><button onClick={() => setShowMobileNavigator(false)} className="min-h-11 px-3 font-bold">إغلاق</button></div><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((q, index) => <button key={q.id} onClick={() => { setCurrent(index); setShowMobileNavigator(false); }} className={`min-h-11 rounded-lg border font-bold ${index === current ? "border-slate-900 ring-2" : isBlank(answers[q.id]) ? "border-slate-300" : "border-sky-700 bg-sky-700 text-white"}`}>{index + 1}</button>)}</div></section></div>}
    {confirm && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-slate-900"><h2 id="submit-title" className="text-2xl font-black">مراجعة وتسليم</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><p className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-800">أُجيب: {answeredCount}</p><p className="rounded-xl bg-amber-50 p-3 font-bold text-amber-800">بدون إجابة: {remaining}</p><p className="rounded-xl bg-orange-50 p-3 font-bold text-orange-800">للمراجعة: {flaggedCount}</p></div><p className="mt-4 text-sm text-slate-600 dark:text-slate-300">الوقت المتبقي {test.time_limit_minutes ? formatTime(time) : "بلا حد"}. بعد التسليم لن تتمكن من تعديل الإجابات.</p>{(remaining > 0 || flaggedCount > 0) && <div className="mt-3 flex flex-wrap gap-2">{questions.map((q, index) => (isBlank(answers[q.id]) || flags[q.id]) && <button key={q.id} onClick={() => { setCurrent(index); setConfirm(false); }} className="min-h-10 rounded-lg border px-3 text-sm font-bold">السؤال {index + 1}{isBlank(answers[q.id]) ? " · بدون إجابة" : " · للمراجعة"}</button>)}</div>}<div className="mt-6 flex gap-3"><button onClick={() => setConfirm(false)} className="min-h-12 flex-1 rounded-xl border font-bold">العودة للأسئلة</button><button disabled={loading} onClick={() => void submit()} className="min-h-12 flex-1 rounded-xl bg-sky-700 font-bold text-white">{loading ? "جارٍ التسليم…" : "تسليم الإجابات"}</button></div></section></div>}
  </main>;
}

function isBlank(value: unknown) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);
}
