"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { AttemptPlayer } from "./attempt/attempt-player";
import { AttemptResultView } from "./result/attempt-result-view";
import { AttemptReviewView } from "./result/attempt-review-view";
import { TestStartScreen } from "./intro/test-start-screen";
import { CourseTestsApiError, getCourseTestsClient } from "./client";
import { useCourseTest, useInvalidateCourseTests } from "./hooks";
import { testHref, type TestView } from "./routes";

export type ActiveTest = { testId: number; attemptId: number | null; view: TestView };

export function parseTestView(value: string | undefined): TestView {
  return value === "attempt" || value === "result" || value === "review" ? value : "intro";
}

/**
 * Renders the active course test inside the course page (in place of the video
 * player). Decides which screen to show from the URL; each screen loads its own data.
 */
export function CourseTestPanel({ courseId, active }: { courseId: number; active: ActiveTest }) {
  const t = useTranslations("courseTests.common");
  const router = useRouter();
  const invalidate = useInvalidateCourseTests();
  const testQuery = useCourseTest(courseId, active.testId);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const startLock = useRef(false);
  const test = testQuery.data;

  const go = (options: { attempt?: number; view?: TestView }) => router.push(testHref(courseId, active.testId, options));

  const start = async () => {
    // Two clicks can land before `starting` re-renders; never start two attempts.
    if (startLock.current) return;
    startLock.current = true;
    setStarting(true);
    setStartError(null);
    try {
      const attempt = await (await getCourseTestsClient()).startAttempt(active.testId);
      await invalidate();
      go({ attempt: attempt.id, view: "attempt" });
    } catch (error) {
      setStartError(error instanceof CourseTestsApiError && error.status ? error.message : t("loadError"));
      await invalidate();
    } finally {
      startLock.current = false;
      setStarting(false);
    }
  };

  if (testQuery.isPending) {
    return (
      <div role="status" className="grid min-h-80 place-items-center rounded-3xl border border-[#E4E2DC] bg-white text-sm font-semibold text-muted dark:border-slate-800 dark:bg-slate-900">
        <span className="animate-pulse">{t("loading")}</span>
      </div>
    );
  }
  if (!test) {
    return (
      <div role="alert" className="grid min-h-80 place-items-center gap-3 rounded-3xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-slate-900">
        <p className="font-semibold text-red-700 dark:text-red-300">{t("loadError")}</p>
        <button type="button" onClick={() => void testQuery.refetch()} className="min-h-11 rounded-xl border border-[#E4E2DC] px-4 font-semibold dark:border-slate-700">
          {t("retry")}
        </button>
      </div>
    );
  }

  const openAttemptId = test.open_attempt?.id ?? null;

  if (active.view === "attempt" && (active.attemptId ?? openAttemptId)) {
    return (
      <AttemptPlayer
        key={active.attemptId ?? openAttemptId}
        test={test}
        attemptId={(active.attemptId ?? openAttemptId)!}
        onExit={() => { void invalidate(); go({}); }}
        onShowResult={(attemptId) => { void invalidate(); go({ attempt: attemptId, view: "result" }); }}
      />
    );
  }
  if (active.view === "result" && active.attemptId) {
    return (
      <AttemptResultView
        test={test}
        attemptId={active.attemptId}
        onReview={(attemptId) => go({ attempt: attemptId, view: "review" })}
        onRetry={() => void start()}
        retrying={starting}
        retryError={startError}
      />
    );
  }
  if (active.view === "review" && active.attemptId) {
    return (
      <AttemptReviewView
        test={test}
        attemptId={active.attemptId}
        onBackToResult={(attemptId) => go({ attempt: attemptId, view: "result" })}
      />
    );
  }
  return (
    <TestStartScreen
      test={test}
      starting={starting}
      startError={startError}
      onStart={() => void start()}
      onResume={(attemptId) => go({ attempt: attemptId, view: "attempt" })}
      onOpenResult={(attemptId) => go({ attempt: attemptId, view: "result" })}
      onOpenReview={(attemptId) => go({ attempt: attemptId, view: "review" })}
    />
  );
}
