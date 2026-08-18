"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "../../data/mock-data";
import { ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Reveal } from "@/src/components/ui/reveal";
import { AnimatePresence, m } from "motion/react";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("faq1");

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-cairo">
              <MarkerHighlight color="yellow" variant={1}>
                الأسئلة الشائعة
              </MarkerHighlight>
            </h2>
            <p className="text-sm sm:text-base text-[#334155]">
              كل ما تحتاج معرفته عن التسجيل، الحصص المباشرة، وطرق الاشتراك على منصة علمني.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isOpen ? "border-primary bg-[#F8FAFC] shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                )}>
                  <button
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`${item.id}-answer`}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-start text-base font-bold text-[#0F172A] focus:outline-none"
                  >
                    <span className="flex-1 font-cairo">{item.question}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 transition-transform duration-300",
                      isOpen ? "rotate-180 bg-primary text-white" : ""
                    )}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        id={`${item.id}-answer`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.3 }, opacity: { duration: 0.2 } }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-start text-sm leading-relaxed text-[#334155]">
                          <p>{item.answer}</p>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-light p-6 text-start sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">هل لديك سؤال آخر؟</h4>
                <p className="text-xs text-[#334155]">فريق الدعم الفني متواجد لمساعدتك طوال اليوم عبر الواتساب.</p>
              </div>
            </div>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all shadow-md shrink-0"
            >
              تحدث مع الدعم الفني
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
