"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GraduationCap,
  Rocket,
} from "lucide-react";
import { GlobalLoading } from "@/src/components/ui/global-loading";
import { m } from "motion/react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { portalContainerVariants, portalItemVariants } from "./dashboard-motion";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import { resolveAssetUrl } from "@/src/lib/asset-url";
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

interface OnboardingDraft {
  grade_id: number;
  stream_id: number;
}

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
      {loading ? <DashboardLoading /> : error ? (
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4"><div role="alert" className="w-full rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm font-bold text-red-700"><CircleAlert className="mx-auto mb-3 size-7" />{error}<button onClick={() => void loadDashboard()} className="mt-4 block w-full cursor-pointer text-[#0369A1] hover:underline">إعادة المحاولة</button></div></div>
        ) : (
        <m.div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" initial="hidden" animate="show" variants={portalContainerVariants}>
          <m.header variants={portalItemVariants}>
            <h1 className="text-2xl font-black sm:text-3xl">أهلاً {firstName}</h1>
            <p className="mt-1 text-sm text-[#777587]">جاهز تكمل مذاكرتك؟</p>
            {profileLabel && <span className="mt-3 inline-flex rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-bold text-[#0369A1]">{profileLabel}</span>}
          </m.header>

          {primary ? (
            <m.section variants={portalItemVariants} className="grid overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white md:grid-cols-[1fr_260px]">
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#F0F9FF] px-3 py-1 text-xs font-bold text-[#0369A1]"><GraduationCap className="size-4" />أحدث كورس مشترك</span>
                <h2 className="text-2xl font-black leading-9 sm:text-4xl">كمّل مذاكرتك</h2>
                <p className="mt-2 text-lg font-bold text-[#0284C7]">{primary.course.title}</p>
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[#777587]">{primary.course.description || `${primary.course.lesson_count} درس متاح ضمن اشتراكك الحالي.`}</p>
                <div className="mt-6 max-w-xl">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#777587]">
                    <span>{primary.progress.completion_percent ? "نسبة إنجازك" : "لم تبدأ الكورس بعد"}</span>
                    <span>{primary.progress.completion_percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#E0F2FE]" aria-label={`نسبة إنجاز ${primary.progress.completion_percent}%`}>
                    <div className="h-full rounded-full bg-[#0284C7] transition-[width]" style={{ width: `${primary.progress.completion_percent}%` }} />
                  </div>
                </div>
                <Link href={`/my-courses/${primary.course.id}`} className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[#0284C7] px-6 text-sm font-bold text-white hover:bg-[#0369A1]">{primary.progress.completion_percent ? "كمّل من حيث توقفت" : "ابدأ الكورس"}<ArrowLeft className="size-4" /></Link>
              </div>
              <m.div className="relative min-h-52 bg-[#F0F9FF] md:min-h-full" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}><Image src={resolveAssetUrl(primary.course.img, lessonFallback.src)} alt={primary.course.title} fill loading="eager" sizes="(max-width: 767px) 100vw, 260px" className="object-cover" /></m.div>
            </m.section>
          ) : (
            <m.section variants={portalItemVariants} className="border-y border-[#E2E0EF] py-12 text-center sm:py-16">
              <Rocket className="mx-auto size-12 text-[#0284C7]" />
              <h2 className="mt-5 text-2xl font-black sm:text-3xl">لا توجد بيانات دراسة بعد</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#777587]">ستظهر مؤشرات التقدم والملخصات هنا بعد الاشتراك في أحد الكورسات.</p>
            </m.section>
          )}

          <m.section variants={portalItemVariants} aria-labelledby="summary-heading">
            <div className="mb-4 flex items-center justify-between"><h2 id="summary-heading" className="text-xl font-black">ملخص دراستك</h2><Link href="/my-courses" className="text-sm font-bold text-[#0369A1] hover:underline">عرض دوراتي</Link></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ value: summary.courses, label: "كورسات نشطة", icon: GraduationCap }, { value: summary.lessons, label: "دروس متاحة", icon: CheckCircle2 }, { value: formatDuration(summary.minutes), label: "إجمالي مدة المحتوى", icon: Clock3 }].map(({ value, label, icon: Icon }) => (
                <article key={label} className="flex items-center gap-4 rounded-xl border border-[#E2E0EF] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(2,132,199,0.08)] motion-reduce:hover:translate-y-0 motion-reduce:transition-none"><span className="flex size-11 items-center justify-center rounded-full bg-[#F0F9FF] text-[#0284C7]"><Icon className="size-5" /></span><span><strong className="block text-2xl font-black">{value}</strong><span className="text-xs text-[#777587]">{label}</span></span></article>
              ))}
            </div>
          </m.section>

          <m.div variants={portalItemVariants} className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
            <section aria-labelledby="courses-heading">
              <div className="mb-4 flex items-center justify-between"><h2 id="courses-heading" className="text-xl font-black">دوراتي الحالية</h2><Link href="/my-courses" className="text-sm font-bold text-[#0369A1] hover:underline">عرض الكل</Link></div>
              {enrollments.length ? <div className="grid gap-4 sm:grid-cols-2">
                {enrollments.slice(0, 4).map((enrollment) => <Link key={enrollment.id} href={`/my-courses/${enrollment.course.id}`} aria-label={`فتح كورس ${enrollment.course.title}`} className="group overflow-hidden rounded-xl border border-[#E2E0EF] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#BAE6FD] hover:shadow-[0_8px_20px_rgba(2,132,199,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 motion-reduce:transition-none">
                  <div className="relative aspect-video bg-[#F0F9FF]"><Image src={resolveAssetUrl(enrollment.course.img, lessonFallback.src)} alt={enrollment.course.title} fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" /></div>
                  <div className="p-4"><p className="text-xs font-bold text-[#0284C7]">{enrollment.course.subject_name || "كورس تعليمي"}</p><h3 className="mt-1 line-clamp-2 min-h-12 text-lg font-black leading-6 transition-colors group-hover:text-[#0369A1]">{enrollment.course.title}</h3><div className="mt-4"><div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#777587]"><span>التقدم</span><span>{enrollment.progress.completion_percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#E0F2FE]"><div className="h-full rounded-full bg-[#0284C7]" style={{ width: `${enrollment.progress.completion_percent}%` }} /></div></div><div className="mt-4 flex flex-wrap gap-3 border-t border-[#E2E0EF] pt-3 text-xs text-[#777587]"><span className="flex items-center gap-1"><BookOpen className="size-4" />{enrollment.course.lesson_count} درس</span><span className="flex items-center gap-1"><CalendarClock className="size-4" />حتى {formatExpiry(enrollment.expires_at)}</span></div></div>
                </Link>)}
              </div> : <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-[#E2E0EF] bg-white text-center"><BookOpen className="mb-3 size-8 text-[#C7C4D8]" /><p className="font-black">لا توجد كورسات حالياً</p><p className="mt-2 text-xs text-[#777587]">ستظهر الكورسات المشتركة هنا مع مؤشرات تقدمها.</p></div>}
            </section>

            <aside className="rounded-xl border border-[#E2E0EF] bg-white p-5">
              <h2 className="text-lg font-black">خطوتك التالية</h2>
              {primary ? <div className="mt-5 border-y border-[#E2E0EF] py-5"><p className="text-sm font-bold text-[#1B1B24]">استكمل التعلم في</p><p className="mt-2 line-clamp-2 text-sm font-black text-[#0369A1]">{primary.course.title}</p><p className="mt-3 text-xs leading-5 text-[#777587]">{primary.progress.completion_percent === 100 ? "أتممت كل محتوى الكورس." : "ارجع إلى الكورس وتابع من آخر محتوى فتحته."}</p><Link href={`/my-courses/${primary.course.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#0369A1] hover:underline">فتح الكورس<ArrowLeft className="size-4" /></Link></div> : <div className="mt-5 flex min-h-36 flex-col items-center justify-center border-y border-[#E2E0EF] text-center"><p className="text-sm font-bold">لا توجد كورسات نشطة حالياً</p><p className="mt-1 text-xs leading-5 text-[#777587]">ابدأ بكورس جديد لتظهر خطواتك هنا.</p></div>}
            </aside>
          </m.div>

        </m.div>
        )}
    </StudentAppShell>
  );
}
