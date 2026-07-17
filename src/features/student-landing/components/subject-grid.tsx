import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getSubjects } from "@/src/lib/api/catalog";
import { SubjectCard } from "./subject-card";

export default async function SubjectGrid({ locale }: { locale: string }) {
  const t = await getTranslations("studentLanding.subjects");
  const subjects = await getSubjects(locale);

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-gradient mb-8 text-2xl font-bold">{t("title")}</h2>
        <Suspense fallback={<SubjectGridSkeleton />}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {subjects.map((s) => (
              <SubjectCard key={s.id} subject={s} locale={locale} />
            ))}
          </div>
        </Suspense>
      </div>
    </section>
  );
}

export function SubjectGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-brand-100"
        />
      ))}
    </div>
  );
}
