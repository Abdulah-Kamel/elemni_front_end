"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Clock3,
  GraduationCap,
  Rocket,
} from "lucide-react";
import { GlobalLoading } from "@/src/components/ui/global-loading";
import CourseCover from "@/src/features/courses/components/course-cover-placeholder";
import { formatDate, formatRelativeDays } from "@/src/lib/format/date";
import { getSubjectArt } from "@/src/features/courses/subject-art";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { m } from "motion/react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import {
  getStudentErrorMessage,
  isStudentUnauthorized,
} from "@/src/lib/student-api/client";
import {
  useCurrentStudent,
  useMyCourses,
} from "@/src/features/student/hooks/use-student-queries";
import StudentAppShell from "@/src/features/portal/components/portal-shell";
import StudyCounter from "./study-counter";

interface OnboardingDraft {
  grade_id: number;
  stream_id: number;
}

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function formatExpiry(value: string, locale: string) {
  return formatDate(value, locale, "short");
}


function DashboardLoading({ message }: { message: string }) {
  return <GlobalLoading variant="content" message={message} />;
}

export default function StudentDashboard({ grades, streams }: { grades: GradeDto[]; streams: StreamDto[] }) {
  const locale = useLocale();
  const dashboardT = useTranslations("studentDashboard");
  const tUi = useTranslations("studentDashboard.ui");
  const tCounts = useTranslations("courseDetail");
  const tApi = useTranslations("apiErrors");
  const router = useRouter();
  const tOnboarding = useTranslations("onboarding");
  const [profileLabel, setProfileLabel] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [courseFilter, setCourseFilter] = useState<"all" | "in-progress" | "completed">("all");
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
    tApi("generic"),
    (key) => tApi(key),
  );

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  useEffect(() => {
    const clockTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const timer = window.setTimeout(() => {
      const rawDraft = localStorage.getItem("elemni-student-onboarding-v1");
      setProfileChecked(true);
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
    return () => { window.clearTimeout(timer); window.clearTimeout(clockTimer); };
  }, [grades, streams]);

  const loadDashboard = () => {
    void Promise.all([userQuery.refetch(), coursesQuery.refetch()]);
  };

  const summary = useMemo(() => {
    const items = courses?.items ?? [];
    return {
      courses: items.length,
      completed: items.filter((item) => item.progress.completion_percent === 100).length,
      lessons: items.reduce((total, item) => total + item.course.lesson_count, 0),
      minutes: items.reduce((total, item) => total + (item.course.total_duration_minutes ?? 0), 0),
    };
  }, [courses]);

  const firstName = user?.name.split(" ").filter(Boolean)[0] ?? tUi("studentFallback");
  const enrollments = courses?.items ?? [];
  const sortedEnrollments = [...enrollments].sort(
    (first, second) =>
      new Date(second.progress.last_opened_at ?? second.purchased_at).getTime() -
      new Date(first.progress.last_opened_at ?? first.purchased_at).getTime(),
  );
  const primary = sortedEnrollments.find((enrollment) => enrollment.progress.completion_percent < 100) ?? sortedEnrollments[0];
  const expiringSoon = currentTime === null ? [] : enrollments.filter((enrollment) => {
    const expiry = new Date(enrollment.expires_at).getTime();
    return expiry >= currentTime && expiry <= currentTime + 14 * 24 * 60 * 60 * 1000;
  }).sort((first, second) => new Date(first.expires_at).getTime() - new Date(second.expires_at).getTime());
  const visibleEnrollments = enrollments.filter((enrollment) => {
    if (courseFilter === "completed") return enrollment.progress.completion_percent === 100;
    if (courseFilter === "in-progress") return enrollment.progress.completion_percent < 100;
    return true;
  });

  return (
    <StudentAppShell user={user} active="dashboard">
      {loading ? (
        <DashboardLoading message={tUi("loading")} />
      ) : error ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
          <div role="alert" className="sticker-tile w-full border-2 border-red-600 bg-red-50 p-6 text-center text-sm font-bold text-red-700 dark:border-red-400 dark:bg-slate-900 dark:text-red-300">
            <CircleAlert className="mx-auto mb-3 size-7" />
            {error}
            <button onClick={() => void loadDashboard()} className="mt-4 block w-full cursor-pointer font-bold text-brand-700 hover:underline dark:text-brand-300">
              {tUi("retry")}
            </button>
          </div>
        </div>
      ) : (
        <div data-dashboard-content className="mx-auto grid max-w-[1440px] grid-cols-1 gap-x-8 gap-y-7 px-4 pb-28 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-12">
            <m.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={popSpring} className="order-1 flex flex-wrap items-start justify-between gap-4 lg:col-span-2">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                  {tUi.rich("greeting", { name: () => <MarkerHighlight color="yellow" variant={1}>{firstName}</MarkerHighlight> })}
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {tUi("intro")}
                </p>
              </div>
              {profileLabel ? (
                <Link href="/onboarding" className="sticker-badge inline-flex rotate-1 bg-amber-300 px-3 py-2 text-xs font-extrabold text-ink hover:-rotate-1 dark:bg-amber-300 dark:text-ink">{profileLabel}</Link>
              ) : profileChecked ? (
                <Link href="/onboarding" className="sticker-btn-outline inline-flex min-h-11 items-center px-4 text-xs font-black text-brand-700 dark:text-brand-300">{tOnboarding("dashboardPrompt")}</Link>
              ) : null}
            </m.header>

            {primary ? (
              <section aria-label={tUi("resume")} className="sticker-tile sticker-tile-brand order-2 overflow-hidden border-2 border-ink lg:col-start-1">
                <div className="flex min-h-[250px] flex-col sm:flex-row">
                  <div className="relative min-h-40 bg-amber-50 text-amber-700 sm:min-h-0 sm:w-44 lg:w-48">
                    <CourseCover src={primary.course.img} subject={primary.course.subject_name} alt={primary.course.title} sizes="(max-width: 639px) 100vw, 192px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                      <span>{tUi("resume")}</span>
                      {primary.course.subject_name && <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">{primary.course.subject_name}</span>}
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-2xl font-black sm:text-3xl">{primary.course.title}</h2>
                    <p className="mt-2 text-sm text-white">
                      {primary.progress.completion_percent === 0 ? tUi("startFirst") : tUi("progress", { percent: primary.progress.completion_percent })}
                      <span className="mx-2 text-white/60">·</span>{tCounts("lessons", { count: primary.course.lesson_count })}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-label={tUi("progressLabel", { percent: primary.progress.completion_percent })} aria-valuenow={primary.progress.completion_percent} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-amber-400 transition-[width] duration-700" style={{ width: `${primary.progress.completion_percent}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums">{primary.progress.completion_percent}%</span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link href={`/my-courses/${primary.course.id}`} className="sticker-badge inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink bg-amber-400 px-5 text-sm font-extrabold text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:border-sky-200 dark:shadow-[3px_3px_0_0_var(--color-sticker-shadow)]">
                        {primary.progress.completion_percent ? tUi("resume") : tUi("startLearning")}<ArrowLeft className="size-4 ltr:-scale-x-100" />
                      </Link>
                      <Link href={`/my-courses/${primary.course.id}`} className="inline-flex h-11 items-center rounded-lg border border-white/40 px-4 text-sm font-bold text-white transition hover:bg-white/10">{tUi("courseDetails")}</Link>
                      <span className="text-xs text-white">{tUi("availableUntil", { date: formatExpiry(primary.expires_at, locale) })}</span>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="sticker-tile order-2 border-2 border-ink bg-white p-7 text-center dark:border-line dark:bg-slate-900 lg:col-start-1">
                <Rocket className="mx-auto size-10 text-brand-700 dark:text-brand-300" />
                <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{tUi("journeyTitle")}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{tUi("journeyDescription")}</p>
              </section>
            )}

            <section aria-labelledby="courses-heading" className="order-4 min-w-0 lg:col-start-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="courses-heading" className="text-2xl font-black text-slate-900 dark:text-white">{tUi("courses")}</h2>
                <Link href="/my-courses" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">{tUi("viewAll")}</Link>
              </div>
              <div className="mb-4 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800" role="group" aria-label={tUi("filterCourses")}>
                {([
                  ["all", tUi("filterAll", { count: enrollments.length })],
                  ["in-progress", tUi("filterInProgress", { count: enrollments.filter((item) => item.progress.completion_percent < 100).length })],
                  ["completed", tUi("filterCompleted", { count: summary.completed })],
                ] as const).map(([filter, label]) => (
                  <button key={filter} type="button" aria-pressed={courseFilter === filter} onClick={() => setCourseFilter(filter)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${courseFilter === filter ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {visibleEnrollments.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleEnrollments.slice(0, 4).map((enrollment) => {
                    const { tone } = getSubjectArt(enrollment.course.subject_name);
                    return (
                    <Link key={enrollment.id} href={`/my-courses/${enrollment.course.id}`} aria-label={tUi("openCourse", { title: enrollment.course.title })} className="sticker-tile group overflow-hidden border-2 border-ink bg-white transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:border-line dark:bg-slate-900 dark:hover:shadow-[7px_7px_0_0_var(--color-sticker-shadow)]">
                      <div className={`relative h-20 border-b-2 border-ink sm:h-28 dark:border-line ${tone}`}>
                        <CourseCover src={enrollment.course.img} subject={enrollment.course.subject_name} alt={enrollment.course.title} sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" />
                        {enrollment.course.subject_name && <span className="sticker-badge absolute end-3 top-3 -rotate-2 bg-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-ink dark:bg-amber-300 dark:text-ink">{enrollment.course.subject_name}</span>}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{enrollment.course.title}</h3>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-slate-100 dark:border-line dark:bg-slate-700" role="progressbar" aria-label={tUi("progressLabelCard", { percent: enrollment.progress.completion_percent })} aria-valuenow={enrollment.progress.completion_percent} aria-valuemin={0} aria-valuemax={100}>
                            <div className={`h-full rounded-full ${enrollment.progress.completion_percent === 100 ? "bg-emerald-600" : "bg-brand-600"}`} style={{ width: `${enrollment.progress.completion_percent}%` }} />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{enrollment.progress.completion_percent}%</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-ink/10 pt-3 text-xs font-medium text-slate-600 dark:border-sky-300/20 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-brand-700 dark:text-brand-300" />{tCounts("lessons", { count: enrollment.course.lesson_count })}</span>
                          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-brand-700 dark:text-brand-300" />{tUi("until", { date: formatExpiry(enrollment.expires_at, locale) })}</span>
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="sticker-tile border-2 border-ink bg-white px-5 py-10 text-center dark:border-line dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{tUi("noCoursesInFilter")}</p>
                </div>
              )}
            </section>
            <section aria-label={tUi("studySummary")} className="order-3 grid grid-cols-2 gap-3 lg:col-start-2 lg:row-start-2 lg:self-start">
              {[
                { value: summary.courses, label: tUi("registeredCourses"), icon: GraduationCap },
                { value: summary.completed, label: tUi("completedCourses"), icon: BookOpen, complete: true },
                { value: summary.lessons, label: tUi("availableLessons"), icon: BookOpen },
                { value: Math.round(summary.minutes / 60), label: tUi("contentHours"), icon: Clock3 },
              ].map(({ value, label, icon: Icon, complete }) => (
                <div key={label} className="sticker-tile min-h-[92px] rounded-xl border-2 border-ink bg-white p-4 dark:border-line dark:bg-slate-900">
                  <span className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"><span>{label}</span><Icon className="size-4 text-slate-400 dark:text-slate-500" aria-hidden="true" /></span>
                  <StudyCounter value={value} className={`mt-2 block text-2xl font-extrabold tabular-nums ${complete ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`} />
                </div>
              ))}
            </section>

            {expiringSoon.length > 0 && <section id="upcoming" aria-labelledby="upcoming-heading" className="sticker-tile order-5 scroll-mt-24 border-2 border-ink bg-white p-5 dark:border-line dark:bg-slate-900 lg:col-start-2 lg:row-start-3 lg:self-start">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 id="upcoming-heading" className="text-lg font-extrabold text-slate-900 dark:text-white">{dashboardT("upcomingTitle")}</h2>
                <Link href="/my-courses" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">{dashboardT("allMyCourses")}</Link>
              </div>
              {expiringSoon.length ? (
                <ul className="space-y-4">
                  {expiringSoon.map((enrollment) => (
                    <li key={enrollment.id}>
                      <Link href={`/my-courses/${enrollment.course.id}`} className="flex items-center gap-3 rounded-lg transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:hover:bg-slate-800">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><CalendarDays className="size-5" aria-hidden="true" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{enrollment.course.title}</span><span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{dashboardT("endsIn", { relative: formatRelativeDays(enrollment.expires_at, locale) })}<span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{formatDate(enrollment.expires_at, locale, "long")}</span></span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{tUi("noUpcoming")}</p>
              )}
            </section>}
        </div>
      )}
    </StudentAppShell>
  );
}
