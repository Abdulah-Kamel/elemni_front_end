"use client";

import { useSyncExternalStore } from "react";
import { CourseTestFlow } from "./course-test-flow";
import { getDemoPageSnapshot, subscribeDemoState } from "./demo-store";
import type { CourseTestAttempt, CourseTestDetail } from "./types";

export function CourseTestDemoPage({ courseId, testId, attemptId, review }: { courseId: number; testId: number; attemptId: number | null; review: boolean }) {
  const snapshot = useSyncExternalStore(subscribeDemoState, () => getDemoPageSnapshot(courseId, testId, attemptId, review), () => "");
  if (!snapshot) return <div dir="rtl" className="grid min-h-72 place-items-center text-slate-500">جارٍ تحميل الاختبار التجريبي…</div>;
  const data = JSON.parse(snapshot) as { test: CourseTestDetail; attempt: CourseTestAttempt | null; result: Record<string, unknown> | null };
  return <CourseTestFlow test={data.test} initialAttempt={data.attempt} initialResult={data.result} />;
}
