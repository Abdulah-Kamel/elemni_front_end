import type { CourseTestAttempt, CourseTestDetail, CourseTestQuestion } from "./types";
import type { CourseTestsProgressDto } from "@/src/lib/student-api/contract";

type DemoQuestion = Omit<CourseTestQuestion, never> & {
  answer_key: Record<string, unknown>;
  explanation: string;
  right_options?: { id: string; text: string }[];
  word_limit?: number;
};
type StoredAttempt = Omit<CourseTestAttempt, "questions"> & { questions: DemoQuestion[]; test_id: number; started_at: string; submitted_at?: string | null; score_auto?: number; score_total?: number | null; max_score: number; percent?: number | null; passed?: boolean | null; auto_submitted?: boolean };
type DemoState = { attempts: StoredAttempt[]; next_id: number };
const STORAGE_KEY = "elemni-course-test-demo-v1";
const CHANGE_EVENT = "elemni:student-course-test-demo-changed";
const pythonOptions = [{ id: "a", text: "2" }, { id: "b", text: "12" }, { id: "c", text: "خطأ" }, { id: "d", text: "لا يظهر شيء" }];

const demoQuestions: DemoQuestion[] = [
  { id: 9001, type: "single", text: "ما ناتج تنفيذ print(2 + 3)؟", points: 2, options: [{ id: "a", text: "5" }, { id: "b", text: "23" }, { id: "c", text: "خطأ" }, { id: "d", text: "لا يظهر شيء" }], answer_key: { option_id: "a" }, explanation: "يجمع بايثون العددين قبل طباعة الناتج.", response: null, flagged: false, code_snippet: "print(2 + 3)" },
  { id: 9002, type: "multi", text: "أي الأسماء التالية صالحة كمتغير في Python؟", points: 2, options: [{ id: "a", text: "student_name" }, { id: "b", text: "2name" }, { id: "c", text: "total2" }, { id: "d", text: "class" }], answer_key: { option_ids: ["a", "c"] }, explanation: "يبدأ اسم المتغير بحرف أو شرطة سفلية ولا يكون كلمة محجوزة.", response: null, flagged: false },
  { id: 9003, type: "true_false", text: "تبدأ فهرسة القوائم في Python من الصفر.", points: 1, options: [{ id: "true", text: "صح" }, { id: "false", text: "خطأ" }], answer_key: { option_id: "true" }, explanation: "أول عنصر في القائمة له الفهرس 0.", response: null, flagged: false },
  { id: 9004, type: "short_answer", text: "ما الكلمة المستخدمة لتعريف دالة في Python؟", points: 2, options: [], answer_key: { accepted: ["def"] }, explanation: "تبدأ الدالة بالكلمة def.", response: null, flagged: false, code_snippet: "___ greet():" },
  { id: 9005, type: "essay", text: "اشرح الفرق بين القائمة tuple والقائمة list باختصار.", points: 4, options: [], answer_key: { model_answer: "القائمة list قابلة للتعديل، أما tuple فلا يمكن تعديل عناصرها بعد إنشائها.", rubric: [{ criterion: "ذكر قابلية list للتعديل", points: 2 }, { criterion: "ذكر ثبات tuple", points: 2 }] }, explanation: "قارن قابلية تعديل كل بنية.", response: null, flagged: false, word_limit: 80 },
  { id: 9006, type: "ordering", text: "رتّب خطوات تشغيل ملف Python.", points: 2, options: [{ id: "a", text: "كتابة الكود" }, { id: "b", text: "حفظ الملف بامتداد py." }, { id: "c", text: "تشغيل الملف" }], answer_key: { option_ids: ["a", "b", "c"] }, explanation: "اكتب ثم احفظ ثم شغّل.", response: null, flagged: false },
  { id: 9007, type: "matching", text: "صِل الأمر بوظيفته.", points: 2, options: [{ id: "a", text: "print" }, { id: "b", text: "input" }], right_options: [{ id: "x", text: "عرض قيمة" }, { id: "y", text: "قراءة قيمة" }], answer_key: { matches: { a: "x", b: "y" } }, explanation: "print للعرض وinput للإدخال.", response: null, flagged: false },
  { id: 9008, type: "single", text: "أي دالة تحسب طول القائمة؟", points: 2, options: pythonOptions, answer_key: { option_id: "a" }, explanation: "الدالة len تعيد عدد العناصر.", response: null, flagged: false, code_snippet: "len([4, 7])" },
];

function readState(): DemoState {
  if (typeof window === "undefined") return { attempts: [], next_id: 1 };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as DemoState | null;
    return parsed && Array.isArray(parsed.attempts) ? parsed : { attempts: [], next_id: 1 };
  } catch { return { attempts: [], next_id: 1 }; }
}

function writeState(state: DemoState) {
  if (typeof window !== "undefined") { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); window.dispatchEvent(new Event(CHANGE_EVENT)); }
}

function withState<T>(change: (state: DemoState) => T): T {
  const state = readState();
  const result = change(state);
  writeState(state);
  return result;
}

export function resetDemoState() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

export function subscribeDemoState(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(CHANGE_EVENT, onChange); window.removeEventListener("storage", onChange); };
}

export function getDemoPageSnapshot(courseId: number, testId: number, attemptId: number | null, review: boolean) {
  const detail = getDemoTest(courseId, testId);
  const selectedAttemptId = attemptId ?? detail.open_attempt_id ?? detail.attempts.at(-1)?.id ?? null;
  const selectedAttempt = selectedAttemptId ? getDemoAttempt(selectedAttemptId) : null;
  const result = selectedAttemptId ? (review ? getDemoReview(selectedAttemptId) : getDemoResult(selectedAttemptId)) : null;
  return JSON.stringify({ test: detail, attempt: selectedAttempt, result });
}

export function getDemoTest(courseId: number, testId: number): CourseTestDetail {
  const attempts = readState().attempts.filter((attempt) => attempt.test_id === testId).sort((a, b) => a.number - b.number);
  const open = attempts.find((attempt) => attempt.status === "in_progress");
  const graded = attempts.filter((attempt) => attempt.status === "graded");
  const best = graded.reduce<number | null>((score, attempt) => score === null ? attempt.percent ?? null : Math.max(score, attempt.percent ?? 0), null);
  const scheduled = testId === 503;
  return {
    id: testId, course_id: courseId, title: testId === 502 ? "الاختبار النهائي" : testId === 503 ? "اختبار المراجعة المجدول" : "اختبار الدرس الأول",
    description: "اختبر فهمك لأساسيات Python. يمكنك حفظ تقدمك والعودة لإكمال المحاولة.", time_limit_minutes: 15,
    allow_back_navigation: true, max_attempts: 3, pass_percent: 70, grading_policy: "highest", cooldown_minutes: 0,
    student_test_state: open ? "in_progress" : scheduled ? "scheduled" : attempts.some((attempt) => attempt.status === "pending_grading") ? "pending_grading" : best !== null && best >= 70 ? "passed" : attempts.length >= 3 ? "attempts_exhausted" : attempts.length ? "failed" : testId === 502 ? "locked" : "not_started",
    question_count: demoQuestions.length, opens_at: scheduled ? "2026-09-27T08:00:00.000Z" : null, closes_at: null,
    unmet_prerequisites: testId === 502 ? [{ type: "test", id: 501, title: "اختبار الدرس الأول" }] : [],
    attempts: attempts.map(({ id, number, status, started_at, submitted_at, percent }) => ({ id, number, status, started_at: started_at ?? new Date().toISOString(), submitted_at: submitted_at ?? null, percent: percent ?? null })), open_attempt_id: open?.id ?? null,
  };
}

export function getDemoSidebarData(courseId: number, contentTotal = 0, contentCompleted = 0): CourseTestsProgressDto {
  const demos = [501, 502, 503].map((id) => getDemoTest(courseId, id));
  const items = demos.map((test) => {
    const open = test.open_attempt_id ? readState().attempts.find((attempt) => attempt.id === test.open_attempt_id) : null;
    const latest = test.attempts[test.attempts.length - 1];
    let subtitle = test.student_test_state === "in_progress" && open
      ? `${open.questions.filter((question) => question.response !== null).length}/${open.questions.length} · قيد الحل`
      : test.student_test_state === "passed" ? `ناجح · أعلى درجة من ${test.attempts.length} محاولات`
        : test.student_test_state === "pending_grading" ? "تم التسليم · النتيجة قريباً"
          : test.student_test_state === "locked" ? "اجتز الاختبار السابق لفتحه"
            : test.student_test_state === "scheduled" ? "قريباً"
              : test.student_test_state === "failed" ? "لم تجتزه · يمكنك المحاولة مجدداً"
                : test.student_test_state === "attempts_exhausted" ? "استنفدت المحاولات · تواصل مع المدرّس"
                  : test.student_test_state === "in_progress" ? "قيد الحل" : "اختبار · 8 أسئلة · 15 دقيقة";
    if (test.student_test_state === "failed" && latest?.percent != null) subtitle += ` · ${latest.percent}%`;
    return { id: test.id, title: test.title, lesson_id: null, position: test.id, placement: "standalone_item" as const, parent_item_id: null, question_count: test.question_count, time_limit_minutes: test.time_limit_minutes, state: test.student_test_state, subtitle, percent: latest?.percent ?? null, attempt_count: test.attempts.length, open_attempt_id: test.open_attempt_id };
  });
  const completed = contentCompleted + items.filter((item) => item.state === "passed").length;
  const total = contentTotal + items.length;
  return { items, completion_percent: total ? Math.round(completed * 100 / total) : 0, completed_count: completed, total_count: total };
}

export function startDemoAttempt(testId: number): CourseTestAttempt {
  return withState((state) => {
    const number = state.attempts.filter((attempt) => attempt.test_id === testId).length + 1;
    const now = new Date();
    const id = state.next_id++;
    const full: StoredAttempt = { id, test_id: testId, number, status: "in_progress", started_at: now.toISOString(), submitted_at: null, deadline_at: new Date(now.getTime() + 15 * 60000).toISOString(), server_now: now.toISOString(), questions: demoQuestions.map((question) => ({ ...question, options: question.options.map((option) => ({ ...option })), response: null, flagged: false })), max_score: demoQuestions.reduce((sum, question) => sum + question.points, 0) };
    state.attempts.push(full);
    return safeAttempt(full);
  });
}

function safeAttempt(attempt: StoredAttempt): CourseTestAttempt {
  return { id: attempt.id, test_id: attempt.test_id, number: attempt.number, status: attempt.status, deadline_at: attempt.deadline_at, server_now: attempt.server_now, questions: attempt.questions.map((question) => ({ id: question.id, type: question.type, text: question.text, code_snippet: question.code_snippet, image_url: question.image_url, points: question.points, options: question.options, response: question.response, flagged: question.flagged })) };
}

export function getDemoAttempt(id: number): CourseTestAttempt | null {
  const attempt = readState().attempts.find((item) => item.id === id);
  return attempt ? safeAttempt(attempt) : null;
}

export function saveDemoAnswer(attemptId: number, questionId: number, response: unknown, flagged: boolean) {
  withState((state) => {
    const attempt = state.attempts.find((item) => item.id === attemptId && item.status === "in_progress");
    const question = attempt?.questions.find((item) => item.id === questionId);
    if (question) { question.response = response; question.flagged = flagged; }
  });
}

export function submitDemoAttempt(id: number, automatic = false) {
  return withState((state) => {
    const attempt = state.attempts.find((item) => item.id === id);
    if (!attempt) throw new Error("المحاولة غير موجودة.");
    if (attempt.status !== "in_progress") return resultFor(attempt);
    let score = 0;
    let pending = false;
    for (const question of attempt.questions) {
      if (question.type === "essay") { pending = true; continue; }
      if (isCorrect(question)) score += question.points;
    }
    attempt.score_auto = score;
    attempt.score_total = pending ? null : score;
    attempt.percent = pending ? null : Math.round(score / attempt.max_score * 100);
    attempt.passed = pending ? null : (attempt.percent ?? 0) >= 70;
    attempt.status = pending ? "pending_grading" : "graded";
    attempt.submitted_at = new Date().toISOString();
    attempt.auto_submitted = automatic;
    return resultFor(attempt);
  });
}

function isCorrect(question: DemoQuestion) {
  const expected = question.answer_key;
  if (question.type === "single" || question.type === "true_false") return question.response === expected.option_id;
  if (question.type === "multi") return Array.isArray(question.response) && sameSet(question.response as string[], expected.option_ids as string[]);
  if (question.type === "short_answer") return (expected.accepted as string[]).some((value) => normalize(value) === normalize(String(question.response ?? "")));
  if (question.type === "ordering") return Array.isArray(question.response) && JSON.stringify(question.response) === JSON.stringify(expected.option_ids);
  if (question.type === "matching") return JSON.stringify(question.response ?? {}) === JSON.stringify(expected.matches);
  return false;
}

function sameSet(a: string[], b: string[]) { return a.length === b.length && a.every((value) => b.includes(value)); }
function normalize(value: string) { return value.trim().toLocaleLowerCase("ar").replace(/\s+/g, " ").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))); }

function resultFor(attempt: StoredAttempt) {
  return { id: attempt.id, status: attempt.status, submitted_at: attempt.submitted_at, score_auto: attempt.score_auto ?? 0, score_total: attempt.score_total ?? null, max_score: attempt.max_score, percent: attempt.percent ?? null, passed: attempt.passed ?? null, auto_submitted: attempt.auto_submitted ?? false };
}

export function getDemoResult(id: number) {
  const attempt = readState().attempts.find((item) => item.id === id);
  return attempt ? resultFor(attempt) : null;
}

export function getDemoReview(id: number) {
  const attempt = readState().attempts.find((item) => item.id === id);
  if (!attempt || attempt.status === "in_progress") return null;
  return { id, status: attempt.status, questions: attempt.questions.map((question) => ({ id: question.id, type: question.type, text: question.text, options: question.options, response: question.response, is_correct: question.type === "essay" ? null : isCorrect(question), points_awarded: question.type === "essay" ? null : isCorrect(question) ? question.points : 0, points: question.points, answer_key: question.answer_key, explanation: question.explanation, feedback: question.type === "essay" ? "بانتظار تصحيح المدرّس." : null, flagged: question.flagged })) };
}
