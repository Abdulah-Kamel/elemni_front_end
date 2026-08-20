"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CircleAlert,
  Clock3,
  Compass,
  GraduationCap,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { GlobalLoading } from "@/src/components/ui/global-loading";
import { Link, useRouter } from "@/src/i18n/navigation";
import { AnimatePresence, m } from "motion/react";
import { portalCardLiftClass, portalContainerVariants, portalImageZoomClass, portalItemVariants } from "./dashboard-motion";
import type { EnrollmentDto, MyCoursesDto, UserDto } from "@/src/lib/student-api/contract";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import DashboardShell from "./dashboard-shell";

type CourseSort = "recent" | "expiring" | "title";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعات`;
}

function CourseRow({ enrollment }: { enrollment: EnrollmentDto }) {
  const { course } = enrollment;

  return (
    <article className={`group flex flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white ${portalCardLiftClass} hover:border-[#BAE6FD] hover:shadow-[0_4px_12px_rgba(2,132,199,0.04)] md:min-h-56 md:flex-row-reverse`}>
      <div className="relative aspect-video shrink-0 overflow-hidden bg-[#F0F9FF] md:aspect-auto md:w-60">
        <Image
          src={course.img || lessonFallback}
          alt={course.title}
          fill
          sizes="(max-width: 767px) 100vw, 240px"
          className={`object-cover ${portalImageZoomClass}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#0284C7]/5 px-3 py-1 text-xs font-bold text-[#0369A1]">{course.subject_name || "كورس تعليمي"}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">اشتراك نشط</span>
        </div>

        <h2 className="mt-3 text-xl font-black leading-8 text-[#1B1B24] transition-colors group-hover:text-[#0369A1] sm:text-2xl">{course.title}</h2>
        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[#777587]">{course.description || `${course.lesson_count} درس متاح ضمن اشتراكك الحالي.`}</p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E2E0EF] pt-4 text-xs font-bold text-[#777587]">
          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-[#0284C7]" />{course.lesson_count} درس</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-[#0284C7]" />{formatDuration(course.total_duration_minutes)}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4 text-[#0284C7]" />متاح حتى {formatDate(enrollment.expires_at)}</span>
        </div>

        <Link href={`/courses/${course.id}`} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-6 text-sm font-black text-white transition-colors hover:bg-[#0369A1] sm:w-fit">
          فتح الكورس<ArrowLeft className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export default function MyCourses() {
  const router = useRouter();
  const [data, setData] = useState<MyCoursesDto | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [sort, setSort] = useState<CourseSort>("recent");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    const [coursesResponse, userResponse] = await Promise.all([
      fetch("/api/student/my-courses", { cache: "no-store" }).catch(() => null),
      fetch("/api/student/auth/me", { cache: "no-store" }).catch(() => null),
    ]);
    if (coursesResponse?.status === 401 || userResponse?.status === 401) {
      router.replace("/login");
      return;
    }
    if (!coursesResponse?.ok) {
      const body = await coursesResponse?.json().catch(() => null);
      setError(body?.detail ?? "تعذر تحميل كورساتك حالياً.");
      setLoading(false);
      return;
    }
    setData(await coursesResponse.json());
    if (userResponse?.ok) setUser(await userResponse.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourses(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCourses]);

  const enrollments = data?.items ?? [];
  const subjects = Array.from(new Set(enrollments.map((item) => item.course.subject_name).filter((value): value is string => Boolean(value))));
  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const visibleCourses = enrollments
    .filter(({ course }) => {
      const matchesSubject = subject === "all" || course.subject_name === subject;
      const haystack = [course.title, course.description, course.subject_name].filter(Boolean).join(" ").toLocaleLowerCase("ar");
      return matchesSubject && (!normalizedSearch || haystack.includes(normalizedSearch));
    })
    .sort((first, second) => {
      if (sort === "expiring") return new Date(first.expires_at).getTime() - new Date(second.expires_at).getTime();
      if (sort === "title") return first.course.title.localeCompare(second.course.title, "ar");
      return new Date(second.purchased_at).getTime() - new Date(first.purchased_at).getTime();
    });

  const visibleEnrollmentIdsKey = visibleCourses.map(({ id }) => id).join("-");

  const totalLessons = enrollments.reduce((sum, item) => sum + item.course.lesson_count, 0);
  const totalMinutes = enrollments.reduce((sum, item) => sum + (item.course.total_duration_minutes ?? 0), 0);
  const hasFilters = Boolean(search) || subject !== "all";

  return (
    <DashboardShell user={user} active="courses">
      {loading ? (
        <GlobalLoading variant="content" message="جاري تحميل كورساتك..." />
      ) : error ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <div role="alert" className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-bold text-red-700">
            <CircleAlert className="mx-auto mb-3 size-8" />
            <p>{error}</p>
            <button type="button" onClick={() => void loadCourses()} className="mt-4 cursor-pointer text-[#0369A1] hover:underline">إعادة المحاولة</button>
          </div>
        </div>
      ) : (
        <m.div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" initial="hidden" animate="show" variants={portalContainerVariants}>
          <m.header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between" variants={portalItemVariants}>
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#F0F9FF] px-3 py-1.5 text-xs font-black text-[#0369A1]"><GraduationCap className="size-4" />مكتبة الطالب</span>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">دوراتي</h1>
              <p className="mt-2 text-sm leading-6 text-[#777587]">كل اشتراكاتك النشطة ومحتواك التعليمي في مكان واحد.</p>
            </div>
            <Link href="/explore" className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-[#BAE6FD] bg-white px-5 text-sm font-black text-[#0369A1] transition hover:bg-[#E0F2FE]"><Compass className="size-4" />استكشف كورسات جديدة</Link>
          </m.header>

          {!!enrollments.length && (
            <m.section className="mt-8 grid grid-cols-3 gap-2 sm:gap-3" aria-label="ملخص الكورسات" variants={portalItemVariants}>
              {[
                { label: "كورسات نشطة", value: enrollments.length, icon: GraduationCap },
                { label: "إجمالي الدروس", value: totalLessons, icon: BookOpen },
                { label: "مدة المحتوى", value: formatDuration(totalMinutes || null), icon: Clock3 },
              ].map(({ label, value, icon: Icon }) => (
                <article key={label} className="flex min-h-24 flex-col justify-center gap-2 rounded-2xl border border-[#E2E0EF] bg-white p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F9FF] text-[#0284C7] sm:size-11"><Icon className="size-4 sm:size-5" /></span>
                  <span><strong className="block text-lg font-black sm:text-2xl">{value}</strong><span className="block text-[10px] font-medium leading-4 text-[#777587] sm:text-xs">{label}</span></span>
                </article>
              ))}
            </m.section>
          )}

          {!!enrollments.length && (
            <m.section className="mt-8 border-y border-[#E2E0EF] py-4" aria-label="فلترة الكورسات" variants={portalItemVariants}>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
                <label className="relative block">
                  <span className="sr-only">ابحث في كورساتك</span>
                  <Search className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-[#777587]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الكورس أو المادة..." className="h-11 w-full rounded-lg border border-[#E2E0EF] bg-white pe-11 ps-4 text-sm outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/10" />
                </label>

                <label className="relative block">
                  <span className="sr-only">فلترة حسب المادة</span>
                  <SlidersHorizontal className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[#777587]" />
                  <select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#E2E0EF] bg-white pe-10 ps-4 text-sm font-bold outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/10">
                    <option value="all">كل المواد</option>
                    {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  <span className="sr-only">ترتيب الكورسات</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value as CourseSort)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/10">
                    <option value="recent">الأحدث اشتراكاً</option>
                    <option value="expiring">الأقرب انتهاءً</option>
                    <option value="title">حسب الاسم</option>
                  </select>
                </label>
              </div>
            </m.section>
          )}

          <m.section className="mt-8" aria-labelledby="courses-heading" variants={portalItemVariants}>
            {!!enrollments.length && (
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="courses-heading" className="text-xl font-black">كورساتك الحالية</h2>
                <span className="text-xs font-bold text-[#777587]">{visibleCourses.length} من {enrollments.length}</span>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {visibleCourses.length ? (
                <m.div key={`results-${visibleEnrollmentIdsKey}`} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {visibleCourses.map((enrollment) => (
                    <m.div key={enrollment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                      <CourseRow enrollment={enrollment} />
                    </m.div>
                  ))}
                </m.div>
              ) : enrollments.length ? (
                <m.div key="no-match" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white px-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Search className="mb-4 size-9 text-[#C7C4D8]" />
                  <h2 className="text-lg font-black">لا توجد نتائج مطابقة</h2>
                  <p className="mt-2 text-sm text-[#777587]">جرّب كلمة بحث مختلفة أو اعرض كل المواد.</p>
                  {hasFilters && <button type="button" onClick={() => { setSearch(""); setSubject("all"); }} className="mt-4 cursor-pointer text-sm font-black text-[#0369A1] hover:underline">مسح الفلاتر</button>}
                </m.div>
              ) : (
                <m.div key="empty" className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white px-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F0F9FF] text-[#0284C7]"><BookOpen className="size-7" /></span>
                  <h2 className="mt-5 text-xl font-black">لا توجد اشتراكات نشطة</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#777587]">استكشف المدرسين واختر الكورس المناسب لسنتك وشعبتك.</p>
                  <Link href="/explore" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0284C7] px-6 text-sm font-black text-white hover:bg-[#0369A1]">استكشف الكورسات<ArrowLeft className="size-4" /></Link>
                </m.div>
              )}
            </AnimatePresence>
          </m.section>
        </m.div>
      )}
    </DashboardShell>
  );
}
