import { Wallet, MonitorPlay, FileCheck, LayoutGrid, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { cn } from "@/src/lib/cn";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";

const cards: {
  key: string;
  span: string;
  bg: string;
  icon: LucideIcon;
  tileBg: string;
}[] = [
    {
      key: "card1",
      span: "md:col-span-1",
      bg: "bg-white",
      icon: Wallet,
      tileBg: "bg-primary",
    },
    {
      key: "card2",
      span: "md:col-span-2",
      bg: "bg-white",
      icon: MonitorPlay,
      tileBg: "bg-primary",
    },
    {
      key: "card3",
      span: "md:col-span-2",
      bg: "bg-white",
      icon: FileCheck,
      tileBg: "bg-primary",
    },
    {
      key: "card4",
      span: "md:col-span-1",
      bg: "bg-white",
      icon: LayoutGrid,
      tileBg: "bg-primary",
    },
  ];

const content = {
  card1: { title: "ادفع بالطريقة اللي تناسبك", items: ["فوري — كاش — تحويل بنكي", "بطاقة ائتمان — ميزة", "محافظ الموبايل 24/7"] },
  card2: { title: "حصص مباشرة تفاعلية", desc: "بث 1080p مباشر مع معلمك. ارفع يدك، اسأل بالصوت، شاهد الإعادة في أي وقت." },
  card3: { title: "بنك أسئلة ذكي", desc: "آلاف الأسئلة لكل مادة مع تصحيح فوري وشرح بالفيديو لكل إجابة." },
  card4: { title: "تابع تقدمك", items: ["تقارير أسبوعية", "نسبة الحضور", "نتائج الاختبارات"] },
};

export default function BentoGrid() {
  return (
    <Section id="why" className="bg-sky-50">
      <Reveal>
        <h2 className="mb-3 text-center text-3xl font-black text-[#0F172A] md:text-4xl font-readex">
          ليه{" "}
          <MarkerHighlight color="yellow" variant={1}>
            علمني؟
          </MarkerHighlight>
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-[#334155]">
          منصة متكاملة بتوفرلك كل اللي تحتاجه{" "}
          <MarkerHighlight color="sky" variant={2}>
            للتفوق
          </MarkerHighlight>
          .
        </p>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map(({ key, span, bg, icon: Icon, tileBg }, i) => (
          <Reveal key={key} delay={i * 60} className={span}>
            <div
              className={cn("group h-full rounded-2xl border border-sky-100 p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg", bg)}
            >
              <div
                className={cn(
                  "mb-4 inline-flex rounded-2xl p-3 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110",
                  tileBg,
                  "text-white",
                )}
              >
                <Icon size={24} />
              </div>
              {"desc" in content[key as keyof typeof content] &&
                "items" in content[key as keyof typeof content] === false ? (
                <>
                  <h3 className="mb-1 text-lg font-bold text-[#0F172A] font-readex">
                    {
                      (
                        content[key as keyof typeof content] as {
                          title: string;
                          desc: string;
                        }
                      ).title
                    }
                  </h3>
                  <p className="text-sm text-[#334155]">
                    {
                      (
                        content[key as keyof typeof content] as {
                          title: string;
                          desc: string;
                        }
                      ).desc
                    }
                  </p>
                </>
              ) : (
                <>
                  <h3 className="mb-3 text-lg font-bold text-[#0F172A] font-readex">
                    {
                      (
                        content[key as keyof typeof content] as {
                          title: string;
                          items: string[];
                        }
                      ).title
                    }
                  </h3>
                  <ul className="space-y-2">
                    {(
                      content[key as keyof typeof content] as {
                        title: string;
                        items: string[];
                      }
                    ).items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-[#334155]"
                      >
                        <Check className="size-4 text-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
