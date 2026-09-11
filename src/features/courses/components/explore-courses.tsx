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
  Compass,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { AnimatePresence, m } from "motion/react";
import { portalCardLiftClass, portalContainerVariants, portalImageZoomClass, portalItemVariants } from "./course-motion";
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

function CourseCard({ entry, enrolled }: { entry: ExploreCourseEntry; enrolled: boolean }) {
  const { course, teacher } = entry;
  const href = enrolled
    ? `/my-courses/${course.id}`
    : `/my-courses/${course.id}?teacher=${encodeURIComponent(teacher.slug)}`;

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white p-4 ${portalCardLiftClass} hover:border-[#BAE6FD] hover:shadow-[0_4px_12px_rgba(2,132,199,0.04)]`}>
      <Link href={href} aria-label={`عرض كورس ${course.title}`} className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-inset" />
      <div className="relative h-40 overflow-hidden rounded-xl bg-[#F0F9FF]">
        <Image src={resolveAssetUrl(course.img, lessonFallback.src)} alt={course.title} fill sizes="(max-width: 767px) 100vw, 33vw" className={`object-cover ${portalImageZoomClass}`} />
        {enrolled && <span className="absolute end-2 top-2 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[11px] font-black text-emerald-700 backdrop-blur">ضمن دوراتك</span>}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <span className="w-fit rounded-lg bg-[#0284C7]/5 px-2.5 py-1 text-xs font-bold text-[#0369A1]">{course.subject_name || "كورس تعليمي"}</span>
        <h3 className="mt-3 line-clamp-2 min-h-14 text-lg font-black leading-7 text-[#1B1B24]">{course.title}</h3>
        <Link href={`/teachers/${teacher.slug}`} className="relative z-30 mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#777587] hover:text-[#0369A1]"><UserRound className="size-3.5" />{teacher.name}</Link>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#777587]">{course.description || `${course.lesson_count} درس في ${course.subject_name || "هذا التخصص"}.`}</p>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-[#E2E0EF] pt-4 text-xs font-bold text-[#777587]">
          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-[#0284C7]" />{course.lesson_count} درس</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-[#0284C7]" />{formatDuration(course.total_duration_minutes)}</span>
        </div>

        <div className="mt-auto pt-5">
          <span><strong className="block text-xl font-black">{formatPrice(course.price)}</strong><span className="text-[11px] font-bold text-[#777587]">ج.م</span></span>
        </div>
      </div>
    </article>
  );
}

function TeacherCard({ teacher, courseCount }: { teacher: PublicTeacherDto; courseCount: number }) {
  const subjects = teacher.subjects.map((subject) => subject.name);
  return (
    <article className={`flex min-h-44 items-center gap-5 rounded-2xl border border-[#E2E0EF] bg-white p-5 ${portalCardLiftClass} hover:border-[#BAE6FD] hover:shadow-[0_4px_12px_rgba(2,132,199,0.04)]`}>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-[#E2E0EF] bg-[#F0F9FF] sm:size-24">
        <Image src={resolveAssetUrl(teacher.img, teacherFallback.src)} alt={teacher.name} fill sizes="96px" className="object-cover object-center" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-black sm:text-xl">{teacher.name}</h3>
        <p className="mt-1 line-clamp-1 text-xs font-bold text-[#0284C7]">{subjects.join("، ") || "مدرس على منصة علمني"}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-[#777587]"><span>{courseCount} كورسات</span><span>{teacher.grades.length} صفوف دراسية</span></div>
        <Link href={`/teachers/${teacher.slug}`} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[#BAE6FD] px-4 text-xs font-black text-[#0369A1] hover:bg-[#E0F2FE]">عرض المدرس<ArrowLeft className="size-3.5" /></Link>
      </div>
    </article>
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
      <m.div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" initial="hidden" animate="show" variants={portalContainerVariants}>
        <m.header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" variants={portalItemVariants}>
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#F0F9FF] px-3 py-1.5 text-xs font-black text-[#0369A1]"><Compass className="size-4" />استكشف</span>
            <h1 className="flex items-center gap-3 text-3xl font-black leading-tight sm:text-4xl"><Search className="size-8 text-[#0284C7]" />اكتشف ما يناسبك</h1>
            <p className="mt-2 text-sm leading-6 text-[#777587]">ابحث عن الكورس أو المدرس المناسب لمرحلتك الدراسية.</p>
          </div>
          {(profileGrade || profileStream) && <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0F2FE] bg-[#0284C7]/5 px-4 py-2 text-xs font-black text-[#0369A1]"><span className="size-2 rounded-full bg-[#0284C7]" />{[profileGrade?.name, profileStream?.name].filter(Boolean).join(" - ")}</span>}
        </m.header>

        <m.div className="mt-7 grid grid-cols-2 rounded-2xl border border-[#E2E0EF] bg-white p-1.5 sm:max-w-md" role="tablist" aria-label="نوع الاستكشاف" variants={portalItemVariants}>
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
              className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] ${view === id ? "bg-[#0284C7] text-white shadow-sm" : "text-[#464555] hover:bg-[#F0F9FF] hover:text-[#0369A1]"}`}
            >
              <Icon className="size-4.5" />
              <span>{label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${view === id ? "bg-white/20 text-white" : "bg-[#F0F9FF] text-[#0369A1]"}`}>{count}</span>
            </button>
          ))}
        </m.div>

        <m.section className="mt-6" aria-label="البحث" variants={portalItemVariants}>
          <label className="relative block max-w-4xl">
            <span className="sr-only">{view === "courses" ? "ابحث عن كورس أو مدرس أو مادة" : "ابحث عن مدرس أو مادة"}</span>
            <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-[#777587]" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); if (view === "courses") setCoursePage(1); else setTeacherPage(1); }} placeholder={view === "courses" ? "ابحث عن مادة أو مدرس أو كورس..." : "ابحث باسم المدرس أو المادة..."} className="h-14 w-full rounded-lg border border-[#C7C4D8] bg-white pe-12 ps-4 text-sm outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/10 sm:text-base" />
          </label>
          {!!suggestedSearches.length && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#777587]"><span>مقترحات:</span>{suggestedSearches.map((item) => <button key={item} type="button" onClick={() => { setSearch(item); if (view === "courses") setCoursePage(1); else setTeacherPage(1); }} className="cursor-pointer rounded-lg bg-[#F0F9FF] px-2.5 py-1 font-bold text-[#464555] hover:text-[#0369A1]">{item}</button>)}</div>}
        </m.section>

        {loadError && <div role="alert" className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"><CircleAlert className="size-5 shrink-0" />تعذر تحميل بعض بيانات الكتالوج. النتائج المتاحة معروضة أدناه.</div>}

        <AnimatePresence mode="wait" initial={false}>
          {view === "courses" ? (
            <m.div key="courses" id="explore-panel-courses" role="tabpanel" aria-labelledby="explore-tab-courses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
              <section className="mt-5" aria-label="فلاتر الكورسات">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label><span className="sr-only">الصف الدراسي</span><select value={courseGrade} onChange={(event) => changeCourseFilter(setCourseGrade, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل الصفوف</option>{grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span className="sr-only">الشعبة</span><select value={courseStream} onChange={(event) => changeCourseFilter(setCourseStream, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل الشعب</option>{streams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span className="sr-only">المدرس</span><select value={selectedCourseTeacher} onChange={(event) => changeCourseFilter(setSelectedCourseTeacher, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل المدرسين</option>{teachers.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
                  <label className="relative"><span className="sr-only">ترتيب الكورسات</span><SlidersHorizontal className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[#777587]" /><select value={courseSort} onChange={(event) => { setCourseSort(event.target.value as CatalogSort); setCoursePage(1); }} className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#E2E0EF] bg-white pe-10 ps-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="newest">الأحدث</option><option value="price-low">السعر: الأقل أولاً</option><option value="price-high">السعر: الأعلى أولاً</option></select></label>
                </div>
                {!!subjects.length && <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="مواد الكورسات"><button type="button" onClick={() => changeCourseFilter(setCourseSubject, "all")} className={`h-10 shrink-0 rounded-full px-5 text-xs font-black ${courseSubject === "all" ? "bg-[#0284C7] text-white" : "border border-[#C7C4D8] bg-white text-[#464555]"}`}>كل المواد</button>{subjects.map((item) => <button key={item.id} type="button" onClick={() => changeCourseFilter(setCourseSubject, item.name)} className={`h-10 shrink-0 rounded-full px-5 text-xs font-black ${courseSubject === item.name ? "bg-[#0284C7] text-white" : "border border-[#C7C4D8] bg-white text-[#464555] hover:bg-[#E0F2FE]"}`}>{item.name}</button>)}</div>}
              </section>

              <section id="all-courses" className="scroll-mt-24 pt-10" aria-labelledby="all-courses-heading">
                <div className="mb-5 flex items-center justify-between gap-4"><h2 id="all-courses-heading" className="text-2xl font-black">كل الكورسات</h2><span className="text-xs font-bold text-[#777587]">{filteredCourses.length} كورس</span></div>
                <AnimatePresence mode="wait" initial={false}>{visibleCourses.length ? <m.div key={`results-${visibleCourseIdsKey}`} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{visibleCourses.map((entry) => <m.div key={entry.course.id} className="h-full" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}><CourseCard entry={entry} enrolled={enrolledCourseIds.includes(entry.course.id)} /></m.div>)}</m.div> : <m.div key="empty-courses" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white px-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Search className="mb-4 size-9 text-[#C7C4D8]" /><h3 className="text-lg font-black">لا توجد كورسات مطابقة</h3><p className="mt-2 text-sm text-[#777587]">جرّب تغيير البحث أو اختيار تصنيف آخر.</p>{hasCourseFilters && <button type="button" onClick={resetCourseFilters} className="mt-4 cursor-pointer text-sm font-black text-[#0369A1] hover:underline">مسح الفلاتر</button>}</m.div>}</AnimatePresence>
                {totalCoursePages > 1 && <nav className="mt-8 flex items-center justify-center gap-2" aria-label="صفحات الكورسات"><button type="button" onClick={() => setCoursePage((current) => Math.max(1, current - 1))} disabled={coursePage === 1} aria-label="الصفحة السابقة" className="flex size-10 items-center justify-center rounded-lg border border-[#E2E0EF] bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>{Array.from({ length: totalCoursePages }, (_, index) => index + 1).map((item) => <button key={item} type="button" onClick={() => setCoursePage(item)} aria-current={coursePage === item ? "page" : undefined} className={`size-10 rounded-lg text-sm font-black ${coursePage === item ? "bg-[#0284C7] text-white" : "border border-[#E2E0EF] bg-white"}`}>{item}</button>)}<button type="button" onClick={() => setCoursePage((current) => Math.min(totalCoursePages, current + 1))} disabled={coursePage === totalCoursePages} aria-label="الصفحة التالية" className="flex size-10 items-center justify-center rounded-lg border border-[#E2E0EF] bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" /></button></nav>}
              </section>
            </m.div>
          ) : (
            <m.div key="teachers" id="explore-panel-teachers" role="tabpanel" aria-labelledby="explore-tab-teachers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
              <section className="mt-5" aria-label="فلاتر المدرسين">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label><span className="sr-only">الصف الدراسي</span><select value={teacherGrade} onChange={(event) => changeTeacherFilter(setTeacherGrade, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل الصفوف</option>{grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span className="sr-only">المادة</span><select value={teacherSubject} onChange={(event) => changeTeacherFilter(setTeacherSubject, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل المواد</option>{subjects.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
                  <label className="relative"><span className="sr-only">ترتيب المدرسين</span><SlidersHorizontal className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[#777587]" /><select value={teacherSort} onChange={(event) => { setTeacherSort(event.target.value as TeacherSort); setTeacherPage(1); }} className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#E2E0EF] bg-white pe-10 ps-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="courses">الأكثر كورسات</option><option value="name">حسب الاسم</option></select></label>
                </div>
              </section>

              <section className="pt-10" aria-labelledby="all-teachers-heading">
                <div className="mb-5 flex items-center justify-between gap-4"><h2 id="all-teachers-heading" className="text-2xl font-black">كل المدرسين</h2><span className="text-xs font-bold text-[#777587]">{filteredTeachers.length} مدرس</span></div>
                <AnimatePresence mode="wait" initial={false}>{visibleTeachers.length ? <m.div key={`teachers-${visibleTeacherSlugsKey}`} className="grid gap-5 lg:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{visibleTeachers.map((item) => <m.div key={item.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}><TeacherCard teacher={item} courseCount={courseCountByTeacher.get(item.slug) ?? 0} /></m.div>)}</m.div> : <m.div key="empty-teachers" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white px-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><UserRound className="mb-4 size-9 text-[#C7C4D8]" /><h3 className="text-lg font-black">لا يوجد مدرسون مطابقون</h3><p className="mt-2 text-sm text-[#777587]">جرّب تغيير البحث أو اختيار صف أو مادة أخرى.</p>{hasTeacherFilters && <button type="button" onClick={resetTeacherFilters} className="mt-4 cursor-pointer text-sm font-black text-[#0369A1] hover:underline">مسح الفلاتر</button>}</m.div>}</AnimatePresence>
                {totalTeacherPages > 1 && <nav className="mt-8 flex items-center justify-center gap-2" aria-label="صفحات المدرسين"><button type="button" onClick={() => setTeacherPage((current) => Math.max(1, current - 1))} disabled={teacherPage === 1} aria-label="الصفحة السابقة" className="flex size-10 items-center justify-center rounded-lg border border-[#E2E0EF] bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>{Array.from({ length: totalTeacherPages }, (_, index) => index + 1).map((item) => <button key={item} type="button" onClick={() => setTeacherPage(item)} aria-current={teacherPage === item ? "page" : undefined} className={`size-10 rounded-lg text-sm font-black ${teacherPage === item ? "bg-[#0284C7] text-white" : "border border-[#E2E0EF] bg-white"}`}>{item}</button>)}<button type="button" onClick={() => setTeacherPage((current) => Math.min(totalTeacherPages, current + 1))} disabled={teacherPage === totalTeacherPages} aria-label="الصفحة التالية" className="flex size-10 items-center justify-center rounded-lg border border-[#E2E0EF] bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" /></button></nav>}
              </section>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </StudentAppShell>
  );
}
