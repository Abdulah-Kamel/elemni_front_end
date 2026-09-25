export type CourseTestQuestion = {
  id: number;
  type: "single" | "multi" | "true_false" | "short_answer" | "essay" | "ordering" | "matching";
  text: string;
  code_snippet?: string | null;
  image_url?: string | null;
  points: number;
  options: { id: string; text: string }[];
  response: unknown;
  flagged: boolean;
};

export type CourseTestAttempt = {
  id: number;
  test_id: number;
  number: number;
  status: string;
  deadline_at: string | null;
  server_now: string;
  questions: CourseTestQuestion[];
};

export type CourseTestDetail = {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  allow_back_navigation: boolean;
  max_attempts: number | null;
  pass_percent: number;
  grading_policy: "highest" | "last" | "average";
  cooldown_minutes: number;
  student_test_state: string;
  question_count: number;
  opens_at: string | null;
  closes_at: string | null;
  unmet_prerequisites: { type: string; id: number; title: string }[];
  attempts: { id: number; number: number; status: string; started_at: string; submitted_at: string | null; percent: number | null }[];
  open_attempt_id: number | null;
};
