import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CircleCheck, VideoOff, Play } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Badge } from "@/src/components/ui/button";
import { Reveal } from "@/src/components/ui/reveal";

const HLS_ITEMS = ["encrypted", "watermark", "devices"] as const;

export async function HlsSection() {
  const t = await getTranslations("hlsSection");

  const heading = t("heading");
  const [before, after] = heading.split("HLS");

  return (
    <Section className="bg-brand-900" id="hls">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <Reveal>
            <Badge tone="amber" className="bg-accent-400/20 text-accent-400">
              {t("badge")}
            </Badge>

            <h2 className="mt-4 mb-4 text-3xl font-black text-white md:text-4xl">
              {before}
              {after !== undefined && (
                <span className="text-accent-400">HLS</span>
              )}
              {after}
            </h2>

            <p className="mb-8 text-white/70">{t("subtitle")}</p>
          </Reveal>

          <ul className="space-y-4">
            {HLS_ITEMS.map((key, i) => (
              <Reveal key={key} delay={i * 80}>
                <li className="flex gap-3">
                  <CircleCheck
                    className="mt-1 shrink-0 text-success-500"
                    size={20}
                  />
                  <div>
                    <p className="font-bold text-white">{t(`${key}.title`)}</p>
                    <p className="text-sm text-white/70">{t(`${key}.desc`)}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        {/*
          Decorative mockup illustrating what the *API-side* HLS produces.
          This is marketing artwork with sample data — it is NOT enforcement.
          Real watermarking/device limits are burned in server-side at license
          issuance (see CLAUDE.md "HLS"). Never treat this overlay as a control.
        */}
        <Reveal delay={120}>
          <div
            aria-hidden
            className="relative aspect-video overflow-hidden rounded-card border border-white/10 bg-black/40 shadow-lift"
          >
            <Image
              src="/placeholders/drm-lesson.svg"
              alt=""
              width={640}
              height={360}
              className="size-full object-cover opacity-80"
            />

            <div className="absolute inset-0 grid place-items-center">
              <div className="relative grid size-16 place-items-center">
                <span className="absolute inset-0 rounded-full border border-teal-400 motion-safe:animate-pulse-ring" />
                <span className="grid size-14 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Play className="size-6 fill-white text-white" />
                </span>
              </div>
            </div>

            {/* Burned-in watermark, shown at two positions to imply it moves */}
            <span className="absolute top-[35%] start-[20%] -rotate-12 font-mono text-sm text-white/30">
              {t("mock.watermark")}
            </span>
            <span className="absolute top-[70%] start-[55%] -rotate-12 font-mono text-sm text-white/30">
              {t("mock.watermark")}
            </span>

            <div className="absolute top-4 start-4 inline-flex items-center gap-2 rounded-full bg-danger-500/90 px-3 py-1 text-xs font-semibold text-white">
              <VideoOff size={14} />
              {t("mockupBadge")}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
