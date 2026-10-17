"use client";

import { m } from "motion/react";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import "@/src/features/portal/styles/sticker.css";

/** Landing section for the student Android app. Renders nothing until a download link is configured. */
export default function MobileApp({ downloadUrl }: { downloadUrl: string | null }) {
  const t = useTranslations("landingMobileApp");
  if (!downloadUrl) return null;
  return (
    <section
      id="mobile"
      className="py-20 lg:py-28 bg-linear-to-br from-[#F5F3FF] via-[#FAF8FF] to-[#EFF6FF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden relative font-readex border-y border-violet-tint/40"
    >
      {/* Background Soft Atmospheric Glows (like screenshot) */}
      <div className="absolute top-0 inset-s-1/4 w-125 h-125 bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 inset-e-1/4 w-112.5 h-112.5 bg-sky-300/20 dark:bg-sky-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 items-center">

          {/* Left Column: Text Content & Android Download */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-6 space-y-6 text-start"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.35]">
              {t("titleLead")} {" "}
              <MarkerHighlight color="emerald" variant={2}>
                {t("titleHighlight")}
              </MarkerHighlight>
              <br />
              {t("titleTail")}
            </h2>

            <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-medium">
              {t("description")}
            </p>

            {/* Feature Highlights List with Marker Highlighters */}
            <div className="space-y-3 pt-2">
              {[
                { text: t("benefitLessons"), color: "sky" as const },
                { text: t("benefitFiles"), color: "purple" as const },
                { text: t("benefitProgress"), color: "yellow" as const },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    <MarkerHighlight color={item.color} variant={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                      {item.text}
                    </MarkerHighlight>
                  </span>
                </div>
              ))}
            </div>

            {/* Android download (no store listing yet: the APK is served directly) */}
            <div className="space-y-3 pt-4">
              <a
                href={downloadUrl}
                download
                className="sticker-btn inline-flex min-h-14 items-center gap-3 px-7 text-base font-extrabold"
              >
                <svg className="size-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52M7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5m10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5" />
                </svg>
                {t("downloadAndroid")}
                <Download className="size-5" aria-hidden="true" />
              </a>
              <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("androidNote")}</p>
            </div>
          </m.div>

          {/* Right Column: Phone Sliding in Smoothly from the Side Edge */}
          <div className="lg:col-span-6 relative flex justify-end items-center pt-6 lg:pt-0">

            {/* Smooth Side-Sliding Phone Mockup Container */}
            <m.div
              initial={{ x: 140, opacity: 0, rotate: 3 }}
              whileInView={{ x: 0, opacity: 1, rotate: -2 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1], // Smooth cubic-bezier spring feel
              }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              className="relative w-full max-w-85 sm:max-w-90 mx-auto lg:me-0"
            >

              {/* STICKY PAPER NOTES FLOATING AROUND THE PHONE */}

              {/* Note 1: Top-Right Grade Note */}
              <m.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -top-6 -end-6 z-30 transform rotate-[8deg]"
              >
                <div className="bg-amber-100 text-amber-950 px-3.5 py-2 rounded-2xl border border-amber-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="yellow" variant={1}>
                    {t("scoreSticker")}
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 2: Top-Left Grade Level Note */}
              <m.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute top-12 -start-8 z-30 transform -rotate-12"
              >
                <div className="bg-purple-100 text-purple-950 px-3.5 py-2 rounded-2xl border border-purple-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="purple" variant={2}>
                    {t("gradeSticker")}
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 3: Mid-Right Streak Note */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="absolute top-1/2 -end-10 z-30 transform rotate-6"
              >
                <div className="bg-rose-100 text-rose-950 px-3.5 py-2 rounded-2xl border border-rose-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="pink" variant={3}>
                    {t("streakSticker")}
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 4: Bottom-Left Star Note */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-4 -start-6 z-30 transform -rotate-6"
              >
                <div className="bg-emerald-100 text-emerald-950 px-3.5 py-2 rounded-2xl border border-emerald-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="emerald" variant={4}>
                    {t("rankSticker")}
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 5: Bottom-Right Callout Tag */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="absolute -bottom-6 -end-4 z-30 transform rotate-10"
              >
                <div className="bg-sky-100 text-sky-950 px-3 py-1.5 rounded-xl border border-sky-300 shadow-sm font-black text-[11px] select-none">
                  <MarkerHighlight color="sky" variant={1}>
                    {t("appSticker")}
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* --- REALISTIC SMARTPHONE BODY FRAME --- */}
              <div className="relative rounded-[3rem] border-10 border-slate-900 dark:border-slate-800 bg-slate-950 p-3 shadow-[0_25px_60px_-15px_rgba(123,44,191,0.25)] ring-1 ring-slate-800">

                {/* Speaker & Notch */}
                <div className="absolute top-4 start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-40 flex items-center justify-between px-3">
                  <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60" />
                </div>

                {/* Smartphone Display Screen Container */}
                <div className="w-full rounded-[2.3rem] bg-slate-50 dark:bg-slate-900 overflow-hidden font-readex border border-slate-200/50 dark:border-slate-800 pt-7 pb-3 px-3.5 space-y-3">

                  {/* Student App Top Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary to-sky-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {t("avatarInitial")}
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">{t("welcome")}</div>
                        <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{t("grade")}</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {t("active")}
                    </div>
                  </div>

                  {/* Active Live Class Card */}
                  <div className="bg-linear-to-r from-primary to-sky-600 rounded-2xl p-3 text-white shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {t("recordedLesson")}
                      </span>
                      <span className="text-[9px] text-sky-100 font-bold">{t("physics")}</span>
                    </div>
                    <div className="text-xs font-black leading-tight">
                      <MarkerHighlight color="yellow" variant={1}>
                        {t("lessonTitle")}
                      </MarkerHighlight>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[9px] text-sky-100 font-bold">{t("teacherName")}</div>
                      <div className="text-[9px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
                        {t("watch")}
                      </div>
                    </div>
                  </div>

                  {/* Course Progress Widget */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-slate-200">
                      <span>{t("courseTitle")}</span>
                      <span className="text-primary">78%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                    </div>
                  </div>

                  {/* Upcoming Quiz Reminder Widget */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-2.5 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                    <div className="leading-tight">
                      <div className="text-[10px] font-black text-amber-950 dark:text-amber-200">{t("examTitle")}</div>
                      <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400">{t("examTime")}</div>
                    </div>
                    <div className="text-[9px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      {t("reminder")}
                    </div>
                  </div>

                  {/* App Bottom Navigation Bar */}
                  <div className="pt-1 flex items-center justify-around text-slate-500 border-t border-slate-200/60 dark:border-slate-800 text-[9px] font-black">
                    <span className="text-primary font-black">{t("home")}</span>
                    <span>{t("lessons")}</span>
                    <span>{t("exams")}</span>
                    <span>{t("account")}</span>
                  </div>

                </div>
              </div>

            </m.div>
          </div>

        </div>
      </div>
    </section>
  );
}
