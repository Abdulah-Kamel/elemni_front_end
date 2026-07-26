import React, { useState, useMemo } from 'react';
import { Teacher } from '../types';
import { Users, Briefcase, CheckCircle2, Search, Video, Award, Sparkles, BookOpen, ChevronDown } from 'lucide-react';

interface TeacherGridProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  onBookTeacher: (teacher: Teacher) => void;
  onViewFullProfile?: (teacher: Teacher) => void;
  searchQuery: string;
}

export const TeacherGrid: React.FC<TeacherGridProps> = ({
  teachers,
  onSelectTeacher,
  onBookTeacher,
  onViewFullProfile,
  searchQuery
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const gradeOptions = [
    { value: 'all', label: 'جميع الصفوف الدراسية' },
    { value: 'sec3', label: 'الصف الثالث الثانوي' },
    { value: 'sec2', label: 'الصف الثاني الثانوي' },
    { value: 'sec1', label: 'الصف الأول الثانوي' },
  ];

  const streamOptions = [
    { value: 'all', label: 'جميع الشعب والتخصصات' },
    { value: 'general', label: 'عام' },
    { value: 'science', label: 'علمي علوم' },
    { value: 'math', label: 'علمي رياضة' },
    { value: 'humanities', label: 'أدبي / مواد أدبية' },
    { value: 'languages', label: 'اللغات واللغويات' },
  ];

  // Combined search and dropdown filters logic
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const activeSearch = (searchQuery || internalSearch).trim().toLowerCase();
      const allSubjectText = [teacher.subject, ...(teacher.subjects || [])].join(' ');

      // Grade matching
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
        matchesGrade = teacher.grade === selectedGrade || (teacher.gradesList && teacher.gradesList.some(g => g.includes(selectedGrade)));
      }

      // Stream / Category matching
      let matchesStream = true;
      if (selectedStream !== 'all') {
        if (selectedStream === 'science') {
          matchesStream = teacher.category === 'science' || allSubjectText.includes('فيزياء') || allSubjectText.includes('أحياء') || allSubjectText.includes('كيمياء') || allSubjectText.includes('علوم');
        } else if (selectedStream === 'math') {
          matchesStream = teacher.category === 'math' || allSubjectText.includes('رياضيات') || allSubjectText.includes('ميكانيكا') || allSubjectText.includes('جبر');
        } else if (selectedStream === 'humanities') {
          matchesStream = teacher.category === 'humanities' || allSubjectText.includes('تاريخ') || allSubjectText.includes('جغرافيا') || allSubjectText.includes('فلسفة') || allSubjectText.includes('علم نفس');
        } else if (selectedStream === 'languages') {
          matchesStream = teacher.category === 'languages' || allSubjectText.includes('عربي') || allSubjectText.includes('English') || allSubjectText.includes('فرنساوي') || allSubjectText.includes('لغة');
        } else if (selectedStream === 'general') {
          matchesStream = true;
        }
      }

      // Search matching
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

  const displayedTeachers = filteredTeachers.slice(0, visibleCount);

  return (
    <section id="teachers" className="pt-8 pb-20 bg-[#F8FAFC] dark:bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center flex flex-col items-center space-y-3 max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 dark:bg-slate-800 text-primary dark:text-sky-300 border border-sky-100 dark:border-slate-700 font-bold text-xs sm:text-sm shadow-sm">
            <Award className="w-4 h-4 text-primary shrink-0" />
            <span>نخبة من أفضل المعلمين المتخصصين</span>
          </div>

          <div className="pt-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-cairo block">
              اختر المدرسين
            </h2>
            <div className="h-1.5 bg-primary rounded-full w-24 mx-auto mt-2.5" />
          </div>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
            تصفح معلمي المنصة، واستكشف الكورسات المتاحة لكل معلم، وشاهد نماذج الشرح بالفيديو للبدء فوراً.
          </p>
        </div>

        {/* Dropdown Filters & Search Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200/80 dark:border-slate-700 max-w-4xl mx-auto mb-12 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Dropdown 1: Grade Selection */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-right font-cairo">
                الصف الدراسي
              </label>
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-sm font-bold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-cairo"
                >
                  {gradeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <BookOpen className="w-5 h-5 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown 2: Stream Selection */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-right font-cairo">
                الشعبة / التخصص
              </label>
              <div className="relative">
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-sm font-bold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-cairo"
                >
                  {streamOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Sparkles className="w-5 h-5 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Teacher Search Input */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-right font-cairo">
                البحث باسم المعلم أو المادة
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={internalSearch}
                  onChange={(e) => setInternalSearch(e.target.value)}
                  placeholder="ابحث هنا..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-sm text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all font-cairo"
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                {internalSearch && (
                  <button
                    onClick={() => setInternalSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center hover:bg-slate-300 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Active Filter Indicators / Reset */}
          {(selectedGrade !== 'all' || selectedStream !== 'all' || internalSearch) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-cairo">
              <span className="text-slate-500 dark:text-slate-400">
                نتائج البحث: <strong className="text-primary">{filteredTeachers.length}</strong> معلم
              </span>
              <button
                onClick={() => {
                  setSelectedGrade('all');
                  setSelectedStream('all');
                  setInternalSearch('');
                }}
                className="text-primary hover:underline font-bold cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}

        </div>

        {/* Teacher Cards Responsive Grid */}
        {displayedTeachers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {displayedTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  onClick={() => {
                    if (onViewFullProfile) {
                      onViewFullProfile(teacher);
                    } else {
                      onSelectTeacher(teacher);
                    }
                  }}
                  className="bg-[#EBF5FB] dark:bg-slate-800/95 rounded-[28px] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-sky-100/90 dark:border-slate-700 flex flex-col justify-between h-full group relative overflow-hidden cursor-pointer select-none"
                >
                  <div className="flex flex-col flex-1">
                    {/* Top Large Portrait Image Container */}
                    <div className="relative w-full aspect-square rounded-[22px] overflow-hidden bg-gradient-to-b from-sky-100 to-slate-200 dark:from-slate-700 dark:to-slate-900 shadow-md mb-4 shrink-0">
                      <img
                        src={teacher.avatar}
                        alt={teacher.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Centered Bold Teacher Name */}
                    <div className="text-center px-1 mb-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight truncate">
                        {teacher.name}
                      </h3>
                    </div>

                    {/* Subject Pills / Badges (Handles 1, 2, 3 or more subjects) */}
                    {(() => {
                      const subjectsList = teacher.subjects && teacher.subjects.length > 0
                        ? teacher.subjects
                        : [teacher.subject];

                      return (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2.5 min-h-[26px]">
                          {subjectsList.map((sub, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-extrabold text-primary dark:text-sky-300 bg-sky-100/90 dark:bg-slate-700/90 px-2.5 py-0.5 rounded-full"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Separated Grade Pills / Badges (Handles 1 to 5+ grades gracefully) */}
                    {(() => {
                      const allGrades = teacher.gradesList && teacher.gradesList.length > 0
                        ? teacher.gradesList
                        : teacher.gradeLabel.includes('و') || teacher.gradeLabel.includes('،')
                          ? [
                              ...(teacher.gradeLabel.includes('الأول') ? ['الصف الأول الثانوي'] : []),
                              ...(teacher.gradeLabel.includes('الثاني') ? ['الصف الثاني الثانوي'] : []),
                              ...(teacher.gradeLabel.includes('الثالث') ? ['الصف الثالث الثانوي'] : [])
                            ]
                          : [teacher.gradeLabel];

                      const maxVisible = 2;
                      const visibleGrades = allGrades.slice(0, maxVisible);
                      const remainingCount = allGrades.length - visibleGrades.length;

                      return (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 min-h-[28px]">
                          {visibleGrades.map((grade, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-100/90 dark:bg-slate-700/80 px-2.5 py-0.5 rounded-full"
                            >
                              {grade}
                            </span>
                          ))}
                          {remainingCount > 0 && (
                            <span
                              className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-600/80 px-2 py-0.5 rounded-full"
                              title={allGrades.join(' • ')}
                            >
                              +{remainingCount} صفوف أخرى
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Teacher Bio / Description */}
                    {teacher.bio && (
                      <div className="text-center px-1 mb-4 my-auto">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">
                          {teacher.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-3 border-t border-sky-200/50 dark:border-slate-700/80 shrink-0">
                    <div
                      className="w-full py-2.5 px-4 bg-primary group-hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 group-hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>عرض الكورسات</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Centered 'عرض المزيد من المدرسين' button */}
            {visibleCount < filteredTeachers.length && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-8 py-3.5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-primary/25 transition-all cursor-pointer inline-flex items-center gap-2 font-cairo"
                >
                  <span>عرض المزيد من المدرسين</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 max-w-lg mx-auto space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-[#0F172A]">لم نجد معلمين يطابقون بحثك</h3>
            <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر صف دراسي مختلف.</p>
            <button
              onClick={() => {
                setSelectedGrade('all');
                setSelectedStream('all');
                setInternalSearch('');
              }}
              className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              إعادة ضبط جميع الفلاتر
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
