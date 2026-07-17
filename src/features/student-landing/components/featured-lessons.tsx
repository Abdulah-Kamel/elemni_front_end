import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getFeaturedContent } from "@/src/lib/api/catalog";
import { Link } from "@/src/i18n/navigation";

export default async function FeaturedLessons({ locale }: { locale: string }) {
  const t = await getTranslations("studentLanding.featured");
  const items = await getFeaturedContent(locale);

  if (items.length === 0) return null;

  return (
    <section id="courses" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-gradient text-2xl font-bold">{t("title")}</h2>
          <Link
            href="/browse"
            className="text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            {t("viewAll")}
          </Link>
        </div>
        <Suspense fallback={<FeaturedSkeleton />}>
          <div className="grid gap-6 md:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.linkType === "subject" ? `/browse?subject=${item.linkTarget}` : item.linkTarget}
                className="group rounded-xl border border-brand-100 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-bold text-ink group-hover:text-brand-700">
                  {item.title[locale as "ar" | "en"]}
                </h3>
                <p className="mt-1 text-sm text-ink/60">
                  {item.description[locale as "ar" | "en"]}
                </p>
              </Link>
            ))}
          </div>
        </Suspense>
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-brand-100" />
      ))}
    </div>
  );
}
