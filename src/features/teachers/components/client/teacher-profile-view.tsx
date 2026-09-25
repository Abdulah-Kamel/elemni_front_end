"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Award,
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
} from "lucide-react";
import type { Course, Teacher } from "../../types";
import { cn } from "@/src/lib/cn";
import { isCheckoutRedirectDto, resolveCheckoutRedirect } from "@/src/lib/student-api/checkout";
import type { CheckoutRedirectDto } from "@/src/lib/student-api/contract";
import { studentQueryKeys } from "@/src/features/student/query-keys";
import { getSubjectArt } from "@/src/features/courses/subject-art";
import { Link } from "@/src/i18n/navigation";
import { TeacherAvatar } from "./teacher-avatar";
import "@/src/features/portal/styles/sticker.css";

interface TeacherProfileViewProps {
  teacher: Teacher;
  onRequireAuth: () => void;
  teacherListHref?: string;
  /** Inside the student portal the page uses the full content width. */
  fullWidth?: boolean;
}

type Tab = "courses" | "about";

const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;
// Scattered subject doodles on the banner: [inset-inline-start %, top %, size px, rotation deg].
const DOODLES = [
  [6, 18, 56, -14],
  [24, 58, 40, 10],
  [44, 14, 48, 6],
  [62, 52, 60, -8],
  [80, 20, 44, 16],
  [93, 62, 36, -20],
] as const;

function courseIncludes(course: Course) {
  const items = course.chapters?.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.items)) ?? [];
  return { exams: items.some((item) => item.hasExam), documents: items.some((item) => item.hasDocument) };
}

export default function TeacherProfileView({ teacher, onRequireAuth, teacherListHref = "/teachers", fullWidth = false }: TeacherProfileViewProps) {
  const t = useTranslations("teacherDirectory.profile");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const tabsId = useId();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ courses: null, about: null });
  const [tab, setTab] = useState<Tab>("courses");
  const [copiedLink, setCopiedLink] = useState(false);
  const [subscribedCourses, setSubscribedCourses] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(teacher.courses.map((course) => [course.id, course.isSubscribed === true])),
  );
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [processingCourse, setProcessingCourse] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;
  const container = fullWidth ? "w-full px-4 sm:px-6 lg:px-8 2xl:px-10" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
  // Backend names are often Latin ("Grade 12"); a neutral separator reads well in both directions.
  const list = (items: string[]) => items.join(" · ");
  const doodleIcons = (teacher.subjects.length ? teacher.subjects : [""]).map((subject) => getSubjectArt(subject).Icon);
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "courses", label: t("tabCourses"), count: teacher.courses.length },
    { id: "about", label: t("tabAbout") },
  ];

  const durationLabel = (minutes: number | null) =>
    minutes ? t("duration", { hours: Math.floor(minutes / 60), minutes: minutes % 60 }) : t("durationUnknown");

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys = locale === "ar" ? { next: "ArrowLeft", prev: "ArrowRight" } : { next: "ArrowRight", prev: "ArrowLeft" };
    const index = tabs.findIndex((item) => item.id === tab);
    let next: number | null = null;
    if (event.key === keys.next) next = (index + 1) % tabs.length;
    else if (event.key === keys.prev) next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    setTab(tabs[next].id);
    tabRefs.current[tabs[next].id]?.focus();
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

  const facts = [
    { key: "courses", Icon: BookOpen, text: t("courses", { count: teacher.courses.length }) },
    ...(teacher.grades.length ? [{ key: "grades", Icon: GraduationCap, text: list(teacher.grades), label: t("gradesLabel") }] : []),
    ...(teacher.experienceYears > 0 ? [{ key: "experience", Icon: Award, text: t("experience", { count: teacher.experienceYears }) }] : []),
    { key: "location", Icon: MapPin, text: teacher.location ?? t("online") },
  ];

  return (
    <div className="bg-page pb-16 text-ink dark:text-slate-100">
      <div className={cn(container, "pt-6 sm:pt-8")}>
        <m.header
          className="sticker-tile overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={popSpring}
        >
          {/* Cover banner: graph-paper blue with the teacher's subjects doodled across it. */}
          <div className="relative h-40 overflow-hidden border-b-2 border-ink bg-brand-600 sm:h-52 dark:border-brand-300 dark:bg-brand-900">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px]"
            />
            <div aria-hidden="true" className="absolute inset-0 text-white/35">
              {DOODLES.map(([start, top, size, rotate], index) => {
                const Icon = doodleIcons[index % doodleIcons.length];
                return (
                  <m.span
                    key={index}
                    className="absolute"
                    style={{ insetInlineStart: `${start}%`, top: `${top}%` }}
                    initial={{ opacity: 0, scale: 0.6, rotate: rotate - 20 }}
                    animate={{ opacity: 1, scale: 1, rotate }}
                    transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 + index * 0.05 }}
                  >
                    <Icon style={{ width: size, height: size }} strokeWidth={1.5} />
                  </m.span>
                );
              })}
            </div>
            <nav className="relative flex items-start justify-between gap-3 p-4 sm:p-5">
              <Link href={teacherListHref} className="sticker-btn-outline inline-flex min-h-11 items-center gap-2 px-4 text-sm font-black text-ink dark:text-slate-100">
                <BackArrow className="size-4" aria-hidden="true" />
                {t("allTeachers")}
              </Link>
              <button type="button" onClick={handleShare} className="sticker-btn-outline inline-flex min-h-11 items-center gap-2 px-4 text-sm font-black text-brand-700 dark:text-brand-300">
                {copiedLink ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                <span aria-live="polite">{copiedLink ? t("linkCopied") : t("share")}</span>
              </button>
            </nav>
          </div>

          <div className="relative px-5 pb-5 sm:px-8 sm:pb-6">
            <m.div
              className="relative z-10 -mt-16 flex justify-center sm:-mt-20 md:absolute md:start-8 md:top-0 md:mt-0 md:-translate-y-1/2"
              initial={{ rotate: -12, scale: 0.85, y: 12 }}
              animate={{ rotate: -3, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.12 }}
            >
              <TeacherAvatar
                name={teacher.name}
                src={teacher.avatar}
                sizes="(max-width: 767px) 128px, 160px"
                priority
                className="size-32 rounded-[1.75rem] bg-brand-50 shadow-[5px_5px_0_0_var(--color-ink)] sm:size-40 dark:shadow-[5px_5px_0_0_#020617]"
                initialsClassName="text-5xl sm:text-6xl"
              />
            </m.div>

            <div className="mt-4 text-center md:mt-0 md:ps-52 md:pt-5 md:text-start">
              <h1 className="text-balance text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl dark:text-slate-50">{teacher.name}</h1>
              {teacher.subjects.length > 0 && (
                <ul className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start" aria-label={t("subjectsLabel")}>
                  {teacher.subjects.map((subject) => (
                    <li key={subject} className="sticker-badge bg-brand-100 px-3 py-1 text-xs font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">{subject}</li>
                  ))}
                </ul>
              )}
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t-2 border-dashed border-ink/10 pt-4 text-sm font-bold text-ink/80 md:justify-start dark:border-slate-700 dark:text-slate-300">
              {facts.map(({ key, Icon, text, label }) => (
                <li key={key} className="inline-flex items-center gap-2 tabular-nums">
                  <Icon className={cn("size-4", key === "location" ? "text-accent" : "text-brand-600 dark:text-brand-300")} aria-hidden="true" />
                  {label && <span className="sr-only">{label}: </span>}
                  <span dir="auto">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div role="tablist" aria-label={t("tabsLabel")} className="flex gap-1 border-t-2 border-ink px-3 sm:px-6 dark:border-brand-300">
            {tabs.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  ref={(node) => { tabRefs.current[item.id] = node; }}
                  id={`${tabsId}-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${tabsId}-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  onKeyDown={onTabKeyDown}
                  className={cn(
                    "relative inline-flex min-h-14 items-center gap-2 px-4 text-sm font-black transition-colors sm:text-base",
                    selected ? "text-ink dark:text-slate-50" : "text-muted hover:text-ink dark:text-slate-400 dark:hover:text-slate-100",
                  )}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", selected ? "bg-brand-600 text-white" : "bg-surface-muted text-muted dark:bg-slate-800 dark:text-slate-300")}>
                      {item.count}
                    </span>
                  )}
                  {selected && (
                    <m.span layoutId={`${tabsId}-indicator`} className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-brand-600 dark:bg-brand-300" transition={popSpring} />
                  )}
                </button>
              );
            })}
          </div>
        </m.header>
      </div>

      <div className={cn(container, "mt-8")}>
        <AnimatePresence mode="wait" initial={false}>
          {tab === "courses" ? (
            <m.section
              key="courses"
              id={`${tabsId}-panel-courses`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-tab-courses`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
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
                    const art = getSubjectArt(course.subject ?? teacher.subjects[0]);
                    const contentId = `course-content-${course.id}`;

                    return (
                      <m.li
                        key={course.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...popSpring, delay: 0.05 + index * 0.05 }}
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
                            {durationLabel(course.durationMinutes)}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <h2 className="line-clamp-2 text-lg font-black leading-snug text-ink dark:text-slate-50">{course.title}</h2>
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
                                <span className="text-2xl font-black text-ink tabular-nums dark:text-slate-50">{format.number(course.price, { maximumFractionDigits: 2 })}</span>
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
                                        {chapter.title && <h3 className="mb-2 text-sm font-black text-ink dark:text-slate-100">{chapter.title}</h3>}
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
            </m.section>
          ) : (
            <m.section
              key="about"
              id={`${tabsId}-panel-about`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-tab-about`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
            >
              <div className="sticker-tile p-6 sm:p-8">
                <h2 className="text-xl font-black text-ink sm:text-2xl dark:text-slate-50">{t("tabAbout")}</h2>
                <p className={cn("mt-4 max-w-[65ch] whitespace-pre-line text-base leading-8", teacher.bio ? "font-medium text-ink/85 dark:text-slate-300" : "font-bold text-muted dark:text-slate-400")}>
                  {teacher.bio || t("noBio")}
                </p>
              </div>
              <dl className="sticker-tile divide-y-2 divide-dashed divide-ink/10 p-2 dark:divide-slate-700">
                {[
                  { label: t("subjectsLabel"), value: teacher.subjects.length ? list(teacher.subjects) : "—", Icon: BookOpen },
                  { label: t("gradesLabel"), value: teacher.grades.length ? list(teacher.grades) : "—", Icon: GraduationCap },
                  { label: t("coursesLabel"), value: t("courses", { count: teacher.courses.length }), Icon: ClipboardList },
                  ...(teacher.experienceYears > 0 ? [{ label: t("experienceLabel"), value: t("experience", { count: teacher.experienceYears }), Icon: Award }] : []),
                  { label: t("locationLabel"), value: teacher.location ?? t("online"), Icon: MapPin },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-3.5">
                    <Icon className="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-xs font-bold text-muted dark:text-slate-400">{label}</dt>
                      <dd dir="auto" className="mt-0.5 text-sm font-black text-ink dark:text-slate-100">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </m.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
