"use client";

import { useState, useMemo } from "react";
import { Teacher } from "../../types";
import { Users, Briefcase, CheckCircle2, Search, Video, Award, BookOpen, ChevronDown, Sparkles } from "lucide-react";
import { Reveal } from "@/src/components/ui/reveal";

interface TeacherGridProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  onBookTeacher: (teacher: Teacher) => void;
  searchQuery: string;
}

export default function TeacherGrid({ teachers, onSelectTeacher, onBookTeacher, searchQuery }: TeacherGridProps) {
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStream, setSelectedStream] = useState("all");
  const [internalSearch, setInternalSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const gradeOptions = [
    { value: "all", label: "جميع الصفوف الدراسية" },
    { value: "sec3", label: "الصف الثالث الثانوي" },
    { value: "sec2", label: "الصف الثاني الثانوي" },
    { value: "sec1", label: "الصف الأول الثانوي" },
  ];

  const streamOptions = [
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
      let matchesGrade = true;
      if (selectedGrade !== "all") {
        matchesGrade = teacher.grade === selectedGrade;
      }
      let matchesStream = true;
      if (selectedStream !== "all") {
        if (selectedStream === "science") {
          matchesStream = teacher.category === "science" || teacher.subject.includes("فيزياء") || teacher.subject.includes("أحياء") || teacher.subject.includes("كيمياء");
        } else if (selectedStream === "math") {
          matchesStream = teacher.category === "math" || teacher.subject.includes("رياضيات") || teacher.subject.includes("ميكانيكا");
        } else if (selectedStream === "humanities") {
          matchesStream = teacher.category === "humanities" || teacher.subject.includes("تاريخ") || teacher.subject.includes("جغرافيا") || teacher.subject.includes("فلسفة") || teacher.subject.includes("علم نفس");
        } else if (selectedStream === "languages") {
          matchesStream = teacher.category === "languages" || teacher.subject.includes("عربي") || teacher.subject.includes("English") || teacher.subject.includes("فرنساوي");
        } else if (selectedStream === "general") {
          matchesStream = true;
        }
      }
      let matchesSearch = true;
      if (activeSearch) {
        matchesSearch = teacher.name.toLowerCase().includes(activeSearch) ||
          teacher.subject.toLowerCase().includes(activeSearch) ||
          teacher.title.toLowerCase().includes(activeSearch) ||
          teacher.gradeLabel.toLowerCase().includes(activeSearch);
      }
      return matchesGrade && matchesStream && matchesSearch;
    });
  }, [teachers, selectedGrade, selectedStream, searchQuery, internalSearch]);

  const displayedTeachers = filteredTeachers.slice(0, visibleCount);

  return (
    <section id="teachers" className="pt-8 pb-20 bg-[#F8FAFC] dark:bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center flex flex-col items-center space-y-3 max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 dark:bg-slate-800 text-primary dark:text-sky-300 border border-sky-100 dark:border-slate-700 font-bold text-xs sm:text-sm shadow-sm">
              <Award className="w-4 h-4 text-primary shrink-0" />
              <span>نخبة من أفضل المعلمين المتخصصين</span>
            </div>
            <div className="pt-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-cairo block">اختر المدرسين</h2>
              <div className="h-1.5 bg-primary rounded-full w-24 mx-auto mt-2.5" />
            </div>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
              تصفح معلمي المنصة، واستكشف الكورسات المتاحة لكل معلم، وشاهد نماذج الشرح بالفيديو للبدء فوراً.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200/80 dark:border-slate-700 max-w-4xl mx-auto mb-12 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-right font-cairo">الصف الدراسي</label>
                <div className="relative">
                  <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-sm font-bold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-cairo">
                    {gradeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <BookOpen className="w-5 h-5 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-right font-cairo">الشعبة / التخصص</label>
                <div className="relative">
                  <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-sm font-bold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-cairo">
                    {streamOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <Sparkles className="w-5 h-5 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-right font-cairo">البحث باسم المعلم أو المادة</label>
                <div className="relative">
                  <input type="text" value={internalSearch} onChange={(e) => setInternalSearch(e.target.value)}
                    placeholder="ابحث هنا..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-sm text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-cairo" />
                  <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  {internalSearch && (
                    <button onClick={() => setInternalSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center hover:bg-slate-300 cursor-pointer">✕</button>
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

        {displayedTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedTeachers.map((teacher, i) => (
              <Reveal key={teacher.id} delay={i * 60}>
                <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-primary/30 flex flex-col justify-between group relative overflow-hidden h-full">
                  {teacher.featured && (
                    <div className="absolute top-4 left-4 bg-primary text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3" />
                      <span>معلم متميز</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        <img src={teacher.avatar} alt={teacher.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-light group-hover:scale-105 transition-transform duration-300 shadow-sm" />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white" title="معلم موثوق">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="space-y-1 text-right flex-1 min-w-0">
                        <span className="inline-block bg-primary-light text-primary font-bold text-xs px-2.5 py-0.5 rounded-md truncate max-w-full">{teacher.gradeLabel}</span>
                        <h3 className="text-lg font-black text-[#0F172A] group-hover:text-primary transition-colors truncate">{teacher.name}</h3>
                        <p className="text-xs font-semibold text-slate-500 truncate">{teacher.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2 px-3 bg-[#F8FAFC] rounded-xl mb-4 text-[#334155]">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <BookOpen className="w-4 h-4" />
                        <span>{teacher.courses ? teacher.courses.length : 1} كورسات متاحة</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{teacher.studentCount.toLocaleString("ar-EG")} طالب</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed line-clamp-2 mb-4 text-right">{teacher.bio}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-100 mb-5">
                      <div className="flex items-center gap-1.5 text-[#334155]">
                        <Briefcase className="w-3.5 h-3.5 text-primary" />
                        <span>{teacher.experienceYears} سنوات خبرة</span>
                      </div>
                      <div className="text-left font-extrabold text-primary">
                        <span>يبدأ من {teacher.courses && teacher.courses.length > 0 ? teacher.courses[0].price : teacher.pricePerSession} ج.م</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button onClick={() => onSelectTeacher(teacher)} className="py-2.5 px-3 bg-slate-100 hover:bg-primary-light text-slate-800 hover:text-primary font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1">
                      <Video className="w-3.5 h-3.5 text-primary" />
                      <span>الملف الشخصي</span>
                    </button>
                    <button onClick={() => onBookTeacher(teacher)} className="py-2.5 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-1">
                      <span>عرض الكورسات</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 max-w-lg mx-auto space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-[#0F172A]">لم نجد معلمين يطابقون بحثك</h3>
            <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر صف دراسي مختلف.</p>
            <button onClick={() => { setSelectedGrade("all"); setSelectedStream("all"); setInternalSearch(""); }} className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer">إعادة ضبط جميع الفلاتر</button>
          </div>
        )}

        {visibleCount < filteredTeachers.length && (
          <Reveal>
            <div className="mt-12 text-center">
              <button onClick={() => setVisibleCount((prev) => prev + 6)} className="px-8 py-3.5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-primary/25 transition-all cursor-pointer inline-flex items-center gap-2 font-cairo">
                <span>عرض المزيد من المدرسين</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
