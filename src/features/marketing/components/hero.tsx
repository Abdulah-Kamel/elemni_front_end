import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import {
  Shield,
  Play,
  ChevronDown,
  FileVideo,
  Plus,
  TrendingUp,
  User,
} from "lucide-react";
import { Button, Badge } from "@/src/components/ui/button";
import { Section } from "@/src/components/ui/section";

function highlightWord(text: string, word: string) {
  const parts = text.split(word);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="underline decoration-accent-400 decoration-4 underline-offset-8">
          {word}
        </span>
      )}
    </Fragment>
  ));
}

export default async function Hero() {
  const t = await getTranslations("hero");
  const searchWord = t("searchWord");
  const title = t("title");

  const dropdowns = [
    { label: t("mock.subjectLabel"), value: t("mock.subjectValue") },
    { label: t("mock.gradeLabel"), value: t("mock.gradeValue") },
    { label: t("mock.streamLabel"), value: t("mock.streamValue") },
  ];

  return (
    <Section
      id="home"
      className="relative overflow-hidden bg-hero-gradient text-white"
    >
      {/* Subtle depth only — the design's hero is a clean violet gradient, so
          these stay inside the brand ramp at low opacity. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 start-[-6rem] size-72 rounded-full bg-brand-300/20 blur-3xl motion-safe:animate-float" />
        <div
          className="absolute bottom-[-6rem] start-1/3 size-64 rounded-full bg-white/10 blur-3xl motion-safe:animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="relative grid items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col items-start gap-6 motion-safe:animate-fade-up">
          <Badge tone="amber" className="bg-accent-400/20 text-accent-400">
            <Shield className="size-4" />
            {t("badge")}
          </Badge>

          <h1
            className="text-4xl font-black leading-tight md:text-5xl motion-safe:animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            {highlightWord(title, searchWord)}
          </h1>

          <p
            className="text-lg text-white/80 md:text-xl motion-safe:animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            {t("subtitle")}
          </p>

          <div
            className="flex flex-wrap gap-4 motion-safe:animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <Button variant="primary" className="motion-safe:hover:-translate-y-0.5">
              {t("ctaPrimary")}
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 motion-safe:hover:-translate-y-0.5"
            >
              <Play className="size-4" />
              {t("ctaSecondary")}
            </Button>
          </div>
        </div>

        {/* Teacher dashboard mockup — decorative illustration of the product */}
        <div aria-hidden className="relative">
          <div className="rounded-card bg-white p-5 text-ink shadow-lift motion-safe:animate-float">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700">
                <User className="size-4" />
              </span>
              <p className="text-sm font-bold">{t("mock.greeting")}</p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/60 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <FileVideo className="size-4" />
                <span>
                  {t("mock.uploadTitle")}
                  <span className="block text-xs font-normal text-muted">
                    {t("mock.uploadHint")}
                  </span>
                </span>
              </span>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                <Plus className="size-4" />
              </span>
            </div>

            {/* The three curriculum dropdowns — the key product detail */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {dropdowns.map((d) => (
                <div
                  key={d.label}
                  className="rounded-xl border border-brand-100 bg-white px-3 py-2"
                >
                  <p className="text-[10px] text-muted">{d.label}</p>
                  <p className="flex items-center justify-between gap-1 text-xs font-bold text-ink">
                    {d.value}
                    <ChevronDown className="size-3 shrink-0 text-muted" />
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-700">
                  {t("mock.progressTitle")}
                </span>
                <span className="text-muted">{t("mock.progressStatus")}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
                <div className="h-full w-3/5 rounded-full bg-brand-600" />
              </div>
            </div>
          </div>

          <div
            className="absolute -top-3 start-[-0.75rem] inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1.5 text-xs font-bold text-white shadow-lift motion-safe:animate-float"
            style={{ animationDelay: "1s" }}
          >
            <TrendingUp className="size-3.5" />
            {t("mock.earningsPill")}
          </div>
        </div>
      </div>
    </Section>
  );
}
