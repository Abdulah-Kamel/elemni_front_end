"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  Clock3,
  GraduationCap,
  LoaderCircle,
  MapPin,
  Share2,
  UserRound,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { m } from "motion/react";
import { portalCardLiftClass, portalContainerVariants, portalImageZoomClass, portalItemVariants, portalNestedContainerVariants, portalNestedItemVariants, scrollIntoViewById } from "./portal-motion";
import type {
  PublicCourseDto,
  PublicTeacherDetailDto,
  UserDto,
} from "@/src/lib/student-api/contract";
import lessonFallback from "@/src/assets/images/student-redesign/lesson-study-skills.webp";
import StudentPortalShell from "./student-portal-shell";

function formatDuration(minutes: number | null) {
  if (!minutes) return "المدة غير محددة";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} س ${remainder} د` : `${hours} ساعات`;
}

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value));
}

function TeacherCourseCard({
  course,
  enrolled,
  processing,
  onCheckout,
}: {
  course: PublicCourseDto;
  enrolled: boolean;
  processing: boolean;
  onCheckout: (courseId: number) => void;
}) {
  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white p-4 ${portalCardLiftClass} hover:border-[#BAE6FD] hover:shadow-[0_4px_12px_rgba(2,132,199,0.04)]`}>
      <div className="relative h-40 overflow-hidden rounded-xl bg-[#F0F9FF]">
        <Image
          src={course.img || lessonFallback}
          alt={course.title}
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          className={`object-cover ${portalImageZoomClass}`}
        />
        {enrolled && (
          <span className="absolute end-2 top-2 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[11px] font-black text-emerald-700 backdrop-blur">
            ضمن دوراتك
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <span className="w-fit rounded-lg bg-[#0284C7]/5 px-2.5 py-1 text-xs font-bold text-[#0369A1]">
          {course.subject_name || "كورس تعليمي"}
        </span>
        <h3 className="mt-3 line-clamp-2 min-h-14 text-lg font-black leading-7">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#777587]">
          {course.description || `محتوى تعليمي يتضمن ${course.lesson_count} درس.`}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-[#E2E0EF] pt-4 text-xs font-bold text-[#777587]">
          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4 text-[#0284C7]" />{course.lesson_count} درس</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-[#0284C7]" />{formatDuration(course.total_duration_minutes)}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span>
            <strong className="block text-xl font-black">{formatPrice(course.price)}</strong>
            <span className="text-[11px] font-bold text-[#777587]">ج.م</span>
          </span>
          {enrolled ? (
            <Link href={`/courses/${course.id}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white transition-colors hover:bg-emerald-700">
              فتح الكورس<ArrowLeft className="size-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onCheckout(course.id)}
              disabled={processing}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#0284C7] px-4 text-xs font-black text-white transition-colors hover:bg-[#0369A1] disabled:cursor-wait disabled:opacity-70"
            >
              {processing ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowLeft className="size-4" />}
              {processing ? "جارٍ التحويل" : "اشترك الآن"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function PortalTeacherProfile({
  teacher,
  courses,
  coursesLoadError,
}: {
  teacher: PublicTeacherDetailDto;
  courses: PublicCourseDto[];
  coursesLoadError: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [processingCourseId, setProcessingCourseId] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(() => new Set(
    courses.filter((course) => course.is_subscribed).map((course) => course.id),
  ));

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/student/auth/me", { cache: "no-store" }).catch(() => null);
      if (response?.status === 401) {
        router.replace("/login");
        return;
      }
      if (response?.ok) setUser(await response.json());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  const shareProfile = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const startCheckout = async (courseId: number) => {
    setProcessingCourseId(courseId);
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
      setEnrolledCourseIds((current) => new Set(current).add(courseId));
      setProcessingCourseId(null);
      return;
    }
    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setCheckoutError(typeof body?.detail === "string" ? body.detail : "تعذر بدء عملية الدفع حالياً.");
      setProcessingCourseId(null);
      return;
    }

    const body = await response.json() as { redirect_url: string };
    window.location.assign(body.redirect_url);
  };

  const subjects = teacher.subjects.map((subject) => subject.name);
  const totalLessons = courses.reduce((sum, course) => sum + course.lesson_count, 0);
  const teacherStats = [
    { value: teacher.course_count, label: "كورس منشور", icon: BookOpen },
    { value: totalLessons, label: "درس متاح", icon: GraduationCap },
    ...(teacher.experience !== null
      ? [{ value: teacher.experience, label: "سنوات خبرة", icon: UserRound }]
      : []),
    { value: teacher.grades.length, label: "مراحل دراسية", icon: GraduationCap },
  ];

  return (
    <StudentPortalShell user={user} active="discover">
      <m.div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8" initial="hidden" animate="show" variants={portalContainerVariants}>
        <m.div className="mb-5 flex items-center justify-between gap-3" variants={portalItemVariants}>
          <Link href="/explore" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E2E0EF] bg-white px-4 text-xs font-black text-[#464555] transition hover:border-[#BAE6FD] hover:text-[#0369A1]">
            <ArrowRight className="size-4" />العودة للاستكشاف
          </Link>
          <button type="button" onClick={() => void shareProfile()} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#E2E0EF] bg-white px-4 text-xs font-black text-[#0369A1] transition hover:bg-[#E0F2FE]">
            {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}{copied ? "تم النسخ" : "مشاركة"}
          </button>
        </m.div>

        <m.section className="flex flex-col items-center gap-6 rounded-2xl border border-[#E2E0EF] bg-white p-5 text-center sm:p-7 md:flex-row md:items-center md:text-start" variants={portalItemVariants}>
          <m.div className="relative size-32 shrink-0 overflow-hidden rounded-2xl border border-[#E2E0EF] bg-[#F0F9FF] sm:size-40" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            {teacher.img ? (
              <Image src={teacher.img} alt={teacher.name} fill priority sizes="160px" className="object-cover object-center" />
            ) : (
              <span className="flex size-full flex-col items-center justify-center bg-[#F0F9FF] text-[#0369A1]">
                <UserRound className="size-10" />
                <strong className="mt-2 text-xl font-black">{teacher.name.slice(0, 1)}</strong>
              </span>
            )}
          </m.div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {(subjects.length ? subjects : ["مدرس على منصة علمني"]).map((subject) => (
                <span key={subject} className="rounded-full bg-[#0284C7]/5 px-3 py-1 text-xs font-black text-[#0369A1]">{subject}</span>
              ))}
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{teacher.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#464555] sm:text-base">
              {teacher.description || "لم يضف المدرس نبذة تعريفية حتى الآن."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-[#777587] md:justify-start">
              {teacher.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-[#0284C7]" />{teacher.location}</span>}
              {!!teacher.experience && <span className="inline-flex items-center gap-1.5"><UserRound className="size-4 text-[#0284C7]" />{teacher.experience} سنوات خبرة</span>}
              {!!teacher.grades.length && <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4 text-[#0284C7]" />{teacher.grades.map((grade) => grade.name).join("، ")}</span>}
            </div>
          </div>
          {!!courses.length && (
            <button type="button" onClick={() => scrollIntoViewById("teacher-courses")} className="inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-6 text-sm font-black text-white transition hover:bg-[#0369A1] md:w-auto">
              ابدأ التعلم<ArrowLeft className="size-4" />
            </button>
          )}
        </m.section>

        <m.section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="معلومات المدرس" variants={portalContainerVariants}>
          {teacherStats.map(({ value, label, icon: Icon }) => (
            <m.div key={label} variants={portalNestedItemVariants} className={`flex min-h-28 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white p-4 text-center ${teacherStats.length % 2 ? "last:col-span-2 lg:last:col-span-1" : ""}`}>
              <Icon className="mb-2 size-5 text-[#0284C7]" />
              <strong className="text-2xl font-black">{value}</strong>
              <span className="mt-1 text-xs font-bold text-[#777587]">{label}</span>
            </m.div>
          ))}
        </m.section>

        <m.section id="teacher-courses" className="scroll-mt-24 pt-10" aria-labelledby="teacher-courses-heading" variants={portalItemVariants}>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 id="teacher-courses-heading" className="text-2xl font-black">كورسات المدرس</h2>
              <p className="mt-1 text-xs text-[#777587]">الكورسات المنشورة والمتاحة للاشتراك حالياً.</p>
            </div>
            <span className="text-xs font-bold text-[#777587]">{courses.length} كورس</span>
          </div>

          {(coursesLoadError || checkoutError) && (
            <div role="alert" className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              <CircleAlert className="size-5 shrink-0" />{checkoutError || "تعذر تحميل بعض كورسات المدرس حالياً."}
            </div>
          )}

          {courses.length ? (
            <m.div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" variants={portalNestedContainerVariants}>
              {courses.map((course) => (
                <m.div key={course.id} className="h-full" variants={portalNestedItemVariants}>
                  <TeacherCourseCard
                    course={course}
                    enrolled={enrolledCourseIds.has(course.id)}
                    processing={processingCourseId === course.id}
                    onCheckout={(courseId) => void startCheckout(courseId)}
                  />
                </m.div>
              ))}
            </m.div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-[#E2E0EF] bg-white px-4 text-center">
              <BookOpen className="mb-4 size-9 text-[#C7C4D8]" />
              <h3 className="text-lg font-black">لا توجد كورسات منشورة</h3>
              <p className="mt-2 text-sm text-[#777587]">ستظهر كورسات المدرس هنا بمجرد نشرها.</p>
            </div>
          )}
        </m.section>
      </m.div>
    </StudentPortalShell>
  );
}
