import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Play, Upload, FolderTree, Wallet, Lock } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

const PILLS = [
  { key: "upload", icon: Upload },
  { key: "organize", icon: FolderTree },
  { key: "collect", icon: Wallet },
] as const;

export default async function VideoDemoSection() {
  const t = await getTranslations("videoDemo");

  return (
    <Section id="demo">
      <Reveal>
        <div className="text-center">
          <h2 className="inline-flex items-center justify-center text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            <Play className="me-2 size-8 text-brand-600" />
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-brand-600">{t("subtitle")}</p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        {/* Decorative browser-chrome mockup */}
        <div
          aria-hidden
          className="mt-10 overflow-hidden rounded-card bg-brand-50 shadow-lift ring-1 ring-brand-200"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-danger-500/70" />
              <span className="size-2.5 rounded-full bg-accent-400" />
              <span className="size-2.5 rounded-full bg-success-500/70" />
            </span>
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-muted">
              <Lock className="size-3" />
              {t("url")}
            </span>
          </div>

          <div className="relative aspect-video bg-brand-900">
            <Image
              src="/placeholders/video-dashboard.svg"
              alt=""
              width={1280}
              height={720}
              className="size-full object-cover"
            />

            <div className="absolute inset-0 grid place-items-center">
              <span className="relative grid size-20 place-items-center">
                <span className="absolute inset-0 rounded-full border border-accent-400 motion-safe:animate-pulse-ring" />
                <span className="grid size-16 place-items-center rounded-full bg-accent-500 text-white shadow-lift motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-110">
                  <Play className="size-7 fill-current" />
                </span>
              </span>
            </div>

            <div className="absolute bottom-0 start-0 end-0 flex items-center gap-3 bg-black/50 px-4 py-3">
              <div className="h-1 flex-1 rounded-full bg-white/30">
                <div className="h-full w-1/3 rounded-full bg-accent-400" />
              </div>
              <span className="text-xs text-white">{t("timestamp")}</span>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {PILLS.map(({ key, icon: Icon }, i) => (
          <Reveal key={key} delay={i * 80}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 motion-safe:transition-transform motion-safe:hover:scale-105">
              <Icon className="size-4" />
              {t(`pill.${key}`)}
            </span>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
