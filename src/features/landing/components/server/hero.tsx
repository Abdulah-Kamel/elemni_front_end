"use client";

import { ArrowLeft, Play } from "lucide-react";
import Image from "next/image";
import heroStudentLight from "@/src/assets/images/student-redesign/hero_student_processed.png";
import heroStudentDark from "@/src/assets/images/student-redesign/hero_student_dark.png";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

interface HeroProps {
  onOpenAuth: (mode: "signup" | "signin") => void;
  onOpenVideoTour: () => void;
  onExploreTeachers: () => void;
}

export default function Hero({
  onOpenAuth,
  onOpenVideoTour,
  onExploreTeachers,
}: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-[88svh] flex items-center overflow-hidden bg-linear-to-b from-[#F4F8FF] via-[#FAF8FF] to-[#F1F5F9] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-28 pb-16 text-slate-900 dark:text-white font-cairo"
    >
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 inset-s-1/3 w-96 h-96 bg-sky-200/30 dark:bg-sky-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 inset-e-1/4 w-80 h-80 bg-purple-200/25 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">

          {/* Left Column: Hero Copy & CTAs */}
          <div className="lg:col-span-7 text-start space-y-6">

            {/* Title with Marker Highlights (No Badges, No Sparkles) */}
            <h1 className="hero-enter hero-enter-1 text-4xl font-black leading-[1.3] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl tracking-tight">
              مدرسك الصح.
              <br />
              <MarkerHighlight color="yellow" variant={1}>
                خطتك أوضح.
              </MarkerHighlight>{" "}
              <MarkerHighlight color="sky" variant={2}>
                نتيجتك أقرب.
              </MarkerHighlight>
            </h1>

            {/* Subtitle Paragraph with Marker Highlight */}
            <p className="hero-enter hero-enter-2 max-w-2xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              كورسات مباشرة ومسجلة، بنوك أسئلة، و{" "}
              <MarkerHighlight color="pink" variant={3}>
                متابعة حقيقية
              </MarkerHighlight>{" "}
              تساعدك تذاكر بثقة من أول حصة لحد الامتحان.
            </p>

            {/* Action CTAs */}
            <div className="hero-enter hero-enter-3 pt-2 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => onOpenAuth("signup")}
                className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover active:scale-[0.98] cursor-pointer"
              >
                <span>ابدأ مجاناً</span>
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                onClick={onOpenVideoTour}
                className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-6 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800 active:scale-[0.98] cursor-pointer"
              >
                <span className="grid size-6 place-items-center rounded-full bg-primary text-white">
                  <Play className="size-3 fill-current ms-0.5" />
                </span>
                <span>شاهد تجربة المنصة</span>
              </button>
            </div>

            {/* Value Highlights List with Pure Text & Marker Highlighters (No Badges) */}
            <div className="hero-enter hero-enter-4 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-black text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <MarkerHighlight color="emerald" variant={4}>
                  كورسات تفاعلية مباشرة
                </MarkerHighlight>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                <MarkerHighlight color="sky" variant={1}>
                  مدرسون متخصصون
                </MarkerHighlight>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <MarkerHighlight color="purple" variant={2}>
                  اختبارات دورية وتصحيح فوري
                </MarkerHighlight>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Student Artwork (Light and Dark Mode Versions) */}
          <div className="lg:col-span-5 flex items-center justify-center relative hero-enter hero-enter-5">
            <div className="relative w-full max-w-130">
              {/* Light Mode Artwork */}
              <Image
                src={heroStudentLight}
                alt="رسم تخطيطي لطالبة ثانوية تذاكر في غرفتها على منصة علمني"
                width={560}
                height={560}
                priority
                className="w-full h-auto object-contain block dark:hidden opacity-95 pointer-events-none select-none"
              />
              {/* Dark Mode Artwork */}
              <Image
                src={heroStudentDark}
                alt="رسم تخطيطي لطالبة ثانوية تذاكر في غرفتها على منصة علمني (الوضع الداكن)"
                width={560}
                height={560}
                priority
                className="w-full h-auto object-contain hidden dark:block opacity-95 pointer-events-none select-none drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
