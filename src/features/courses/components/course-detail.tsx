"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, RotateCcw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import StudentAppShell from "@/src/features/portal/components/portal-shell";
import { Link, useRouter } from "@/src/i18n/navigation";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import type {
  GradeDto,
  PublicItemDto,
  PublicLessonDto,
  StudentCourseDetailDto,
  CheckoutRedirectDto,
  StreamDto,
} from "@/src/lib/student-api/contract";
import { isCheckoutRedirectDto, resolveCheckoutRedirect } from "@/src/lib/student-api/checkout";
import { resolveAssetUrl } from "@/src/lib/asset-url";
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
import { getEffectiveCoupons, validateCoupon, type CouponValidation } from "@/src/lib/coupons/coupons";
import { cn } from "@/src/lib/cn";
import { CourseTestPanel, type ActiveTest } from "@/src/features/course-tests/course-test-panel";
import { useCourseTestsProgress } from "@/src/features/course-tests/hooks";
import { courseItemHref } from "@/src/features/course-tests/routes";
import { findTestLocation } from "@/src/features/course-tests/sidebar/placement";
import { portalContainerVariants, portalItemVariants, scrollIntoViewById } from "./course-motion";
import CheckoutConfirmation from "./checkout-confirmation";
import CourseHero from "./course-hero";
import CoursePurchasePanel from "./course-purchase-panel";
import CurriculumAccordion from "./curriculum-accordion";
import LearnerPlayer from "./learner-player";
import LearnerCurriculumSidebar from "./learner-curriculum-sidebar";
import CourseDetailSkeleton from "./course-detail-skeleton";
import PublicCourseDetailShell from "./public-course-detail-shell";

function absoluteDocumentUrl(path: string | null) {
  if (!path) return null;
  return resolveAssetUrl(path, "") || null;
}

export default function CourseDetail({
  courseId,
  teacherSlug,
  grades,
  streams,
  isAuthenticated = true,
  publicMode = false,
  initialDetail,
  activeTest,
  initialItemId,
}: {
  courseId: number;
  teacherSlug?: string;
  grades: GradeDto[];
  streams: StreamDto[];
  isAuthenticated?: boolean;
  publicMode?: boolean;
  initialDetail?: StudentCourseDetailDto;
  /** When set, the course test panel replaces the player (tests/[testId] route). */
  activeTest?: ActiveTest;
  /** Content item to open first (e.g. `?item=` links from test screens). */
  initialItemId?: number | null;
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion() === true;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState("");
  const [expandedChapterId, setExpandedChapterId] = useState<number | null | undefined>(
    () => initialDetail && !activeTest && !initialItemId
      ? initialDetail.course.chapters.find((chapter) => chapter.lessons.length)?.id ?? null
      : undefined,
  );
  const [expandedLessonId, setExpandedLessonId] = useState<number | null | undefined>(
    () => initialDetail && !activeTest && !initialItemId
      ? initialDetail.course.chapters.find((chapter) => chapter.lessons.length)?.lessons[0]?.id ?? null
      : undefined,
  );
  const [activeContent, setActiveContent] = useState<{
    item: PublicItemDto;
    lesson: PublicLessonDto;
    type: "video" | "document";
  } | null>(null);
  const [theaterMode, setTheaterMode] = useState(false);

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
  const playableItems = enrolled
    ? chapters.flatMap((chapter) =>
        chapter.lessons.flatMap((lesson) =>
          lesson.items
            .filter((item) => Boolean(item.bunny_stream_embed_url) || Boolean(absoluteDocumentUrl(item.document_path)))
            .map((item) => ({ item, lesson, chapter })),
        ),
      )
    : [];
  const firstContentChapter = chapters.find((chapter) => chapter.lessons.length);
  const testsProgress = useCourseTestsProgress(courseId, enrolled && !publicMode).data ?? null;
  const activeTestLocation = activeTest && testsProgress
    ? findTestLocation(chapters, testsProgress.items, activeTest.testId)
    : null;
  // The attempt screen is a focused layout: no course header or curriculum sidebar.
  const focusedTest = activeTest?.view === "attempt";
  const resumeItemId = enrolled
    ? initialItemId ?? detail?.enrollment?.progress.next_item_id ?? detail?.enrollment?.progress.last_item_id
    : null;
  const resumeLocation = resumeItemId
    ? chapters
        .flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })))
        .find(({ lesson }) => lesson.items.some((item) => item.id === resumeItemId))
    : null;
  const visibleExpandedChapterId = expandedChapterId === undefined
    ? activeTestLocation?.chapterId ?? resumeLocation?.chapter.id ?? firstContentChapter?.id ?? null
    : expandedChapterId;
  const visibleExpandedLessonId = expandedLessonId === undefined
    ? activeTestLocation?.lessonId ?? resumeLocation?.lesson.id ?? chapters.find((chapter) => chapter.id === visibleExpandedChapterId)?.lessons[0]?.id ?? null
    : expandedLessonId;
  const firstPlayableContent = enrolled
    ? chapters
        .flatMap((chapter) => chapter.lessons)
        .flatMap((lesson) => lesson.items.map((item) => ({ item, lesson })))
        .find(({ item }) => item.id === resumeItemId && (Boolean(item.bunny_stream_embed_url) || Boolean(absoluteDocumentUrl(item.document_path))))
      ?? chapters
        .flatMap((chapter) => chapter.lessons)
        .flatMap((lesson) => lesson.items.map((item) => ({ item, lesson })))
        .find(({ item }) => Boolean(item.bunny_stream_embed_url) || Boolean(absoluteDocumentUrl(item.document_path)))
      ?? null
    : null;
  const visibleActiveContent = activeContent ?? (firstPlayableContent ? {
    ...firstPlayableContent,
    type: firstPlayableContent.item.bunny_stream_embed_url ? "video" as const : "document" as const,
  } : null);
  const visibleActiveIndex = visibleActiveContent
    ? playableItems.findIndex(({ item }) => item.id === visibleActiveContent.item.id)
    : -1;
  const itemPosition = visibleActiveIndex >= 0
    ? t("lessonItemPosition", { current: visibleActiveIndex + 1, total: playableItems.length })
    : "";
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
    if (activeTest) {
      router.push(courseItemHref(courseId, { id: item.id, kind: "video" }));
      return;
    }
    setActiveContent({ item, lesson, type: "video" });
    if (enrolled) progressMutation.mutate({ itemId: item.id });
    window.setTimeout(() => scrollIntoViewById("course-player", { block: "start" }), 0);
  };

  const openDocument = (item: PublicItemDto, lesson: PublicLessonDto) => {
    if (activeTest) {
      router.push(courseItemHref(courseId, { id: item.id, kind: "file" }));
      return;
    }
    if (enrolled) progressMutation.mutate({ itemId: item.id });
    setActiveContent({ item, lesson, type: "document" });
    window.setTimeout(() => scrollIntoViewById("course-player", { block: "start" }), 0);
  };

  const goToPlayableItem = (index: number) => {
    const target = playableItems[index];
    if (!target) return;
    setExpandedChapterId(target.chapter.id);
    setExpandedLessonId(target.lesson.id);
    if (target.item.bunny_stream_embed_url) playVideo(target.item, target.lesson);
    else openDocument(target.item, target.lesson);
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
    const firstContent = firstPlayableContent?.item;
    const firstContentLesson = firstPlayableContent?.lesson;
    const firstContentChapter = chapters.find((chapter) =>
      chapter.lessons.some((lesson) => lesson.id === firstContentLesson?.id),
    );
    if (firstContent && firstContentLesson) {
      setExpandedChapterId(firstContentChapter?.id ?? null);
      setExpandedLessonId(firstContentLesson.id);
      if (firstContent.bunny_stream_embed_url) playVideo(firstContent, firstContentLesson);
      else openDocument(firstContent, firstContentLesson);
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

  const basePrice = Number(detail?.enrollment?.course_price ?? course?.price ?? 0);
  const applyCoupon = (raw: string) => {
    const r = validateCoupon(raw, basePrice, new Date(), getEffectiveCoupons());
    if (r.ok) { setCouponApplied(r); setCouponCode(r.coupon!.code); setCouponError(""); }
    else { setCouponApplied(null); setCouponError(t(`couponError_${r.error}` as never) || t("couponInvalid")); }
  };
  const removeCoupon = () => { setCouponApplied(null); setCouponCode(""); setCouponError(""); };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    const response = await fetch("/api/student/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(couponApplied?.ok ? { course_id: courseId, coupon_code: couponApplied.coupon!.code } : { course_id: courseId }),
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
    <div className={cn(!publicMode && enrolled && "min-h-[calc(100vh-4rem)] bg-[#F4F3EF]")}>
      {loading ? (
        <CourseDetailSkeleton label={t("loadingCourse")} />
      ) : error || !detail || !course ? (
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4">
          <div role="alert" className="sticker-tile w-full border-red-600 bg-red-50 p-6 text-center text-sm font-black text-red-700 dark:border-red-400 dark:bg-red-500/10 dark:text-red-300">
            <CircleAlert className="mx-auto mb-3 size-8" aria-hidden="true" />
            <p>{error || t("notFound")}</p>
            <div className="mt-5 flex justify-center gap-4">
              <button type="button" onClick={loadCourse} className="inline-flex cursor-pointer items-center gap-2 font-black text-brand-700 hover:underline dark:text-brand-300">
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("retry")}
              </button>
              <Link href={backHref} className="inline-flex items-center gap-2 font-bold text-muted hover:underline dark:text-slate-400">
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
          {!enrolled && (
            <m.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mb-6 w-fit">
              <Link
                href={backHref}
                className="sticker-btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm font-black text-ink dark:text-slate-200"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {backLabel}
              </Link>
            </m.div>
          )}

          {enrolled ? (
            <div
              data-enrolled-layout
              className={cn(
                "grid items-start gap-8",
                theaterMode || focusedTest
                  ? "lg:grid-cols-1"
                  : "lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]",
              )}
            >
              <div className="min-w-0 space-y-5">
                {!focusedTest && <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold">
                      {(gradeName || streamName) && (
                        <span className="rounded-full border border-[#E4E2DC] bg-white px-3 py-1.5 text-[#4A505C]">
                          {[gradeName, streamName].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {course.subject_name && (
                        <span className="rounded-full border border-[#F0DDA0] bg-[#FFF4D6] px-3 py-1.5 text-[#6B4E00]">
                          {course.subject_name}
                        </span>
                      )}
                    </div>
                    <h1
                      id="course-title"
                      className="text-balance text-2xl font-bold tracking-[-0.02em] text-[#15181E] sm:text-[30px]"
                    >
                      {course.title}
                    </h1>
                  </div>
                  <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={backHref}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#E4E2DC] bg-white px-4 text-sm font-semibold text-[#15181E] transition hover:bg-[#F4F3EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4]"
                    >
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      {backLabel}
                    </Link>
                  </m.div>
                </div>}
                <AnimatePresence initial={false} mode="wait">
                  {activeTest ? (
                    <m.div
                      key={`course-test-${activeTest.testId}-${activeTest.view}`}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CourseTestPanel courseId={courseId} active={activeTest} />
                    </m.div>
                  ) : (
                  <m.div
                    key="course-player"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <LearnerPlayer
                      activeContent={visibleActiveContent}
                      itemPosition={itemPosition}
                      canGoPrevious={visibleActiveIndex > 0}
                      canGoNext={visibleActiveIndex >= 0 && visibleActiveIndex < playableItems.length - 1}
                      onPrevious={() => goToPlayableItem(visibleActiveIndex - 1)}
                      onNext={() => goToPlayableItem(visibleActiveIndex + 1)}
                      theaterMode={theaterMode}
                      onTheaterModeChange={setTheaterMode}
                    />
                  </m.div>
                  )}
                </AnimatePresence>

              </div>

              {!focusedTest && <LearnerCurriculumSidebar
                chapters={chapters}
                lessonsCount={lessons.length}
                activeContentId={activeTest ? null : visibleActiveContent?.item.id ?? null}
                activeTestId={activeTest?.testId ?? null}
                expandedChapterId={visibleExpandedChapterId}
                expandedLessonId={visibleExpandedLessonId}
                onChapterToggle={handleChapterToggle}
                onLessonToggle={handleLessonToggle}
                onPlay={playVideo}
                onOpen={openDocument}
                completedItemIds={detail.enrollment?.progress.completed_item_ids ?? []}
                theaterMode={theaterMode}
                completionPercent={detail.enrollment?.progress.completion_percent ?? null}
                courseSummary={
                  <CourseHero
                    variant="lesson"
                    course={course}
                    teacher={detail.teacher}
                    gradeName={gradeName}
                    streamName={streamName}
                    examCount={examCount}
                  />
                }
                courseId={course.id}
              />}
            </div>
          ) : (
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
                      <h2 id="content-title" className="text-3xl font-black tracking-tight text-ink sm:text-4xl dark:text-slate-50">
                        <MarkerHighlight color="sky" variant={1}>
                          {t("coursePlan")}
                        </MarkerHighlight>
                      </h2>
                      <p className="mt-2 max-w-[65ch] text-sm font-medium text-muted dark:text-slate-400">{t("curriculumDescription")}</p>
                    </div>
                    <p className="sticker-badge bg-surface px-3 py-1 text-xs font-black text-muted dark:text-slate-300">
                      {lessons.length ? t("lessons", { count: lessons.length }) : t("contentWillAppear")}
                    </p>
                  </div>

                  {chapters.some((chapter) => chapter.lessons.length) ? (
                    <CurriculumAccordion
                      chapters={chapters}
                      enrolled={false}
                      activeContentId={visibleActiveContent?.item.id ?? null}
                      expandedChapterId={visibleExpandedChapterId}
                      expandedLessonId={visibleExpandedLessonId}
                      onChapterToggle={handleChapterToggle}
                      onLessonToggle={handleLessonToggle}
                      onPlay={playVideo}
                      onOpen={openDocument}
                    />
                  ) : (
                    <div className="sticker-tile flex min-h-64 flex-col items-center justify-center px-5 text-center">
                      <CircleAlert className="mb-4 size-10 text-muted" aria-hidden="true" />
                      <h3 className="text-lg font-black text-ink dark:text-slate-50">
                        <MarkerHighlight color="pink" variant={3}>
                          {t("noContent")}
                        </MarkerHighlight>
                      </h3>
                      <p className="mt-2 max-w-[65ch] text-sm leading-6 font-medium text-muted dark:text-slate-400">{t("noContentDescription")}</p>
                    </div>
                  )}
                </m.section>
              </div>

              <aside className="order-2 min-w-0 lg:order-1">
                <CoursePurchasePanel
                  course={course}
                  enrollment={detail.enrollment}
                  isAuthenticated={isAuthenticated}
                  loading={checkoutLoading}
                  onPurchase={openCheckout}
                  onContinue={startCourse}
                  couponApplied={couponApplied}
                  couponError={couponError}
                  onCouponApply={applyCoupon}
                  onCouponRemove={removeCoupon}
                />
              </aside>
            </div>
          )}
        </m.div>
      )}

      {course && (
        <CheckoutConfirmation
          open={checkoutOpen}
          course={course}
          teacher={detail?.teacher ?? null}
          loading={checkoutLoading}
          error={checkoutError}
          coupon={couponApplied}
          onOpenChange={(open) => {
            if (!checkoutLoading) setCheckoutOpen(open);
          }}
          onConfirm={() => void startCheckout()}
        />
      )}
    </div>
  );

  return publicMode ? (
    <PublicCourseDetailShell>{pageContent}</PublicCourseDetailShell>
  ) : (
    <StudentAppShell
      user={user}
      active={enrolled ? "courses" : "discover"}
      title={course?.title}
    >
      {pageContent}
    </StudentAppShell>
  );
}
