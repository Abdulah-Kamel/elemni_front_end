"use client";

import Image from "next/image";
import { BookOpen, CalendarDays, Clock3, PlayCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import ImageWithFallback from "@/src/components/ui/image-with-fallback";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import { cn } from "@/src/lib/cn";
import type {
  PublicCourseDto,
  StudentCourseTeacherDto,
} from "@/src/lib/student-api/contract";

function formatDuration(
  minutes: number | null,
  t: ReturnType<typeof useTranslations<"courseDetail">>,
) {
  if (!minutes) return t("durationUnknown");
  if (minutes < 60) return t("minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder
    ? `${t("hours", { count: hours })} ${t("minutes", { count: remainder })}`
    : t("hours", { count: hours });
}

function TeacherAvatar({
  name,
  image,
  tone = "brand",
}: {
  name: string;
  image: string | null;
  tone?: "brand" | "dark";
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={48}
        height={48}
        className="size-12 rounded-full border border-white/20 object-cover"
      />
    );
  }

  return (
    <span className={cn(
      "flex size-12 items-center justify-center rounded-full text-lg font-semibold",
      tone === "dark" ? "bg-[#15181E] text-white" : "bg-[#BFE8FF] text-[#075985]",
    )}>
      {name.slice(0, 1)}
    </span>
  );
}

export default function CourseHero({
  course,
  teacher,
  gradeName,
  streamName,
  examCount,
  variant = "default",
}: {
  course: PublicCourseDto;
  teacher: StudentCourseTeacherDto | null;
  gradeName?: string;
  streamName?: string;
  examCount: number;
  variant?: "default" | "lesson";
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const lesson = variant === "lesson";
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(course.created_at));
  const metaIconClass = lesson ? "text-[#0A5FB4]" : "text-[#7DD3FC]";

  if (lesson) {
    return (
      <section
        aria-label={t("courseLabel")}
        className="rounded-[18px] border border-[#E4E2DC] bg-white p-5 text-[#15181E] shadow-[0_16px_38px_-30px_rgba(21,24,30,0.35)]"
      >
        {teacher && (
          <Link
            href={`/explore/teachers/${teacher.slug}`}
            className="flex items-center gap-3 rounded-xl outline-none transition hover:bg-[#F4F3EF] focus-visible:ring-2 focus-visible:ring-[#0A5FB4] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <TeacherAvatar name={teacher.name} image={teacher.img} tone="dark" />
            <span className="min-w-0">
              <span className="block text-xs text-[#5F6573]">{t("teacherRole", { subject: course.subject_name || t("courseLabel") })}</span>
              <strong className="mt-0.5 block truncate text-sm font-semibold text-[#15181E]">{teacher.name}</strong>
            </span>
          </Link>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#F4F3EF] px-3 py-2.5">
            <dt className="text-xs text-[#5F6573]">{t("totalDuration")}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#15181E]">{formatDuration(course.total_duration_minutes, t)}</dd>
          </div>
          <div className="rounded-xl bg-[#F4F3EF] px-3 py-2.5">
            <dt className="text-xs text-[#5F6573]">{t("lessonsLabel")}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#15181E]">{t("lessons", { count: course.lesson_count })}</dd>
          </div>
          <div className="rounded-xl bg-[#F4F3EF] px-3 py-2.5">
            <dt className="text-xs text-[#5F6573]">{t("examsLabel")}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#15181E]">{t("exams", { count: examCount })}</dd>
          </div>
          <div className="rounded-xl bg-[#F4F3EF] px-3 py-2.5">
            <dt className="text-xs text-[#5F6573]">{t("lastUpdated")}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#15181E]">{date}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="course-title"
      className={cn(
        "overflow-hidden",
        lesson
          ? "rounded-[18px] border border-[#E4E2DC] bg-white text-[#15181E] shadow-[0_16px_38px_-30px_rgba(21,24,30,0.35)]"
          : "rounded-[1.75rem] border-2 border-ink bg-[#0B1726] text-white shadow-[5px_5px_0_0_var(--color-ink)] dark:border-brand-300 dark:shadow-[5px_5px_0_0_#020617]",
      )}
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,36%)]">
        <div
          className={cn(
            "order-2 flex flex-col justify-between lg:order-1",
            lesson ? "p-5 sm:p-7 lg:p-8" : "p-6 sm:p-9 lg:p-10",
          )}
        >
          <div>
            <div className="mb-5 flex flex-wrap gap-2 text-xs font-black">
              {course.subject_name &&
                (lesson ? (
                  <span className="rounded-full border border-[#F0DDA0] bg-[#FFF4D6] px-3 py-1.5 text-[#6B4E00]">
                    {course.subject_name}
                  </span>
                ) : (
                  <span className="sticker-badge -rotate-1 bg-amber-300 px-3 py-1.5 text-ink">
                    {course.subject_name}
                  </span>
                ))}
              {(gradeName || streamName) && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5",
                    lesson
                      ? "border border-[#E4E2DC] bg-white text-[#4A505C]"
                      : "border border-white/15 bg-white/5 text-[#D6E5F2]",
                  )}
                >
                  {[gradeName, streamName].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>

            <h1
              id="course-title"
              className={cn(
                "max-w-3xl text-balance font-black leading-[1.12] tracking-[-0.025em]",
                lesson
                  ? "text-2xl text-[#15181E] sm:text-3xl lg:text-[1.875rem]"
                  : "text-3xl sm:text-4xl lg:text-[2.9rem]",
              )}
            >
              {lesson ? (
                course.title
              ) : (
                <MarkerHighlight color="yellow" variant={1}>
                  {course.title}
                </MarkerHighlight>
              )}
            </h1>

            <p
              className={cn(
                "mt-5 text-sm leading-7 sm:text-base",
                lesson ? "text-[#4A505C]" : "text-[#C5D4E2]",
              )}
            >
              {course.description || t("courseFallbackDescription")}
            </p>

            {teacher && (
              <Link
                href={`/explore/teachers/${teacher.slug}`}
                className={cn(
                  "mt-7 inline-flex w-fit items-center gap-3 rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2",
                  lesson
                    ? "hover:bg-[#F4F3EF] focus-visible:ring-[#0A5FB4] focus-visible:ring-offset-white"
                    : "hover:bg-white/5 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-[#0B1726]",
                )}
              >
                <TeacherAvatar name={teacher.name} image={teacher.img} />
                <span>
                  <strong
                    className={cn(
                      "block text-sm font-black",
                      lesson ? "text-[#15181E]" : "text-white",
                    )}
                  >
                    {teacher.name}
                  </strong>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      lesson ? "text-[#5F6573]" : "text-[#A9C0D2]",
                    )}
                  >
                    {t("teacherRole", {
                      subject: course.subject_name || t("courseLabel"),
                    })}
                  </span>
                </span>
              </Link>
            )}
          </div>

          <div
            className={cn(
              "mt-8 border-t pt-5 text-xs font-bold",
              lesson
                ? "grid grid-cols-2 gap-2.5 border-[#E4E2DC] text-[#4A505C] sm:grid-cols-4"
                : "grid grid-cols-2 gap-3 border-white/10 text-[#C5D4E2] sm:flex sm:flex-wrap sm:gap-x-7",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-2",
                lesson && "rounded-xl bg-[#F4F3EF] px-3 py-2.5 text-[13px] text-[#15181E]",
              )}
            >
              <PlayCircle className={cn("size-4 shrink-0", metaIconClass)} aria-hidden="true" />
              {t("lessons", { count: course.lesson_count })}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2",
                lesson && "rounded-xl bg-[#F4F3EF] px-3 py-2.5 text-[13px] text-[#15181E]",
              )}
            >
              <Clock3 className={cn("size-4 shrink-0", metaIconClass)} aria-hidden="true" />
              {formatDuration(course.total_duration_minutes, t)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2",
                lesson && "rounded-xl bg-[#F4F3EF] px-3 py-2.5 text-[13px] text-[#15181E]",
              )}
            >
              <BookOpen className={cn("size-4 shrink-0", metaIconClass)} aria-hidden="true" />
              {t("exams", { count: examCount })}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2",
                lesson && "rounded-xl bg-[#F4F3EF] px-3 py-2.5 text-[13px] text-[#15181E]",
              )}
            >
              <CalendarDays className={cn("size-4 shrink-0", metaIconClass)} aria-hidden="true" />
              {date}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "relative order-1 aspect-[16/10] min-h-56 overflow-hidden lg:order-2 lg:aspect-auto lg:min-h-[25rem]",
            lesson
              ? "bg-[#ECEAE4] lg:border-s lg:border-[#E4E2DC]"
              : "bg-[#142B40]",
          )}
        >
          <ImageWithFallback
            src={course.img}
            fallbackSrc={lessonFallback}
            alt={course.title}
            fill
            priority
            sizes="(min-width: 1024px) 36vw, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[#07131F]/20" />
        </div>
      </div>
    </section>
  );
}
