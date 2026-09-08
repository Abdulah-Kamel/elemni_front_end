"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, m } from "motion/react";
import { BookOpen, CircleAlert, Clock3, Search, Sparkles } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { ModernSelect } from "@/src/components/ui/modern-select";
import type {
  GradeDto,
  PublicCourseDto,
  StreamDto,
  SubjectDto,
} from "@/src/lib/student-api/contract";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-calculus.webp";
import { filterLandingCourses, type LandingCourseFilters } from "./course-filter";

const initialFilters: LandingCourseFilters = {
  query: "",
  subject: "all",
  gradeId: "all",
  streamId: "all",
};

function formatDuration(minutes: number | null, t: ReturnType<typeof useTranslations<"studentLanding.courses">>) {
  if (!minutes) return null;
  return minutes < 60
    ? t("minutes", { count: minutes })
    : t("hours", { count: Math.round(minutes / 60) });
}

function formatPrice(price: string | number, locale: string, t: ReturnType<typeof useTranslations<"studentLanding.courses">>) {
  const value = Number(price);
  if (!Number.isFinite(value) || value === 0) return t("free");

  return `${new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 2,
  }).format(value)} ${t("currency")}`;
}

function courseDetailsHref(course: PublicCourseDto) {
  const teacherSlug = course.teacher_slug?.trim();
  return teacherSlug
    ? `/courses/${course.id}?teacher=${encodeURIComponent(teacherSlug)}`
    : `/courses/${course.id}`;
}

export default function CourseDiscovery({
  courses,
  grades,
  streams,
  subjects,
  searchQuery,
  onSearchChange,
  loadError = false,
}: {
  courses: PublicCourseDto[];
  grades: GradeDto[];
  streams: StreamDto[];
  subjects: SubjectDto[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loadError?: boolean;
}) {
  const t = useTranslations("studentLanding.courses");
  const locale = useLocale();
  const [filters, setFilters] = useState<LandingCourseFilters>(initialFilters);

  const activeFilters = useMemo(
    () => ({ ...filters, query: searchQuery }),
    [filters, searchQuery],
  );
  const filteredCourses = useMemo(
    () => filterLandingCourses(courses, activeFilters),
    [activeFilters, courses],
  );
  const visibleCourses = filteredCourses.slice(0, 6);

  const subjectOptions = useMemo(
    () => [
      { value: "all", label: t("allSubjects") },
      ...subjects.map((subject) => ({ value: subject.name, label: subject.name })),
    ],
    [subjects, t],
  );
  const gradeOptions = useMemo(
    () => [
      { value: "all", label: t("allGrades") },
      ...grades.map((grade) => ({ value: String(grade.id), label: grade.name })),
    ],
    [grades, t],
  );
  const streamOptions = useMemo(
    () => [
      { value: "all", label: t("allStreams") },
      ...streams.map((stream) => ({ value: String(stream.id), label: stream.name })),
    ],
    [streams, t],
  );

  const hasActiveFilters = Boolean(
    searchQuery ||
      filters.subject !== "all" ||
      filters.gradeId !== "all" ||
      filters.streamId !== "all",
  );

  const resetFilters = () => {
    onSearchChange("");
    setFilters(initialFilters);
  };

  const updateFilter = (key: keyof Omit<LandingCourseFilters, "query">) => (value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <Section id="courses" className="bg-[#F8FAFC] dark:bg-slate-900">
      <Reveal>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="font-readex text-3xl font-black tracking-tight text-[#0F172A] dark:text-white sm:text-4xl lg:text-5xl">
            اختار <MarkerHighlight color="sky" variant={1}>{t("titleHighlight")}</MarkerHighlight>
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {t("description")}
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mx-auto mb-10 max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-6">
          <div className="grid items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative font-readex md:col-span-2 lg:col-span-1">
              <label htmlFor="landing-course-search" className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
                {t("searchLabel")}
              </label>
              <Search className="absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="landing-course-search"
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pe-4 ps-10 text-sm font-bold text-[#0F172A] placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-white dark:focus:bg-slate-900"
              />
            </div>
            <ModernSelect label={t("subjectLabel")} options={subjectOptions} value={filters.subject} onChange={updateFilter("subject")} icon={BookOpen} />
            <ModernSelect label={t("gradeLabel")} options={gradeOptions} value={filters.gradeId} onChange={updateFilter("gradeId")} icon={Sparkles} />
            <ModernSelect label={t("streamLabel")} options={streamOptions} value={filters.streamId} onChange={updateFilter("streamId")} icon={Sparkles} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-bold dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">{t("resultCount", { count: filteredCourses.length })}</span>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="cursor-pointer text-primary hover:underline">
                {t("reset")}
              </button>
            )}
          </div>
        </div>
      </Reveal>

      {loadError && (
        <div role="alert" className="mx-auto mb-8 flex max-w-3xl items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
          <span>{t("loadError")}</span>
        </div>
      )}

      {visibleCourses.length > 0 ? (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleCourses.map((course) => {
              const duration = formatDuration(course.total_duration_minutes, t);
              return (
                <Link
                  key={course.id}
                  href={courseDetailsHref(course)}
                  prefetch={false}
                  aria-label={course.title}
                  className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 dark:focus-visible:ring-offset-slate-900"
                >
                  <m.article
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.25 }}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-sky-100/90 bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-sky-900/10 dark:border-slate-700 dark:bg-slate-800/95"
                  >
                    <div
                      data-testid="course-card-image"
                      className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-700"
                    >
                      <Image
                        src={resolveAssetUrl(course.img, lessonFallback.src)}
                        alt={course.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute start-3 bottom-3 w-fit max-w-[75%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-sm backdrop-blur-sm dark:bg-slate-900/90">
                        {course.subject_name || t("courseLabel")}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 min-h-12 text-lg font-black leading-6 text-[#0F172A] dark:text-white">{course.title}</h3>
                      <p
                        title={course.teacher_name || undefined}
                        className="mt-1 truncate text-xs font-bold leading-5 text-slate-500 dark:text-slate-400"
                      >
                        {course.teacher_name ? t("teacher", { name: course.teacher_name }) : t("teacherFallback")}
                      </p>
                      <p className="mt-2 line-clamp-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                        {course.description || t("courseFallbackDescription")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-primary" aria-hidden="true" />{t("lessons", { count: course.lesson_count })}</span>
                        {duration && <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-emerald-600" aria-hidden="true" />{duration}</span>}
                      </div>
                      <div className="mt-auto flex items-center justify-end gap-3 pt-4">
                        <span className="text-base font-black text-[#0F172A] dark:text-white sm:text-lg">{formatPrice(course.price, locale, t)}</span>
                      </div>
                    </div>
                  </m.article>
                </Link>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <Search className="mx-auto size-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-black text-[#0F172A] dark:text-white">{courses.length ? t("noResults") : t("noCourses")}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{courses.length ? t("noResultsDescription") : t("noCoursesDescription")}</p>
          {courses.length > 0 && hasActiveFilters && (
            <button type="button" onClick={resetFilters} className="mt-4 cursor-pointer text-sm font-bold text-primary hover:underline">
              {t("reset")}
            </button>
          )}
        </div>
      )}
    </Section>
  );
}
