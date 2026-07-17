import { getTranslations } from "next-intl/server";
import { getGrades } from "@/src/lib/api/catalog";
import { Link } from "@/src/i18n/navigation";

export default async function GradeStreamFilter({ locale }: { locale: string }) {
  const t = await getTranslations("curriculum.filters");
  const grades = await getGrades(locale);

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="sr-only">{t("grade")}</h2>
        <div className="flex flex-wrap gap-3">
          {grades.map((g) => (
            <Link
              key={g.id}
              href={`/browse?grade=${g.slug}`}
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-50"
            >
              {g.name[locale as "ar" | "en"]}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
