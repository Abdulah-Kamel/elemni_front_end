import React, { useState } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Award, 
  Star, 
  CheckCircle2, 
  PlayCircle, 
  Sparkles, 
  GraduationCap, 
  FileText, 
  Clock, 
  Calendar, 
  Share2, 
  Check, 
  ChevronLeft
} from 'lucide-react';
import { Teacher, Course } from '../types';

interface TeacherProfileProps {
  teacher?: Teacher | null;
  onBack?: () => void;
  onSubscribeCourse?: (course: Course, teacherName: string) => void;
  onOpenVideo?: (videoUrl: string) => void;
}

// Default Fallback Mock Teacher if none passed
const DEFAULT_TEACHER: Teacher = {
  id: 't-default',
  name: 'أ. محمود صبري',
  title: 'كبير معلمين وخبير الفيزياء للثانوية العامة',
  subject: 'فيزياء',
  subjects: ['الفيزياء الحديثة', 'الفيزياء الكهربية'],
  category: 'science',
  grade: 'sec3',
  gradeLabel: 'الصف الثالث الثانوي والدبلومات',
  gradesList: ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'],
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  studentCount: 18500,
  experienceYears: 16,
  pricePerSession: 80,
  bio: 'معلم خبير ومحاضر مادة الفيزياء لأكثر من 16 عاماً في كبرى المنصات والمراكز التعليمية. أعتمد على أسلوب التبسيط وتفكيك المسائل الصعبة مع تقديم خرائط ذهنية وتجارب تفاعلية تضمن للطالب الاستيعاب الكامل والدرجة النهائية بأسهل الطرق.',
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  featured: true,
  specialties: [
    'الكهربية والمغناطيسية',
    'الفيزياء الحديثة والكم',
    'حل أسئلة امتحانات بابل شيت',
    'متابعة أسبوعية وتقارير أداء'
  ],
  schedule: ['الأحد والأربعاء - 5:00 مساءً', 'الإثنين والخميس - 7:00 مساءً'],
  courses: [
    {
      id: 'c1',
      title: 'الفيزياء الكهربية وقوانين كيرشوف وشديد الشدة',
      description: 'شرح وافٍ ومبسط للتيار الكهربي وقانون أوم وقوانين كيرشوف مع حل أكثر من 500 سؤال بابل شيت متدرج الصعوبة.',
      price: 250,
      duration: '18 ساعة تعليمية',
      sessionsCount: 12,
    },
    {
      id: 'c2',
      title: 'كورس التأثير المغناطيسي للتيار الكهربي وأجهزة القياس',
      description: 'دراسة المجال المغناطيسي والقوة المغناطيسية وأجهزة القياس المباشرة مع ملزمة تمارين مجانية شاملة.',
      price: 280,
      duration: '22 ساعة تعليمية',
      sessionsCount: 14,
    },
    {
      id: 'c3',
      title: 'كورس الحث الكهرومغناطيسي والمحولات الكهربية',
      description: 'قانون فاراداي والدينامو والمحول الكهربي مع شرح تطبيقات عملية وأسئلة من امتحانات الأعوام السابقة.',
      price: 300,
      duration: '20 ساعة تعليمية',
      sessionsCount: 12,
    },
    {
      id: 'c4',
      title: 'الفيزياء الحديثة - إزدواجية الموجة والجسيم واطياف الذرة',
      description: 'تغطية كاملة لباب الفيزياء الحديثة، إشعاع الجسم الأسود، إلكترونيات الصلبة والليزرات ببساطة وإتقان.',
      price: 220,
      duration: '15 ساعة تعليمية',
      sessionsCount: 10,
    },
    {
      id: 'c5',
      title: 'المراجعة النهائية الشاملة وليلة الامتحان - ثانوية عامة',
      description: 'معسكر المراجعة المكثفة، ملخص القوانين في 20 صفحة، وحل 10 امتحانات شاملة متوقعة طبقاً للمواصفات.',
      price: 350,
      duration: '30 ساعة تعليمية',
      sessionsCount: 18,
    },
    {
      id: 'c6',
      title: 'أساسيات الفيزياء والرياضيات لمرحلة أولى وثانية ثانوي',
      description: 'كورس تأسيسي قوي للتحويلات والقوانين والتحليل البياني لمساعدة الطلاب على الاستعداد المبكر للثانوية.',
      price: 180,
      duration: '12 ساعة تعليمية',
      sessionsCount: 8,
    }
  ]
};

export const TeacherProfile: React.FC<TeacherProfileProps> = ({
  teacher = DEFAULT_TEACHER,
  onBack,
  onSubscribeCourse,
  onOpenVideo
}) => {
  const activeTeacher = teacher || DEFAULT_TEACHER;
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [subscribedCourses, setSubscribedCourses] = useState<Record<string, boolean>>({});

  // Filter courses by grade if applicable
  const filteredCourses = activeTeacher.courses.filter((course) => {
    if (selectedGradeFilter === 'all') return true;
    return course.title.includes(selectedGradeFilter);
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSubscribe = (course: Course) => {
    setSubscribedCourses((prev) => ({ ...prev, [course.id]: true }));
    if (onSubscribeCourse) {
      onSubscribeCourse(course, activeTeacher.name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 dir-rtl pb-20 transition-colors">
      
      {/* SECTION 1: Page Header / Wide Cover & Overlapping Avatar */}
      <div className="relative bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white overflow-hidden shadow-xl">
        
        {/* Cover Background Graphic Elements */}
        <div 
          className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1600')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-slate-900/80 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Floating Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة المعلمين</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-95 mr-auto"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الملف'}</span>
          </button>
        </div>

        {/* Cover Banner Header Main Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 text-center md:text-right">
            
            {/* Prominent Clear Portrait Picture Banner Container */}
            <div className="relative shrink-0 group">
              <div className="w-44 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400/80 via-sky-400/80 to-primary/80 shadow-2xl relative">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border border-white/10 relative">
                  <img
                    src={activeTeacher.avatar}
                    alt={activeTeacher.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle Gradient Overlay for High Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />

                  {/* Online/Verified Badge */}
                  <div className="absolute bottom-3 right-3 bg-emerald-500 border-2 border-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5" title="معلم موثوق">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                    <span className="text-[11px] font-black text-white">معلم موثوق</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Header Main Text Details */}
            <div className="space-y-3 flex-1">
              
              {/* Subject Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معلم معتمد</span>
                </span>

                {(activeTeacher.subjects && activeTeacher.subjects.length > 0
                  ? activeTeacher.subjects
                  : [activeTeacher.subject]
                ).map((sub, idx) => (
                  <span
                    key={idx}
                    className="bg-sky-500/20 border border-sky-400/40 text-sky-200 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md"
                  >
                    {sub}
                  </span>
                ))}
              </div>

              {/* Teacher Name */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-cairo tracking-tight">
                {activeTeacher.name}
              </h1>

              {/* Title / Specialization */}
              <p className="text-slate-300 text-sm sm:text-base font-semibold max-w-2xl">
                {activeTeacher.title}
              </p>

              {/* Quick Stats Badges (Experience & Courses Count) */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs sm:text-sm font-bold text-slate-200">
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>{activeTeacher.experienceYears} سنة خبرة</span>
                </div>

                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{activeTeacher.courses.length} كورسات متاحة</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Main Page Body Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* SECTION: Teacher's Courses Section (الكورسات المتاحة) */}
        <section className="space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 dark:bg-slate-800 text-primary dark:text-sky-300 font-extrabold text-xs mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تصفح المحاضرات والاشتراكات</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-cairo">
                الكورسات المتاحة
              </h2>
            </div>
          </div>

          {/* Courses Responsive Grid (1 col mobile, 3 col desktop) */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filteredCourses.map((course, index) => {
                const isSubscribed = subscribedCourses[course.id];
                const thumbnails = [
                  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
                  'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800',
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
                  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800'
                ];
                const thumbnail = thumbnails[index % thumbnails.length];

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-800/95 rounded-[28px] overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Course Thumbnail Image */}
                      <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                        <img
                          src={thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                        {/* Subject Badge */}
                        <div className="absolute top-3 right-3 bg-primary/90 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
                          {activeTeacher.subject}
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-3 left-3 bg-slate-900/80 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>{course.duration}</span>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 space-y-3">
                        
                        {/* Course Title */}
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors font-cairo leading-snug line-clamp-2 min-h-[52px]">
                          {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">
                          {course.description}
                        </p>

                        {/* Course Stats Info Row */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                            <span>{course.sessionsCount} محاضرة تفاعلية</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>اختبارات وملازم</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Card Footer: Price & Subscribe CTA Button */}
                    <div className="p-5 pt-0 mt-2">
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                        
                        {/* Price Tag */}
                        <div>
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-cairo">
                            {course.price}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                            ج.م / الشهر
                          </span>
                        </div>

                        {/* Subscribe Button */}
                        <button
                          onClick={() => handleSubscribe(course)}
                          disabled={isSubscribed}
                          className={`py-2.5 px-5 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                            isSubscribed
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-primary hover:bg-primary-hover text-white active:scale-95 shadow-primary/20'
                          }`}
                        >
                          {isSubscribed ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>تم الاشتراك!</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4" />
                              <span>اشترك الآن</span>
                            </>
                          )}
                        </button>

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300 font-bold text-base">
                لا توجد كورسات مطابقة للتصفية الحالية.
              </p>
              <button
                onClick={() => setSelectedGradeFilter('all')}
                className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
              >
                عرض كل الكورسات
              </button>
            </div>
          )}

        </section>

      </div>

    </div>
  );
};

export default TeacherProfile;
