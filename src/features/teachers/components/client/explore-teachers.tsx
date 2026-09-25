"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import type { GradeDto, PublicTeacherDto } from "@/src/lib/student-api/contract";
import { Link, useRouter } from "@/src/i18n/navigation";
import { useCurrentStudent } from "@/src/features/student/hooks/use-student-queries";
import { isStudentUnauthorized } from "@/src/lib/student-api/client";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import StudentPortalShell from "@/src/features/portal/components/portal-shell";
import teacherFallback from "@/src/assets/images/student-redesign/teacher-ahmad.webp";

const TEACHERS_PER_PAGE = 8;
const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;
type TeacherSort = "courses" | "name";

function TeacherCard({
  teacher,
  courseCount,
  index,
}: {
  teacher: PublicTeacherDto;
  courseCount: number;
  index: number;
}) {
  const t = useTranslations("studentPortal");
  const locale = useLocale();

  return (
    <m.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ ...popSpring, delay: 0.04 * (index % TEACHERS_PER_PAGE) }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      className="sticker-tile group flex min-h-56 flex-col items-stretch gap-4 p-4 transition-colors hover:bg-brand-50/60 sm:p-5 dark:hover:bg-slate-900"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-[1.25rem] border-2 border-ink bg-brand-100 shadow-[3px_3px_0_0_var(--color-ink)] transition-transform group-hover:-rotate-2 sm:size-[5.5rem] dark:border-brand-300 dark:bg-slate-800 dark:shadow-[3px_3px_0_0_#334155]">
          <Image
            src={resolveAssetUrl(teacher.img, teacherFallback.src)}
            alt={teacher.name}
            fill
            sizes="88px"
            className="object-cover object-center"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black leading-tight text-ink sm:text-xl dark:text-slate-50">
            {teacher.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {teacher.subjects.slice(0, 3).map((subject) => (
              <span key={subject.id} className="sticker-badge bg-brand-100 px-2.5 py-1 text-[11px] font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">
                {subject.name}
              </span>
            ))}
          </div>
          {teacher.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 font-medium text-muted dark:text-slate-400">
              {teacher.description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3 dark:border-slate-700">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-black text-muted dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            {t("exploreTeacherCourseCount", { count: courseCount })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            {t("exploreTeacherGradeCount", { count: teacher.grades.length })}
          </span>
        </div>
        <Link
          href={`/explore/teachers/${teacher.slug}`}
          className="sticker-btn-outline inline-flex min-h-10 shrink-0 items-center gap-2 px-4 text-xs font-black text-brand-700 transition-transform group-hover:translate-x-0.5 dark:text-brand-300"
        >
          {t("exploreTeacherViewProfile")}
          {locale === "ar" ? (
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden="true" />
          )}
        </Link>
      </div>
    </m.article>
  );
}

export default function ExploreTeachers({
  teachers,
  grades,
  courseCounts,
  loadError,
}: {
  teachers: PublicTeacherDto[];
  grades: GradeDto[];
  courseCounts: Record<string, number>;
  loadError: boolean;
}) {
  const t = useTranslations("studentPortal");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const userQuery = useCurrentStudent();
  const user = userQuery.data ?? null;
  const unauthorized = isStudentUnauthorized(userQuery.error);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [grade, setGrade] = useState(() => searchParams.get("grade") ?? searchParams.get("tgrade") ?? "all");
  const [subject, setSubject] = useState(() => searchParams.get("subject") ?? searchParams.get("tsubject") ?? "all");
  const [sort, setSort] = useState<TeacherSort>(() => (searchParams.get("sort") ?? searchParams.get("tsort")) === "name" ? "name" : "courses");
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page") ?? searchParams.get("tpage")) || 1));
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(queryString);
    const values: Record<string, string | number> = { q: search, grade, subject, sort, page };
    for (const [key, value] of Object.entries(values)) {
      const normalized = String(value);
      const isDefault = (key === "grade" || key === "subject") && normalized === "all";
      const isDefaultSort = key === "sort" && normalized === "courses";
      const isDefaultPage = key === "page" && normalized === "1";
      if (!normalized || isDefault || isDefaultSort || isDefaultPage) params.delete(key);
      else params.set(key, normalized);
    }
    params.delete("view");
    params.delete("tgrade");
    params.delete("tsubject");
    params.delete("tsort");
    params.delete("tpage");
    const nextQueryString = params.toString();
    if (nextQueryString !== queryString) {
      router.replace(`/explore/teachers${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false });
    }
  }, [grade, page, queryString, router, search, sort, subject]);

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  const subjects = useMemo(
    () => Array.from(new Map(teachers.flatMap((teacher) => teacher.subjects).map((item) => [item.id, item])).values())
      .sort((first, second) => first.name.localeCompare(second.name, locale)),
    [locale, teachers],
  );
  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    return teachers
      .filter((teacher) => {
        const haystack = [
          teacher.name,
          teacher.description,
          ...teacher.subjects.map((item) => item.name),
          ...teacher.grades.map((item) => item.name),
        ].filter(Boolean).join(" ").toLocaleLowerCase(locale);
        return (
          (!query || haystack.includes(query)) &&
          (grade === "all" || teacher.grades.some((item) => item.id === Number(grade))) &&
          (subject === "all" || teacher.subjects.some((item) => item.name === subject))
        );
      })
      .sort((first, second) => {
        if (sort === "name") return first.name.localeCompare(second.name, locale);
        return (courseCounts[second.slug] ?? 0) - (courseCounts[first.slug] ?? 0) || first.name.localeCompare(second.name, locale);
      });
  }, [courseCounts, grade, locale, search, sort, subject, teachers]);

  const totalPages = Math.ceil(filteredTeachers.length / TEACHERS_PER_PAGE);
  const visibleTeachers = filteredTeachers.slice((page - 1) * TEACHERS_PER_PAGE, page * TEACHERS_PER_PAGE);
  const visibleTeacherSlugs = visibleTeachers.map((teacher) => teacher.slug).join("-");
  const hasFilters = Boolean(search) || grade !== "all" || subject !== "all";
  const resetFilters = () => {
    setSearch("");
    setGrade("all");
    setSubject("all");
    setPage(1);
  };

  return (
    <StudentPortalShell user={user} active="teachers">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <m.header
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={popSpring}
        >
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-ink sm:text-5xl dark:text-slate-50">
              <UserRound className="size-8 shrink-0 text-brand-600 dark:text-brand-300 sm:size-10" aria-hidden="true" />
              <MarkerHighlight color="yellow" variant={1}>{t("exploreTeachersTitle")}</MarkerHighlight>
            </h1>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 font-medium text-muted dark:text-slate-400">
              {t("exploreTeachersDescription")}
            </p>
          </div>
          <span className="sticker-badge inline-flex w-fit rotate-1 items-center gap-2 bg-brand-100 px-4 py-2 text-xs font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">
            {t("exploreTeachersCount", { count: teachers.length })}
          </span>
        </m.header>

        <div className="mt-6 lg:hidden">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            aria-expanded={showFilters}
            aria-controls="teacher-explore-filters"
            className="sticker-btn-outline inline-flex h-11 cursor-pointer items-center gap-2 px-5 text-sm font-black text-ink dark:text-slate-200"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {showFilters ? t("exploreTeachersHideFilters") : t("exploreTeachersShowFilters")}
          </button>
        </div>

        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
          <m.aside
            id="teacher-explore-filters"
            aria-label={t("exploreTeachersFilters")}
            className={`sticker-tile p-4 sm:p-5 lg:sticky lg:top-24 ${showFilters ? "block" : "hidden"} lg:block`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...popSpring, delay: 0.08 }}
          >
            <label className="relative block">
              <span className="sr-only">{t("exploreTeachersSearchLabel")}</span>
              <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder={t("exploreTeachersSearchPlaceholder")}
                className="h-12 w-full rounded-full border-2 border-ink bg-surface pe-12 ps-5 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-brand-600 sm:text-base dark:border-brand-300 dark:bg-transparent dark:text-slate-100"
              />
            </label>
            <div className="mt-4 grid gap-3">
              <label>
                <span className="sr-only">{t("exploreTeachersGradeFilter")}</span>
                <select value={grade} onChange={(event) => { setGrade(event.target.value); setPage(1); }} className="h-11 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-slate-900 dark:text-slate-100">
                  <option value="all">{t("exploreTeachersAllGrades")}</option>
                  {grades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">{t("exploreTeachersSubjectFilter")}</span>
                <select value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1); }} className="h-11 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-slate-900 dark:text-slate-100">
                  <option value="all">{t("exploreTeachersAllSubjects")}</option>
                  {subjects.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">{t("exploreTeachersSort")}</span>
                <select value={sort} onChange={(event) => { setSort(event.target.value as TeacherSort); setPage(1); }} className="h-11 w-full cursor-pointer rounded-full border-2 border-ink bg-surface px-4 text-sm font-black text-ink outline-none focus:border-brand-600 dark:border-brand-300 dark:bg-slate-900 dark:text-slate-100">
                  <option value="courses">{t("exploreTeachersSortCourses")}</option>
                  <option value="name">{t("exploreTeachersSortName")}</option>
                </select>
              </label>
            </div>
            {hasFilters && <button type="button" onClick={resetFilters} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">{t("exploreTeachersResetFilters")}</button>}
          </m.aside>

          <section className="min-w-0" aria-labelledby="teacher-results-title">
            {loadError && (
              <div role="alert" className="sticker-tile mb-5 flex items-center gap-3 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
                {t("exploreTeachersLoadError")}
              </div>
            )}
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="teacher-results-title" className="text-2xl font-black tracking-tight text-ink sm:text-3xl dark:text-slate-50">
                <MarkerHighlight color="sky" variant={1}>{t("exploreTeachersResultsTitle")}</MarkerHighlight>
              </h2>
              <span className="sticker-badge shrink-0 bg-surface px-3 py-1 text-xs font-black text-muted dark:text-slate-300">
                {t("exploreTeachersCount", { count: filteredTeachers.length })}
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {visibleTeachers.length ? (
                <m.div key={visibleTeacherSlugs} className="grid gap-5 md:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {visibleTeachers.map((teacher, index) => (
                    <TeacherCard key={teacher.slug} teacher={teacher} courseCount={courseCounts[teacher.slug] ?? 0} index={index} />
                  ))}
                </m.div>
              ) : (
                <m.div key="empty-teachers" className="sticker-tile flex min-h-64 flex-col items-center justify-center px-5 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={popSpring}>
                  <UserRound className="mb-4 size-9 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                  <h3 className="text-lg font-black text-ink dark:text-slate-50">{t("exploreTeachersEmptyTitle")}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 font-medium text-muted dark:text-slate-400">{t("exploreTeachersEmptyDescription")}</p>
                  {hasFilters && <button type="button" onClick={resetFilters} className="mt-4 cursor-pointer text-sm font-black text-brand-700 hover:underline dark:text-brand-300">{t("exploreTeachersResetFilters")}</button>}
                </m.div>
              )}
            </AnimatePresence>
            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label={t("exploreTeachersPageNavigation")}>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label={t("exploreTeachersPreviousPage")} className="sticker-btn-outline flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                  <button key={item} type="button" onClick={() => setPage(item)} aria-current={page === item ? "page" : undefined} className={`size-11 rounded-full border-2 text-sm font-black transition ${page === item ? "border-ink bg-brand-600 text-white shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300" : "sticker-btn-outline"}`}>
                    {item}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label={t("exploreTeachersNextPage")} className="sticker-btn-outline flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </StudentPortalShell>
  );
}
