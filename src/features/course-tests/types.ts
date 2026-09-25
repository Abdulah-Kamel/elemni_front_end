// Student-facing course-test contract. The backend owns every rule and value
// here; these types describe what the UI expects to receive. Answer keys are
// never part of a pre-submission payload.

export type QuestionType = "single" | "multi" | "true_false" | "short_answer" | "essay" | "ordering" | "matching";

export type StudentTestState =
  | "not_started"
  | "locked"
  | "scheduled"
  | "in_progress"
  | "passed"
  | "failed"
  | "attempts_exhausted"
  | "pending_grading"
  | "closed";

export type AttemptStatus = "in_progress" | "submitted" | "pending_grading" | "graded";
export type GradingPolicy = "highest" | "last" | "average";

export type Option = { id: string; text: string };

/** single/true_false: option id · multi/ordering: option ids · short_answer/essay: text · matching: {left_id: right_id} */
export type AnswerResponse = string | string[] | Record<string, string> | null;

export type AttemptQuestion = {
  id: number;
  type: QuestionType;
  text: string;
  code_snippet: string | null;
  image_url: string | null;
  points: number;
  /** Already in this attempt's per-question order. For matching these are the left items. */
  options: Option[];
  /** Matching only: the choices for each left item. */
  right_options?: Option[];
  /** Essay only. */
  word_limit?: number | null;
  response: AnswerResponse;
  flagged: boolean;
  /** Last autosave version the server accepted (0 = never saved). */
  client_version: number;
};

export type CourseItemRef = { id: number; title: string; kind: "video" | "file" | "test" | "item" };

export type AttemptSummary = {
  id: number;
  number: number;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  duration_seconds: number | null;
  score_total: number | null;
  max_score: number;
  percent: number | null;
  passed: boolean | null;
  can_review: boolean;
};

/** `hint` explains what completes it, e.g. "شاهد الفيديو حتى النهاية". */
export type Prerequisite = CourseItemRef & { met: boolean; hint: string | null };

export type CourseTestDetail = {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  lesson_title: string | null;
  /** "العنصر X من Y" and the prev/next footer. */
  item_index: number;
  item_count: number;
  prev_item: CourseItemRef | null;
  next_item: CourseItemRef | null;
  question_count: number;
  total_points: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  pass_percent: number;
  grading_policy: GradingPolicy;
  cooldown_minutes: number;
  allow_back_navigation: boolean;
  opens_at: string | null;
  closes_at: string | null;
  state: StudentTestState;
  prerequisites: Prerequisite[];
  /** Set while a cooldown blocks the next attempt. */
  next_attempt_at: string | null;
  attempts: AttemptSummary[];
  open_attempt: { id: number; answered_count: number; deadline_at: string | null; server_now: string } | null;
  best_percent: number | null;
  /** Server clock at response time, for countdowns (scheduled, cooldown). */
  server_now: string;
};

export type Attempt = {
  id: number;
  test_id: number;
  number: number;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string | null;
  server_now: string;
  allow_back_navigation: boolean;
  questions: AttemptQuestion[];
};

export type SaveAnswerInput = { response: AnswerResponse; flagged: boolean; client_version: number };

export type AttemptResult = {
  id: number;
  test_id: number;
  number: number;
  status: AttemptStatus;
  auto_submitted: boolean;
  submitted_at: string | null;
  /** False when the teacher hides the score until later. */
  score_visible: boolean;
  score_auto: number;
  score_total: number | null;
  max_score: number;
  percent: number | null;
  passed: boolean | null;
  pass_percent: number;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  answered_count: number;
  question_count: number;
  duration_seconds: number;
  max_attempts: number | null;
  attempts_left: number | null;
  is_best: boolean;
  grading_policy: GradingPolicy;
  /** Points still needed to pass, when failed. */
  points_to_pass: number | null;
  pending_essay_count: number;
  pending_essay_points: number;
  can_review: boolean;
  can_retry: boolean;
  next_attempt_at: string | null;
  review_topics: (CourseItemRef & { wrong_count: number })[];
  next_item: CourseItemRef | null;
};

export type ReviewStatus = "correct" | "wrong" | "partial" | "blank" | "pending";

export type ReviewQuestion = {
  id: number;
  type: QuestionType;
  text: string;
  code_snippet: string | null;
  image_url: string | null;
  points: number;
  points_awarded: number | null;
  status: ReviewStatus;
  options: Option[];
  right_options?: Option[];
  response: AnswerResponse;
  /** Shape follows `response`. */
  correct_response: AnswerResponse;
  /** Short answer: every accepted answer. */
  accepted_answers?: string[];
  model_answer?: string | null;
  explanation: string | null;
  feedback: string | null;
};

export type AttemptReview = {
  attempt: AttemptResult;
  questions: ReviewQuestion[];
};

export type SidebarTestItem = {
  id: number;
  title: string;
  lesson_id: number | null;
  position: number;
  placement: "standalone_item" | "inside_item";
  parent_item_id: number | null;
  question_count: number;
  time_limit_minutes: number | null;
  state: StudentTestState;
  percent: number | null;
  grading_policy: GradingPolicy;
  attempt_count: number;
  max_attempts: number | null;
  opens_at: string | null;
  open_attempt: { id: number; answered_count: number; deadline_at: string | null; server_now: string } | null;
  prerequisite_title: string | null;
};

export type CourseTestsProgress = {
  items: SidebarTestItem[];
  completion_percent: number;
  completed_count: number;
  total_count: number;
};
