"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import ImageWithFallback from "@/src/components/ui/image-with-fallback";
import { AnimatePresence, m } from "motion/react";
import type {
  GradeDto,
  PublicCourseDto,
  PublicTeacherDto,
  StreamDto,
  SubjectDto,
} from "@/src/lib/student-api/contract";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import { isStudentUnauthorized } from "@/src/lib/student-api/client";
import {
  useCurrentStudent,
  useMyCourses,
} from "@/src/features/student/hooks/use-student-queries";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import teacherFallback from "@/src/assets/images/student-redesign/teacher-ahmad.webp";
import StudentAppShell from "@/src/features/portal/components/portal-shell";

export interface ExploreCourseEntry {
  course: PublicCourseDto;
  teacher: {
    name: string;
    slug: string;
    img: string | null;
    subjects: string[];
    grades: string[];
  };
}

interface OnboardingDraft {
  grade_id: number;
  stream_id: number;
}

type CatalogSort = "newest" | "price-low" | "price-high";
type TeacherSort = "courses" | "name";
type ExploreView = "courses" | "teachers";

const COURSES_PER_PAGE = 6;
const TEACHERS_PER_PAGE = 8;

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function formatDuration(minutes: number | null) {
  if (!minutes) return "غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعات`;
}

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value));
}

function CourseCard({ entry, enrolled, index }: { entry: ExploreCourseEntry; enrolled: boolean; index: number }) {
  const { course, teacher } = entry;
  const href = enrolled
    ? `/my-courses/${course.id}`
    : `/my-courses/${course.id}?teacher=${encodeURIComponent(teacher.slug)}`;

  return (
    <m.div
      className="h-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ ...popSpring, delay: 0.05 * (index % 6) }}
      whileHover={{ y: -6, rotate: -0.3 }}
      whileTap={{ scale: 0.99 }}
    >
      <article className="sticker-tile group relative flex h-full flex-col overflow-hidden p-4">
        <Link href={href} aria-label={`عرض كورس ${course.title}`} className="absolute inset-0 z-20 rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset" />
        <div className="relative h-40 overflow-hidden rounded-xl border-2 border-ink bg-brand-100 dark:border-brand-300 dark:bg-slate-800">
          <ImageWithFallback src={course.img} fallbackSrc={lessonFallback} alt={course.title} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover" />
          {enrolled && <span className="sticker-badge absolute end-2 top-2 bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">ضمن كورساتك</span>}
        </div>

        <div className="mt-4 flex flex-1 flex-col">
          <span className="sticker-badge w-fit -rotate-1 bg-amber-300 px-2.5 py-1 text-xs font-black text-ink">{course.subject_name || "كورس تعليمي"}</span>
          <h3 className="mt-3 line-clamp-2 min-h-14 text-lg font-black leading-7 text-ink dark:text-slate-50">{course.title}</h3>
          <Link href={`/teachers/${teacher.slug}`} className="relative z-30 mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-muted hover:text-brand-700 dark:text-slate-400"><UserRound className="size-3.5" />{teacher.name}</Link>
          <p className="mt-3 line-clamp-2 text-xs leading-5 font-medium text-muted dark:text-slate-400">{course.description || `${course.lesson_count} درس في ${course.subject_name || "هذا التخصص"}.`}</p>

          <div className="mt-4 flex flex-wrap gap-4 border-t-2 border-ink/10 pt-4 text-xs font-black text-muted dark:border-white/10 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-brand-600 dark:text-brand-300" />{course.lesson_count} درس</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-brand-600 dark:text-brand-300" />{formatDuration(course.total_duration_minutes)}</span>
          </div>

          <div className="mt-auto pt-5">
            <span><strong className="sticker-numeral block text-2xl font-black text-ink dark:text-slate-50">{formatPrice(course.price)}</strong><span className="text-[11px] font-black text-muted dark:text-slate-400">ج.م</span></span>
          </div>
        </div>
      </article>
    </m.div>
  );
}

function TeacherCard({ teacher, courseCount, index }: { teacher: PublicTeacherDto; courseCount: number; index: number }) {
  const subjects = teacher.subjects.map((subject) => subject.name);
  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ ...popSpring, delay: 0.05 * (index % 8) }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      <article className="sticker-tile flex min-h-44 items-center gap-5 p-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-brand-100 sm:size-24 dark:border-brand-300 dark:bg-slate-800">
          <Image src={resolveAssetUrl(teacher.img, teacherFallback.src)} alt={teacher.name} fill sizes="96px" className="object-cover object-center" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-ink sm:text-xl dark:text-slate-50">{teacher.name}</h3>
          <p className="mt-1 line-clamp-1 text-xs font-black text-brand-700 dark:text-brand-300">{subjects.join("، ") || "مدرس على منصة علمني"}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-black text-muted dark:text-slate-400"><span className="sticker-numeral">{courseCount} كورسات</span><span className="sticker-numeral">{teacher.grades.length} صفوف دراسية</span></div>
          <Link href={`/teachers/${teacher.slug}`} className="sticker-btn-outline mt-4 inline-flex h-10 items-center gap-2 px-5 text-xs font-black text-brand-700 dark:text-brand-300">عرض المدرس<ArrowLeft className="size-3.5" /></Link>
        </div>
      </article>
    </m.div>
  );
}

export default function ExploreCourses({
  catalog,
  teachers,
  grades,
  streams,
  subjects,
  loadError,
}: {
  catalog: ExploreCourseEntry[];
  teachers: PublicTeacherDto[];
  grades: GradeDto[];
  streams: StreamDto[];
  subjects: SubjectDto[];
  loadError: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: ExploreView = searchParams.get("view") === "teachers" ? "teachers" : "courses";
  const [profile, setProfile] = useState<OnboardingDraft | null>(null);
  const userQuery = useCurrentStudent();
  const coursesQuery = useMyCourses();
  const user = userQuery.data ?? null;
  const enrolledCourseIds = coursesQuery.data?.items.map((item) => item.course_id) ?? [];
  const unauthorized =
    isStudentUnauthorized(userQuery.error) ||
    isStudentUnauthorized(coursesQuery.error);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [courseGrade, setCourseGrade] = useState(() => searchParams.get("grade") ?? "all");
  const [courseStream, setCourseStream] = useState(() => searchParams.get("stream") ?? "all");
  const [courseSubject, setCourseSubject] = useState(() => searchParams.get("subject") ?? "all");
  const [selectedCourseTeacher, setSelectedCourseTeacher] = useState(() => searchParams.get("teacher") ?? "all");
  const [courseSort, setCourseSort] = useState<CatalogSort>(() => {
    const value = searchParams.get("sort");
    return value === "price-low" || value === "price-high" ? value : "newest";
  });
  const [coursePage, setCoursePage] = useState(() => Math.max(1, Number(searchParams.get("page")) || 1));
  const [teacherGrade, setTeacherGrade] = useState(() => searchParams.get("tgrade") ?? "all");
  const [teacherSubject, setTeacherSubject] = useState(() => searchParams.get("tsubject") ?? "all");
  const [teacherSort, setTeacherSort] = useState<TeacherSort>(() => searchParams.get("tsort") === "name" ? "name" : "courses");
  const [teacherPage, setTeacherPage] = useState(() => Math.max(1, Number(searchParams.get("tpage")) || 1));
  const [showFilters, setShowFilters] = useState(false);

  const queryString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(queryString);
    const values: Record<string, string | number> = {
      q: search,
      grade: courseGrade,
      stream: courseStream,
      subject: courseSubject,
      teacher: selectedCourseTeacher,
      sort: courseSort,
      page: coursePage,
      tgrade: teacherGrade,
      tsubject: teacherSubject,
      tsort: teacherSort,
      tpage: teacherPage,
    };
    for (const [key, value] of Object.entries(values)) {
      const normalized = String(value);
      const isDefault = ["grade", "stream", "subject", "teacher"].includes(key) && normalized === "all";
      const isDefaultSort = (key === "sort" && normalized === "newest") || (key === "tsort" && normalized === "courses");
      const isDefaultPage = (key === "page" || key === "tpage") && normalized === "1";
      if (!normalized || isDefault || isDefaultSort || isDefaultPage) params.delete(key);
      else params.set(key, normalized);
    }
    const nextQueryString = params.toString();
    if (nextQueryString !== queryString) {
      router.replace(`/explore${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false });
    }
  }, [courseGrade, coursePage, courseSort, courseStream, courseSubject, queryString, router, search, selectedCourseTeacher, teacherGrade, teacherPage, teacherSort, teacherSubject]);

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rawDraft = localStorage.getItem("elemni-student-onboarding-v1");
      if (!rawDraft) return;
      try {
        setProfile(JSON.parse(rawDraft) as OnboardingDraft);
      } catch {
        localStorage.removeItem("elemni-student-onboarding-v1");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const changeCourseFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCoursePage(1);
  };

  const changeTeacherFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setTeacherPage(1);
  };

  const selectView = (nextView: ExploreView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    setCoursePage(1);
    setTeacherPage(1);
    router.replace(`/explore?${params.toString()}`, { scroll: false });
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextView: ExploreView | null = null;
    if (event.key === "ArrowLeft" || event.key === "End") nextView = "teachers";
    if (event.key === "ArrowRight" || event.key === "Home") nextView = "courses";
    if (!nextView) return;
    event.preventDefault();
    selectView(nextView);
    window.requestAnimationFrame(() => document.getElementById(`explore-tab-${nextView}`)?.focus());
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const filteredCourses = catalog
    .filter(({ course, teacher: courseTeacher }) => {
      const haystack = [course.title, course.description, course.subject_name, courseTeacher.name, ...courseTeacher.subjects].filter(Boolean).join(" ").toLocaleLowerCase("ar");
      return (
        (!normalizedSearch || haystack.includes(normalizedSearch)) &&
        (courseGrade === "all" || course.grade_id === Number(courseGrade)) &&
        (courseStream === "all" || course.stream_id === Number(courseStream)) &&
        (courseSubject === "all" || course.subject_name === courseSubject) &&
        (selectedCourseTeacher === "all" || courseTeacher.slug === selectedCourseTeacher)
      );
    })
    .sort((first, second) => {
      if (courseSort === "price-low") return Number(first.course.price) - Number(second.course.price);
      if (courseSort === "price-high") return Number(second.course.price) - Number(first.course.price);
      return new Date(second.course.created_at).getTime() - new Date(first.course.created_at).getTime();
    });

  const profileGrade = grades.find((item) => item.id === profile?.grade_id);
  const profileStream = streams.find((item) => item.id === profile?.stream_id);
  const courseCountByTeacher = new Map<string, number>();
  for (const { teacher: courseOwner } of catalog) {
    courseCountByTeacher.set(courseOwner.slug, (courseCountByTeacher.get(courseOwner.slug) ?? 0) + 1);
  }
  const filteredTeachers = teachers
    .filter((item) => {
      const haystack = [item.name, item.description, ...item.subjects.map((entry) => entry.name), ...item.grades.map((entry) => entry.name)].filter(Boolean).join(" ").toLocaleLowerCase("ar");
      return (
        (!normalizedSearch || haystack.includes(normalizedSearch)) &&
        (teacherGrade === "all" || item.grades.some((entry) => entry.id === Number(teacherGrade))) &&
        (teacherSubject === "all" || item.subjects.some((entry) => entry.name === teacherSubject))
      );
    })
    .sort((first, second) => {
      if (teacherSort === "name") return first.name.localeCompare(second.name, "ar");
      return (courseCountByTeacher.get(second.slug) ?? 0) - (courseCountByTeacher.get(first.slug) ?? 0);
    });
  const totalCoursePages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const visibleCourses = filteredCourses.slice((coursePage - 1) * COURSES_PER_PAGE, coursePage * COURSES_PER_PAGE);
  const visibleCourseIdsKey = visibleCourses.map(({ course }) => course.id).join("-");
  const totalTeacherPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);
  const visibleTeachers = filteredTeachers.slice((teacherPage - 1) * TEACHERS_PER_PAGE, teacherPage * TEACHERS_PER_PAGE);
  const visibleTeacherSlugsKey = visibleTeachers.map((item) => item.slug).join("-");
  const hasCourseFilters = Boolean(search) || courseGrade !== "all" || courseStream !== "all" || courseSubject !== "all" || selectedCourseTeacher !== "all";
  const hasTeacherFilters = Boolean(search) || teacherGrade !== "all" || teacherSubject !== "all";
  const suggestedSearches = Array.from(new Set(catalog.map(({ course }) => course.subject_name).filter((value): value is string => Boolean(value)))).slice(0, 3);

  const resetCourseFilters = () => {
    setSearch("");
    setCourseGrade("all");
    setCourseStream("all");
    setCourseSubject("all");
    setSelectedCourseTeacher("all");
    setCoursePage(1);
  };

  const resetTeacherFilters = () => {
    setSearch("");
    setTeacherGrade("all");
    setTeacherSubject("all");
    setTeacherPage(1);
  };

  return (
    <StudentAppShell user={user} active="discover">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <m.header
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={popSpring}
        >
          <div>
            <h1 className="flex items-center gap-3 text-5xl font-black tracking-tight text-ink sm:text-6xl dark:text-slate-50"><Search className="size-10 text-brand-600 dark:text-brand-300" />اكتشف ما يناسبك</h1>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 font-medium text-muted dark:text-slate-400">ابحث عن الكورس أو المدرس المناسب لمرحلتك الدراسية.</p>
          </div>
          {(profileGrade || profileStream) && <span className="sticker-badge inline-flex w-fit rotate-1 items-center gap-2 bg-amber-300 px-4 py-2 text-xs font-black text-ink"><span className="size-2 rounded-full bg-ink" />{[profileGrade?.name, profileStream?.name].filter(Boolean).join(" - ")}</span>}
        </m.header>

        <m.div
          className="sticker-tile mt-7 grid grid-cols-2 gap-1.5 p-1.5 sm:max-w-md"
          role="tablist"
          aria-label="نوع الاستكشاف"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...popSpring, delay: 0.1 }}
        >
          {([
            { id: "courses" as const, label: "الكورسات", count: catalog.length, icon: BookOpen },
            { id: "teachers" as const, label: "المدرسون", count: teachers.length, icon: UserRound },
          ]).map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              id={`explore-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={view === id}
              aria-controls={`explore-panel-${id}`}
              tabIndex={view === id ? 0 : -1}
              onClick={() => selectView(id)}
              onKeyDown={handleTabKeyDown}
              className={`relative flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${view === id ? "text-white" : "text-muted hover:text-brand-700 dark:text-slate-400"}`}
            >
              {view === id && <m.span layoutId="explore-tab-active" className="absolute inset-0 rounded-xl border-2 border-ink bg-brand-600 shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300 dark:shadow-[2px_2px_0_0_#020617]" transition={popSpring} />}
              <Icon className="relative size-4.5" />
              <span className="relative">{label}</span>
              <span className={`sticker-numeral relative rounded-full px-2 py-0.5 text-[10px] ${view === id ? "bg-white/20 text-white" : "bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"}`}>{count}</span>
            </button>
          ))}
        </m.div>

        <div className="mt-6 lg:hidden">
          <m.button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            aria-expanded={showFilters}
            aria-controls="explore-filters"
            whileTap={{ scale: 0.97 }}
            transition={popSpring}
            className="sticker-btn-outline inline-flex h-12 cursor-pointer items-center gap-2 px-6 text-sm font-black text-ink dark:text-slate-200"
          >
            <SlidersHorizontal className="size-4" />
            {showFilters ? "إخفاء الفلاتر" : "عرض الفلاتر والبحث"}
          </m.button>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
          <m.aside
            id="explore-filters"
            aria-label="البحث والفلاتر"
            className={`sticker-tile p-4 sm:p-5 lg:sticky lg:top-24 ${showFilters ? "block" : "hidden"} lg:block`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...popSpring, delay: 0.15 }}
          >
            <section aria-label="البحث">
          <label className="relative block">
            <span className="sr-only">{view === "courses" ? "ابحث عن كورس أو مدرس أو مادة" : "ابحث عن مدرس أو مادة"}</span>
            <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); if (view === "courses") setCoursePage(1); else setTeacherPage(1); }} placeholder={view === "courses" ? "ابحث عن مادة أو مدرس أو كورس..." : "ابحث باسم المدرس أو المادة..."} className="h-14 w-full rounded-full border-2 border-ink bg-surface pe-12 ps-5 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-brand-600 sm:text-base dark:border-brand-300 dark:bg-transparent dark:text-slate-100" />
          </label>
          {!!suggestedSearches.length && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-muted dark:text-slate-400"><span>مقترحات:</span>{suggestedSearches.map((item) => <button key={item} type="button" onClick={() => { setSearch(item); if (view === "courses") setCoursePage(1); else setTeacherPage(1); }} className="sticker-badge cursor-pointer bg-surface px-3 py-1 font-black text-ink hover:bg-brand-100 dark:text-slate-200">{item}</button>)}</div>}
            </section>
            {view === "courses" ? (
              <section className="mt-5" aria-label="فلاتر الكورسات">
                <div className="grid gap-3">
                  <label><span className="sr-only">الصف الدراسي</span><select value={courseGrade} onChange={(event) => changeCourseFilter(setCourseGrade, event.target.value)} className="h-12 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="all">كل الصفوف</option>{grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span className="sr-only">الشعبة</span><select value={courseStream} onChange={(event) => changeCourseFilter(setCourseStream, event.target.value)} className="h-12 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="all">كل الشعب</option>{streams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span className="sr-only">المدرس</span><select value={selectedCourseTeacher} onChange={(event) => changeCourseFilter(setSelectedCourseTeacher, event.target.value)} className="h-12 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="all">كل المدرسين</option>{teachers.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
                  <label className="relative"><span className="sr-only">ترتيب الكورسات</span><SlidersHorizontal className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><select value={courseSort} onChange={(event) => { setCourseSort(event.target.value as CatalogSort); setCoursePage(1); }} className="h-12 w-full cursor-pointer appearance-none rounded-full border-2 border-ink bg-surface pe-10 ps-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="newest">الأحدث</option><option value="price-low">السعر: الأقل أولاً</option><option value="price-high">السعر: الأعلى أولاً</option></select></label>
                </div>
                {!!subjects.length && <div className="mt-4 flex flex-wrap gap-2" aria-label="مواد الكورسات"><button type="button" onClick={() => changeCourseFilter(setCourseSubject, "all")} className={`h-10 shrink-0 rounded-full border-2 px-4 text-xs font-black transition ${courseSubject === "all" ? "border-ink bg-ink text-white dark:border-brand-300 dark:bg-brand-600" : "sticker-badge bg-surface text-ink hover:bg-brand-100 dark:text-slate-200"}`}>كل المواد</button>{subjects.map((item) => <button key={item.id} type="button" onClick={() => changeCourseFilter(setCourseSubject, item.name)} className={`h-10 shrink-0 rounded-full border-2 px-4 text-xs font-black transition ${courseSubject === item.name ? "border-ink bg-ink text-white dark:border-brand-300 dark:bg-brand-600" : "sticker-badge bg-surface text-ink hover:bg-brand-100 dark:text-slate-200"}`}>{item.name}</button>)}</div>}
                {hasCourseFilters && <button type="button" onClick={resetCourseFilters} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">مسح الفلاتر</button>}
              </section>
            ) : (
              <section className="mt-5" aria-label="فلاتر المدرسين">
                <div className="grid gap-3">
                  <label><span className="sr-only">الصف الدراسي</span><select value={teacherGrade} onChange={(event) => changeTeacherFilter(setTeacherGrade, event.target.value)} className="h-12 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="all">كل الصفوف</option>{grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span className="sr-only">المادة</span><select value={teacherSubject} onChange={(event) => changeTeacherFilter(setTeacherSubject, event.target.value)} className="h-12 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="all">كل المواد</option>{subjects.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
                  <label className="relative"><span className="sr-only">ترتيب المدرسين</span><SlidersHorizontal className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><select value={teacherSort} onChange={(event) => { setTeacherSort(event.target.value as TeacherSort); setTeacherPage(1); }} className="h-12 w-full cursor-pointer appearance-none rounded-full border-2 border-ink bg-surface pe-10 ps-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-transparent dark:text-slate-100"><option value="courses">الأكثر كورسات</option><option value="name">حسب الاسم</option></select></label>
                </div>
                {hasTeacherFilters && <button type="button" onClick={resetTeacherFilters} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">مسح الفلاتر</button>}
              </section>
            )}
          </m.aside>

          <div className="min-w-0">
            {loadError && <div role="alert" className="sticker-tile flex items-center gap-3 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 dark:bg-amber-500/10 dark:text-amber-300"><CircleAlert className="size-5 shrink-0" />تعذر تحميل بعض بيانات الكتالوج. النتائج المتاحة معروضة أدناه.</div>}

            <AnimatePresence mode="wait" initial={false}>
              {view === "courses" ? (
                <m.div key="courses" id="explore-panel-courses" role="tabpanel" aria-labelledby="explore-tab-courses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>

              <section id="all-courses" className="scroll-mt-24" aria-labelledby="all-courses-heading">
                <div className="mb-5 flex items-center justify-between gap-4"><h2 id="all-courses-heading" className="text-3xl font-black tracking-tight text-ink dark:text-slate-50">كل الكورسات</h2><span className="sticker-badge bg-surface px-3 py-1 text-xs font-black text-muted dark:text-slate-300">{filteredCourses.length} كورس</span></div>
                <AnimatePresence mode="wait" initial={false}>{visibleCourses.length ? <m.div key={`results-${visibleCourseIdsKey}`} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{visibleCourses.map((entry, index) => <CourseCard key={entry.course.id} entry={entry} enrolled={enrolledCourseIds.includes(entry.course.id)} index={index} />)}</m.div> : <m.div key="empty-courses" className="sticker-tile flex min-h-64 flex-col items-center justify-center px-4 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={popSpring}><Search className="mb-4 size-9 text-muted" /><h3 className="text-lg font-black text-ink dark:text-slate-50">لا توجد كورسات مطابقة</h3><p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">جرّب تغيير البحث أو اختيار تصنيف آخر.</p>{hasCourseFilters && <button type="button" onClick={resetCourseFilters} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">مسح الفلاتر</button>}</m.div>}</AnimatePresence>
                {totalCoursePages > 1 && <nav className="mt-8 flex items-center justify-center gap-2" aria-label="صفحات الكورسات"><button type="button" onClick={() => setCoursePage((current) => Math.max(1, current - 1))} disabled={coursePage === 1} aria-label="الصفحة السابقة" className="sticker-btn-outline flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>{Array.from({ length: totalCoursePages }, (_, index) => index + 1).map((item) => <button key={item} type="button" onClick={() => setCoursePage(item)} aria-current={coursePage === item ? "page" : undefined} className={`size-11 rounded-full border-2 text-sm font-black transition ${coursePage === item ? "border-ink bg-brand-600 text-white shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300" : "sticker-btn-outline"}`}>{item}</button>)}<button type="button" onClick={() => setCoursePage((current) => Math.min(totalCoursePages, current + 1))} disabled={coursePage === totalCoursePages} aria-label="الصفحة التالية" className="sticker-btn-outline flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" /></button></nav>}
              </section>
            </m.div>
          ) : (
            <m.div key="teachers" id="explore-panel-teachers" role="tabpanel" aria-labelledby="explore-tab-teachers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
              <section aria-labelledby="all-teachers-heading">
                <div className="mb-5 flex items-center justify-between gap-4"><h2 id="all-teachers-heading" className="text-3xl font-black tracking-tight text-ink dark:text-slate-50">كل المدرسين</h2><span className="sticker-badge bg-surface px-3 py-1 text-xs font-black text-muted dark:text-slate-300">{filteredTeachers.length} مدرس</span></div>
                <AnimatePresence mode="wait" initial={false}>{visibleTeachers.length ? <m.div key={`teachers-${visibleTeacherSlugsKey}`} className="grid gap-5 lg:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{visibleTeachers.map((item, index) => <TeacherCard key={item.slug} teacher={item} courseCount={courseCountByTeacher.get(item.slug) ?? 0} index={index} />)}</m.div> : <m.div key="empty-teachers" className="sticker-tile flex min-h-64 flex-col items-center justify-center px-4 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={popSpring}><UserRound className="mb-4 size-9 text-muted" /><h3 className="text-lg font-black text-ink dark:text-slate-50">لا يوجد مدرسون مطابقون</h3><p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">جرّب تغيير البحث أو اختيار صف أو مادة أخرى.</p>{hasTeacherFilters && <button type="button" onClick={resetTeacherFilters} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">مسح الفلاتر</button>}</m.div>}</AnimatePresence>
                {totalTeacherPages > 1 && <nav className="mt-8 flex items-center justify-center gap-2" aria-label="صفحات المدرسين"><button type="button" onClick={() => setTeacherPage((current) => Math.max(1, current - 1))} disabled={teacherPage === 1} aria-label="الصفحة السابقة" className="sticker-btn-outline flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>{Array.from({ length: totalTeacherPages }, (_, index) => index + 1).map((item) => <button key={item} type="button" onClick={() => setTeacherPage(item)} aria-current={teacherPage === item ? "page" : undefined} className={`size-11 rounded-full border-2 text-sm font-black transition ${teacherPage === item ? "border-ink bg-brand-600 text-white shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300" : "sticker-btn-outline"}`}>{item}</button>)}<button type="button" onClick={() => setTeacherPage((current) => Math.min(totalTeacherPages, current + 1))} disabled={teacherPage === totalTeacherPages} aria-label="الصفحة التالية" className="sticker-btn-outline flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" /></button></nav>}
              </section>
            </m.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
    </StudentAppShell>
  );
}
