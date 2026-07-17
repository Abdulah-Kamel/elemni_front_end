import { getTranslations } from "next-intl/server";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Link } from "@/src/i18n/navigation";

export default async function StudentHero() {
  const t = await getTranslations("studentLanding.hero");
  return (
    <section className="bg-page px-4 pb-20 pt-16 md:pt-20">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-black leading-[1.3] text-start md:text-5xl">
            <span className="text-gradient">{t("headlineLine1")}</span>
            <br />
            <span className="text-gradient">{t("headlineLine2")}</span>
            <br />
            <span className="text-brand-900">{t("headlineLine3")}</span>
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            {t("paragraph")}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/browse">
              <Button variant="primary" className="text-ink">
                {t("ctaPrimary")}
                <ArrowLeft aria-hidden className="size-4" />
              </Button>
            </Link>
            <Link href="/teachers">
              <Button variant="outline" className="text-ink">
                {t("ctaSecondary")}
              </Button>
            </Link>
          </div>

          <div className="mt-6 inline-flex w-fit items-center gap-3 rounded-full border border-brand-200/70 bg-white px-4 py-2.5">
            <div className="flex -space-x-3 space-x-reverse">
              <div className="size-8 rounded-full border-2 border-white bg-brand-600">
                <svg viewBox="0 0 96 96" className="size-full"><circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.85)"/><path d="M16 92c0-19 14-32 32-32s32 13 32 32z" fill="rgba(255,255,255,0.85)"/></svg>
              </div>
              <div className="size-8 rounded-full border-2 border-white bg-brand-300">
                <svg viewBox="0 0 96 96" className="size-full"><circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.85)"/><path d="M16 92c0-19 14-32 32-32s32 13 32 32z" fill="rgba(255,255,255,0.85)"/></svg>
              </div>
              <div className="size-8 rounded-full border-2 border-white bg-accent-500">
                <svg viewBox="0 0 96 96" className="size-full"><circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.85)"/><path d="M16 92c0-19 14-32 32-32s32 13 32 32z" fill="rgba(255,255,255,0.85)"/></svg>
              </div>
              <div className="size-8 rounded-full border-2 border-white bg-success-500">
                <svg viewBox="0 0 96 96" className="size-full"><circle cx="48" cy="38" r="16" fill="rgba(255,255,255,0.85)"/><path d="M16 92c0-19 14-32 32-32s32 13 32 32z" fill="rgba(255,255,255,0.85)"/></svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{t("proofValue")}</p>
              <p className="text-xs text-muted">{t("proofLabel")}</p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-lg">
            <div className="flex aspect-4/3 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300/25">
              <div className="relative flex flex-col items-center gap-3">
                <div className="grid size-16 place-items-center rounded-full bg-brand-600/15 backdrop-blur-sm">
                  <Play className="size-7 fill-brand-600 text-brand-600" />
                </div>
                <p className="text-xs font-medium text-brand-600/60">{t("nowPlayingTitle")}</p>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-brand-200/30">
              <div className="h-full w-1/3 bg-brand-600 rounded-full" />
            </div>
            <div className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 ps-1.5 shadow-sm">
              <span className="grid size-8 place-items-center rounded-full bg-accent-500">
                <Play className="size-3.5 fill-white text-white" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">{t("nowPlayingTitle")}</p>
                <p className="text-[10px] text-muted">{t("nowPlayingLabel")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
