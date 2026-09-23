"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CircleAlert,
  Clock3,
  GraduationCap,
  Rocket,
} from "lucide-react";
import { GlobalLoading } from "@/src/components/ui/global-loading";
import ImageWithFallback from "@/src/components/ui/image-with-fallback";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { m } from "motion/react";
import { Link, useRouter } from "@/src/i18n/navigation";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import {
  getStudentErrorMessage,
  isStudentUnauthorized,
} from "@/src/lib/student-api/client";
import {
  useCurrentStudent,
  useMyCourses,
} from "@/src/features/student/hooks/use-student-queries";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import StudentAppShell from "@/src/features/portal/components/portal-shell";
import StudyCounter from "./study-counter";

interface OnboardingDraft {
  grade_id: number;
  stream_id: number;
}

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function formatDuration(minutes: number | null) {
  if (!minutes) return "غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  return `${Math.round(minutes / 60)} ساعة`;
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function DashboardLoading() {
  return <GlobalLoading variant="content" message="جاري تجهيز صفحتك..." />;
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...popSpring, delay }}
    >
      {children}
    </m.div>
  );
}

export default function StudentDashboard({ grades, streams }: { grades: GradeDto[]; streams: StreamDto[] }) {
  const router = useRouter();
  const [profileLabel, setProfileLabel] = useState("");
  const userQuery = useCurrentStudent();
  const coursesQuery = useMyCourses();
  const user = userQuery.data ?? null;
  const courses = coursesQuery.data;
  const unauthorized =
    isStudentUnauthorized(userQuery.error) ||
    isStudentUnauthorized(coursesQuery.error);
  const loading = userQuery.isPending || coursesQuery.isPending;
  const error = getStudentErrorMessage(
    coursesQuery.error ?? userQuery.error,
    "تعذر تحميل بيانات الصفحة الرئيسية حالياً.",
  );

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rawDraft = localStorage.getItem("elemni-student-onboarding-v1");
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft) as OnboardingDraft;
          const grade = grades.find((item) => item.id === draft.grade_id)?.name;
          const stream = streams.find((item) => item.id === draft.stream_id)?.name;
          setProfileLabel([grade, stream].filter(Boolean).join(" - "));
        } catch {
          localStorage.removeItem("elemni-student-onboarding-v1");
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [grades, streams]);

  const loadDashboard = () => {
    void Promise.all([userQuery.refetch(), coursesQuery.refetch()]);
  };

  const summary = useMemo(() => {
    const items = courses?.items ?? [];
    return {
      courses: items.length,
      lessons: items.reduce((total, item) => total + item.course.lesson_count, 0),
      minutes: items.reduce((total, item) => total + (item.course.total_duration_minutes ?? 0), 0),
    };
  }, [courses]);

  const firstName = user?.name.split(" ").filter(Boolean)[0] ?? "طالبنا";
  const enrollments = courses?.items ?? [];
  const primary = [...enrollments].sort(
    (first, second) =>
      new Date(second.progress.last_opened_at ?? second.purchased_at).getTime() -
      new Date(first.progress.last_opened_at ?? first.purchased_at).getTime(),
  )[0];

  return (
    <StudentAppShell user={user} active="dashboard">
      {loading ? (
        <DashboardLoading />
      ) : error ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
          <div
            role="alert"
            className="sticker-tile w-full border-red-600 bg-red-50 p-5 text-center text-sm font-black text-red-700 dark:border-red-400 dark:bg-red-500/10 dark:text-red-300"
          >
            <CircleAlert className="mx-auto mb-3 size-7" />
            {error}
            <button
              onClick={() => void loadDashboard()}
              className="mt-4 block w-full cursor-pointer text-brand-700 hover:underline dark:text-brand-300"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <m.header
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={popSpring}
          >
            <h1 className="text-5xl font-black tracking-tight text-ink sm:text-6xl dark:text-slate-50">
              <MarkerHighlight color="yellow" variant={1}>
                أهلاً {firstName}
              </MarkerHighlight>
            </h1>
            <p className="mt-3 text-base font-bold text-muted dark:text-slate-400">
              جاهز{" "}
              <MarkerHighlight color="sky" variant={2}>
                تكمل مذاكرتك؟
              </MarkerHighlight>
            </p>
            {profileLabel && (
              <m.span
                className="sticker-badge mt-4 inline-block bg-amber-300 px-4 py-1.5 text-xs font-black text-ink"
                initial={{ rotate: 6, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 1, scale: 1, opacity: 1 }}
                transition={{ ...popSpring, delay: 0.15 }}
              >
                {profileLabel}
              </m.span>
            )}
          </m.header>

          {primary ? (
            <div className="grid items-stretch gap-5 lg:grid-cols-3">
              <m.section
                aria-label="أحدث كورس مشترك"
                className="sticker-tile overflow-hidden lg:col-span-2"
                initial={{ opacity: 0, y: 32, rotate: -0.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ ...popSpring, delay: 0.1 }}
              >
                <div className="flex h-full flex-col justify-center p-6 sm:p-8">
                  <p className="text-lg font-black text-brand-700 dark:text-brand-300">
                    {primary.course.title}
                  </p>
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 font-medium text-muted dark:text-slate-400">
                    {primary.course.description ||
                      `${primary.course.lesson_count} درس متاح ضمن اشتراكك الحالي.`}
                  </p>
                  <div className="mt-6 flex items-end gap-4">
                    <StudyCounter
                      value={primary.progress.completion_percent}
                      format={(n) => `${n}%`}
                      className="sticker-numeral text-6xl font-black text-ink sm:text-7xl dark:text-slate-50"
                    />
                    <span className="pb-2 text-sm font-black text-muted dark:text-slate-400">
                      {primary.progress.completion_percent
                        ? "نسبة إنجازك"
                        : "لم تبدأ الكورس بعد"}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-4 overflow-hidden rounded-full border-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800"
                    aria-label={`نسبة إنجاز ${primary.progress.completion_percent}%`}
                  >
                    <m.div
                      className="h-full rounded-full bg-brand-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${primary.progress.completion_percent}%`,
                      }}
                      transition={{ ...popSpring, delay: 0.4 }}
                    />
                  </div>
                  <m.div
                    whileHover={{ scale: 1.04, rotate: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={popSpring}
                    className="mt-6 w-fit"
                  >
                    <Link
                      href={`/my-courses/${primary.course.id}`}
                      className="sticker-btn inline-flex h-12 items-center gap-2 px-7 text-sm font-black"
                    >
                      {primary.progress.completion_percent
                        ? "كمّل من حيث توقفت"
                        : "ابدأ الكورس"}
                      <ArrowLeft className="size-4" />
                    </Link>
                  </m.div>
                </div>
              </m.section>

              <m.aside
                aria-label="خطوتك التالية"
                className="sticker-tile flex flex-col justify-center bg-brand-700 p-6 sm:p-7"
                initial={{ opacity: 0, y: 32, rotate: 0.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ ...popSpring, delay: 0.2 }}
              >
                <m.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...popSpring, delay: 0.35 }}
                >
                  <GraduationCap className="size-9" />
                </m.span>
                <h2 className="mt-4 text-2xl font-black">
                  <MarkerHighlight color="yellow" variant={1}>
                    خطوتك التالية
                  </MarkerHighlight>
                </h2>
                <p className="mt-2 line-clamp-2 text-sm font-black">
                  {primary.course.title}
                </p>
                <p className="mt-2 text-sm leading-6 font-medium">
                  {primary.progress.completion_percent === 100
                    ? "أتممت كل محتوى الكورس."
                    : "ارجع إلى الكورس وتابع من آخر محتوى فتحته."}
                </p>
                <m.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={popSpring}
                  className="mt-5 w-fit"
                >
                  <Link
                    href={`/my-courses/${primary.course.id}`}
                    className="sticker-btn inline-flex h-12 items-center gap-2 px-7 text-sm font-black"
                  >
                    فتح الكورس
                    <ArrowLeft className="size-4" />
                  </Link>
                </m.div>
              </m.aside>
            </div>
          ) : (
            <Reveal className="sticker-tile py-12 text-center sm:py-16">
              <Rocket className="mx-auto size-12 text-brand-600 dark:text-brand-300" />
              <h2 className="mt-5 text-3xl font-black tracking-tight text-ink dark:text-slate-50">
                <MarkerHighlight color="pink" variant={3}>
                  لا توجد بيانات دراسة بعد
                </MarkerHighlight>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 font-medium text-muted dark:text-slate-400">
                ستظهر مؤشرات التقدم والملخصات هنا بعد الاشتراك في أحد الكورسات.
              </p>
            </Reveal>
          )}

          <Reveal
            className="sticker-tile flex flex-col divide-y-2 divide-ink/10 px-6 py-2 sm:flex-row sm:items-center sm:divide-x-2 sm:divide-x-reverse sm:divide-y-0 dark:divide-white/10"
            aria-label="ملخص دراستك"
          >
            {[
              {
                value: summary.courses,
                label: "كورسات نشطة",
                icon: GraduationCap,
                format: undefined as ((n: number) => string) | undefined,
              },
              {
                value: summary.lessons,
                label: "دروس متاحة",
                icon: BookOpen,
                format: undefined as ((n: number) => string) | undefined,
              },
              {
                value: summary.minutes,
                label: "دقائق المحتوى",
                icon: Clock3,
                format: (n: number) => formatDuration(n || null),
              },
            ].map(({ value, label, icon: Icon, format }) => (
              <div
                key={label}
                className="flex flex-1 items-center gap-4 py-4 sm:justify-center sm:py-5"
              >
                <span className="sticker-badge flex size-11 shrink-0 items-center justify-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300">
                  <Icon className="size-5" />
                </span>
                <span>
                  <StudyCounter
                    value={typeof value === "number" ? value : 0}
                    format={format}
                    className="sticker-numeral block text-3xl font-black text-ink dark:text-slate-50"
                  />
                  <span className="text-xs font-black text-muted dark:text-slate-400">
                    {label}
                  </span>
                </span>
              </div>
            ))}
          </Reveal>

          <section aria-labelledby="courses-heading">
            <Reveal className="mb-4 flex items-center justify-between">
              <h2
                id="courses-heading"
                className="text-3xl font-black tracking-tight text-ink dark:text-slate-50"
              >
                <MarkerHighlight color="sky" variant={1}>
                  كورساتى الحالية
                </MarkerHighlight>
              </h2>
              <m.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.95 }}
                transition={popSpring}
              >
                <Link
                  href="/my-courses"
                  className="rounded-full border-2 border-ink bg-surface px-4 py-1.5 text-sm font-black text-brand-700 shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300 dark:text-brand-300 dark:shadow-[2px_2px_0_0_#020617]"
                >
                  عرض كورساتى
                </Link>
              </m.div>
            </Reveal>
            {enrollments.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {enrollments.slice(0, 4).map((enrollment, index) => (
                  <Reveal key={enrollment.id} delay={0.06 * index}>
                    <m.div
                      whileHover={{ y: -6, rotate: -0.4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={popSpring}
                    >
                      <Link
                        href={`/my-courses/${enrollment.course.id}`}
                        aria-label={`فتح كورس ${enrollment.course.title}`}
                        className="sticker-tile group block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                      >
                        <div className="relative aspect-video border-b-2 border-ink bg-brand-100 dark:border-brand-300">
                          <ImageWithFallback
                            src={enrollment.course.img}
                            fallbackSrc={lessonFallback}
                            alt={enrollment.course.title}
                            fill
                            sizes="(max-width: 639px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="p-5">
                          <p className="inline-block -rotate-1 rounded-full border-2 border-ink bg-amber-300 px-3 py-0.5 text-xs font-black text-ink">
                            {enrollment.course.subject_name || "كورس تعليمي"}
                          </p>
                          <h3 className="mt-2 line-clamp-2 min-h-12 text-xl font-black leading-7 text-ink transition-colors group-hover:text-brand-700 dark:text-slate-50 dark:group-hover:text-brand-300">
                            {enrollment.course.title}
                          </h3>
                          <div className="mt-4 flex items-center gap-3">
                            <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-brand-600"
                                style={{
                                  width: `${enrollment.progress.completion_percent}%`,
                                }}
                              />
                            </div>
                            <span className="sticker-numeral text-lg font-black text-ink dark:text-slate-50">
                              {enrollment.progress.completion_percent}%
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-3 border-t-2 border-ink/10 pt-3 text-xs font-black text-muted dark:border-white/10 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="size-4 text-brand-600 dark:text-brand-300" />
                              {enrollment.course.lesson_count} درس
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock className="size-4 text-brand-600 dark:text-brand-300" />
                              حتى {formatExpiry(enrollment.expires_at)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </m.div>
                  </Reveal>
                ))}
              </div>
            ) : (
              <Reveal className="sticker-tile flex min-h-48 flex-col items-center justify-center text-center">
                <BookOpen className="mb-3 size-8 text-muted" />
                <p className="text-lg font-black text-ink dark:text-slate-50">
                  <MarkerHighlight color="emerald" variant={3}>
                    لا توجد كورسات حالياً
                  </MarkerHighlight>
                </p>
                <p className="mt-2 text-xs font-medium text-muted dark:text-slate-400">
                  ستظهر الكورسات المشتركة هنا مع مؤشرات تقدمها.
                </p>
              </Reveal>
            )}
          </section>
        </div>
      )}
    </StudentAppShell>
  );
}
