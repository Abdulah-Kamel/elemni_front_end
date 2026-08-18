import { BookOpen, Clock } from "lucide-react";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import type { PublicCourseDto } from "@/src/lib/student-api/contract";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-calculus.webp";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

export interface FeaturedCourse {
  course: PublicCourseDto;
  teacherName: string;
  teacherSlug: string;
}

function courseImage(src: string | null) {
  return src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))
    ? src
    : lessonFallback;
}

function durationLabel(minutes: number | null) {
  if (!minutes) return null;
  return minutes < 60 ? `${minutes} دقيقة` : `${Math.round(minutes / 60)} ساعة`;
}

export default function FeaturedLessons({ courses }: { courses: FeaturedCourse[] }) {
  if (!courses.length) return null;

  return (
    <Section id="featured-courses">
      <Reveal>
        <h2 className="mb-3 text-center text-3xl font-black text-[#0F172A] md:text-4xl font-cairo">
          ابدأ بأحدث{" "}
          <MarkerHighlight color="pink" variant={1}>
            كورسات المنصة
          </MarkerHighlight>
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-[#334155]">
          كورسات منشورة فعلياً من مكتبات المدرسين على علمني.
        </p>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {courses.map(({ course, teacherName, teacherSlug }, index) => (
          <Reveal key={course.id} delay={index * 80} className="h-full">
            <Link href={`/teachers/${teacherSlug}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800">
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <Image
                  src={courseImage(course.img)}
                  alt={course.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 767px) calc(100vw - 2rem), 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-extrabold text-primary">{course.subject_name ?? teacherName}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-black text-ink">{course.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted">{course.description ?? `كورس مقدم من ${teacherName}`}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-bold text-muted dark:border-slate-700">
                  <span className="flex items-center gap-1.5"><BookOpen className="size-4 text-primary" />{course.lesson_count} درس</span>
                  {durationLabel(course.total_duration_minutes) && <span className="flex items-center gap-1.5"><Clock className="size-4 text-emerald-600" />{durationLabel(course.total_duration_minutes)}</span>}
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
