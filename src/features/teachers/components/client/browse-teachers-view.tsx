"use client";

import { memo, useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, CircleAlert, Search, Sparkles, UserRound, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import { cn } from "@/src/lib/cn";
import { ModernSelect } from "@/src/components/ui/modern-select";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import type { TeacherSummary } from "../../types";
import { TeacherCard } from "./teacher-card";
import "@/src/features/portal/styles/sticker.css";

const ITEMS_PER_PAGE = 12;

function BrowseTeachersView({
  teachers,
  grades,
  streams,
  loadError = false,
}: {
  teachers: TeacherSummary[];
  grades: GradeDto[];
  streams: StreamDto[];
  loadError?: boolean;
}) {
  const t = useTranslations("teacherDirectory.browse");
  const locale = useLocale();
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  const gradeOptions = useMemo(() => grades.length ? [
    { value: "all", label: t("allGrades") },
    ...grades.map((grade) => ({ value: String(grade.id), label: grade.name })),
  ] : [
    { value: "all", label: t("allGrades") },
    { value: "sec3", label: "الصف الثالث الثانوي" },
    { value: "sec2", label: "الصف الثاني الثانوي" },
    { value: "sec1", label: "الصف الأول الثانوي" },
  ], [grades, t]);

  const streamOptions = useMemo(() => streams.length ? [
    { value: "all", label: t("allStreams") },
    ...streams.map((stream) => ({ value: String(stream.id), label: stream.name })),
  ] : [
    { value: "all", label: t("allStreams") },
    { value: "general", label: "عام" },
    { value: "science", label: "علمي علوم" },
    { value: "math", label: "علمي رياضة" },
    { value: "humanities", label: "أدبي / مواد أدبية" },
    { value: "languages", label: "اللغات واللغويات" },
  ], [streams, t]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const q = searchQuery.trim().toLowerCase();
      const allText = [teacher.subject, ...(teacher.subjects || []), teacher.name, teacher.title, teacher.gradeLabel].join(" ").toLowerCase();

      let matchGrade = true;
      if (selectedGrade !== "all") {
        matchGrade = teacher.grade === selectedGrade || teacher.gradeIds?.includes(selectedGrade) === true;
      }

      let matchStream = true;
      if (selectedStream !== "all") {
        if (teacher.streamIds?.length) matchStream = teacher.streamIds.includes(selectedStream);
        else if (selectedStream === "science") matchStream = teacher.category === "science" || allText.includes("فيزياء") || allText.includes("أحياء") || allText.includes("كيمياء");
        else if (selectedStream === "math") matchStream = teacher.category === "math" || allText.includes("رياضيات") || allText.includes("ميكانيكا");
        else if (selectedStream === "humanities") matchStream = teacher.category === "humanities" || allText.includes("تاريخ") || allText.includes("فلسفة");
        else if (selectedStream === "languages") matchStream = teacher.category === "languages" || allText.includes("عربي") || allText.includes("English");
        else if (selectedStream === "general") matchStream = true;
      }

      return matchGrade && matchStream && (!q || allText.includes(q));
    });
  }, [teachers, selectedGrade, selectedStream, searchQuery]);

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const paginatedTeachers = filteredTeachers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const hasFilters = selectedGrade !== "all" || selectedStream !== "all" || Boolean(searchQuery);

  const handleFilterChange = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };
  const resetFilters = () => {
    setSelectedGrade("all");
    setSelectedStream("all");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-page text-ink dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <Link href="/" className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-black text-brand-700 hover:underline dark:text-brand-300">
            <BackArrow className="size-4" aria-hidden="true" />
            {t("backHome")}
          </Link>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-ink sm:text-5xl dark:text-slate-50">
            <UserRound className="size-8 shrink-0 text-brand-600 sm:size-10 dark:text-brand-300" aria-hidden="true" />
            <MarkerHighlight color="yellow" variant={1}>{t("title")}</MarkerHighlight>
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-7 font-medium text-muted sm:text-base dark:text-slate-400">{t("description")}</p>
        </header>

        <section aria-label={t("searchLabel")} className="sticker-tile mb-8 grid grid-cols-1 items-end gap-4 p-4 sm:p-5 md:grid-cols-3">
          <ModernSelect label={t("gradeLabel")} options={gradeOptions} value={selectedGrade} onChange={handleFilterChange(setSelectedGrade)} icon={BookOpen} />
          <ModernSelect label={t("streamLabel")} options={streamOptions} value={selectedStream} onChange={handleFilterChange(setSelectedStream)} icon={Sparkles} />
          <label className="block text-start">
            <span className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">{t("searchLabel")}</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
                placeholder={t("searchPlaceholder")}
                className="h-12 w-full rounded-2xl border-2 border-ink/15 bg-surface ps-10 pe-11 text-sm font-bold text-ink outline-none transition placeholder:font-medium placeholder:text-muted focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setPage(1); }}
                  aria-label={t("clearSearch")}
                  className="absolute end-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </span>
          </label>
        </section>

        {loadError && (
          <div role="alert" className="sticker-tile mb-6 flex items-center gap-3 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
            <span>{t("loadError")}</span>
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted tabular-nums dark:text-slate-400" aria-live="polite">
            {t("showing", { shown: paginatedTeachers.length, total: filteredTeachers.length })}
          </p>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="min-h-11 text-sm font-black text-brand-700 hover:underline dark:text-brand-300">
              {t("reset")}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {paginatedTeachers.length > 0 ? (
            <m.ul
              key={`${page}-${paginatedTeachers.map((teacher) => teacher.id).join("-")}`}
              className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {paginatedTeachers.map((teacher, index) => (
                <li key={teacher.id}>
                  <TeacherCard
                    index={index}
                    teacher={{
                      href: `/teachers/${teacher.id}`,
                      name: teacher.name,
                      avatar: teacher.avatar,
                      subjects: teacher.subjects?.length ? teacher.subjects : [teacher.subject],
                      grades: teacher.gradesList?.length ? teacher.gradesList : [teacher.gradeLabel],
                      description: teacher.bio,
                    }}
                  />
                </li>
              ))}
            </m.ul>
          ) : (
            <m.div
              key="empty"
              className="sticker-tile flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Search className="mb-4 size-10 text-brand-600 dark:text-brand-300" aria-hidden="true" />
              <h2 className="text-lg font-black text-ink dark:text-slate-50">{t("emptyTitle")}</h2>
              <p className="mt-2 max-w-[28rem] text-sm leading-6 font-medium text-muted dark:text-slate-400">{t("emptyDescription")}</p>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="sticker-btn mt-5 inline-flex min-h-11 items-center px-6 text-sm font-black text-white">
                  {t("resetAll")}
                </button>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label={t("pageNavigation")}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label={t("previousPage")}
              className="sticker-btn-outline grid size-11 place-items-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              {locale === "ar" ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronLeft className="size-4" aria-hidden="true" />}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-label={t("page", { page: p })}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "size-11 rounded-full border-2 text-sm font-black tabular-nums transition",
                  p === page ? "border-ink bg-brand-600 text-white shadow-[2px_2px_0_0_var(--color-ink)] dark:border-brand-300" : "sticker-btn-outline",
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label={t("nextPage")}
              className="sticker-btn-outline grid size-11 place-items-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              {locale === "ar" ? <ChevronLeft className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default memo(BrowseTeachersView);
