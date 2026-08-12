"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  FolderOpen,
  LoaderCircle,
  LockKeyhole,
  Play,
  PlayCircle,
  RotateCcw,
  Video,
} from "lucide-react";
import { GlobalLoading } from "@/src/components/ui/global-loading";
import { Link, useRouter } from "@/src/i18n/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { portalContainerVariants, portalItemVariants, scrollIntoViewById } from "./portal-motion";
import type {
  GradeDto,
  PublicItemDto,
  PublicLessonDto,
  StreamDto,
  StudentCourseDetailDto,
  UserDto,
} from "@/src/lib/student-api/contract";
import StudentPortalShell from "./student-portal-shell";

function formatDuration(minutes: number | null) {
  if (!minutes) return "المدة غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعات`;
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(new Date(value));
}

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value));
}

function lessonDuration(lesson: PublicLessonDto) {
  if (lesson.duration_minutes) return lesson.duration_minutes;
  const total = lesson.items.reduce((sum, item) => sum + (item.duration_minutes ?? 0), 0);
  return total || null;
}

function chapterDuration(lessons: PublicLessonDto[]) {
  const total = lessons.reduce((sum, lesson) => sum + (lessonDuration(lesson) ?? 0), 0);
  return total || null;
}

function absoluteDocumentUrl(path: string | null) {
  return path && /^https?:\/\//i.test(path) ? path : null;
}

function TeacherAvatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return <Image src={image} alt={name} width={44} height={44} className="size-11 rounded-full border border-[#E2E0EF] object-cover" />;
  }
  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-[#E0F2FE] text-sm font-black text-[#0369A1]">
      {name.slice(0, 1)}
    </span>
  );
}

function LessonRow({
  lesson,
  enrolled,
  expanded,
  activeVideoId,
  onToggle,
  onPlay,
}: {
  lesson: PublicLessonDto;
  enrolled: boolean;
  expanded: boolean;
  activeVideoId: number | null;
  onToggle: () => void;
  onPlay: (item: PublicItemDto, lesson: PublicLessonDto) => void;
}) {
  const hasVideo = lesson.items.some((item) => item.has_video);
  const hasDocument = lesson.items.some((item) => item.has_document);
  const hasExam = lesson.items.some((item) => item.has_exam);
  const reduced = useReducedMotion() === true;

  return (
    <div className="border-b border-[#E8E5F0] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-18 w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[#F0F9FF] sm:px-5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F0F9FF] text-[#0284C7]">
          {hasVideo ? <PlayCircle className="size-5" /> : hasDocument ? <FileText className="size-5" /> : <BookOpen className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-bold leading-6 text-[#292733] sm:text-base">{lesson.title}</strong>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#777587]">
            <span>{formatDuration(lessonDuration(lesson))}</span>
            {hasVideo && <span>فيديو</span>}
            {hasDocument && <span>ملفات</span>}
            {hasExam && <span>اختبار</span>}
          </span>
        </span>
        <ChevronLeft className={`size-4 shrink-0 text-[#A6A3B5] transition-transform motion-reduce:transition-none ${expanded ? "-rotate-90" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            className="space-y-2 overflow-hidden bg-[#FAF9FD] px-4 py-4 sm:ps-16"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
          {lesson.description && <p className="pb-2 text-sm leading-6 text-[#777587]">{lesson.description}</p>}
          {lesson.items.length ? lesson.items.map((item) => {
            const documentUrl = absoluteDocumentUrl(item.document_path);
            const isActive = item.id === activeVideoId;
            const itemIcon = item.has_video ? Video : item.has_document ? FileText : ClipboardList;
            const ItemIcon = itemIcon;
            const itemMeta = [
              item.has_video ? "فيديو" : null,
              item.has_document ? "ملف" : null,
              item.has_exam ? "اختبار" : null,
              item.duration_minutes ? formatDuration(item.duration_minutes) : null,
            ].filter(Boolean).join(" · ");

            if (enrolled && item.bunny_stream_embed_url) {
              return (
                <button key={item.id} type="button" onClick={() => onPlay(item, lesson)} className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-start transition ${isActive ? "border-[#0284C7] bg-[#F0F9FF]" : "border-[#E2E0EF] bg-white hover:border-[#BAE6FD]"}`}>
                  <ItemIcon className="size-5 shrink-0 text-[#0284C7]" />
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="text-xs text-[#777587]">{itemMeta}</span></span>
                  <Play className="size-4 shrink-0 fill-current text-[#0284C7]" />
                </button>
              );
            }

            if (enrolled && documentUrl) {
              return (
                <a key={item.id} href={documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[#E2E0EF] bg-white px-3 py-3 text-start transition hover:border-[#BAE6FD]">
                  <ItemIcon className="size-5 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="text-xs text-[#777587]">{itemMeta}</span></span>
                  <ArrowLeft className="size-4 shrink-0 text-[#777587]" />
                </a>
              );
            }

            return (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[#E2E0EF] bg-white px-3 py-3 text-start">
                <ItemIcon className="size-5 shrink-0 text-[#777587]" />
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="text-xs text-[#777587]">{itemMeta || "محتوى الدرس"}</span></span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#A6A3B5]">
                  {!enrolled && <LockKeyhole className="size-3.5" />}
                  {enrolled ? "غير متاح حالياً" : "يتطلب الاشتراك"}
                </span>
              </div>
            );
          }) : <p className="text-sm font-medium text-[#777587]">لم تتم إضافة مواد لهذا الدرس بعد.</p>}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetail({
  courseId,
  teacherSlug,
  grades,
  streams,
}: {
  courseId: number;
  teacherSlug?: string;
  grades: GradeDto[];
  streams: StreamDto[];
}) {
  const router = useRouter();
  const reduced = useReducedMotion() === true;
  const [detail, setDetail] = useState<StudentCourseDetailDto | null>(null);
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [expandedChapterId, setExpandedChapterId] = useState<number | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ item: PublicItemDto; lesson: PublicLessonDto } | null>(null);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError("");
    const teacherQuery = teacherSlug ? `?teacher=${encodeURIComponent(teacherSlug)}` : "";
    const [courseResponse, userResponse] = await Promise.all([
      fetch(`/api/student/my-courses/${courseId}${teacherQuery}`, { cache: "no-store" }).catch(() => null),
      fetch("/api/student/auth/me", { cache: "no-store" }).catch(() => null),
    ]);
    if (courseResponse?.status === 401 || userResponse?.status === 401) {
      router.replace("/login");
      return;
    }
    if (!courseResponse?.ok) {
      const body = await courseResponse?.json().catch(() => null);
      setError(body?.detail ?? "تعذر تحميل تفاصيل الكورس حالياً.");
      setLoading(false);
      return;
    }
    const courseDetail = await courseResponse.json() as StudentCourseDetailDto;
    setDetail(courseDetail);
    const firstChapter = courseDetail.course.chapters.find((chapter) => chapter.lessons.length);
    setExpandedChapterId(firstChapter?.id ?? null);
    setExpandedLessonId(firstChapter?.lessons[0]?.id ?? null);
    const firstPlayableVideo = courseDetail.course.chapters
      .flatMap((chapter) => chapter.lessons)
      .flatMap((lesson) => lesson.items.map((item) => ({ item, lesson })))
      .find(({ item }) => Boolean(item.bunny_stream_embed_url));
    setActiveVideo(firstPlayableVideo ?? null);
    if (userResponse?.ok) setUser(await userResponse.json());
    setLoading(false);
  }, [courseId, router, teacherSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourse(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCourse]);

  const course = detail?.course;
  const enrolled = Boolean(detail?.enrollment);
  const chapters = course?.chapters ?? [];
  const lessons = chapters.flatMap((chapter) => chapter.lessons);
  const items = lessons.flatMap((lesson) => lesson.items);
  const examCount = items.filter((item) => item.has_exam).length;
  const gradeName = grades.find((grade) => grade.id === course?.grade_id)?.name;
  const streamName = streams.find((stream) => stream.id === course?.stream_id)?.name;

  const playVideo = (item: PublicItemDto, lesson: PublicLessonDto) => {
    setActiveVideo({ item, lesson });
    window.setTimeout(() => scrollIntoViewById("course-player", { block: "start" }), 0);
  };

  const startCourse = () => {
    const firstVideoChapter = chapters.find((chapter) => chapter.lessons.some((lesson) => lesson.items.some((item) => item.bunny_stream_embed_url)));
    const firstVideoLesson = firstVideoChapter?.lessons.find((lesson) => lesson.items.some((item) => item.bunny_stream_embed_url));
    const firstVideo = firstVideoLesson?.items.find((item) => item.bunny_stream_embed_url);
    if (firstVideo && firstVideoLesson) {
      setExpandedChapterId(firstVideoChapter?.id ?? null);
      setExpandedLessonId(firstVideoLesson.id);
      playVideo(firstVideo, firstVideoLesson);
      return;
    }
    scrollIntoViewById("course-content", { block: "start" });
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    const response = await fetch("/api/student/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    }).catch(() => null);

    if (response?.status === 401) {
      router.replace("/login");
      return;
    }
    if (response?.status === 409) {
      setCheckoutLoading(false);
      await loadCourse();
      return;
    }
    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setCheckoutError(typeof body?.detail === "string" ? body.detail : "تعذر بدء عملية الدفع حالياً.");
      setCheckoutLoading(false);
      return;
    }

    const body = await response.json() as { redirect_url: string };
    window.location.assign(body.redirect_url);
  };

  return (
    <StudentPortalShell user={user} active={enrolled ? "courses" : "discover"}>
      {loading ? (
        <GlobalLoading variant="content" message="جاري تجهيز محتوى الكورس..." />
      ) : error || !detail || !course ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <div role="alert" className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-bold text-red-700">
            <CircleAlert className="mx-auto mb-3 size-8" />
            <p>{error || "تعذر العثور على الكورس."}</p>
            <div className="mt-5 flex justify-center gap-4">
              <button type="button" onClick={() => void loadCourse()} className="inline-flex cursor-pointer items-center gap-2 text-[#0369A1] hover:underline"><RotateCcw className="size-4" />إعادة المحاولة</button>
              <Link href={teacherSlug ? "/explore" : "/my-courses"} className="inline-flex items-center gap-2 text-[#464555] hover:underline">العودة</Link>
            </div>
          </div>
        </div>
      ) : (
        <m.div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8" initial="hidden" animate="show" variants={portalContainerVariants}>
          <Link href={enrolled ? "/my-courses" : "/explore"} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#777587] transition-colors hover:text-[#0369A1]">
            <ChevronLeft className="size-4 rotate-180" />{enrolled ? "العودة إلى دوراتي" : "العودة إلى الاستكشاف"}
          </Link>

          <m.section className="rounded-2xl border border-[#E2E0EF] bg-white p-5 sm:p-7" aria-labelledby="course-title" variants={portalItemVariants}>
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {course.subject_name && <span className="rounded-full bg-[#0284C7]/5 px-3 py-1 text-xs font-bold text-[#0369A1]">{course.subject_name}</span>}
                  {(gradeName || streamName) && <span className="rounded-full bg-[#F0F9FF] px-3 py-1 text-xs font-bold text-[#464555]">{[gradeName, streamName].filter(Boolean).join(" - ")}</span>}
                </div>
                <h1 id="course-title" className="text-3xl font-black leading-tight text-[#1B1B24] sm:text-4xl">{course.title}</h1>
                {detail.teacher && (
                  <Link href={`/explore/teachers/${detail.teacher.slug}`} className="mt-5 flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7]">
                    <TeacherAvatar name={detail.teacher.name} image={detail.teacher.img} />
                    <span><strong className="block text-sm font-black">{detail.teacher.name}</strong><span className="text-xs text-[#777587]">مدرس {course.subject_name || "الكورس"}</span></span>
                  </Link>
                )}
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[#464555] sm:text-base">{course.description || "تابع محتوى الكورس ودروس المدرس من مكان واحد."}</p>
              </div>

              <div className="w-full lg:w-auto">
                <div className="mb-5 grid grid-cols-3 gap-5 text-center text-xs font-bold text-[#464555] sm:flex sm:justify-end">
                  <span className="grid justify-items-center gap-1"><PlayCircle className="size-5 text-[#0284C7]" />{course.lesson_count} درس</span>
                  <span className="grid justify-items-center gap-1"><Clock3 className="size-5 text-[#0284C7]" />{formatDuration(course.total_duration_minutes)}</span>
                  <span className="grid justify-items-center gap-1"><ClipboardList className="size-5 text-[#0284C7]" />{examCount} اختبار</span>
                </div>
                {enrolled ? (
                  <button type="button" onClick={startCourse} className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-7 text-sm font-black text-white transition-colors hover:bg-[#0369A1] lg:w-auto">
                    عرض محتوى الكورس<ArrowLeft className="size-4" />
                  </button>
                ) : (
                  <button type="button" onClick={() => void startCheckout()} disabled={checkoutLoading} className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-7 text-sm font-black text-white transition-colors hover:bg-[#0369A1] disabled:cursor-wait disabled:opacity-70 lg:w-auto">
                    {checkoutLoading ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowLeft className="size-4" />}
                    {checkoutLoading ? "جارٍ التحويل" : `اشترك الآن - ${formatPrice(course.price)} ج.م`}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E2E0EF] pt-4 text-xs font-bold text-[#777587]">
              {detail.enrollment && <span className="inline-flex items-center gap-2"><CalendarClock className="size-4 text-[#0284C7]" />الاشتراك متاح حتى {formatExpiry(detail.enrollment.expires_at)}</span>}
              {!!chapters.length && <span className="inline-flex items-center gap-2"><FolderOpen className="size-4 text-[#0284C7]" />{chapters.length} {chapters.length === 1 ? "وحدة" : "وحدات"}</span>}
            </div>
          </m.section>

          {checkoutError && <div role="alert" className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"><CircleAlert className="size-5 shrink-0" />{checkoutError}</div>}

          <AnimatePresence initial={false}>
            {enrolled && activeVideo?.item.bunny_stream_embed_url && (
              <m.section
                key="course-player"
                id="course-player"
                className="scroll-mt-24 pt-8"
                aria-labelledby="player-title"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="overflow-hidden rounded-2xl border border-[#E2E0EF] bg-[#11111A]">
                  <div className="aspect-video">
                    <iframe
                      src={activeVideo.item.bunny_stream_embed_url}
                      title={`${activeVideo.lesson.title} - ${activeVideo.item.title}`}
                      className="size-full border-0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                  <div className="bg-white px-5 py-4">
                    <p className="text-xs font-bold text-[#0284C7]">{activeVideo.lesson.title}</p>
                    <h2 id="player-title" className="mt-1 text-lg font-black">{activeVideo.item.title}</h2>
                  </div>
                </div>
              </m.section>
            )}
          </AnimatePresence>

          <m.nav className="mt-8 flex gap-2 overflow-x-auto border-b border-[#E2E0EF]" aria-label="أقسام الكورس" variants={portalItemVariants}>
            {["المحتوى", "الاختبارات", "الملفات", "المناقشات", "التقدم"].map((tab, index) => (
              <button key={tab} type="button" disabled={index !== 0} title={index !== 0 ? `${tab} - قريباً` : undefined} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black ${index === 0 ? "border-[#0284C7] text-[#0369A1]" : "cursor-not-allowed border-transparent text-[#A6A3B5]"}`}>{tab}</button>
            ))}
          </m.nav>

          <m.section id="course-content" className="scroll-mt-24 pt-8" aria-labelledby="content-title" variants={portalItemVariants}>
            <div>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
                <h2 id="content-title" className="text-2xl font-black text-[#1B1B24] sm:text-3xl">{enrolled ? "محتوى الكورس" : "خطة الكورس"}</h2>
                <p className="text-xs font-bold text-[#777587]">
                  {lessons.length ? `${lessons.length} درس · ${formatDuration(course.total_duration_minutes)}` : "سيظهر المحتوى المنشور هنا"}
                </p>
              </div>

              {chapters.some((chapter) => chapter.lessons.length) ? (
                <div className="space-y-3">
                  {chapters.filter((chapter) => chapter.lessons.length).map((chapter, chapterIndex) => (
                    <section key={`${chapter.id}-${chapterIndex}`} className="overflow-hidden rounded-xl border border-[#DDD9E8] bg-white" aria-labelledby={`chapter-${chapter.id}-${chapterIndex}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const isOpening = expandedChapterId !== chapter.id;
                          setExpandedChapterId(isOpening ? chapter.id : null);
                          if (isOpening) setExpandedLessonId(chapter.lessons[0]?.id ?? null);
                        }}
                        aria-expanded={expandedChapterId === chapter.id}
                        aria-controls={`chapter-content-${chapter.id}-${chapterIndex}`}
                        className={`flex min-h-15 w-full cursor-pointer items-center gap-4 px-4 py-4 text-start transition-colors sm:px-5 ${expandedChapterId === chapter.id ? "bg-[#F0F9FF]" : "hover:bg-[#FAF9FD]"}`}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <h3 id={`chapter-${chapter.id}-${chapterIndex}`} className={`truncate text-base font-black sm:text-lg ${expandedChapterId === chapter.id ? "text-[#0369A1]" : "text-[#292733]"}`}>{chapter.title || "دروس الكورس"}</h3>
                          <ChevronDown className={`size-4 shrink-0 text-[#777587] transition-transform motion-reduce:transition-none ${expandedChapterId === chapter.id ? "rotate-180" : ""}`} />
                        </span>
                        <span className="shrink-0 text-xs font-medium text-[#777587]">{chapter.lessons.length} دروس · {formatDuration(chapterDuration(chapter.lessons))}</span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedChapterId === chapter.id && (
                          <m.div
                            key={`chapter-content-${chapter.id}-${chapterIndex}`}
                            id={`chapter-content-${chapter.id}-${chapterIndex}`}
                            className="overflow-hidden border-t border-[#DDD9E8]"
                            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            {chapter.lessons.map((lesson) => (
                              <LessonRow
                                key={lesson.id}
                                lesson={lesson}
                                enrolled={enrolled}
                                expanded={expandedLessonId === lesson.id}
                                activeVideoId={activeVideo?.item.id ?? null}
                                onToggle={() => setExpandedLessonId((current) => current === lesson.id ? null : lesson.id)}
                                onPlay={playVideo}
                              />
                            ))}
                          </m.div>
                        )}
                      </AnimatePresence>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-[#E2E0EF] bg-white px-4 text-center">
                  <BookOpen className="mb-4 size-10 text-[#C7C4D8]" />
                  <h3 className="text-lg font-black">محتوى الكورس غير متاح حالياً</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#777587]">عند نشر المدرس للدروس والمواد التعليمية ستظهر هنا تلقائياً.</p>
                </div>
              )}
            </div>
          </m.section>
        </m.div>
      )}
    </StudentPortalShell>
  );
}
