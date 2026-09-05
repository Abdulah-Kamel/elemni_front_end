"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Teacher } from "../../types";
import { BookOpen, Clock, CheckCircle2, ArrowRight, Award, Sparkles, Share2, Check, MapPin, LoaderCircle, CircleAlert, PlayCircle, FileText, ClipboardList, ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { studentQueryKeys } from "@/src/features/student/query-keys";
import { Link } from "@/src/i18n/navigation";
import { Reveal } from "@/src/components/ui/reveal";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import profileBackground from "@/src/assets/images/student-redesign/profile-background.webp";
import lessonCalculus from "@/src/assets/images/student-redesign/lesson-calculus.webp";
import lessonMechanics from "@/src/assets/images/student-redesign/lesson-mechanics.webp";
import lessonStudySkills from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import lessonArabic from "@/src/assets/images/student-redesign/lesson-arabic.webp";

const courseThumbnails = [
  lessonCalculus,
  lessonMechanics,
  lessonStudySkills,
  lessonArabic,
];

interface TeacherProfileViewProps {
  teacher: Teacher;
  onRequireAuth: () => void;
}

export default function TeacherProfileView({ teacher, onRequireAuth }: TeacherProfileViewProps) {
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState(false);
  const [subscribedCourses, setSubscribedCourses] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(teacher.courses.map((course) => [course.id, course.isSubscribed === true])),
  );
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [processingCourse, setProcessingCourse] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCourseAction = async (courseId: string, isSubscribed: boolean) => {
    if (isSubscribed) {
      setExpandedCourses((current) => ({ ...current, [courseId]: !current[courseId] }));
      return;
    }

    setProcessingCourse(courseId);
    setCheckoutError("");
    const response = await fetch("/api/student/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: Number(courseId) }),
    }).catch(() => null);

    if (response?.status === 401) {
      setProcessingCourse(null);
      onRequireAuth();
      return;
    }
    if (response?.status === 409) {
      setSubscribedCourses((current) => ({ ...current, [courseId]: true }));
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.myCourses(),
      });
      setProcessingCourse(null);
      return;
    }
    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setCheckoutError(body?.detail ?? "تعذر بدء عملية الدفع حالياً.");
      setProcessingCourse(null);
      return;
    }

    const body = await response.json();
    window.location.assign(body.redirect_url);
  };

  return (
    <div dir="rtl" className="bg-page text-ink pb-16">
      <div className="relative overflow-hidden bg-slate-950 pt-24 text-white shadow-xl">
        <Image
          src={profileBackground}
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none object-cover object-center opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex items-center justify-between">
          <Link href="/teachers" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all">
            <ArrowRight className="w-4 h-4" />
            <span>كل المدرسين</span>
          </Link>

          <button onClick={handleShare} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer">
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? "تم نسخ الرابط!" : "مشاركة"}</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 text-center md:text-start">
            <m.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative shrink-0 group"
            >
              <div className="w-44 h-52 sm:w-56 sm:h-64 md:w-64 md:h-72 rounded-3xl p-1.5 bg-gradient-to-tr from-amber-400/80 via-sky-400/80 to-primary/80 shadow-2xl">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 border border-white/10 relative">
                  <Image
                    src={teacher.avatar}
                    alt={teacher.name}
                    fill
                    sizes="(max-width: 639px) 176px, (max-width: 767px) 224px, 256px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 end-3 bg-emerald-500 border-2 border-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
                    <span className="text-[11px] font-black text-white">معلم موثوق</span>
                  </div>
                </div>
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3 flex-1"
            >
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معلم معتمد</span>
                </span>
                {(teacher.subjects?.length ? teacher.subjects : [teacher.subject]).map((sub, idx) => (
                  <span key={idx} className="bg-sky-500/20 border border-sky-400/40 text-sky-200 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md">{sub}</span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-readex tracking-tight">{teacher.name}</h1>
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
            </m.div>
          </div>
        </div>
      </div>

      <section className="border-b border-slate-200/70 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
          <Reveal>
            <div>
              <p className="mb-2 text-xs font-extrabold text-primary">عن المدرس</p>
              <h2 className="text-2xl font-black text-ink">خبرة تساعدك تفهم، مش تحفظ</h2>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-muted">{teacher.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {teacher.specialties.map((specialty) => (
                  <span key={specialty} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="grid h-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700">
              <div className="bg-page p-4">
                <BookOpen className="mb-3 size-5 text-primary" />
                <strong className="block text-xl font-black">{teacher.courses.length}</strong>
                <span className="text-xs text-muted">كورسات منشورة</span>
              </div>
              <div className="bg-page p-4">
                <MapPin className="mb-3 size-5 text-accent" />
                <strong className="block text-sm font-black leading-6">{teacher.location ?? "أونلاين"}</strong>
                <span className="text-xs text-muted">مكان التدريس</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 dark:bg-slate-800 text-primary dark:text-sky-300 font-extrabold text-xs mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تصفح المحاضرات والاشتراكات</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink font-readex">الكورسات المتاحة</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {checkoutError && (
              <div role="alert" className="col-span-full flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <CircleAlert className="size-5 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}
            {teacher.courses.map((course, index) => {
              const isSubscribed = subscribedCourses[course.id];
              const thumbnail = course.image ?? courseThumbnails[index % courseThumbnails.length];
              const isProcessing = processingCourse === course.id;
              const isExpanded = expandedCourses[course.id];

              return (
                <m.article
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -5 }}
                  transition={{ delay: index * 0.06 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800/95"
                >
                  <div>
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                      <Image
                        src={thumbnail}
                        alt={course.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute end-3 top-3 bg-primary/90 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-md shadow-sm">{teacher.subject}</div>
                      <div className="absolute bottom-3 start-3 bg-slate-900/80 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-black text-ink group-hover:text-primary transition-colors font-readex leading-snug line-clamp-2 min-h-[52px]">{course.title}</h3>
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
                        <span className="text-2xl font-black text-ink font-readex">{course.price}</span>
                        <span className="ms-1 text-xs font-bold text-muted">ج.م / الشهر</span>
                      </div>
                      <button onClick={() => handleCourseAction(course.id, isSubscribed)}
                        disabled={isProcessing}
                        className={cn(
                          "py-2.5 px-5 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2",
                          isSubscribed ? "bg-emerald-600 text-white" : "bg-primary hover:bg-primary-hover text-white active:scale-95 shadow-primary/20"
                        )}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <m.span
                            key={isSubscribed ? "subscribed" : "subscribe"}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2"
                          >
                            {isProcessing ? <><LoaderCircle className="w-4 h-4 animate-spin" /><span>جاري التحويل</span></> : isSubscribed ? <><ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} /><span>محتوى الكورس</span></> : <><BookOpen className="w-4 h-4" /><span>اشترك الآن</span></>}
                          </m.span>
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                  {isSubscribed && isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/60">
                      {course.chapters?.length ? (
                        <div className="space-y-4">
                          {course.chapters.map((chapter) => (
                            <div key={chapter.id}>
                              {chapter.title && <h4 className="mb-2 text-sm font-black text-ink">{chapter.title}</h4>}
                              <div className="space-y-2">
                                {chapter.lessons.map((lesson) => (
                                  <div key={lesson.id} className="border-b border-slate-200 pb-2 last:border-0 dark:border-slate-700">
                                    <p className="text-xs font-extrabold text-ink">{lesson.title}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {lesson.items.map((item) => (
                                        <span key={item.id} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted">
                                          {item.hasVideo ? <PlayCircle className="size-3.5 text-primary" /> : item.hasDocument ? <FileText className="size-3.5 text-emerald-600" /> : <ClipboardList className="size-3.5 text-amber-600" />}
                                          {item.videoUrl ? (
                                            <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{item.title}</a>
                                          ) : item.documentPath ? (
                                            <a href={item.documentPath} target="_blank" rel="noreferrer" className="text-primary hover:underline">{item.title}</a>
                                          ) : item.title}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-muted">لم يضف المدرس محتوى للكورس بعد.</p>
                      )}
                    </div>
                  )}
                </m.article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
