"use client";

import { useState } from "react";
import { Teacher } from "../../types";
import { BookOpen, Clock, CheckCircle2, ArrowRight, Award, Sparkles, Share2, Check } from "lucide-react";
import { cn } from "@/src/lib/cn";
import Link from "next/link";

interface TeacherProfileViewProps {
  teacher: Teacher;
}

export default function TeacherProfileView({ teacher }: TeacherProfileViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [subscribedCourses, setSubscribedCourses] = useState<Record<string, boolean>>({});

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink dir-rtl pb-20">
      <div className="relative bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1600')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-slate-900/80 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>

          <button onClick={handleShare} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer">
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? "تم نسخ الرابط!" : "مشاركة"}</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 text-center md:text-right">
            <div className="relative shrink-0 group">
              <div className="w-44 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400/80 via-sky-400/80 to-primary/80 shadow-2xl">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border border-white/10 relative">
                  <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 right-3 bg-emerald-500 border-2 border-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                    <span className="text-[11px] font-black text-white">معلم موثوق</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معلم معتمد</span>
                </span>
                {(teacher.subjects?.length ? teacher.subjects : [teacher.subject]).map((sub, idx) => (
                  <span key={idx} className="bg-sky-500/20 border border-sky-400/40 text-sky-200 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md">{sub}</span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-cairo tracking-tight">{teacher.name}</h1>
              <p className="text-slate-300 text-sm sm:text-base font-semibold max-w-2xl">{teacher.title}</p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs sm:text-sm font-bold text-slate-200">
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>{teacher.experienceYears} سنة خبرة</span>
                </div>
                <div className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{teacher.courses.length} كورسات متاحة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 dark:bg-slate-800 text-primary dark:text-sky-300 font-extrabold text-xs mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تصفح المحاضرات والاشتراكات</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink font-cairo">الكورسات المتاحة</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {teacher.courses.map((course, index) => {
              const isSubscribed = subscribedCourses[course.id];
              const thumbnails = [
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
              ];
              const thumbnail = thumbnails[index % thumbnails.length];

              return (
                <div key={course.id} className="bg-white dark:bg-slate-800/95 rounded-[28px] overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                      <img src={thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 bg-primary/90 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-md shadow-sm">{teacher.subject}</div>
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-black text-ink group-hover:text-primary transition-colors font-cairo leading-snug line-clamp-2 min-h-[52px]">{course.title}</h3>
                      <p className="text-xs text-muted leading-relaxed font-medium line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between text-xs font-bold text-muted pt-2 border-t border-slate-100 dark:border-slate-700/80">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          <span>{course.sessionsCount} محاضرة</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>اختبارات وملازم</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0 mt-2">
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                      <div>
                        <span className="text-2xl font-black text-ink font-cairo">{course.price}</span>
                        <span className="text-xs font-bold text-muted mr-1">ج.م / الشهر</span>
                      </div>
                      <button onClick={() => setSubscribedCourses((p) => ({ ...p, [course.id]: true }))}
                        disabled={isSubscribed}
                        className={cn(
                          "py-2.5 px-5 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2",
                          isSubscribed ? "bg-emerald-600 text-white cursor-default" : "bg-primary hover:bg-primary-hover text-white active:scale-95 shadow-primary/20"
                        )}
                      >
                        {isSubscribed ? <><Check className="w-4 h-4" /><span>تم الاشتراك!</span></> : <><BookOpen className="w-4 h-4" /><span>اشترك الآن</span></>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
