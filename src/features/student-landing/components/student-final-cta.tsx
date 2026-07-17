import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export async function StudentFinalCta() {
  const t = await getTranslations("studentLanding.finalCta");

  return (
    <section className="bg-brand-50 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-cta-gradient px-8 py-14 text-center">
          <div className="pointer-events-none absolute -end-20 -bottom-20 size-72 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -start-16 -top-16 size-72 rounded-full border border-white/15" />

          <h2 className="relative text-3xl font-black text-white md:text-4xl">
            {t("heading")}
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/75">
            {t("paragraph")}
          </p>

          <div className="relative mt-8">
            <Link href="/teachers" locale={false} prefetch={false}>
              <Button variant="primary" className="text-ink">
                <Mail aria-hidden className="size-4" />
                {t("cta")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
