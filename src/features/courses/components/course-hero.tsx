"use client";

import Image from "next/image";
import { BookOpen, CalendarDays, Clock3, PlayCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { resolveAssetUrl } from "@/src/lib/asset-url";
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
}: {
  name: string;
  image: string | null;
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
    <span className="flex size-12 items-center justify-center rounded-full bg-[#BFE8FF] text-lg font-black text-[#075985]">
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
}: {
  course: PublicCourseDto;
  teacher: StudentCourseTeacherDto | null;
  gradeName?: string;
  streamName?: string;
  examCount: number;
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(course.created_at));
  const courseImageUrl = course.img ? resolveAssetUrl(course.img, "") : null;

  return (
    <section
      aria-labelledby="course-title"
      className="overflow-hidden rounded-[1.75rem] bg-[#0B1726] text-white shadow-[0_24px_70px_-34px_rgba(2,132,199,0.85)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,36%)]">
        <div className="order-2 flex flex-col justify-between p-6 sm:p-9 lg:order-1 lg:p-10">
          <div>
            <div className="mb-5 flex flex-wrap gap-2 text-xs font-bold">
              {course.subject_name && (
                <span className="rounded-full bg-[#38BDF8]/15 px-3 py-1.5 text-[#BFE8FF]">
                  {course.subject_name}
                </span>
              )}
              {(gradeName || streamName) && (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[#D6E5F2]">
                  {[gradeName, streamName].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>

            <h1
              id="course-title"
              className="max-w-3xl text-balance text-3xl font-black leading-[1.12] tracking-[-0.025em] sm:text-4xl lg:text-[2.9rem]"
            >
              {course.title}
            </h1>

            <p className="mt-5 text-sm leading-7 text-[#C5D4E2] sm:text-base">
              {course.description || t("courseFallbackDescription")}
            </p>

            {teacher && (
              <Link
                href={`/teachers/${teacher.slug}`}
                className="mt-7 inline-flex w-fit items-center gap-3 rounded-xl outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1726]"
              >
                <TeacherAvatar name={teacher.name} image={teacher.img} />
                <span>
                  <strong className="block text-sm font-black text-white">
                    {teacher.name}
                  </strong>
                  <span className="mt-0.5 block text-xs text-[#A9C0D2]">
                    {t("teacherRole", {
                      subject: course.subject_name || t("courseLabel"),
                    })}
                  </span>
                </span>
              </Link>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs font-bold text-[#C5D4E2] sm:flex sm:flex-wrap sm:gap-x-7">
            <span className="inline-flex items-center gap-2">
              <PlayCircle className="size-4 text-[#7DD3FC]" aria-hidden="true" />
              {t("lessons", { count: course.lesson_count })}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-[#7DD3FC]" aria-hidden="true" />
              {formatDuration(course.total_duration_minutes, t)}
            </span>
            <span className="inline-flex items-center gap-2">
              <BookOpen className="size-4 text-[#7DD3FC]" aria-hidden="true" />
              {t("exams", { count: examCount })}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-[#7DD3FC]" aria-hidden="true" />
              {date}
            </span>
          </div>
        </div>

        <div className="relative order-1 aspect-[16/10] min-h-56 overflow-hidden bg-[#142B40] lg:order-2 lg:aspect-auto lg:min-h-[25rem]">
          {courseImageUrl ? (
            <Image
              src={courseImageUrl}
              alt={course.title}
              fill
              priority
              sizes="(min-width: 1024px) 36vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[#7DD3FC]">
              <BookOpen className="size-16" strokeWidth={1.25} aria-hidden="true" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[#07131F]/20" />
        </div>
      </div>
    </section>
  );
}
