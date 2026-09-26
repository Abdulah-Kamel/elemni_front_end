"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Calculator,
  CalendarDays,
  CircleAlert,
  Clock3,
  Cpu,
  GraduationCap,
  Leaf,
  NotebookPen,
  Rocket,
} from "lucide-react";
import { GlobalLoading } from "@/src/components/ui/global-loading";
import ImageWithFallback from "@/src/components/ui/image-with-fallback";
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
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import StudentAppShell from "@/src/features/portal/components/portal-shell";
import StudyCounter from "./study-counter";

interface OnboardingDraft {
  grade_id: number;
  stream_id: number;
}

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function formatExpiry(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

function getCourseArtwork(subject: string | null) {
  const value = subject?.toLocaleLowerCase() ?? "";
  if (value.includes("رياض") || value.includes("math")) return { Icon: Calculator, tone: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" };
  if (value.includes("أحيا") || value.includes("احيا") || value.includes("biology")) return { Icon: Leaf, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" };
  if (value.includes("فيزي") || value.includes("physics")) return { Icon: Atom, tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" };
  if (value.includes("كمبيوتر") || value.includes("computer") || value.includes("برمج")) return { Icon: Cpu, tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" };
  return { Icon: BookOpen, tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" };
}

function DashboardLoading() {
  return <GlobalLoading variant="content" message="جاري تجهيز صفحتك..." />;
}

export default function StudentDashboard({ grades, streams }: { grades: GradeDto[]; streams: StreamDto[] }) {
  const locale = useLocale();
  const router = useRouter();
  const tOnboarding = useTranslations("onboarding");
  const [profileLabel, setProfileLabel] = useState("");
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
    "تعذر تحميل بيانات الصفحة الرئيسية حالياً.",
  );

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  useEffect(() => {
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
    return () => window.clearTimeout(timer);
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

  const firstName = user?.name.split(" ").filter(Boolean)[0] ?? "طالبنا";
  const enrollments = courses?.items ?? [];
  const sortedEnrollments = [...enrollments].sort(
    (first, second) =>
      new Date(second.progress.last_opened_at ?? second.purchased_at).getTime() -
      new Date(first.progress.last_opened_at ?? first.purchased_at).getTime(),
  );
  const primary = sortedEnrollments.find((enrollment) => enrollment.progress.completion_percent < 100) ?? sortedEnrollments[0];
  const expiringSoon = [...enrollments]
    .sort((first, second) => new Date(first.expires_at).getTime() - new Date(second.expires_at).getTime())
    .slice(0, 4);
  const visibleEnrollments = enrollments.filter((enrollment) => {
    if (courseFilter === "completed") return enrollment.progress.completion_percent === 100;
    if (courseFilter === "in-progress") return enrollment.progress.completion_percent < 100;
    return true;
  });

  return (
    <StudentAppShell user={user} active="dashboard">
      {loading ? (
        <DashboardLoading />
      ) : error ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
          <div role="alert" className="sticker-tile w-full border-2 border-red-600 bg-red-50 p-6 text-center text-sm font-bold text-red-700 dark:border-red-400 dark:bg-slate-900 dark:text-red-300">
            <CircleAlert className="mx-auto mb-3 size-7" />
            {error}
            <button onClick={() => void loadDashboard()} className="mt-4 block w-full cursor-pointer font-bold text-brand-700 hover:underline dark:text-brand-300">
              إعادة المحاولة
            </button>
          </div>
        </div>
      ) : (
        <div data-dashboard-content className="mx-auto grid max-w-[1440px] grid-cols-1 gap-x-8 gap-y-7 px-4 pb-28 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-12">
            <m.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={popSpring} className="order-1 flex flex-wrap items-start justify-between gap-4 lg:col-span-2">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                  أهلاً يا <MarkerHighlight color="yellow" variant={1}>{firstName}</MarkerHighlight>
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  تابع تقدّم كورساتك ومواعيد انتهاء اشتراكاتك.
                </p>
              </div>
              {profileLabel ? (
                <Link href="/onboarding" className="sticker-badge inline-flex rotate-1 bg-amber-300 px-3 py-2 text-xs font-extrabold text-ink hover:-rotate-1 dark:bg-amber-300 dark:text-ink">{profileLabel}</Link>
              ) : profileChecked ? (
                <Link href="/onboarding" className="sticker-btn-outline inline-flex min-h-11 items-center px-4 text-xs font-black text-brand-700 dark:text-brand-300">{tOnboarding("dashboardPrompt")}</Link>
              ) : null}
            </m.header>

            {primary ? (
              <section aria-label="تابع التعلّم" className="sticker-tile sticker-tile-brand order-2 overflow-hidden border-2 border-ink lg:col-start-1">
                <div className="flex min-h-[250px] flex-col sm:flex-row">
                  <div className="relative min-h-40 bg-amber-50 text-amber-700 sm:min-h-0 sm:w-44 lg:w-48">
                    {primary.course.img ? (
                      <ImageWithFallback src={primary.course.img} fallbackSrc={lessonFallback} alt={primary.course.title} fill sizes="(max-width: 639px) 100vw, 192px" className="object-cover" />
                    ) : (
                      <div className="flex h-full min-h-40 items-center justify-center"><NotebookPen className="size-12" strokeWidth={1.7} /></div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                      <span>تابع التعلّم</span>
                      {primary.course.subject_name && <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">{primary.course.subject_name}</span>}
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-2xl font-black sm:text-3xl">{primary.course.title}</h2>
                    <p className="mt-2 text-sm text-white">
                      {primary.progress.completion_percent === 0 ? "ابدأ أول درس في الكورس" : `تقدّمك في الكورس ${primary.progress.completion_percent}%`}
                      <span className="mx-2 text-white/60">·</span>{primary.course.lesson_count} درس
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-label={`نسبة إنجاز ${primary.progress.completion_percent}%`} aria-valuenow={primary.progress.completion_percent} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-amber-400 transition-[width] duration-700" style={{ width: `${primary.progress.completion_percent}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums">{primary.progress.completion_percent}%</span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link href={`/my-courses/${primary.course.id}`} className="sticker-badge inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink bg-amber-400 px-5 text-sm font-extrabold text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:border-sky-200 dark:shadow-[3px_3px_0_0_#020617]">
                        {primary.progress.completion_percent ? "تابع التعلّم" : "ابدأ التعلّم"}<ArrowLeft className="size-4" />
                      </Link>
                      <Link href={`/my-courses/${primary.course.id}`} className="inline-flex h-11 items-center rounded-lg border border-white/40 px-4 text-sm font-bold text-white transition hover:bg-white/10">تفاصيل الكورس</Link>
                      <span className="text-xs text-white">متاح حتى {formatExpiry(primary.expires_at, locale)}</span>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="sticker-tile order-2 border-2 border-ink bg-white p-7 text-center dark:border-sky-300 dark:bg-slate-900 lg:col-start-1">
                <Rocket className="mx-auto size-10 text-brand-700 dark:text-brand-300" />
                <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">ابدأ رحلتك التعليمية</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">ستظهر كورساتك ومؤشرات التقدم هنا بعد الاشتراك في أحد الكورسات.</p>
              </section>
            )}

            <section aria-labelledby="courses-heading" className="order-4 min-w-0 lg:col-start-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="courses-heading" className="text-2xl font-black text-slate-900 dark:text-white">كورساتي</h2>
                <Link href="/my-courses" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">عرض الكل</Link>
              </div>
              <div className="mb-4 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800" role="group" aria-label="تصفية الكورسات">
                {([
                  ["all", `الكل (${enrollments.length})`],
                  ["in-progress", `قيد التقدّم (${enrollments.filter((item) => item.progress.completion_percent < 100).length})`],
                  ["completed", `مكتملة (${summary.completed})`],
                ] as const).map(([filter, label]) => (
                  <button key={filter} type="button" aria-pressed={courseFilter === filter} onClick={() => setCourseFilter(filter)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${courseFilter === filter ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {visibleEnrollments.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleEnrollments.slice(0, 4).map((enrollment) => {
                    const { Icon: ArtworkIcon, tone } = getCourseArtwork(enrollment.course.subject_name);
                    return (
                    <Link key={enrollment.id} href={`/my-courses/${enrollment.course.id}`} aria-label={`فتح كورس ${enrollment.course.title}`} className="sticker-tile group overflow-hidden border-2 border-ink bg-white transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:border-sky-300 dark:bg-slate-900 dark:hover:shadow-[7px_7px_0_0_#020617]">
                      <div className={`relative h-20 border-b-2 border-ink sm:h-28 dark:border-sky-300 ${tone}`}>
                        {enrollment.course.img ? <ImageWithFallback src={enrollment.course.img} fallbackSrc={lessonFallback} alt={enrollment.course.title} fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><ArtworkIcon className="size-9" strokeWidth={1.7} /></div>}
                        {enrollment.course.subject_name && <span className="sticker-badge absolute end-3 top-3 -rotate-2 bg-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-ink dark:bg-amber-300 dark:text-ink">{enrollment.course.subject_name}</span>}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{enrollment.course.title}</h3>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-slate-100 dark:border-sky-300 dark:bg-slate-700" role="progressbar" aria-label={`نسبة الإنجاز ${enrollment.progress.completion_percent}%`} aria-valuenow={enrollment.progress.completion_percent} aria-valuemin={0} aria-valuemax={100}>
                            <div className={`h-full rounded-full ${enrollment.progress.completion_percent === 100 ? "bg-emerald-600" : "bg-brand-600"}`} style={{ width: `${enrollment.progress.completion_percent}%` }} />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{enrollment.progress.completion_percent}%</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-ink/10 pt-3 text-xs font-medium text-slate-600 dark:border-sky-300/20 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-brand-700 dark:text-brand-300" />{enrollment.course.lesson_count} درس</span>
                          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-brand-700 dark:text-brand-300" />حتى {formatExpiry(enrollment.expires_at, locale)}</span>
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="sticker-tile border-2 border-ink bg-white px-5 py-10 text-center dark:border-sky-300 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">لا توجد كورسات ضمن هذا التصنيف.</p>
                </div>
              )}
            </section>
            <section aria-label="ملخص دراستك" className="order-3 grid grid-cols-2 gap-3 lg:col-start-2 lg:row-start-2 lg:self-start">
              {[
                { value: summary.courses, label: "كورسات مسجّلة", icon: GraduationCap },
                { value: summary.completed, label: "كورسات مكتملة", icon: BookOpen, complete: true },
                { value: summary.lessons, label: "دروس متاحة", icon: BookOpen },
                { value: Math.round(summary.minutes / 60), label: "ساعات المحتوى", icon: Clock3 },
              ].map(({ value, label, icon: Icon, complete }) => (
                <div key={label} className="sticker-tile min-h-[92px] rounded-xl border-2 border-ink bg-white p-4 dark:border-sky-300 dark:bg-slate-900">
                  <span className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600 dark:text-slate-300"><span>{label}</span><Icon className="size-4 text-slate-400 dark:text-slate-500" aria-hidden="true" /></span>
                  <StudyCounter value={value} className={`mt-2 block text-2xl font-extrabold tabular-nums ${complete ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`} />
                </div>
              ))}
            </section>

            <section id="upcoming" aria-labelledby="upcoming-heading" className="sticker-tile order-5 scroll-mt-24 border-2 border-ink bg-white p-5 dark:border-sky-300 dark:bg-slate-900 lg:col-start-2 lg:row-start-3 lg:self-start">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 id="upcoming-heading" className="text-lg font-extrabold text-slate-900 dark:text-white">ينتهي الوصول قريباً</h2>
                <Link href="/my-courses" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">التقويم</Link>
              </div>
              {expiringSoon.length ? (
                <ul className="space-y-4">
                  {expiringSoon.map((enrollment) => (
                    <li key={enrollment.id}>
                      <Link href={`/my-courses/${enrollment.course.id}`} className="flex items-center gap-3 rounded-lg transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:hover:bg-slate-800">
                        <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><span className="text-base font-extrabold leading-5 tabular-nums">{new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric" }).format(new Date(enrollment.expires_at))}</span><span className="text-[9px] font-semibold">{new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "short" }).format(new Date(enrollment.expires_at))}</span></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{enrollment.course.title}</span><span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{enrollment.progress.completion_percent === 100 ? "مكتمل · متاح للمراجعة" : "متاح ضمن اشتراكك"}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">لا توجد اشتراكات تنتهي قريباً.</p>
              )}
            </section>
        </div>
      )}
    </StudentAppShell>
  );
}
