// Development-only stand-in for the course-test API, persisted in localStorage.
// Loaded only when NEXT_PUBLIC_COURSE_TESTS_DEMO=1 (see client.ts). It enforces
// the same rules the backend will, so the UI can be exercised end to end.
import { CourseTestsApiError, type CourseTestsClient } from "./client";
import { aggregatePercent, isBlankResponse, percentOf, scoreQuestion, type AnswerKey } from "./scoring";
import type {
  AnswerResponse,
  Attempt,
  AttemptResult,
  AttemptReview,
  AttemptStatus,
  CourseItemRef,
  CourseTestDetail,
  CourseTestsProgress,
  GradingPolicy,
  Option,
  QuestionType,
  ReviewQuestion,
  SidebarTestItem,
  StudentTestState,
} from "./types";

type DemoQuestion = {
  id: number;
  type: QuestionType;
  text: string;
  code_snippet?: string | null;
  image_url?: string | null;
  points: number;
  options: Option[];
  right_options?: Option[];
  word_limit?: number | null;
  key: AnswerKey;
  explanation: string;
  topic?: CourseItemRef;
};

type DemoTest = {
  id: number;
  title: string;
  description: string;
  lesson_title: string;
  placement: "standalone_item" | "inside_item";
  position: number;
  item_index: number;
  item_count: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  pass_percent: number;
  grading_policy: GradingPolicy;
  cooldown_minutes: number;
  allow_back_navigation: boolean;
  shuffle_questions: boolean;
  prerequisite_test_id: number | null;
  opens_in_hours: number | null;
  next_item: CourseItemRef | null;
  questions: DemoQuestion[];
};

type StoredAnswer = { response: AnswerResponse; flagged: boolean; client_version: number; points: number | null; feedback: string | null };
type StoredAttempt = {
  id: number;
  test_id: number;
  number: number;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string | null;
  submitted_at: string | null;
  auto_submitted: boolean;
  order: number[];
  answers: Record<number, StoredAnswer>;
};
type DemoState = { attempts: StoredAttempt[]; next_id: number; created_at: string };

const STORAGE_KEY = "elemni-course-test-demo-v2";
const GRACE_MS = 5_000;
const DEMO_ESSAY_GRADING_MS = 60_000;

const L = ["a", "b", "c", "d"];
const opts = (...texts: string[]): Option[] => texts.map((text, index) => ({ id: L[index], text }));
const tf = opts("صح", "خطأ");
const topicVariables: CourseItemRef = { id: 9101, title: "المتغيرات وأنواع البيانات", kind: "video" };
const topicOperators: CourseItemRef = { id: 9102, title: "العمليات الحسابية", kind: "file" };
const topicControl: CourseItemRef = { id: 9103, title: "الشروط والحلقات", kind: "video" };

// The ten questions from design/Question.dc.html.
const lessonOneQuestions: DemoQuestion[] = [
  { id: 5011, type: "single", text: "أي مما يلي اسم متغير صحيح في بايثون؟", points: 2, options: opts("2total", "total_2", "total-2", "class"), key: { option_id: "b" }, explanation: "يبدأ اسم المتغير بحرف أو شرطة سفلية، ولا يحتوي على «-»، ولا يكون كلمة محجوزة مثل class.", topic: topicVariables },
  { id: 5012, type: "single", text: "ما ناتج تنفيذ الكود التالي؟", code_snippet: "x = 7\ny = 2\nprint(x // y, x % y)", points: 2, options: opts("3 1", "3.5 1", "3 2", "1 3"), key: { option_id: "a" }, explanation: "العامل // يعطي ناتج القسمة الصحيحة (3)، و% يعطي باقي القسمة (1).", topic: topicOperators },
  { id: 5013, type: "true_false", text: "القوائم (list) في بايثون قابلة للتعديل بعد إنشائها.", points: 2, options: tf, key: { option_id: "a" }, explanation: "القائمة بنية قابلة للتعديل، على عكس tuple.", topic: topicVariables },
  { id: 5014, type: "multi", text: "اختر جميع أنواع البيانات الرقمية في بايثون.", points: 2, options: opts("int", "float", "str", "complex"), key: { option_ids: ["a", "b", "d"] }, explanation: "النوع complex نوع رقمي أيضاً ويمثّل الأعداد المركّبة مثل 3+4j. أما str فهو نص حتى لو احتوى على أرقام.", topic: topicVariables },
  { id: 5015, type: "single", text: "ما نوع القيمة التي تُرجعها الدالة input()؟", points: 2, options: opts("int", "str", "float", "bool"), key: { option_id: "b" }, explanation: "الدالة input() تُرجع دائماً نصاً (str)، ويجب تحويله إن احتجت رقماً.", topic: topicVariables },
  { id: 5016, type: "single", text: "ماذا يطبع الكود التالي؟", code_snippet: "nums = [4, 8, 15]\nprint(len(nums))", points: 2, options: opts("2", "3", "15", "27"), key: { option_id: "b" }, explanation: "الدالة len تُرجع عدد العناصر في القائمة، وهو 3.", topic: topicVariables },
  { id: 5017, type: "true_false", text: "الكلمة elif تُستخدم لإضافة شرط بديل داخل جملة if.", points: 2, options: tf, key: { option_id: "a" }, explanation: "elif اختصار لـ else if وتضيف شرطاً بديلاً.", topic: topicControl },
  { id: 5018, type: "single", text: "أي رمز يُستخدم لكتابة تعليق من سطر واحد؟", points: 2, options: opts("//", "#", "--", "/* */"), key: { option_id: "b" }, explanation: "يبدأ التعليق في بايثون بالرمز #.", topic: topicVariables },
  { id: 5019, type: "multi", text: "أي مما يلي يُعد حلقة تكرار في بايثون؟", points: 2, options: opts("for", "while", "loop", "repeat"), key: { option_ids: ["a", "b"] }, explanation: "بايثون فيها حلقتا for وwhile فقط.", topic: topicControl },
  { id: 5020, type: "single", text: "ما قيمة المتغير result؟", code_snippet: "result = 10 if 3 > 5 else 20", points: 2, options: opts("10", "20", "True", "None"), key: { option_id: "b" }, explanation: "الشرط 3 > 5 خاطئ، لذلك تُؤخذ القيمة بعد else وهي 20.", topic: topicControl },
];

// One of every question type (design/Question-Types.dc.html).
const finalQuestions: DemoQuestion[] = [
  { id: 5021, type: "true_false", text: "الدالة print() تُرجع القيمة التي تطبعها.", points: 1, options: tf, key: { option_id: "b" }, explanation: "print() تطبع فقط وتُرجع None.", topic: topicVariables },
  { id: 5022, type: "single", text: "ما ناتج تشغيل الكود الظاهر في الصورة؟", image_url: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="560" height="160"><rect width="560" height="160" rx="16" fill="#0F172A"/><text x="28" y="70" font-family="monospace" font-size="24" fill="#E2E8F0">for i in range(3):</text><text x="68" y="112" font-family="monospace" font-size="24" fill="#7DD3FC">print(i * 2)</text></svg>'), points: 2, options: opts("0 2 4", "2 4 6", "0 1 2", "1 2 3"), key: { option_id: "a" }, explanation: "range(3) يعطي 0 و1 و2، وكل منها يُضرب في 2.", topic: topicControl },
  { id: 5023, type: "short_answer", text: "ما الكلمة المحجوزة المستخدمة لتعريف دالة في بايثون؟", code_snippet: "___ greet(name):\n    print(name)", points: 2, options: [], key: { accepted: ["def"] }, explanation: "تبدأ الدالة بالكلمة def.", topic: topicControl },
  { id: 5024, type: "essay", text: "اشرح الفرق بين القائمة list والصف tuple في بايثون، مع مثال لكل منهما.", points: 4, options: [], word_limit: 150, key: { model_answer: "list قابلة للتعديل وتُكتب بين [ ]، أما tuple فثابتة بعد إنشائها وتُكتب بين ( ).", rubric: [{ criterion: "ذكر قابلية list للتعديل", points: 2 }, { criterion: "ذكر ثبات tuple مع مثال", points: 2 }] }, explanation: "الفرق الأساسي هو قابلية التعديل.", topic: topicVariables },
  { id: 5025, type: "ordering", text: "رتّب خطوات تشغيل برنامج بايثون من الأول إلى الأخير.", points: 2, options: opts("كتابة الكود في محرر", "حفظ الملف بامتداد ‎.py", "فتح الطرفية", "تشغيل python main.py"), key: { option_ids: ["a", "b", "c", "d"] }, explanation: "نكتب الكود ثم نحفظه ثم نشغّله من الطرفية.", topic: topicControl },
  { id: 5026, type: "matching", text: "صِل كل دالة بوظيفتها.", points: 2, options: opts("print()", "input()", "len()"), right_options: [{ id: "x", text: "عرض قيمة على الشاشة" }, { id: "y", text: "قراءة إدخال من المستخدم" }, { id: "z", text: "حساب عدد العناصر" }], key: { matches: { a: "x", b: "y", c: "z" } }, explanation: "print للعرض، input للإدخال، len للطول.", topic: topicVariables },
  { id: 5027, type: "multi", text: "أي مما يلي أنواع بيانات مدمجة في بايثون؟", points: 2, options: opts("dict", "set", "array", "tuple"), key: { option_ids: ["a", "b", "d"] }, explanation: "array ليست نوعاً مدمجاً بل وحدة منفصلة.", topic: topicVariables },
];

const quickQuestions: DemoQuestion[] = [
  { id: 5031, type: "true_false", text: "يمكن تخزين نص ورقم في القائمة نفسها.", points: 1, options: tf, key: { option_id: "a" }, explanation: "القوائم في بايثون تقبل أنواعاً مختلفة.", topic: topicVariables },
  { id: 5032, type: "single", text: "ما فهرس أول عنصر في القائمة؟", points: 1, options: opts("0", "1", "-1", "لا يوجد"), key: { option_id: "a" }, explanation: "تبدأ الفهرسة من الصفر.", topic: topicVariables },
  { id: 5033, type: "short_answer", text: "اكتب ناتج: ‎len(\"علمني\")", points: 1, options: [], key: { accepted: ["5", "٥"] }, explanation: "الكلمة مكونة من خمسة أحرف.", topic: topicVariables },
];

const TESTS: DemoTest[] = [
  { id: 501, title: "اختبار الدرس الأول", description: "اختبار قصير يغطي أساسيات بايثون: المتغيرات، أنواع البيانات، العمليات الحسابية والشروط. أجب عن جميع الأسئلة قبل انتهاء الوقت.", lesson_title: "lesson 1", placement: "standalone_item", position: 99, item_index: 3, item_count: 3, time_limit_minutes: 15, max_attempts: 3, pass_percent: 60, grading_policy: "highest", cooldown_minutes: 0, allow_back_navigation: true, shuffle_questions: false, prerequisite_test_id: null, opens_in_hours: null, next_item: { id: 502, title: "الاختبار النهائي", kind: "test" }, questions: lessonOneQuestions },
  { id: 504, title: "اختبار قصير", description: "ثلاثة أسئلة سريعة للتأكد من فهمك للفيديو. بلا حد زمني.", lesson_title: "lesson 1", placement: "inside_item", position: 0, item_index: 1, item_count: 3, time_limit_minutes: null, max_attempts: null, pass_percent: 60, grading_policy: "last", cooldown_minutes: 0, allow_back_navigation: true, shuffle_questions: false, prerequisite_test_id: null, opens_in_hours: null, next_item: null, questions: quickQuestions },
  { id: 502, title: "الاختبار النهائي", description: "اختبار شامل لكل أنواع الأسئلة. يحتوي على سؤال مقالي يصححه المدرّس.", lesson_title: "lesson 2", placement: "standalone_item", position: 99, item_index: 2, item_count: 2, time_limit_minutes: 30, max_attempts: 2, pass_percent: 70, grading_policy: "highest", cooldown_minutes: 1, allow_back_navigation: true, shuffle_questions: false, prerequisite_test_id: 501, opens_in_hours: null, next_item: null, questions: finalQuestions },
  { id: 503, title: "اختبار المراجعة", description: "اختبار مراجعة مجدول يُفتح في موعد محدد.", lesson_title: "lesson 2", placement: "standalone_item", position: 100, item_index: 2, item_count: 2, time_limit_minutes: 20, max_attempts: 1, pass_percent: 60, grading_policy: "highest", cooldown_minutes: 0, allow_back_navigation: false, shuffle_questions: false, prerequisite_test_id: null, opens_in_hours: 50, next_item: null, questions: quickQuestions },
];

function fresh(): DemoState {
  return { attempts: [], next_id: 1, created_at: new Date().toISOString() };
}

function read(): DemoState {
  if (typeof window === "undefined") return fresh();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as DemoState | null;
    if (parsed && Array.isArray(parsed.attempts) && parsed.created_at) return parsed;
  } catch { /* fall through to a fresh demo */ }
  const state = fresh();
  write(state);
  return state;
}

function write(state: DemoState) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mutate<T>(change: (state: DemoState) => T): T {
  const state = read();
  settle(state);
  const result = change(state);
  write(state);
  return result;
}

function snapshot(): DemoState {
  const state = read();
  if (settle(state)) write(state);
  return state;
}

function findTest(testId: number) {
  const test = TESTS.find((item) => item.id === testId);
  if (!test) throw new CourseTestsApiError("الاختبار غير موجود.", 404);
  return test;
}

function findAttempt(state: DemoState, attemptId: number) {
  const attempt = state.attempts.find((item) => item.id === attemptId);
  if (!attempt) throw new CourseTestsApiError("المحاولة غير موجودة.", 404);
  return attempt;
}

const questionById = (test: DemoTest, id: number) => test.questions.find((question) => question.id === id)!;
const opensAt = (state: DemoState, test: DemoTest) =>
  test.opens_in_hours == null ? null : new Date(new Date(state.created_at).getTime() + test.opens_in_hours * 3_600_000).toISOString();

/** Lazily auto-submits expired attempts and resolves demo essay grading. Returns true when anything changed. */
function settle(state: DemoState) {
  let changed = false;
  const now = Date.now();
  for (const attempt of state.attempts) {
    if (attempt.status === "in_progress" && attempt.deadline_at && now > new Date(attempt.deadline_at).getTime() + GRACE_MS) {
      finalize(attempt, true, attempt.deadline_at);
      changed = true;
    }
    if (attempt.status === "pending_grading" && attempt.submitted_at && now - new Date(attempt.submitted_at).getTime() > DEMO_ESSAY_GRADING_MS) {
      const test = findTest(attempt.test_id);
      for (const id of attempt.order) {
        const question = questionById(test, id);
        const answer = attempt.answers[id];
        if (question.type === "essay" && answer && answer.points === null) {
          const words = String(answer.response ?? "").trim().split(/\s+/).filter(Boolean).length;
          answer.points = words >= 12 ? question.points : Math.floor(question.points / 2);
          answer.feedback = words >= 12 ? "إجابة واضحة وذكرت الفرق الأساسي. (تصحيح تجريبي)" : "إجابتك مختصرة جداً، أضف مثالاً لكل نوع. (تصحيح تجريبي)";
        }
      }
      attempt.status = "graded";
      changed = true;
    }
  }
  return changed;
}

function finalize(attempt: StoredAttempt, automatic: boolean, at = new Date().toISOString()) {
  const test = findTest(attempt.test_id);
  let pending = false;
  for (const id of attempt.order) {
    const question = questionById(test, id);
    const answer = (attempt.answers[id] ??= { response: null, flagged: false, client_version: 0, points: null, feedback: null });
    const outcome = scoreQuestion(question.type, question.points, answer.response, question.key);
    answer.points = outcome.points;
    if (outcome.status === "pending") pending = true;
  }
  attempt.status = pending ? "pending_grading" : "graded";
  attempt.submitted_at = at;
  attempt.auto_submitted = automatic;
}

function totals(attempt: StoredAttempt) {
  const test = findTest(attempt.test_id);
  let correct = 0, wrong = 0, blank = 0, auto = 0, total = 0, max = 0, pendingCount = 0, pendingPoints = 0;
  for (const id of attempt.order) {
    const question = questionById(test, id);
    const answer = attempt.answers[id];
    max += question.points;
    const isBlank = isBlankResponse(answer?.response);
    if (question.type === "essay") {
      if (isBlank) blank++;
      else if (answer?.points == null) { pendingCount++; pendingPoints += question.points; }
      else if (answer.points === question.points) correct++;
      else wrong++;
      total += answer?.points ?? 0;
      continue;
    }
    const outcome = scoreQuestion(question.type, question.points, answer?.response ?? null, question.key);
    if (outcome.status === "correct") correct++;
    else if (outcome.status === "blank") blank++;
    else wrong++;
    auto += outcome.points ?? 0;
    total += outcome.points ?? 0;
  }
  return { correct, wrong, blank, auto, total, max, pendingCount, pendingPoints };
}

function gradedPercents(state: DemoState, testId: number) {
  return state.attempts
    .filter((attempt) => attempt.test_id === testId && attempt.status === "graded")
    .sort((a, b) => a.number - b.number)
    .map((attempt) => { const t = totals(attempt); return percentOf(t.total, t.max); });
}

function testState(state: DemoState, test: DemoTest): { state: StudentTestState; nextAttemptAt: string | null; best: number | null } {
  const attempts = state.attempts.filter((attempt) => attempt.test_id === test.id).sort((a, b) => a.number - b.number);
  const best = aggregatePercent(test.grading_policy, gradedPercents(state, test.id));
  const last = attempts.at(-1);
  const opens = opensAt(state, test);
  const cooldownUntil = last?.submitted_at && test.cooldown_minutes
    ? new Date(new Date(last.submitted_at).getTime() + test.cooldown_minutes * 60_000)
    : null;
  const nextAttemptAt = cooldownUntil && cooldownUntil.getTime() > Date.now() ? cooldownUntil.toISOString() : null;
  if (last?.status === "in_progress") return { state: "in_progress", nextAttemptAt, best };
  if (opens && new Date(opens).getTime() > Date.now()) return { state: "scheduled", nextAttemptAt, best };
  if (test.prerequisite_test_id) {
    const prerequisite = findTest(test.prerequisite_test_id);
    if (testState(state, prerequisite).state !== "passed") return { state: "locked", nextAttemptAt, best };
  }
  if (last?.status === "pending_grading") return { state: "pending_grading", nextAttemptAt, best };
  if (best !== null && best >= test.pass_percent) return { state: "passed", nextAttemptAt, best };
  if (test.max_attempts !== null && attempts.length >= test.max_attempts) return { state: "attempts_exhausted", nextAttemptAt, best };
  return { state: attempts.length ? "failed" : "not_started", nextAttemptAt, best };
}

function openAttemptInfo(attempt: StoredAttempt | undefined) {
  if (!attempt || attempt.status !== "in_progress") return null;
  return {
    id: attempt.id,
    answered_count: attempt.order.filter((id) => !isBlankResponse(attempt.answers[id]?.response)).length,
    deadline_at: attempt.deadline_at,
    server_now: new Date().toISOString(),
  };
}

function canReview(attempt: StoredAttempt) {
  return attempt.status === "graded" || attempt.status === "pending_grading";
}

function toResult(state: DemoState, attempt: StoredAttempt): AttemptResult {
  const test = findTest(attempt.test_id);
  const t = totals(attempt);
  const graded = attempt.status === "graded";
  const percent = graded ? percentOf(t.total, t.max) : null;
  const passed = percent === null ? null : percent >= test.pass_percent;
  const count = state.attempts.filter((item) => item.test_id === test.id).length;
  const attemptsLeft = test.max_attempts === null ? null : Math.max(0, test.max_attempts - count);
  const percents = gradedPercents(state, test.id);
  const { state: status, nextAttemptAt } = testState(state, test);
  const topics = new Map<number, CourseItemRef & { wrong_count: number }>();
  if (graded && !passed) {
    for (const id of attempt.order) {
      const question = questionById(test, id);
      const outcome = scoreQuestion(question.type, question.points, attempt.answers[id]?.response ?? null, question.key);
      if (question.topic && outcome.status !== "correct" && outcome.status !== "pending") {
        const entry = topics.get(question.topic.id) ?? { ...question.topic, wrong_count: 0 };
        entry.wrong_count++;
        topics.set(question.topic.id, entry);
      }
    }
  }
  const started = new Date(attempt.started_at).getTime();
  const ended = attempt.submitted_at ? new Date(attempt.submitted_at).getTime() : Date.now();
  return {
    id: attempt.id,
    test_id: test.id,
    number: attempt.number,
    status: attempt.status,
    auto_submitted: attempt.auto_submitted,
    submitted_at: attempt.submitted_at,
    score_visible: true,
    score_auto: t.auto,
    score_total: graded ? t.total : null,
    max_score: t.max,
    percent,
    passed,
    pass_percent: test.pass_percent,
    correct_count: t.correct,
    wrong_count: t.wrong,
    blank_count: t.blank,
    answered_count: attempt.order.length - t.blank,
    question_count: attempt.order.length,
    duration_seconds: Math.max(0, Math.round((ended - started) / 1000)),
    max_attempts: test.max_attempts,
    attempts_left: attemptsLeft,
    is_best: percent !== null && percents.length > 1 && percent === Math.max(...percents),
    grading_policy: test.grading_policy,
    points_to_pass: passed === false ? Math.max(0, Math.ceil((test.pass_percent / 100) * t.max) - t.total) : null,
    pending_essay_count: t.pendingCount,
    pending_essay_points: t.pendingPoints,
    can_review: canReview(attempt),
    can_retry: attemptsLeft !== 0 && (status === "passed" || status === "failed"),
    next_attempt_at: nextAttemptAt,
    review_topics: [...topics.values()],
    next_item: test.next_item,
  };
}

function toAttempt(attempt: StoredAttempt): Attempt {
  const test = findTest(attempt.test_id);
  return {
    id: attempt.id,
    test_id: test.id,
    number: attempt.number,
    status: attempt.status,
    started_at: attempt.started_at,
    deadline_at: attempt.deadline_at,
    server_now: new Date().toISOString(),
    allow_back_navigation: test.allow_back_navigation,
    // Answer keys and explanations never leave the "server" before submission.
    questions: attempt.order.map((id) => {
      const question = questionById(test, id);
      const answer = attempt.answers[id];
      return {
        id: question.id,
        type: question.type,
        text: question.text,
        code_snippet: question.code_snippet ?? null,
        image_url: question.image_url ?? null,
        points: question.points,
        options: question.options,
        ...(question.right_options ? { right_options: question.right_options } : {}),
        ...(question.type === "essay" ? { word_limit: question.word_limit ?? null } : {}),
        response: answer?.response ?? null,
        flagged: answer?.flagged ?? false,
        client_version: answer?.client_version ?? 0,
      };
    }),
  };
}

function correctResponse(question: DemoQuestion): AnswerResponse {
  const key = question.key;
  if ("option_id" in key) return key.option_id;
  if ("option_ids" in key) return key.option_ids;
  if ("accepted" in key) return key.accepted[0] ?? null;
  if ("matches" in key) return key.matches;
  return null;
}

function progress(): CourseTestsProgress {
  const state = snapshot();
  const items: SidebarTestItem[] = TESTS.map((test) => {
    const attempts = state.attempts.filter((attempt) => attempt.test_id === test.id).sort((a, b) => a.number - b.number);
    const computed = testState(state, test);
    const last = attempts.at(-1);
    const lastGraded = [...attempts].reverse().find((attempt) => attempt.status === "graded");
    const showPercent = computed.state === "passed" ? computed.best : lastGraded ? toResult(state, lastGraded).percent : null;
    return {
      id: test.id,
      title: test.title,
      lesson_id: null,
      position: test.position,
      placement: test.placement,
      parent_item_id: null,
      question_count: test.questions.length,
      time_limit_minutes: test.time_limit_minutes,
      state: computed.state,
      grading_policy: test.grading_policy,
      percent: computed.state === "in_progress" || computed.state === "pending_grading" ? null : showPercent,
      attempt_count: attempts.length,
      max_attempts: test.max_attempts,
      opens_at: opensAt(state, test),
      open_attempt: openAttemptInfo(last),
      prerequisite_title: test.prerequisite_test_id ? findTest(test.prerequisite_test_id).title : null,
    };
  });
  const completed = items.filter((item) => item.state === "passed").length;
  return { items, completed_count: completed, total_count: items.length, completion_percent: percentOf(completed, items.length) };
}

const delay = <T,>(value: () => T) => new Promise<T>((resolve, reject) => {
  window.setTimeout(() => { try { resolve(value()); } catch (error) { reject(error); } }, 120);
});

export const demoCourseTestsClient: CourseTestsClient = {
  getProgress: () => delay(progress),

  getTest: (courseId, testId) => delay((): CourseTestDetail => {
    const state = snapshot();
    const test = findTest(testId);
    const attempts = state.attempts.filter((attempt) => attempt.test_id === testId).sort((a, b) => a.number - b.number);
    const computed = testState(state, test);
    const prerequisite = test.prerequisite_test_id ? findTest(test.prerequisite_test_id) : null;
    return {
      id: test.id,
      course_id: courseId,
      title: test.title,
      description: test.description,
      lesson_title: test.lesson_title,
      item_index: test.item_index,
      item_count: test.item_count,
      prev_item: null,
      next_item: test.next_item,
      question_count: test.questions.length,
      total_points: test.questions.reduce((sum, question) => sum + question.points, 0),
      time_limit_minutes: test.time_limit_minutes,
      max_attempts: test.max_attempts,
      pass_percent: test.pass_percent,
      grading_policy: test.grading_policy,
      cooldown_minutes: test.cooldown_minutes,
      allow_back_navigation: test.allow_back_navigation,
      opens_at: opensAt(state, test),
      closes_at: null,
      state: computed.state,
      prerequisites: prerequisite
        ? [{ id: prerequisite.id, title: prerequisite.title, kind: "test", met: testState(state, prerequisite).state === "passed", hint: "اجتز الاختبار بنسبة النجاح المطلوبة" }]
        : [],
      next_attempt_at: computed.nextAttemptAt,
      attempts: attempts.map((attempt) => {
        const result = toResult(state, attempt);
        return {
          id: attempt.id,
          number: attempt.number,
          status: attempt.status,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          duration_seconds: attempt.submitted_at ? result.duration_seconds : null,
          score_total: result.score_total,
          max_score: result.max_score,
          percent: result.percent,
          passed: result.passed,
          can_review: canReview(attempt),
        };
      }),
      open_attempt: openAttemptInfo(attempts.at(-1)),
      best_percent: computed.best,
      server_now: new Date().toISOString(),
    };
  }),

  startAttempt: (testId) => delay(() => mutate((state) => {
    const test = findTest(testId);
    const computed = testState(state, test);
    const attempts = state.attempts.filter((attempt) => attempt.test_id === testId);
    if (computed.state === "in_progress") throw new CourseTestsApiError("لديك محاولة مفتوحة بالفعل.", 409);
    if (computed.state === "locked") throw new CourseTestsApiError("أكمل المتطلبات أولاً.", 403);
    if (computed.state === "scheduled" || computed.state === "closed") throw new CourseTestsApiError("الاختبار غير متاح الآن.", 403);
    if (computed.state === "pending_grading") throw new CourseTestsApiError("انتظر تصحيح محاولتك السابقة.", 409);
    if (test.max_attempts !== null && attempts.length >= test.max_attempts) throw new CourseTestsApiError("استنفدت كل المحاولات.", 403);
    if (computed.nextAttemptAt) throw new CourseTestsApiError("المحاولة التالية لم تُتح بعد.", 429);
    const now = new Date();
    const attempt: StoredAttempt = {
      id: state.next_id++,
      test_id: testId,
      number: attempts.length + 1,
      status: "in_progress",
      started_at: now.toISOString(),
      deadline_at: test.time_limit_minutes ? new Date(now.getTime() + test.time_limit_minutes * 60_000).toISOString() : null,
      submitted_at: null,
      auto_submitted: false,
      order: test.questions.map((question) => question.id),
      answers: {},
    };
    state.attempts.push(attempt);
    return toAttempt(attempt);
  })),

  getAttempt: (attemptId) => delay(() => toAttempt(findAttempt(snapshot(), attemptId))),

  saveAnswer: (attemptId, questionId, input) => delay(() => mutate((state) => {
    const attempt = findAttempt(state, attemptId);
    if (attempt.status !== "in_progress") throw new CourseTestsApiError("تم تسليم هذه المحاولة.", 409);
    if (attempt.deadline_at && Date.now() > new Date(attempt.deadline_at).getTime() + GRACE_MS) throw new CourseTestsApiError("انتهى الوقت.", 409);
    if (!attempt.order.includes(questionId)) throw new CourseTestsApiError("السؤال غير موجود.", 404);
    const current = attempt.answers[questionId];
    if (current && current.client_version >= input.client_version) return;
    attempt.answers[questionId] = { response: input.response, flagged: input.flagged, client_version: input.client_version, points: null, feedback: null };
  })),

  submitAttempt: (attemptId) => delay(() => mutate((state) => {
    const attempt = findAttempt(state, attemptId);
    if (attempt.status === "in_progress") finalize(attempt, false);
    return toResult(state, attempt);
  })),

  getResult: (attemptId) => delay(() => {
    const state = snapshot();
    return toResult(state, findAttempt(state, attemptId));
  }),

  getReview: (attemptId) => delay((): AttemptReview => {
    const state = snapshot();
    const attempt = findAttempt(state, attemptId);
    if (!canReview(attempt)) throw new CourseTestsApiError("المراجعة غير متاحة.", 403);
    const test = findTest(attempt.test_id);
    const questions: ReviewQuestion[] = attempt.order.map((id) => {
      const question = questionById(test, id);
      const answer = attempt.answers[id];
      const outcome = scoreQuestion(question.type, question.points, answer?.response ?? null, question.key);
      const essayGraded = question.type === "essay" && answer?.points != null && outcome.status !== "blank";
      return {
        id: question.id,
        type: question.type,
        text: question.text,
        code_snippet: question.code_snippet ?? null,
        image_url: question.image_url ?? null,
        points: question.points,
        points_awarded: essayGraded ? answer!.points : outcome.points,
        status: essayGraded ? (answer!.points === question.points ? "correct" : answer!.points ? "partial" : "wrong") : outcome.status,
        options: question.options,
        ...(question.right_options ? { right_options: question.right_options } : {}),
        response: answer?.response ?? null,
        correct_response: correctResponse(question),
        ...("accepted" in question.key ? { accepted_answers: question.key.accepted } : {}),
        model_answer: "model_answer" in question.key ? question.key.model_answer : null,
        explanation: question.explanation,
        feedback: answer?.feedback ?? null,
      };
    });
    return { attempt: toResult(state, attempt), questions };
  }),
};

export function resetCourseTestsDemo() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}
