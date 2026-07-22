import { Atom, Sigma, FlaskRound, Dna } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

const subjects = [
  { id: "physics", name: "فيزياء", icon: Atom, count: "12 كورس" },
  { id: "math", name: "رياضيات", icon: Sigma, count: "8 كورسات" },
  { id: "chemistry", name: "كيمياء", icon: FlaskRound, count: "6 كورسات" },
  { id: "biology", name: "أحياء", icon: Dna, count: "5 كورسات" },
];

export default function SubjectGrid() {
  return (
    <Section id="subjects" className="bg-[#F8FAFC]">
      <Reveal>
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-bold text-primary">المواد الدراسية</span>
        </div>
        <h2 className="mb-3 text-center text-3xl font-black text-[#0F172A] md:text-4xl font-cairo">تصفح المواد المتاحة</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-[#334155]">اختر المادة التي تريدها وابدأ رحلة التعلم مع أمهر المدرسين.</p>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-4">
        {subjects.map(({ id, name, icon: Icon, count }, i) => (
          <Reveal key={id} delay={i * 80} className="h-full">
            <div className="flex h-full flex-col items-center rounded-2xl border border-sky-100 bg-white p-6 text-center hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer">
              <div className="mb-3 grid size-16 place-items-center rounded-2xl bg-primary-light">
                <Icon className="size-8 text-primary" />
              </div>
              <p className="font-black text-[#0F172A] font-cairo">{name}</p>
              <p className="mt-1 text-xs text-[#334155]">{count}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
