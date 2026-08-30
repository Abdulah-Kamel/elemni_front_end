"use client";

import { useMemo, useState } from "react";
import { Link } from "@/src/i18n/navigation";
import type { TeacherSummary } from "@/src/features/teachers/types";
import { Search, BookOpen, Sparkles, ArrowLeft, CircleAlert } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Reveal } from "@/src/components/ui/reveal";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import type { GradeDto, StreamDto } from "@/src/lib/student-api/contract";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { ModernSelect } from "@/src/components/ui/modern-select";

interface TeacherGridProps {
  teachers: TeacherSummary[];
  grades: GradeDto[];
  streams: StreamDto[];
  searchQuery: string;
  loadError?: boolean;
}

export default function TeacherGrid({ teachers, grades, streams, searchQuery, loadError = false }: TeacherGridProps) {
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");
  const [internalSearch, setInternalSearch] = useState("");

  const gradeOptions = grades.length ? [
    { value: "all", label: "جميع الصفوف الدراسية" },
    ...grades.map((grade) => ({ value: String(grade.id), label: grade.name })),
  ] : [
    { value: "all", label: "جميع الصفوف الدراسية" },
    { value: "sec3", label: "الصف الثالث الثانوي" },
    { value: "sec2", label: "الصف الثاني الثانوي" },
    { value: "sec1", label: "الصف الأول الثانوي" },
  ];

  const streamOptions = streams.length ? [
    { value: "all", label: "جميع الشعب والتخصصات" },
    ...streams.map((stream) => ({ value: String(stream.id), label: stream.name })),
  ] : [
    { value: "all", label: "جميع الشعب والتخصصات" },
    { value: "general", label: "عام" },
    { value: "science", label: "علمي علوم" },
    { value: "math", label: "علمي رياضة" },
    { value: "humanities", label: "أدبي / مواد أدبية" },
    { value: "languages", label: "اللغات واللغويات" },
  ];

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const activeSearch = (searchQuery || internalSearch).trim().toLowerCase();
      const allSubjectText = [teacher.subject, ...(teacher.subjects || [])].join(" ");

      let matchesGrade = true;
      if (selectedGrade !== "all") {
        matchesGrade = teacher.grade === selectedGrade || teacher.gradeIds?.includes(selectedGrade) === true;
      }

      let matchesStream = true;
      if (selectedStream !== "all") {
        if (teacher.streamIds?.length) {
          matchesStream = teacher.streamIds.includes(selectedStream);
        } else if (selectedStream === "science") {
          matchesStream = teacher.category === "science" || allSubjectText.includes("فيزياء") || allSubjectText.includes("أحياء") || allSubjectText.includes("كيمياء") || allSubjectText.includes("علوم");
        } else if (selectedStream === "math") {
          matchesStream = teacher.category === "math" || allSubjectText.includes("رياضيات") || allSubjectText.includes("ميكانيكا") || allSubjectText.includes("جبر");
        } else if (selectedStream === "humanities") {
          matchesStream = teacher.category === "humanities" || allSubjectText.includes("تاريخ") || allSubjectText.includes("جغرافيا") || allSubjectText.includes("فلسفة") || allSubjectText.includes("علم نفس");
        } else if (selectedStream === "languages") {
          matchesStream = teacher.category === "languages" || allSubjectText.includes("عربي") || allSubjectText.includes("English") || allSubjectText.includes("فرنساوي") || allSubjectText.includes("لغة");
        } else if (selectedStream === "general") {
          matchesStream = true;
        }
      }

      let matchesSearch = true;
      if (activeSearch) {
        matchesSearch =
          teacher.name.toLowerCase().includes(activeSearch) ||
          allSubjectText.toLowerCase().includes(activeSearch) ||
          teacher.title.toLowerCase().includes(activeSearch) ||
          teacher.gradeLabel.toLowerCase().includes(activeSearch);
      }

      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [teachers, selectedGrade, selectedStream, searchQuery, internalSearch]);

  const displayedTeachers = filteredTeachers.slice(0, 6);

  return (
    <section id="teachers" className="pt-8 pb-20 bg-[#F8FAFC] dark:bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center flex flex-col items-center space-y-3 max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-cairo block">
              اختر{" "}
              <MarkerHighlight color="sky" variant={1}>
                المدرسين
              </MarkerHighlight>
            </h2>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
              تصفح معلمي المنصة، واستكشف الكورسات المتاحة لكل معلم، وشاهد نماذج الشرح بالفيديو للبدء فوراً.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200/80 dark:border-slate-700 max-w-4xl mx-auto mb-12 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <ModernSelect
                label="الصف الدراسي"
                options={gradeOptions}
                value={selectedGrade}
                onChange={setSelectedGrade}
                icon={BookOpen}
              />
              <ModernSelect
                label="الشعبة / التخصص"
                options={streamOptions}
                value={selectedStream}
                onChange={setSelectedStream}
                icon={Sparkles}
              />
              <div className="relative text-start font-cairo">
                <label className="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">
                  البحث باسم المعلم أو المادة
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={internalSearch}
                    onChange={(e) => setInternalSearch(e.target.value)}
                    placeholder="ابحث هنا..."
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/80 py-3 pe-10 ps-10 text-sm font-bold text-[#0F172A] dark:text-white placeholder-slate-400 transition-all focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-cairo backdrop-blur-sm"
                  />
                  <Search className="absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 stroke-[2.2]" />
                  {internalSearch && (
                    <button
                      onClick={() => setInternalSearch("")}
                      className="absolute inset-e-3 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            {(selectedGrade !== "all" || selectedStream !== "all" || internalSearch) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-cairo">
                <span className="text-slate-500 dark:text-slate-400">نتائج البحث: <strong className="text-primary">{filteredTeachers.length}</strong> معلم</span>
                <button onClick={() => { setSelectedGrade("all"); setSelectedStream("all"); setInternalSearch(""); }} className="text-primary hover:underline font-bold cursor-pointer">إعادة ضبط الفلاتر</button>
              </div>
            )}
          </div>
        </Reveal>

        {loadError && (
          <div className="mx-auto mb-8 flex max-w-3xl items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <CircleAlert className="size-5 shrink-0" />
            <span>تعذر تحميل المدرسين من الخادم. تحقق من اتصال خدمة الـ API ثم أعد المحاولة.</span>
          </div>
        )}

        {displayedTeachers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {displayedTeachers.map((teacher) => {
                  const subjectsList = teacher.subjects?.length ? teacher.subjects : [teacher.subject];
                  const gradesList = teacher.gradesList?.length ? teacher.gradesList : [teacher.gradeLabel];
                  const maxVisibleGrades = 2;
                  const visibleGrades = gradesList.slice(0, maxVisibleGrades);
                  const remainingCount = gradesList.length - visibleGrades.length;

                  return (
                    <m.div
                      layout
                      key={teacher.id}
                      initial={{ opacity: 0, y: 18, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.97 }}
                      transition={{ layout: { type: "spring", bounce: 0.16, duration: 0.5 } }}
                      className="h-full transition-transform duration-300 hover:-translate-y-1.5"
                    >
                      <Link href={`/teachers/${teacher.id}`} prefetch={false}
                        className={cn(
                          "group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-sky-100/90 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-sky-900/10 dark:border-slate-700 dark:bg-slate-800/95"
                        )}
                      >
                        <div className="flex flex-col flex-1">
                          <div className="relative mb-4 h-48 w-full shrink-0 overflow-hidden rounded-xl bg-linear-to-b from-sky-100 to-slate-200 shadow-md sm:h-52 dark:from-slate-700 dark:to-slate-900">
                            <Image
                              src={teacher.avatar}
                              alt={teacher.name}
                              fill
                              loading="lazy"
                              sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw"
                              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="text-center px-1 mb-2">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight truncate">{teacher.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2.5 min-h-6.5">
                            {subjectsList.map((sub, idx) => (
                              <span key={idx} className="text-[11px] font-extrabold text-primary dark:text-sky-300 bg-sky-100/90 dark:bg-slate-700/90 px-2.5 py-0.5 rounded-full">{sub}</span>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 min-h-7">
                            {visibleGrades.map((grade, idx) => (
                              <span key={idx} className="text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-100/90 dark:bg-slate-700/80 px-2.5 py-0.5 rounded-full">{grade}</span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-600/80 px-2 py-0.5 rounded-full">
                                +{remainingCount} صفوف أخرى
                              </span>
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
                    </m.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <Reveal>
              <div className="mt-10 text-center">
                <Link href="/teachers"
                  className="px-8 py-3.5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-primary/25 transition-all inline-flex items-center gap-2 font-cairo">
                  <span>عرض جميع المدرسين</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 max-w-lg mx-auto space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-[#0F172A]">
              {teachers.length ? "لم نجد معلمين يطابقون بحثك" : "لا يوجد مدرسون منشورون حالياً"}
            </h3>
            <p className="text-xs text-slate-500">
              {teachers.length ? "جرب البحث بكلمات أخرى أو اختر صف دراسي مختلف." : "سيظهر المدرسون هنا بعد إضافتهم وتفعيل حساباتهم من لوحة الإدارة."}
            </p>
            {teachers.length > 0 && <button onClick={() => { setSelectedGrade("all"); setSelectedStream("all"); setInternalSearch(""); }} className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer">إعادة ضبط جميع الفلاتر</button>}
          </div>
        )}
      </div>
    </section>
  );
}
