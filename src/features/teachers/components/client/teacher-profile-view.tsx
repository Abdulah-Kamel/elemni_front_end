"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  LoaderCircle,
  MapPin,
  PlayCircle,
  Share2,
  Award,
} from "lucide-react";
import type { Course, Teacher } from "../../types";
import { cn } from "@/src/lib/cn";
import { isCheckoutRedirectDto, resolveCheckoutRedirect } from "@/src/lib/student-api/checkout";
import type { CheckoutRedirectDto } from "@/src/lib/student-api/contract";
import { studentQueryKeys } from "@/src/features/student/query-keys";
import { getSubjectArt } from "@/src/features/courses/subject-art";
import { Link } from "@/src/i18n/navigation";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { TeacherAvatar } from "./teacher-avatar";
import "@/src/features/portal/styles/sticker.css";

interface TeacherProfileViewProps {
  teacher: Teacher;
  onRequireAuth: () => void;
  teacherListHref?: string;
  /** Inside the student portal the page uses the full content width. */
  fullWidth?: boolean;
}

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function courseIncludes(course: Course) {
  const items = course.chapters?.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.items)) ?? [];
  return { exams: items.some((item) => item.hasExam), documents: items.some((item) => item.hasDocument) };
}

export default function TeacherProfileView({ teacher, onRequireAuth, teacherListHref = "/teachers", fullWidth = false }: TeacherProfileViewProps) {
  const t = useTranslations("teacherDirectory.profile");
  const queryClient = useQueryClient();
  const locale = useLocale();
  const [copiedLink, setCopiedLink] = useState(false);
  const [subscribedCourses, setSubscribedCourses] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(teacher.courses.map((course) => [course.id, course.isSubscribed === true])),
  );
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [processingCourse, setProcessingCourse] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;
  const container = fullWidth ? "w-full px-4 sm:px-6 lg:px-8 2xl:px-10" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
  const subjects = teacher.subjects?.length ? teacher.subjects : [teacher.subject];
  const grades = teacher.gradesList ?? [];

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
      setCheckoutError(body?.detail ?? t("checkoutError"));
      setProcessingCourse(null);
      return;
    }

    const body = (await response.json().catch(() => null)) as CheckoutRedirectDto | null;
    // The backend owns payment state: paid courses return a Kashier hosted
    // checkout URL, free courses return the relative "/my-courses".
    if (!isCheckoutRedirectDto(body)) {
      setCheckoutError(t("checkoutError"));
      setProcessingCourse(null);
      return;
    }
    window.location.assign(resolveCheckoutRedirect(body.redirect_url, locale));
  };

  return (
    <div className="bg-page pb-16 text-ink dark:text-slate-100">
      <div className={cn(container, "pt-6 sm:pt-8")}>
        <nav className="flex items-center justify-between gap-3">
          <Link href={teacherListHref} className="sticker-btn-outline inline-flex min-h-11 items-center gap-2 px-4 text-sm font-black text-ink dark:text-slate-100">
            <BackArrow className="size-4" aria-hidden="true" />
            {t("allTeachers")}
          </Link>
          <button type="button" onClick={handleShare} className="sticker-btn-outline inline-flex min-h-11 items-center gap-2 px-4 text-sm font-black text-brand-700 dark:text-brand-300">
            {copiedLink ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
            <span aria-live="polite">{copiedLink ? t("linkCopied") : t("share")}</span>
          </button>
        </nav>

        <m.header
          className="sticker-tile relative mt-6 grid gap-6 overflow-hidden p-5 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={popSpring}
        >
          {/* Ruled-notebook lines behind the header, faded out towards the avatar side. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,color-mix(in_oklab,var(--color-brand-600)_10%,transparent)_31px,color-mix(in_oklab,var(--color-brand-600)_10%,transparent)_32px)] [mask-image:linear-gradient(to_left,black,transparent_70%)] rtl:[mask-image:linear-gradient(to_right,black,transparent_70%)]"
          />
          <m.div
            className="relative mx-auto md:mx-0"
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: -3, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.08 }}
          >
            <TeacherAvatar
              name={teacher.name}
              src={teacher.avatar}
              sizes="(max-width: 639px) 144px, 176px"
              priority
              className="size-36 rounded-[1.75rem] shadow-[5px_5px_0_0_var(--color-ink)] sm:size-44 dark:shadow-[5px_5px_0_0_#020617]"
              initialsClassName="text-5xl sm:text-6xl"
            />
          </m.div>

          <div className="relative min-w-0 text-center md:text-start">
            <h1 className="text-balance text-3xl font-black tracking-tight text-ink sm:text-5xl dark:text-slate-50">{teacher.name}</h1>
            <ul className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start" aria-label={subjects.join("، ")}>
              {subjects.map((subject) => (
                <li key={subject} className="sticker-badge bg-brand-100 px-3 py-1 text-xs font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">{subject}</li>
              ))}
            </ul>
            <p className="mx-auto mt-4 max-w-[65ch] text-sm leading-7 font-medium text-muted sm:text-base md:mx-0 dark:text-slate-300">{teacher.bio}</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-ink/80 md:justify-start dark:text-slate-300">
              <li className="inline-flex items-center gap-2 tabular-nums">
                <BookOpen className="size-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                {t("courses", { count: teacher.courses.length })}
              </li>
              {grades.length > 0 && (
                <li className="inline-flex items-center gap-2">
                  <GraduationCap className="size-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                  <span className="sr-only">{t("grades")}: </span>
                  <span dir="auto">{grades.join(" · ")}</span>
                </li>
              )}
              {teacher.experienceYears > 0 && (
                <li className="inline-flex items-center gap-2 tabular-nums">
                  <Award className="size-4 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                  {t("experience", { count: teacher.experienceYears })}
                </li>
              )}
              <li className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-accent" aria-hidden="true" />
                {teacher.location ?? t("online")}
              </li>
            </ul>
          </div>
        </m.header>
      </div>

      <section className={cn(container, "mt-12")} aria-labelledby="teacher-courses-title">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 id="teacher-courses-title" className="text-2xl font-black tracking-tight text-ink sm:text-3xl dark:text-slate-50">
            <MarkerHighlight color="yellow" variant={1}>{t("coursesTitle", { name: teacher.name })}</MarkerHighlight>
          </h2>
          <span className="sticker-badge bg-surface px-3 py-1 text-xs font-black text-muted tabular-nums dark:text-slate-300">
            {t("courses", { count: teacher.courses.length })}
          </span>
        </div>

        {checkoutError && (
          <div role="alert" className="sticker-tile mb-6 flex items-center gap-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
            <span>{checkoutError}</span>
          </div>
        )}

        {teacher.courses.length === 0 ? (
          <div className="sticker-tile flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
            <BookOpen className="size-9 text-brand-600 dark:text-brand-300" aria-hidden="true" />
            <p className="text-sm font-bold text-muted dark:text-slate-400">{t("coursesEmpty")}</p>
          </div>
        ) : (
          <ul className={cn("grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3", fullWidth && "2xl:grid-cols-4")}>
            {teacher.courses.map((course, index) => {
              const isSubscribed = subscribedCourses[course.id];
              const isProcessing = processingCourse === course.id;
              const isExpanded = expandedCourses[course.id];
              const includes = courseIncludes(course);
              const art = getSubjectArt(course.subject ?? subjects[0]);
              const contentId = `course-content-${course.id}`;

              return (
                <m.li
                  key={course.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...popSpring, delay: 0.12 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="sticker-tile group flex h-full flex-col overflow-hidden"
                >
                  <div className={cn("relative aspect-[16/9] overflow-hidden border-b-2 border-ink dark:border-brand-300", !course.image && art.tone)}>
                    {course.image ? (
                      <Image
                        src={course.image}
                        alt=""
                        fill
                        loading="lazy"
                        sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      />
                    ) : (
                      <div className="grid h-full place-items-center" aria-hidden="true">
                        <art.Icon className="size-16 stroke-[1.5] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:group-hover:transform-none" />
                      </div>
                    )}
                    {course.subject && (
                      <span className="sticker-badge absolute start-3 top-3 bg-surface px-2.5 py-1 text-[11px] font-black text-ink dark:text-slate-100">{course.subject}</span>
                    )}
                    <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold text-white tabular-nums backdrop-blur-sm dark:bg-slate-950/85">
                      <Clock className="size-3" aria-hidden="true" />
                      {course.duration}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="line-clamp-2 text-lg font-black leading-snug text-ink dark:text-slate-50">{course.title}</h3>
                    {course.description && <p className="line-clamp-2 text-[13px] leading-6 font-medium text-muted dark:text-slate-400">{course.description}</p>}
                    <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-muted dark:text-slate-400">
                      <li className="inline-flex items-center gap-1.5 tabular-nums">
                        <BookOpen className="size-3.5 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                        {t("lessons", { count: course.sessionsCount })}
                      </li>
                      {includes.exams && (
                        <li className="inline-flex items-center gap-1.5">
                          <ClipboardList className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                          {t("includesExams")}
                        </li>
                      )}
                      {includes.documents && (
                        <li className="inline-flex items-center gap-1.5">
                          <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          {t("includesDocuments")}
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-ink/10 px-5 py-4 dark:border-slate-700">
                    <p className="min-w-0">
                      {course.price > 0 ? (
                        <>
                          <span className="text-2xl font-black text-ink tabular-nums dark:text-slate-50">{course.price}</span>
                          <span className="ms-1 text-sm font-black text-ink dark:text-slate-100">{t("currency")}</span>
                          <span className="ms-1 text-xs font-bold text-muted dark:text-slate-400">{t("perPeriod")}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{t("free")}</span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCourseAction(course.id, isSubscribed)}
                      disabled={isProcessing}
                      aria-expanded={isSubscribed ? Boolean(isExpanded) : undefined}
                      aria-controls={isSubscribed ? contentId : undefined}
                      className={cn(
                        "inline-flex min-h-11 shrink-0 items-center gap-2 px-5 text-sm font-black disabled:cursor-progress disabled:opacity-80",
                        isSubscribed ? "sticker-btn-outline text-emerald-700 dark:text-emerald-400" : "sticker-btn text-white",
                      )}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <m.span
                          key={isProcessing ? "processing" : isSubscribed ? "subscribed" : "subscribe"}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="flex items-center gap-2"
                        >
                          {isProcessing ? (
                            <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{t("redirecting")}</>
                          ) : isSubscribed ? (
                            <><ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />{isExpanded ? t("hideContent") : t("showContent")}</>
                          ) : (
                            t("subscribe")
                          )}
                        </m.span>
                      </AnimatePresence>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSubscribed && isExpanded && (
                      <m.div
                        id={contentId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t-2 border-ink/10 bg-surface-muted dark:border-slate-700 dark:bg-slate-900/60"
                      >
                        <div className="px-5 py-4">
                          {course.chapters?.length ? (
                            <div className="space-y-4">
                              {course.chapters.map((chapter) => (
                                <div key={chapter.id}>
                                  {chapter.title && <h4 className="mb-2 text-sm font-black text-ink dark:text-slate-100">{chapter.title}</h4>}
                                  <div className="space-y-2">
                                    {chapter.lessons.map((lesson) => (
                                      <div key={lesson.id} className="border-b border-slate-200 pb-2 last:border-0 dark:border-slate-700">
                                        <p className="text-xs font-extrabold text-ink dark:text-slate-100">{lesson.title}</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {lesson.items.map((item) => (
                                            <span key={item.id} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted dark:text-slate-400">
                                              {item.hasVideo ? <PlayCircle className="size-3.5 text-brand-600" aria-hidden="true" /> : item.hasDocument ? <FileText className="size-3.5 text-emerald-600" aria-hidden="true" /> : <ClipboardList className="size-3.5 text-amber-600" aria-hidden="true" />}
                                              {item.videoUrl ? (
                                                <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline dark:text-brand-300">{item.title}</a>
                                              ) : item.documentPath ? (
                                                <a href={item.documentPath} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline dark:text-brand-300">{item.title}</a>
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
                            <p className="text-xs font-bold text-muted dark:text-slate-400">{t("noContent")}</p>
                          )}
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
