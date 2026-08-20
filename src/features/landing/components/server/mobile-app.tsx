"use client";

import { m } from "motion/react";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

export default function MobileApp() {
  return (
    <section
      id="mobile"
      className="py-20 lg:py-28 bg-linear-to-br from-[#F5F3FF] via-[#FAF8FF] to-[#EFF6FF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden relative font-cairo border-y border-violet-tint/40"
    >
      {/* Background Soft Atmospheric Glows (like screenshot) */}
      <div className="absolute top-0 inset-s-1/4 w-125 h-125 bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 inset-e-1/4 w-112.5 h-112.5 bg-sky-300/20 dark:bg-sky-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 items-center">

          {/* Left Column: Text Content & App Store Badges */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-6 space-y-6 text-start"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.35]">
              حمّل{" "}
              <MarkerHighlight color="emerald" variant={2}>
                تطبيق علمني
              </MarkerHighlight>
              <br />
              وذاكر من أي مكان
            </h2>

            <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-medium">
              تطبيق الطالب الذكي يضع المنصة بالكامل في جيبك. احضر البث المباشر، تابع المواعيد، وحل الامتحانات التفاعلية في أي وقت ومن أي مكان.
            </p>

            {/* Feature Highlights List with Marker Highlighters */}
            <div className="space-y-3 pt-2">
              {[
                { text: "بث مباشر تفاعلي عالي الجودة وبدون تقطيع", color: "sky" as const },
                { text: "تنبيهات فورية بمواعيد الحصص والامتحانات القادمة", color: "purple" as const },
                { text: "حل بنوك الأسئلة مع تصحيح فوري وشرح بالفيديو", color: "pink" as const },
                { text: "متابعة نسبة إنجازك والدرجات أولاً بأول", color: "yellow" as const },
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

            {/* App Store / Google Play Download Buttons */}
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <button className="group relative inline-flex items-center gap-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl shadow-xl shadow-slate-900/15 transition-all hover:-translate-y-1 active:scale-95 cursor-pointer">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.61-1.603V3.417c0-.62.228-1.18.609-1.603zm11.6 11.6l2.35 2.35-12.012 6.945 9.662-9.295zm0-2.828L5.547 1.291l12.012 6.945-2.35 2.35zm1.414 1.414l3.196 1.846c.866.501.866 1.314 0 1.815l-3.196 1.846-2.02-2.02 2.02-2.02z" />
                </svg>
                <div className="text-start leading-tight">
                  <div className="text-[10px] uppercase tracking-wider opacity-70 font-medium">متاح على</div>
                  <div className="text-sm font-black">Google Play</div>
                </div>
              </button>

              <button className="group relative inline-flex items-center gap-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-2xl shadow-xl shadow-slate-900/15 transition-all hover:-translate-y-1 active:scale-95 cursor-pointer">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.81 1.44-.6.69-1.13 1.83-0.99 2.93 1.07.08 2.16-.53 2.81-1.33z" />
                </svg>
                <div className="text-start leading-tight">
                  <div className="text-[10px] uppercase tracking-wider opacity-70 font-medium">متاح على</div>
                  <div className="text-sm font-black">App Store</div>
                </div>
              </button>
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
                className="absolute -top-6 -right-6 z-30 transform rotate-[8deg]"
              >
                <div className="bg-amber-100 text-amber-950 px-3.5 py-2 rounded-2xl border border-amber-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="yellow" variant={1}>
                    100/100 متفوق
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 2: Top-Left Grade Level Note */}
              <m.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute top-12 -left-8 z-30 transform -rotate-12"
              >
                <div className="bg-purple-100 text-purple-950 px-3.5 py-2 rounded-2xl border border-purple-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="purple" variant={2}>
                    ثانوية عامة
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 3: Mid-Right Streak Note */}
              <m.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="absolute top-1/2 -right-10 z-30 transform rotate-6"
              >
                <div className="bg-rose-100 text-rose-950 px-3.5 py-2 rounded-2xl border border-rose-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="pink" variant={3}>
                    12 يوم حماسي
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 4: Bottom-Left Star Note */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-4 -left-6 z-30 transform -rotate-6"
              >
                <div className="bg-emerald-100 text-emerald-950 px-3.5 py-2 rounded-2xl border border-emerald-300 shadow-md font-black text-xs select-none">
                  <MarkerHighlight color="emerald" variant={4}>
                    الأول على الدفعة
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* Note 5: Bottom-Right Callout Tag */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="absolute -bottom-6 -right-4 z-30 transform rotate-10"
              >
                <div className="bg-sky-100 text-sky-950 px-3 py-1.5 rounded-xl border border-sky-300 shadow-sm font-black text-[11px] select-none">
                  <MarkerHighlight color="sky" variant={1}>
                    تطبيق الطالب
                  </MarkerHighlight>
                </div>
              </m.div>

              {/* --- REALISTIC SMARTPHONE BODY FRAME --- */}
              <div className="relative rounded-[3rem] border-10 border-slate-900 dark:border-slate-800 bg-slate-950 p-3 shadow-[0_25px_60px_-15px_rgba(123,44,191,0.25)] ring-1 ring-slate-800">

                {/* Speaker & Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-40 flex items-center justify-between px-3">
                  <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60" />
                </div>

                {/* Smartphone Display Screen Container */}
                <div className="w-full rounded-[2.3rem] bg-slate-50 dark:bg-slate-900 overflow-hidden font-cairo border border-slate-200/50 dark:border-slate-800 pt-7 pb-3 px-3.5 space-y-3">

                  {/* Student App Top Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary to-sky-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        أ
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">أهلاً أحمد</div>
                        <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400">الصف الثالث الثانوي</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      نشط
                    </div>
                  </div>

                  {/* Active Live Class Card */}
                  <div className="bg-linear-to-r from-primary to-sky-600 rounded-2xl p-3 text-white shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        مباشر الآن
                      </span>
                      <span className="text-[9px] text-sky-100 font-bold">مادة الفيزياء</span>
                    </div>
                    <div className="text-xs font-black leading-tight">
                      <MarkerHighlight color="yellow" variant={1}>
                        شرح القوانين الكهربية
                      </MarkerHighlight>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[9px] text-sky-100 font-bold">د. محمد عبدالمعبود</div>
                      <div className="text-[9px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
                        مشاهدة
                      </div>
                    </div>
                  </div>

                  {/* Course Progress Widget */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-slate-200">
                      <span>كورس الرياضيات التطبيقية</span>
                      <span className="text-primary">78%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                    </div>
                  </div>

                  {/* Upcoming Quiz Reminder Widget */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-2.5 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                    <div className="leading-tight">
                      <div className="text-[10px] font-black text-amber-950 dark:text-amber-200">امتحان الكيمياء الشامل</div>
                      <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400">غداً الساعة 06:00 مساءً</div>
                    </div>
                    <div className="text-[9px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      تذكير
                    </div>
                  </div>

                  {/* App Bottom Navigation Bar */}
                  <div className="pt-1 flex items-center justify-around text-slate-500 border-t border-slate-200/60 dark:border-slate-800 text-[9px] font-black">
                    <span className="text-primary font-black">الرئيسية</span>
                    <span>الحصص</span>
                    <span>الامتحانات</span>
                    <span>حسابي</span>
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
