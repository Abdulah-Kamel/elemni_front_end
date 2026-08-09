"use client";

import { ArrowLeft, BookOpen, Play, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import heroStudents from "@/src/assets/images/student-redesign/hero-students.webp";

interface HeroProps {
  onOpenAuth: (mode: "signup" | "signin") => void;
  onOpenVideoTour: () => void;
  onExploreTeachers: () => void;
}

const heroStats = [
  { value: "+50 ألف", label: "طالب نشط", icon: Users },
  { value: "+120", label: "مدرس متخصص", icon: BookOpen },
  { value: "4.9/5", label: "تقييم الطلاب", icon: Sparkles },
];

export default function Hero({
  onOpenAuth,
  onOpenVideoTour,
  onExploreTeachers,
}: HeroProps) {
  return (
    <section
      id="hero"
      className="relative flex min-h-[92svh] items-end overflow-hidden bg-slate-950 pt-28 text-white"
    >
      <div className="absolute inset-0">
        <Image
          src={heroStudents}
          alt="طلاب يتعلمون معاً على منصة علمني"
          fill
          fetchPriority="high"
          loading="eager"
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-slate-950/68" />
      <div className="hero-grid absolute inset-0 opacity-25" aria-hidden />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 md:pb-10 lg:px-8">
        <div className="max-w-4xl text-start">
          <div className="hero-enter hero-enter-1 mb-5 inline-flex items-center gap-2 border-b border-white/35 pb-2 text-xs font-bold text-sky-100 sm:text-sm">
            <Sparkles className="size-4 text-amber-400" />
            <span>تعلم تفاعلي مع أفضل مدرسين الثانوية في مصر</span>
          </div>

          <h1 className="hero-enter hero-enter-2 max-w-3xl text-4xl font-black leading-[1.25] sm:text-5xl lg:text-7xl">
            مدرسك الصح.
            <span className="mt-1 block text-sky-300">خطتك أوضح. نتيجتك أقرب.</span>
          </h1>

          <p className="hero-enter hero-enter-3 mt-5 max-w-2xl text-base font-medium leading-8 text-slate-200 sm:text-lg">
            كورسات مباشرة ومسجلة، بنوك أسئلة، ومتابعة حقيقية تساعدك تذاكر بثقة من أول حصة لحد الامتحان.
          </p>

          <div className="hero-enter hero-enter-4 mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => onOpenAuth("signup")}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-950/25 transition-transform hover:-translate-y-0.5 hover:bg-accent-hover active:scale-[0.98]"
            >
              <span>ابدأ مجاناً</span>
              <ArrowLeft className="size-5" />
            </button>
            <button
              onClick={onOpenVideoTour}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-transform hover:-translate-y-0.5 hover:bg-white/20 active:scale-[0.98]"
            >
              <span className="grid size-7 place-items-center rounded-full bg-white text-primary">
                <Play className="size-3.5 fill-current" />
              </span>
              شاهد تجربة المنصة
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onExploreTeachers}
          className="hero-enter hero-enter-5 mt-9 grid w-full grid-cols-3 border-y border-white/20 bg-slate-950/25 py-4 text-start backdrop-blur-sm sm:max-w-2xl"
          aria-label="استكشف المدرسين"
        >
          {heroStats.map(({ value, label, icon: Icon }) => (
            <span key={label} className="flex items-center gap-2 px-3 first:ps-0">
              <Icon className="hidden size-5 text-sky-300 sm:block" />
              <span>
                <strong className="block text-sm font-black sm:text-base">{value}</strong>
                <span className="text-[11px] text-slate-300 sm:text-xs">{label}</span>
              </span>
            </span>
          ))}
        </button>
      </div>
    </section>
  );
}
