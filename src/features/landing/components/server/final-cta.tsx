"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import groupStudentsLight from "@/src/assets/images/student-redesign/final_cta_group_students.png";
import groupStudentsDark from "@/src/assets/images/student-redesign/final_cta_group_students_dark.png";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

export default function FinalCta() {
  return (
    <section className="bg-[#F8FAFC] dark:bg-slate-950 px-4 py-16 md:py-24 font-readex">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-sky-200/80 dark:border-slate-800 bg-linear-to-br from-sky-50/90 via-white to-purple-50/60 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 p-8 sm:p-12 md:p-14 shadow-xl">

          {/* Subtle Background Glows */}
          <div className="pointer-events-none absolute -inset-e-20 -bottom-20 size-80 rounded-full bg-sky-200/40 dark:bg-sky-900/20 blur-3xl" />
          <div className="pointer-events-none absolute -inset-s-16 -top-16 size-80 rounded-full bg-purple-200/30 dark:bg-purple-900/20 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-12 items-center relative z-10">

            {/* Left Column: CTA Text & Actions */}
            <div className="lg:col-span-7 text-start space-y-6">

              <h2 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl md:text-5xl leading-[1.3] tracking-tight">
                جهز نفسك للتفوق —{" "}
                <br className="hidden sm:inline" />
                <MarkerHighlight color="yellow" variant={1}>
                  ابدأ دلوقتي
                </MarkerHighlight>
              </h2>

              <p className="max-w-xl text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                انضم لأكثر من 50,000 طالب واستفيد من أقوى الكورسات التفاعلية مع{" "}
                <MarkerHighlight color="sky" variant={2}>
                  نخبة المدرسين
                </MarkerHighlight>
                .
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#hero"
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl bg-primary px-8 py-3.5 text-base font-black text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover active:scale-[0.98] cursor-pointer"
                >
                  <span>ابدأ تجربة المنصة مجاناً</span>
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </a>
              </div>

              {/* Marker-drawn highlights (No Badges, No Emojis, No Sparkles) */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-black text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <MarkerHighlight color="emerald" variant={3}>
                    بدون رسوم تسجيل
                  </MarkerHighlight>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <MarkerHighlight color="purple" variant={4}>
                    جدول مذاكرة منظم
                  </MarkerHighlight>
                </span>
              </div>
            </div>

            {/* Right Column: Student Doodle Artwork & Floating Sticky Paper Stickers */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              <div className="relative w-full max-w-105">

                {/* Floating Paper Sticker 1 */}
                <div className="absolute -top-4 -inset-s-2 z-20 rotate-[-4deg] rounded-xl bg-amber-100 dark:bg-amber-950/80 px-3.5 py-2 text-xs font-black text-amber-900 dark:text-amber-200 shadow-md border border-amber-200 dark:border-amber-800">
                  <MarkerHighlight color="yellow" variant={1}>
                    خطتك واضحة ✨
                  </MarkerHighlight>
                </div>

                {/* Floating Paper Sticker 2 */}
                <div className="absolute -bottom-2 -inset-e-2 z-20 rotate-3 rounded-xl bg-sky-100 dark:bg-sky-950/80 px-3.5 py-2 text-xs font-black text-sky-900 dark:text-sky-200 shadow-md border border-sky-200 dark:border-sky-800">
                  <MarkerHighlight color="sky" variant={2}>
                    متابعة حقيقية 100%
                  </MarkerHighlight>
                </div>

                {/* Light Mode Korean Students Group Doodle */}
                <Image
                  src={groupStudentsLight}
                  alt="رسم تخطيطي لمجموعة من الطلاب يذاكرون معاً على منصة علمني"
                  width={520}
                  height={420}
                  priority
                  className="w-full h-auto object-contain block dark:hidden opacity-95 pointer-events-none select-none"
                />

                {/* Dark Mode Korean Students Group Doodle */}
                <Image
                  src={groupStudentsDark}
                  alt="رسم تخطيطي لمجموعة من الطلاب يذاكرون معاً على منصة علمني (الوضع الداكن)"
                  width={520}
                  height={420}
                  priority
                  className="w-full h-auto object-contain hidden dark:block opacity-95 pointer-events-none select-none drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                />

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
