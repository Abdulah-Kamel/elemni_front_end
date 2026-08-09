import { Atom, Sigma, FlaskRound, Dna, BookOpen } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import type { SubjectDto } from "@/src/lib/student-api/contract";

const icons = [Atom, Sigma, FlaskRound, Dna, BookOpen];

export default function SubjectGrid({ subjects }: { subjects: SubjectDto[] }) {
  if (!subjects.length) return null;

  return (
    <Section id="subjects" className="bg-white dark:bg-[#0B132B]">
      <Reveal>
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-primary-light px-4 py-1.5 text-xs font-bold text-primary">المواد الدراسية</span>
        </div>
        <h2 className="mb-3 text-center text-3xl font-black text-[#0F172A] md:text-4xl font-cairo">تصفح المواد المتاحة</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-[#334155]">اختر المادة التي تريدها وابدأ رحلة التعلم مع أمهر المدرسين.</p>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.slice(0, 8).map((subject, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Reveal key={subject.id} delay={index * 60} className="h-full">
              <Link
                href="/browse-teachers"
                className="group flex h-full w-full flex-col items-center rounded-lg border border-sky-100 bg-white p-6 text-center transition-transform transition-shadow duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-3 grid size-16 place-items-center rounded-lg bg-primary-light transition-transform duration-300 group-hover:scale-105">
                  <Icon className="size-8 text-primary" />
                </div>
                <p className="font-black text-[#0F172A] font-cairo">{subject.name}</p>
                <p className="mt-1 text-xs text-[#334155]">{subject.grades.length} صفوف دراسية</p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
