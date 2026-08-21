"use client";

import Image from "next/image";
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
  Target,
  UserRound,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { AnimatePresence, m } from "motion/react";
import { portalCardLiftClass, portalContainerVariants, portalImageZoomClass, portalItemVariants, scrollIntoViewById } from "./course-motion";
import type {
  GradeDto,
  MyCoursesDto,
  PublicCourseDto,
  PublicTeacherDto,
  StreamDto,
  SubjectDto,
  UserDto,
} from "@/src/lib/student-api/contract";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import teacherFallback from "@/src/assets/images/student-redesign/teacher-ahmad.webp";
import StudentAppShell from "@/src/features/shared/components/student-app-shell";

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

const COURSES_PER_PAGE = 6;

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
  const href = `/courses/${course.id}?teacher=${encodeURIComponent(teacher.slug)}`;

  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white p-4 ${portalCardLiftClass} hover:border-[#BAE6FD] hover:shadow-[0_4px_12px_rgba(2,132,199,0.04)]`}>
      <div className="relative h-40 overflow-hidden rounded-xl bg-[#F0F9FF]">
        <Image src={course.img || lessonFallback} alt={course.title} fill sizes="(max-width: 767px) 100vw, 33vw" className={`object-cover ${portalImageZoomClass}`} />
        {enrolled && <span className="absolute end-2 top-2 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[11px] font-black text-emerald-700 backdrop-blur">ضمن دوراتك</span>}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <span className="w-fit rounded-lg bg-[#0284C7]/5 px-2.5 py-1 text-xs font-bold text-[#0369A1]">{course.subject_name || "كورس تعليمي"}</span>
        <h3 className="mt-3 line-clamp-2 min-h-14 text-lg font-black leading-7 text-[#1B1B24]">{course.title}</h3>
        <Link href={`/teachers/${teacher.slug}`} className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#777587] hover:text-[#0369A1]"><UserRound className="size-3.5" />{teacher.name}</Link>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#777587]">{course.description || `${course.lesson_count} درس في ${course.subject_name || "هذا التخصص"}.`}</p>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-[#E2E0EF] pt-4 text-xs font-bold text-[#777587]">
          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-[#0284C7]" />{course.lesson_count} درس</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-[#0284C7]" />{formatDuration(course.total_duration_minutes)}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span><strong className="block text-xl font-black">{formatPrice(course.price)}</strong><span className="text-[11px] font-bold text-[#777587]">ج.م</span></span>
          <Link href={href} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black transition-colors ${enrolled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-[#0284C7] text-white hover:bg-[#0369A1]"}`}>{enrolled ? "فتح الكورس" : "عرض الكورس"}<ArrowLeft className="size-4" /></Link>
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
        <Image src={teacher.img || teacherFallback} alt={teacher.name} fill sizes="96px" className="object-cover object-center" />
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
  const [user, setUser] = useState<UserDto | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [profile, setProfile] = useState<OnboardingDraft | null>(null);
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [stream, setStream] = useState("all");
  const [subject, setSubject] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const rawDraft = localStorage.getItem("elemni-student-onboarding-v1");
      if (rawDraft) {
        try {
          setProfile(JSON.parse(rawDraft) as OnboardingDraft);
        } catch {
          localStorage.removeItem("elemni-student-onboarding-v1");
        }
      }

      const [userResponse, coursesResponse] = await Promise.all([
        fetch("/api/student/auth/me", { cache: "no-store" }).catch(() => null),
        fetch("/api/student/my-courses", { cache: "no-store" }).catch(() => null),
      ]);
      if (userResponse?.status === 401 || coursesResponse?.status === 401) {
        router.replace("/login");
        return;
      }
      if (userResponse?.ok) setUser(await userResponse.json());
      if (coursesResponse?.ok) {
        const myCourses = await coursesResponse.json() as MyCoursesDto;
        setEnrolledCourseIds(myCourses.items.map((item) => item.course_id));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const filteredCourses = catalog
    .filter(({ course, teacher: courseTeacher }) => {
      const haystack = [course.title, course.description, course.subject_name, courseTeacher.name, ...courseTeacher.subjects].filter(Boolean).join(" ").toLocaleLowerCase("ar");
      return (
        (!normalizedSearch || haystack.includes(normalizedSearch)) &&
        (grade === "all" || course.grade_id === Number(grade)) &&
        (stream === "all" || course.stream_id === Number(stream)) &&
        (subject === "all" || course.subject_name === subject) &&
        (teacher === "all" || courseTeacher.slug === teacher)
      );
    })
    .sort((first, second) => {
      if (sort === "price-low") return Number(first.course.price) - Number(second.course.price);
      if (sort === "price-high") return Number(second.course.price) - Number(first.course.price);
      return new Date(second.course.created_at).getTime() - new Date(first.course.created_at).getTime();
    });

  const profileGrade = grades.find((item) => item.id === profile?.grade_id);
  const profileStream = streams.find((item) => item.id === profile?.stream_id);
  const personalized = catalog.filter(({ course }) => (
    (!profile?.grade_id || course.grade_id === profile.grade_id) &&
    (!profile?.stream_id || course.stream_id === profile.stream_id)
  ));
  const recommended = (personalized.length ? personalized : catalog).slice(0, 3);
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const visibleCourses = filteredCourses.slice((page - 1) * COURSES_PER_PAGE, page * COURSES_PER_PAGE);
  const visibleCourseIdsKey = visibleCourses.map(({ course }) => course.id).join("-");
  const hasFilters = Boolean(search) || grade !== "all" || stream !== "all" || subject !== "all" || teacher !== "all";
  const suggestedSearches = Array.from(new Set(catalog.map(({ course }) => course.subject_name).filter((value): value is string => Boolean(value)))).slice(0, 3);

  const resetFilters = () => {
    setSearch("");
    setGrade("all");
    setStream("all");
    setSubject("all");
    setTeacher("all");
    setPage(1);
  };

  return (
    <StudentAppShell user={user} active="discover">
      <m.div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" initial="hidden" animate="show" variants={portalContainerVariants}>
        <m.header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" variants={portalItemVariants}>
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#F0F9FF] px-3 py-1.5 text-xs font-black text-[#0369A1]"><Compass className="size-4" />استكشف</span>
            <h1 className="flex items-center gap-3 text-3xl font-black leading-tight sm:text-4xl"><Search className="size-8 text-[#0284C7]" />اكتشف كورسات جديدة</h1>
            <p className="mt-2 text-sm leading-6 text-[#777587]">اختر المدرس والكورس المناسبين لمرحلتك الدراسية.</p>
          </div>
          {(profileGrade || profileStream) && <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E0F2FE] bg-[#0284C7]/5 px-4 py-2 text-xs font-black text-[#0369A1]"><span className="size-2 rounded-full bg-[#0284C7]" />{[profileGrade?.name, profileStream?.name].filter(Boolean).join(" - ")}</span>}
        </m.header>

        <m.section className="mt-7" aria-label="بحث وفلاتر الكورسات" variants={portalItemVariants}>
          <label className="relative block max-w-4xl">
            <span className="sr-only">ابحث عن كورس أو مدرس أو مادة</span>
            <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-[#777587]" />
            <input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="ابحث عن مادة أو مدرس أو كورس..." className="h-14 w-full rounded-lg border border-[#C7C4D8] bg-white pe-12 ps-4 text-sm outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/10 sm:text-base" />
          </label>
          {!!suggestedSearches.length && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#777587]"><span>مقترحات:</span>{suggestedSearches.map((item) => <button key={item} type="button" onClick={() => changeFilter(setSearch, item)} className="cursor-pointer rounded-lg bg-[#F0F9FF] px-2.5 py-1 font-bold text-[#464555] hover:text-[#0369A1]">{item}</button>)}</div>}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label><span className="sr-only">الصف الدراسي</span><select value={grade} onChange={(event) => changeFilter(setGrade, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل الصفوف</option>{grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span className="sr-only">الشعبة</span><select value={stream} onChange={(event) => changeFilter(setStream, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل الشعب</option>{streams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span className="sr-only">المدرس</span><select value={teacher} onChange={(event) => changeFilter(setTeacher, event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-[#E2E0EF] bg-white px-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="all">كل المدرسين</option>{teachers.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            <label className="relative"><span className="sr-only">ترتيب النتائج</span><SlidersHorizontal className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[#777587]" /><select value={sort} onChange={(event) => { setSort(event.target.value as CatalogSort); setPage(1); }} className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#E2E0EF] bg-white pe-10 ps-3 text-sm font-bold outline-none focus:border-[#0284C7]"><option value="newest">الأحدث</option><option value="price-low">السعر: الأقل أولاً</option><option value="price-high">السعر: الأعلى أولاً</option></select></label>
          </div>

          {!!subjects.length && <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="المواد"><button type="button" onClick={() => changeFilter(setSubject, "all")} className={`h-10 shrink-0 rounded-full px-5 text-xs font-black ${subject === "all" ? "bg-[#0284C7] text-white" : "border border-[#C7C4D8] bg-white text-[#464555]"}`}>كل المواد</button>{subjects.map((item) => <button key={item.id} type="button" onClick={() => changeFilter(setSubject, item.name)} className={`h-10 shrink-0 rounded-full px-5 text-xs font-black ${subject === item.name ? "bg-[#0284C7] text-white" : "border border-[#C7C4D8] bg-white text-[#464555] hover:bg-[#E0F2FE]"}`}>{item.name}</button>)}</div>}
        </m.section>

        {loadError && <div role="alert" className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"><CircleAlert className="size-5 shrink-0" />تعذر تحميل بعض بيانات الكتالوج. النتائج المتاحة معروضة أدناه.</div>}

        {!hasFilters && !!recommended.length && (
          <m.section className="mt-10" aria-labelledby="recommended-heading" variants={portalItemVariants}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 id="recommended-heading" className="flex items-center gap-2 text-2xl font-black"><Target className="size-6 text-[#0284C7]" />مناسب لك</h2><p className="mt-1 text-xs text-[#777587]">{profile ? "بناءً على المرحلة والشعبة المحفوظتين في ملفك." : "اختيارات من أحدث الكورسات المنشورة على المنصة."}</p></div><button type="button" onClick={() => scrollIntoViewById("all-courses")} className="inline-flex cursor-pointer items-center gap-1 text-xs font-black text-[#0369A1] hover:underline">عرض الكل<ArrowLeft className="size-3.5" /></button></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{recommended.map((entry) => <CourseCard key={`recommended-${entry.course.id}`} entry={entry} enrolled={enrolledCourseIds.includes(entry.course.id)} />)}</div>
          </m.section>
        )}

        <m.section id="all-courses" className="scroll-mt-24 pt-10" aria-labelledby="all-courses-heading" variants={portalItemVariants}>
          <div className="mb-5 flex items-center justify-between gap-4"><h2 id="all-courses-heading" className="text-2xl font-black">كل الكورسات</h2><span className="text-xs font-bold text-[#777587]">{filteredCourses.length} كورس</span></div>
          <AnimatePresence mode="wait" initial={false}>
            {visibleCourses.length ? (
              <m.div key={`results-${visibleCourseIdsKey}`} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {visibleCourses.map((entry) => (
                  <m.div key={entry.course.id} className="h-full" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                    <CourseCard entry={entry} enrolled={enrolledCourseIds.includes(entry.course.id)} />
                  </m.div>
                ))}
              </m.div>
            ) : (
              <m.div key="empty" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white px-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Search className="mb-4 size-9 text-[#C7C4D8]" /><h3 className="text-lg font-black">لا توجد كورسات مطابقة</h3><p className="mt-2 text-sm text-[#777587]">جرّب تغيير البحث أو اختيار تصنيف آخر.</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-4 cursor-pointer text-sm font-black text-[#0369A1] hover:underline">مسح الفلاتر</button>}
              </m.div>
            )}
          </AnimatePresence>

          {totalPages > 1 && <nav className="mt-8 flex items-center justify-center gap-2" aria-label="صفحات الكورسات"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="الصفحة السابقة" className="flex size-10 items-center justify-center rounded-lg border border-[#E2E0EF] bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => <button key={item} type="button" onClick={() => setPage(item)} aria-current={page === item ? "page" : undefined} className={`size-10 rounded-lg text-sm font-black ${page === item ? "bg-[#0284C7] text-white" : "border border-[#E2E0EF] bg-white"}`}>{item}</button>)}<button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="الصفحة التالية" className="flex size-10 items-center justify-center rounded-lg border border-[#E2E0EF] bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" /></button></nav>}
        </m.section>

        {!!teachers.length && (
          <m.section className="pt-12" aria-labelledby="featured-teachers-heading" variants={portalItemVariants}>
            <div className="mb-5 flex items-center justify-between"><h2 id="featured-teachers-heading" className="text-2xl font-black">أبرز المدرسين</h2><Link href="/teachers" className="inline-flex items-center gap-1 text-xs font-black text-[#0369A1] hover:underline">كل المدرسين<ArrowLeft className="size-3.5" /></Link></div>
            <div className="grid gap-5 lg:grid-cols-2">{teachers.slice(0, 4).map((item) => <TeacherCard key={item.slug} teacher={item} courseCount={catalog.filter(({ teacher: courseTeacher }) => courseTeacher.slug === item.slug).length} />)}</div>
          </m.section>
        )}
      </m.div>
    </StudentAppShell>
  );
}
