import { CircleCheck, CircleX } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { cn } from "@/src/lib/cn";

const matrix = {
  price: { elemni: true, youtube: "partial", tutor: false, books: false },
  quality: { elemni: true, youtube: "partial", tutor: true, books: false },
  organize: { elemni: true, youtube: false, tutor: false, books: true },
  mobile: { elemni: true, youtube: true, tutor: false, books: false },
  repeat: { elemni: true, youtube: true, tutor: false, books: false },
  tracking: { elemni: true, youtube: false, tutor: false, books: false },
};

const rowLabels: Record<string, string> = {
  price: "السعر مناسب",
  quality: "جودة المحتوى",
  organize: "تنظيم المذاكرة",
  mobile: "مشاهدة على الموبايل",
  repeat: "إعادة المشاهدة",
  tracking: "متابعة ولي الأمر",
};

const cols = [
  { key: "elemni" as const, label: "علمني", className: "bg-primary font-bold text-white" },
  { key: "youtube" as const, label: "يوتيوب", className: "bg-slate-100" },
  { key: "tutor" as const, label: "دروس خصوصية", className: "bg-slate-100" },
  { key: "books" as const, label: "كتب خارجية", className: "bg-slate-100" },
];

export default function Comparison() {
  return (
    <Section id="comparison" className="bg-white">
      <Reveal>
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl font-cairo">ليه علمني أحسن اختيار؟</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-[#334155]">قارن بنفسك الفرق بين علمني وطرق المذاكرة التقليدية.</p>
      </Reveal>
      <div className="overflow-x-auto rounded-2xl border border-sky-100">
        <table className="w-full text-right text-sm">
          <thead>
            <tr>
              <th className="p-4 font-bold text-[#0F172A] border-l border-sky-100">الميزة</th>
              {cols.map((col) => (
                <th key={col.key} className={cn("p-4 text-center", col.className)}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(matrix).map(([rowKey, row]) => (
              <tr key={rowKey} className="border-t border-sky-100">
                <td className="p-4 font-semibold text-[#0F172A] border-l border-sky-100">{rowLabels[rowKey]}</td>
                {cols.map((col) => (
                  <td key={col.key} className="p-4 text-center">
                    {row[col.key] === true ? (
                      <CircleCheck className="inline size-5 text-emerald-500" />
                    ) : row[col.key] === "partial" ? (
                      <span className="text-xs text-amber-600 font-bold">جزئي</span>
                    ) : (
                      <CircleX className="inline size-5 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
