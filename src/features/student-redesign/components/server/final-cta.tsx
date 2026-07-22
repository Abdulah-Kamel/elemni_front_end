import { Mail } from "lucide-react";

export default function FinalCta() {
  return (
    <section className="bg-[#F8FAFC] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0284C7] to-[#0F172A] px-8 py-14 text-center">
          <div className="pointer-events-none absolute -end-20 -bottom-20 size-72 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -start-16 -top-16 size-72 rounded-full border border-white/15" />

          <h2 className="relative text-3xl font-black text-white md:text-4xl font-cairo">جهز نفسك للتفوق — ابدأ دلوقتي</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/75">
            انضم لأكثر من 50,000 طالب واستفيد من أقوى الكورسات التفاعلية مع نخبة المدرسين.
          </p>

          <div className="relative mt-8">
            <a href="#hero" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition-all cursor-pointer">
              <Mail aria-hidden className="size-4" />
              ابدأ مجاناً
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
