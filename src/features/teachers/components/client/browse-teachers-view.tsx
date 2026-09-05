"use client";

import { memo, useState, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import type { TeacherSummary } from "../../types";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import { Search, BookOpen, Sparkles, ChevronRight, ArrowLeft, ChevronLeft, CircleAlert } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { ModernSelect } from "@/src/components/ui/modern-select";

const ITEMS_PER_PAGE = 8;

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
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const gradeOptions = useMemo(() => grades.length ? [
    { value: "all", label: "جميع الصفوف الدراسية" },
    ...grades.map((grade) => ({ value: String(grade.id), label: grade.name })),
  ] : [
    { value: "all", label: "جميع الصفوف الدراسية" },
    { value: "sec3", label: "الصف الثالث الثانوي" },
    { value: "sec2", label: "الصف الثاني الثانوي" },
    { value: "sec1", label: "الصف الأول الثانوي" },
  ], [grades]);

  const streamOptions = useMemo(() => streams.length ? [
    { value: "all", label: "جميع الشعب والتخصصات" },
    ...streams.map((stream) => ({ value: String(stream.id), label: stream.name })),
  ] : [
    { value: "all", label: "جميع الشعب والتخصصات" },
    { value: "general", label: "عام" },
    { value: "science", label: "علمي علوم" },
    { value: "math", label: "علمي رياضة" },
    { value: "humanities", label: "أدبي / مواد أدبية" },
    { value: "languages", label: "اللغات واللغويات" },
  ], [streams]);

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

      let matchSearch = true;
      if (q) matchSearch = allText.includes(q);

      return matchGrade && matchStream && matchSearch;
    });
  }, [teachers, selectedGrade, selectedStream, searchQuery]);

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const paginatedTeachers = filteredTeachers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  const handleFilterChange = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-page text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-ink font-readex">جميع المدرسين</h1>
          <p className="text-muted mt-1">تصفح جميع المدرسين المتخصصين على المنصة</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200/80 dark:border-slate-700 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <ModernSelect
              label="الصف الدراسي"
              options={gradeOptions}
              value={selectedGrade}
              onChange={handleFilterChange(setSelectedGrade)}
              icon={BookOpen}
            />
            <ModernSelect
              label="الشعبة / التخصص"
              options={streamOptions}
              value={selectedStream}
              onChange={handleFilterChange(setSelectedStream)}
              icon={Sparkles}
            />
            <div className="relative text-start font-readex">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 font-readex">
                البحث باسم المعلم أو المادة
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ابحث عن معلم..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/80 py-3 pe-10 ps-10 text-sm font-bold text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-readex backdrop-blur-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute inset-s-3 top-1/2 -translate-y-1/2 stroke-[2.2]" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full w-5 h-5 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        {loadError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <CircleAlert className="size-5 shrink-0" />
            <span>تعذر تحميل قائمة المدرسين من الخادم. حاول تحديث الصفحة بعد قليل.</span>
          </div>
        )}
        <p className="text-sm text-muted mb-6">
          عرض {paginatedTeachers.length} من {filteredTeachers.length} معلم
          {(selectedGrade !== "all" || selectedStream !== "all" || searchQuery) && (
            <button onClick={() => { setSelectedGrade("all"); setSelectedStream("all"); setSearchQuery(""); setPage(1); }} className="ms-3 text-primary font-bold hover:underline text-xs">إعادة ضبط</button>
          )}
        </p>

        {/* Teacher grid */}
        {paginatedTeachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {paginatedTeachers.map((teacher) => {
              const subjectsList = teacher.subjects?.length ? teacher.subjects : [teacher.subject];
              const gradesList = teacher.gradesList?.length ? teacher.gradesList : [teacher.gradeLabel];
              const visibleGrades = gradesList.slice(0, 2);
              const remainingCount = gradesList.length - visibleGrades.length;

              return (
                <Link key={teacher.id} href={`/teachers/${teacher.id}`} prefetch={false}
                  className="bg-[#EBF5FB] dark:bg-slate-800/95 rounded-[28px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-sky-100/90 dark:border-slate-700 flex flex-col justify-between h-full group relative overflow-hidden cursor-pointer"
                >
                  <div className="flex flex-col flex-1">
                    <div className="relative w-full aspect-square rounded-[22px] overflow-hidden bg-linear-to-b from-sky-100 to-slate-200 dark:from-slate-700 dark:to-slate-900 shadow-md mb-4 shrink-0">
                      <Image
                        src={teacher.avatar}
                        alt={teacher.name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 25vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="text-center px-1 mb-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight truncate">{teacher.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2.5">
                      {subjectsList.map((sub, idx) => (
                        <span key={idx} className="text-[11px] font-extrabold text-primary dark:text-sky-300 bg-sky-100/90 dark:bg-slate-700/90 px-2.5 py-0.5 rounded-full">{sub}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                      {visibleGrades.map((grade, idx) => (
                        <span key={idx} className="text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-100/90 dark:bg-slate-700/80 px-2.5 py-0.5 rounded-full">{grade}</span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-600/80 px-2 py-0.5 rounded-full">+{remainingCount} صفوف أخرى</span>
                      )}
                    </div>
                    {teacher.bio && (
                      <div className="text-center px-1 mb-4 my-auto">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">{teacher.bio}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-sky-200/50 dark:border-slate-700/80 shrink-0">
                    <div className="w-full py-2.5 px-4 bg-primary group-hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 group-hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>عرض الكورسات</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-ink">لم نجد معلمين يطابقون بحثك</h3>
            <p className="text-sm text-muted mt-1">جرب البحث بكلمات أخرى أو اختر صف دراسي مختلف.</p>
            <button onClick={() => { setSelectedGrade("all"); setSelectedStream("all"); setSearchQuery(""); setPage(1); }}
              className="mt-4 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl">إعادة ضبط جميع الفلاتر</button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", page === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-100 hover:bg-primary-light text-ink hover:text-primary")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={cn("w-10 h-10 rounded-xl font-bold text-sm transition-all", p === page ? "bg-primary text-white" : "bg-slate-100 hover:bg-primary-light text-ink hover:text-primary")}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn("px-4 py-2 rounded-xl font-bold text-sm transition-all", page === totalPages ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-100 hover:bg-primary-light text-ink hover:text-primary")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BrowseTeachersView);
