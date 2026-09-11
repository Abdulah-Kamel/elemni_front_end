"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, RotateCcw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import StudentAppShell from "@/src/features/portal/components/portal-shell";
import { Link, useRouter } from "@/src/i18n/navigation";
import type {
  GradeDto,
  PublicItemDto,
  PublicLessonDto,
  StudentCourseDetailDto,
  CheckoutRedirectDto,
  StreamDto,
} from "@/src/lib/student-api/contract";
import { isCheckoutRedirectDto, resolveCheckoutRedirect } from "@/src/lib/student-api/checkout";
import {
  getStudentErrorMessage,
  isStudentUnauthorized,
} from "@/src/lib/student-api/client";
import {
  useCurrentStudent,
  useStudentCourse,
  useUpdateCourseProgress,
} from "@/src/features/student/hooks/use-student-queries";
import { studentQueryKeys } from "@/src/features/student/query-keys";
import { portalContainerVariants, portalItemVariants, scrollIntoViewById } from "./course-motion";
import CheckoutConfirmation from "./checkout-confirmation";
import CourseHero from "./course-hero";
import CoursePurchasePanel from "./course-purchase-panel";
import CurriculumAccordion from "./curriculum-accordion";
import LearnerPlayer from "./learner-player";
import LearnerCurriculumSidebar from "./learner-curriculum-sidebar";
import CourseDetailSkeleton from "./course-detail-skeleton";
import PublicCourseDetailShell from "./public-course-detail-shell";

export default function CourseDetail({
  courseId,
  teacherSlug,
  grades,
  streams,
  isAuthenticated = true,
  publicMode = false,
  initialDetail,
}: {
  courseId: number;
  teacherSlug?: string;
  grades: GradeDto[];
  streams: StreamDto[];
  isAuthenticated?: boolean;
  publicMode?: boolean;
  initialDetail?: StudentCourseDetailDto;
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion() === true;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [expandedChapterId, setExpandedChapterId] = useState<number | null | undefined>(
    () => initialDetail
      ? initialDetail.course.chapters.find((chapter) => chapter.lessons.length)?.id ?? null
      : undefined,
  );
  const [expandedLessonId, setExpandedLessonId] = useState<number | null | undefined>(
    () => initialDetail
      ? initialDetail.course.chapters.find((chapter) => chapter.lessons.length)?.lessons[0]?.id ?? null
      : undefined,
  );
  const [activeVideo, setActiveVideo] = useState<{
    item: PublicItemDto;
    lesson: PublicLessonDto;
  } | null>(null);

  const courseQuery = useStudentCourse(courseId, teacherSlug, { initialData: initialDetail });
  const userQuery = useCurrentStudent(isAuthenticated);
  const progressMutation = useUpdateCourseProgress(courseId);
  const detail = courseQuery.data;
  const user = isAuthenticated ? userQuery.data ?? null : null;
  const unauthorized =
    isStudentUnauthorized(courseQuery.error) ||
    (isAuthenticated && isStudentUnauthorized(userQuery.error));
  const loading = courseQuery.isPending || (isAuthenticated && userQuery.isPending);
  const error = getStudentErrorMessage(courseQuery.error, t("loadError"));

  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [router, unauthorized]);

  const loadCourse = () => {
    void courseQuery.refetch();
    if (isAuthenticated) void userQuery.refetch();
  };

  const course = detail?.course;
  const enrolled = Boolean(detail?.enrollment);
  const chapters = course?.chapters ?? [];
  const lessons = chapters.flatMap((chapter) => chapter.lessons);
  const firstContentChapter = chapters.find((chapter) => chapter.lessons.length);
  const resumeItemId = enrolled
    ? detail?.enrollment?.progress.next_item_id ?? detail?.enrollment?.progress.last_item_id
    : null;
  const resumeLocation = resumeItemId
    ? chapters
        .flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })))
        .find(({ lesson }) => lesson.items.some((item) => item.id === resumeItemId))
    : null;
  const visibleExpandedChapterId = expandedChapterId === undefined
    ? resumeLocation?.chapter.id ?? firstContentChapter?.id ?? null
    : expandedChapterId;
  const visibleExpandedLessonId = expandedLessonId === undefined
    ? resumeLocation?.lesson.id ?? chapters.find((chapter) => chapter.id === visibleExpandedChapterId)?.lessons[0]?.id ?? null
    : expandedLessonId;
  const firstPlayableVideo = enrolled
    ? chapters
        .flatMap((chapter) => chapter.lessons)
        .flatMap((lesson) => lesson.items.map((item) => ({ item, lesson })))
        .find(({ item }) => item.id === resumeItemId && Boolean(item.bunny_stream_embed_url))
      ?? chapters
        .flatMap((chapter) => chapter.lessons)
        .flatMap((lesson) => lesson.items.map((item) => ({ item, lesson })))
        .find(({ item }) => Boolean(item.bunny_stream_embed_url))
      ?? null
    : null;
  const visibleActiveVideo = activeVideo ?? firstPlayableVideo;
  const examCount = lessons.flatMap((lesson) => lesson.items).filter((item) => item.has_exam).length;
  const gradeName = grades.find((grade) => grade.id === course?.grade_id)?.name;
  const streamName = streams.find((stream) => stream.id === course?.stream_id)?.name;
  const backHref = publicMode ? "/" : enrolled ? "/my-courses" : "/explore";
  const backLabel = publicMode
    ? t("backToCatalog")
    : enrolled
      ? t("backToCourses")
      : t("backToExplore");

  const playVideo = (item: PublicItemDto, lesson: PublicLessonDto) => {
    setActiveVideo({ item, lesson });
    if (enrolled) progressMutation.mutate({ itemId: item.id });
    window.setTimeout(() => scrollIntoViewById("course-player", { block: "start" }), 0);
  };

  const openDocument = (item: PublicItemDto, _lesson: PublicLessonDto) => {
    if (enrolled) progressMutation.mutate({ itemId: item.id });
  };

  const handleChapterToggle = (chapterId: number) => {
    const isOpening = visibleExpandedChapterId !== chapterId;
    setExpandedChapterId(isOpening ? chapterId : null);
    if (isOpening) {
      const chapter = chapters.find((item) => item.id === chapterId);
      setExpandedLessonId(chapter?.lessons[0]?.id ?? null);
    }
  };

  const handleLessonToggle = (lessonId: number) => {
    setExpandedLessonId(visibleExpandedLessonId === lessonId ? null : lessonId);
  };

  const startCourse = () => {
    const firstVideo = firstPlayableVideo?.item;
    const firstVideoLesson = firstPlayableVideo?.lesson;
    const firstVideoChapter = chapters.find((chapter) =>
      chapter.lessons.some((lesson) => lesson.id === firstVideoLesson?.id),
    );
    if (firstVideo && firstVideoLesson) {
      setExpandedChapterId(firstVideoChapter?.id ?? null);
      setExpandedLessonId(firstVideoLesson.id);
      playVideo(firstVideo, firstVideoLesson);
      return;
    }
    scrollIntoViewById("course-content", { block: "start" });
  };

  const openCheckout = () => {
    if (!isAuthenticated) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }
    setCheckoutError("");
    setCheckoutOpen(true);
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
      setCheckoutLoading(false);
      setCheckoutOpen(false);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (response?.status === 409) {
      setCheckoutLoading(false);
      setCheckoutOpen(false);
      await Promise.all([
        courseQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.myCourses() }),
      ]);
      return;
    }
    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setCheckoutError(typeof body?.detail === "string" ? body.detail : t("checkoutError"));
      setCheckoutLoading(false);
      return;
    }

    const body = (await response.json().catch(() => null)) as CheckoutRedirectDto | null;
    // The backend owns payment state: paid courses return a Kashier hosted
    // checkout URL, free courses return the relative "/my-courses".
    if (!isCheckoutRedirectDto(body)) {
      setCheckoutError(t("checkoutError"));
      setCheckoutLoading(false);
      return;
    }
    window.location.assign(resolveCheckoutRedirect(body.redirect_url, locale));
  };

  const pageContent = (
    <>
      {loading ? (
        <CourseDetailSkeleton label={t("loadingCourse")} />
      ) : error || !detail || !course ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <div role="alert" className="w-full rounded-2xl border border-[#F4C7C7] bg-[#FFF7F7] p-6 text-center text-sm font-bold text-[#B42318]">
            <CircleAlert className="mx-auto mb-3 size-8" aria-hidden="true" />
            <p>{error || t("notFound")}</p>
            <div className="mt-5 flex justify-center gap-4">
              <button type="button" onClick={loadCourse} className="inline-flex cursor-pointer items-center gap-2 text-[#075985] hover:underline">
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("retry")}
              </button>
              <Link href={backHref} className="inline-flex items-center gap-2 text-[#536A7C] hover:underline">
                {backLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <m.div
          className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
          initial={reduced ? false : "hidden"}
          animate="show"
          variants={portalContainerVariants}
        >
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#6B7E8F] transition-colors hover:text-[#075985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]">
            <div className="order-1 min-w-0 space-y-8 lg:order-2">
              <m.div
                initial={publicMode || reduced ? false : "hidden"}
                animate="show"
                variants={portalItemVariants}
              >
                <CourseHero
                  course={course}
                  teacher={detail.teacher}
                  gradeName={gradeName}
                  streamName={streamName}
                  examCount={examCount}
                />
              </m.div>

              <AnimatePresence initial={false}>
                  {enrolled && visibleActiveVideo?.item.bunny_stream_embed_url && (
                  <m.div
                    key="course-player"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <LearnerPlayer activeVideo={visibleActiveVideo} />
                  </m.div>
                )}
              </AnimatePresence>

              <m.nav
                className="flex gap-1 overflow-x-auto border-b border-[#D8E3EC]"
                aria-label={t("courseContent")}
                initial={publicMode || reduced ? false : "hidden"}
                animate="show"
                variants={portalItemVariants}
              >
                {([
                  ["content", true],
                  ["exams", false],
                  ["files", false],
                  ["discussions", false],
                  ["progress", false],
                ] as const).map(([key, enabled]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={!enabled}
                    title={!enabled ? `${t(`tabs.${key}`)} · ${t("tabs.comingSoon")}` : undefined}
                    className={`shrink-0 border-b-2 px-4 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0284C7] ${enabled ? "border-[#0284C7] text-[#075985]" : "cursor-not-allowed border-transparent text-[#9AAEBD]"}`}
                  >
                    {t(`tabs.${key}`)}
                  </button>
                ))}
              </m.nav>

              {!enrolled && (
                <m.section
                  id="course-content"
                  className="scroll-mt-24"
                  aria-labelledby="content-title"
                  initial={publicMode || reduced ? false : "hidden"}
                  animate="show"
                  variants={portalItemVariants}
                >
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 id="content-title" className="text-2xl font-black tracking-[-0.025em] text-[#0F2638] sm:text-3xl">
                        {t("coursePlan")}
                      </h2>
                      <p className="mt-2 text-sm text-[#6B7E8F]">{t("curriculumDescription")}</p>
                    </div>
                    <p className="text-xs font-bold text-[#6B7E8F]">
                      {lessons.length ? t("lessons", { count: lessons.length }) : t("contentWillAppear")}
                    </p>
                  </div>

                  {chapters.some((chapter) => chapter.lessons.length) ? (
                    <CurriculumAccordion
                      chapters={chapters}
                      enrolled={false}
                      activeVideoId={visibleActiveVideo?.item.id ?? null}
                      expandedChapterId={visibleExpandedChapterId}
                      expandedLessonId={visibleExpandedLessonId}
                      onChapterToggle={handleChapterToggle}
                      onLessonToggle={handleLessonToggle}
                      onPlay={playVideo}
                      onOpen={openDocument}
                    />
                  ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#B7CDDC] bg-white px-5 text-center">
                      <CircleAlert className="mb-4 size-10 text-[#9AB4C5]" aria-hidden="true" />
                      <h3 className="text-lg font-black text-[#1C3345]">{t("noContent")}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#6B7E8F]">{t("noContentDescription")}</p>
                    </div>
                  )}
                </m.section>
              )}
            </div>

            {enrolled ? (
              <LearnerCurriculumSidebar
                chapters={chapters}
                lessonsCount={lessons.length}
                activeVideoId={visibleActiveVideo?.item.id ?? null}
                expandedChapterId={visibleExpandedChapterId}
                expandedLessonId={visibleExpandedLessonId}
                onChapterToggle={handleChapterToggle}
                onLessonToggle={handleLessonToggle}
                onPlay={playVideo}
                onOpen={openDocument}
                completedItemIds={detail.enrollment?.progress.completed_item_ids ?? []}
              />
            ) : (
              <aside className="order-2 min-w-0 lg:order-1">
                <CoursePurchasePanel
                  course={course}
                  enrollment={detail.enrollment}
                  isAuthenticated={isAuthenticated}
                  loading={checkoutLoading}
                  onPurchase={openCheckout}
                  onContinue={startCourse}
                />
              </aside>
            )}
          </div>
        </m.div>
      )}

      {course && (
        <CheckoutConfirmation
          open={checkoutOpen}
          course={course}
          teacher={detail?.teacher ?? null}
          loading={checkoutLoading}
          error={checkoutError}
          onOpenChange={(open) => {
            if (!checkoutLoading) setCheckoutOpen(open);
          }}
          onConfirm={() => void startCheckout()}
        />
      )}
    </>
  );

  return publicMode ? (
    <PublicCourseDetailShell>{pageContent}</PublicCourseDetailShell>
  ) : (
    <StudentAppShell user={user} active={enrolled ? "courses" : "discover"}>
      {pageContent}
    </StudentAppShell>
  );
}
