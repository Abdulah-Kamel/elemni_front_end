"use client";

import { useEffect, useState } from "react";
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
import ImageWithFallback from "@/src/components/ui/image-with-fallback";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { Pagination } from "@/src/components/ui/pagination";
import { clampPage, pageCount } from "@/src/components/ui/pagination-range";
import { Link, useRouter } from "@/src/i18n/navigation";
import { AnimatePresence, m } from "motion/react";
import type { EnrollmentDto } from "@/src/lib/student-api/contract";
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

type CourseSort = "recent" | "expiring" | "title";

const COURSES_PER_PAGE = 9;
const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

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

function CourseCard({ enrollment, index }: { enrollment: EnrollmentDto; index: number }) {
  const { course } = enrollment;

  return (
    <m.div
      className="h-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ ...popSpring, delay: 0.05 * (index % 6) }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link href={`/my-courses/${course.id}`} aria-label={`فتح كورس ${course.title}`} className="sticker-tile group flex h-full flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        <div className="relative aspect-video shrink-0 overflow-hidden border-b-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800">
          <ImageWithFallback
            src={course.img}
            fallbackSrc={lessonFallback}
            alt={course.title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sticker-badge -rotate-1 bg-amber-300 px-3 py-1 text-xs font-black text-ink">{course.subject_name || "كورس تعليمي"}</span>
            <span className="sticker-badge bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">اشتراك نشط</span>
          </div>

          <h2 className="mt-3 text-xl font-black leading-8 text-ink transition-colors group-hover:text-brand-700 sm:text-2xl dark:text-slate-50 dark:group-hover:text-brand-300">{course.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 font-medium text-muted dark:text-slate-400">{course.description || `${course.lesson_count} درس متاح ضمن اشتراكك الحالي.`}</p>

          <div className="mt-5 mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-muted dark:text-slate-400">
              <span>التقدم في الكورس</span>
              <StudyCounter value={enrollment.progress.completion_percent} format={(n) => `${n}%`} className="sticker-numeral" />
            </div>
            <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800">
              <m.div
                className="h-full rounded-full bg-brand-600"
                initial={{ width: 0 }}
                animate={{ width: `${enrollment.progress.completion_percent}%` }}
                transition={{ ...popSpring, delay: 0.2 }}
              />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-ink/10 pt-4 text-xs font-black text-muted dark:border-white/10 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-brand-600 dark:text-brand-300" />{course.lesson_count} درس</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-brand-600 dark:text-brand-300" />{formatDuration(course.total_duration_minutes)}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4 text-brand-600 dark:text-brand-300" />متاح حتى {formatDate(enrollment.expires_at)}</span>
          </div>

        </div>
      </Link>
    </m.div>
  );
}

export default function MyCourses() {
  const router = useRouter();
  const coursesQuery = useMyCourses();
  const userQuery = useCurrentStudent();
  const data = coursesQuery.data;
  const user = userQuery.data ?? null;
  const unauthorized =
    isStudentUnauthorized(coursesQuery.error) ||
    isStudentUnauthorized(userQuery.error);
  const loading = coursesQuery.isPending || userQuery.isPending;
  const error = getStudentErrorMessage(
    coursesQuery.error ?? userQuery.error,
    "تعذر تحميل كورساتك حالياً.",
  );
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [sort, setSort] = useState<CourseSort>("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  const loadCourses = () => {
    void Promise.all([coursesQuery.refetch(), userQuery.refetch()]);
  };

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

  const totalPages = pageCount(visibleCourses.length, COURSES_PER_PAGE);
  const currentPage = clampPage(page, totalPages);
  const pageCourses = visibleCourses.slice((currentPage - 1) * COURSES_PER_PAGE, currentPage * COURSES_PER_PAGE);
  const visibleEnrollmentIdsKey = pageCourses.map(({ id }) => id).join("-");

  const totalLessons = enrollments.reduce((sum, item) => sum + item.course.lesson_count, 0);
  const totalMinutes = enrollments.reduce((sum, item) => sum + (item.course.total_duration_minutes ?? 0), 0);
  const hasFilters = Boolean(search) || subject !== "all";

  return (
    <StudentAppShell user={user} active="courses">
      {loading ? (
        <GlobalLoading variant="content" message="جاري تحميل كورساتك..." />
      ) : error ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <div role="alert" className="sticker-tile w-full border-red-600 bg-red-50 p-6 text-center text-sm font-black text-red-700 dark:border-red-400 dark:bg-red-500/10 dark:text-red-300">
            <CircleAlert className="mx-auto mb-3 size-8" />
            <p>{error}</p>
            <button type="button" onClick={() => void loadCourses()} className="mt-4 cursor-pointer font-black text-brand-700 hover:underline dark:text-brand-300">إعادة المحاولة</button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <m.header
            className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={popSpring}
          >
            <div>
              <h1 className="text-5xl font-black tracking-tight text-ink sm:text-6xl dark:text-slate-50">
                <MarkerHighlight color="yellow" variant={1}>
                  كورساتى
                </MarkerHighlight>
              </h1>
              <p className="mt-3 max-w-[65ch] text-sm leading-7 font-medium text-muted dark:text-slate-400">كل اشتراكاتك النشطة ومحتواك التعليمي في مكان واحد.</p>
            </div>
            <m.div whileHover={{ scale: 1.04, rotate: 1 }} whileTap={{ scale: 0.95 }} transition={popSpring} className="w-fit">
              <Link href="/explore" className="sticker-btn-outline inline-flex h-12 items-center gap-2 px-6 text-sm font-black text-brand-700 dark:text-brand-300"><Compass className="size-4" />استكشف كورسات جديدة</Link>
            </m.div>
          </m.header>

          {!!enrollments.length && (
            <m.section
              className="sticker-tile mt-8 flex flex-col divide-y-2 divide-ink/10 px-6 py-2 sm:flex-row sm:items-center sm:divide-x-2 sm:divide-x-reverse sm:divide-y-0 dark:divide-white/10"
              aria-label="ملخص الكورسات"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...popSpring, delay: 0.1 }}
            >
              {[
                { label: "كورسات نشطة", value: enrollments.length, icon: GraduationCap, format: undefined as ((n: number) => string) | undefined },
                { label: "إجمالي الدروس", value: totalLessons, icon: BookOpen, format: undefined as ((n: number) => string) | undefined },
                { label: "مدة المحتوى", value: totalMinutes, icon: Clock3, format: (n: number) => formatDuration(n || null) },
              ].map(({ label, value, icon: Icon, format }) => (
                <div key={label} className="flex flex-1 items-center gap-4 py-4 sm:justify-center sm:py-5">
                  <span className="sticker-badge flex size-11 shrink-0 items-center justify-center bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><Icon className="size-5" /></span>
                  <span>
                    <StudyCounter value={value} format={format} className="sticker-numeral block text-3xl font-black text-ink dark:text-slate-50" />
                    <span className="text-xs font-black text-muted dark:text-slate-400">{label}</span>
                  </span>
                </div>
              ))}
            </m.section>
          )}

          {!!enrollments.length && (
            <m.section
              className="sticker-tile mt-6 p-4"
              aria-label="فلترة الكورسات"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...popSpring, delay: 0.15 }}
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
                <label className="relative block">
                  <span className="sr-only">ابحث في كورساتك</span>
                  <Search className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
                  <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="ابحث باسم الكورس أو المادة..." className="h-12 w-full rounded-full border-2 border-ink bg-surface pe-11 ps-4 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100" />
                </label>

                <label className="relative block">
                  <span className="sr-only">فلترة حسب المادة</span>
                  <SlidersHorizontal className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <select value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1); }} className="h-12 w-full cursor-pointer appearance-none rounded-full border-2 border-ink bg-surface pe-10 ps-4 text-sm font-black text-ink outline-none transition focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100">
                    <option value="all">كل المواد</option>
                    {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  <span className="sr-only">ترتيب الكورسات</span>
                  <select value={sort} onChange={(event) => { setSort(event.target.value as CourseSort); setPage(1); }} className="h-12 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none transition focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100">
                    <option value="recent">الأحدث اشتراكاً</option>
                    <option value="expiring">الأقرب انتهاءً</option>
                    <option value="title">حسب الاسم</option>
                  </select>
                </label>
              </div>
            </m.section>
          )}

          <m.section className="mt-8" aria-labelledby="courses-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {!!enrollments.length && (
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="courses-heading" className="scroll-mt-24 text-2xl font-black tracking-tight text-ink dark:text-slate-50">
                  <MarkerHighlight color="sky" variant={1}>
                    كورساتك الحالية
                  </MarkerHighlight>
                </h2>
                <span className="sticker-badge bg-surface px-3 py-1 text-xs font-black text-muted dark:text-slate-300">{visibleCourses.length} من {enrollments.length}</span>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {visibleCourses.length ? (
                <m.div key={`results-${visibleEnrollmentIdsKey}`} className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {pageCourses.map((enrollment, index) => (
                    <CourseCard key={enrollment.id} enrollment={enrollment} index={index} />
                  ))}
                </m.div>
              ) : enrollments.length ? (
                <m.div key="no-match" className="sticker-tile flex min-h-64 flex-col items-center justify-center px-4 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={popSpring}>
                  <Search className="mb-4 size-9 text-muted" />
                  <h2 className="text-lg font-black text-ink dark:text-slate-50">
                    <MarkerHighlight color="pink" variant={3}>
                      لا توجد نتائج مطابقة
                    </MarkerHighlight>
                  </h2>
                  <p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">جرّب كلمة بحث مختلفة أو اعرض كل المواد.</p>
                  {hasFilters && <button type="button" onClick={() => { setSearch(""); setSubject("all"); setPage(1); }} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">مسح الفلاتر</button>}
                </m.div>
              ) : (
                <m.div key="empty" className="sticker-tile flex min-h-80 flex-col items-center justify-center px-4 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={popSpring}>
                  <span className="sticker-badge flex size-14 items-center justify-center bg-brand-100 text-brand-600 dark:bg-slate-800 dark:text-brand-300"><BookOpen className="size-7" /></span>
                  <h2 className="mt-5 text-xl font-black text-ink dark:text-slate-50">
                    <MarkerHighlight color="purple" variant={4}>
                      لا توجد اشتراكات نشطة
                    </MarkerHighlight>
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 font-medium text-muted dark:text-slate-400">استكشف المدرسين واختر الكورس المناسب لسنتك وشعبتك.</p>
                  <Link href="/explore" className="sticker-btn mt-6 inline-flex h-12 items-center gap-2 px-7 text-sm font-black">استكشف الكورسات<ArrowLeft className="size-4" /></Link>
                </m.div>
              )}
            </AnimatePresence>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} scrollTargetId="courses-heading" />
          </m.section>
        </div>
      )}
    </StudentAppShell>
  );
}
