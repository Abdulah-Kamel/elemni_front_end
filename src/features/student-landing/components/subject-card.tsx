import type { Subject } from "@/src/features/student-landing/schemas/subject";
import { Link } from "@/src/i18n/navigation";
import { Atom, Sigma, FlaskConical, Dna, GraduationCap } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  atom: <Atom className="size-8" />,
  sigma: <Sigma className="size-8" />,
  flask: <FlaskConical className="size-8" />,
  dna: <Dna className="size-8" />,
};

export function SubjectCard({ subject, locale }: { subject: Subject; locale: string }) {
  const icon = subject.icon ? iconMap[subject.icon] : <GraduationCap className="size-8" />;
  const name = locale === "ar" ? subject.name.ar : subject.name.en;

  return (
    <Link
      href={`/browse?subject=${subject.slug}`}
      className="flex flex-col items-center gap-3 rounded-xl border border-brand-100 p-6 text-center transition-shadow hover:shadow-md"
    >
      <div className="text-brand-700">{icon}</div>
      <span className="text-sm font-bold text-ink">{name}</span>
    </Link>
  );
}
