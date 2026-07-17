import { getLocale, getTranslations } from "next-intl/server";
import { Check, Bell, Smartphone } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export async function StudentMobileApp() {
  const t = await getTranslations("studentLanding.mobile");
  const locale = await getLocale();
  const greeting = locale === "ar" ? "أهلاً يا أحمد 👋" : "Hey Ahmed 👋";
  const ready = locale === "ar" ? "جاهز تذاكر النهاردة؟" : "Ready to study today?";

  return (
    <Section id="mobile" className="bg-white">
      <div className="grid gap-8 md:grid-cols-2">
        <Reveal className="h-full">
          <div>
            <h2 className="text-gradient mb-4 text-3xl font-black md:text-4xl leading-[1.3]">
              {t("headingLine1")}<br />{t("headingLine2")}
            </h2>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-muted">
              {t("paragraph")}
            </p>

            <div className="mb-6 flex flex-col gap-3">
              {["check1", "check2", "check3"].map((key) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-500/15">
                    <Check className="size-3 text-success-700" />
                  </span>
                  <span className="text-sm text-ink">{t(key)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-brand-200/70 bg-white px-4 py-2.5 text-xs font-bold">
                <Smartphone className="size-4" />
                App Store
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-brand-200/70 bg-white px-4 py-2.5 text-xs font-bold">
                <Smartphone className="size-4" />
                Google Play
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="flex items-center justify-center">
          <div className="relative mx-auto w-[260px]">
            <div className="overflow-hidden rounded-[36px] border-[6px] border-ink bg-white" style={{ aspectRatio: "1/2" }}>
              <div className="rounded-b-2xl bg-brand-600 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{greeting}</p>
                    <p className="text-[10px] text-white/70">{ready}</p>
                  </div>
                  <Bell className="size-4 text-white/80" />
                </div>
              </div>
              <div className="flex flex-col gap-2.5 p-3">
                <div className="rounded-xl bg-brand-100" style={{ height: "64px" }} />
                <div className="flex gap-2.5">
                  <div className="flex-1 rounded-xl bg-success-500/20" style={{ height: "56px" }} />
                  <div className="flex-1 rounded-xl bg-accent-500/20" style={{ height: "56px" }} />
                </div>
                <div className="rounded-xl bg-brand-100" style={{ height: "64px" }} />
              </div>
            </div>
            <div className="absolute -bottom-3 end-0 inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-white px-3 py-2 shadow-sm">
              <span className="grid size-5 place-items-center rounded-full bg-success-500">
                <Check className="size-3 text-white" />
              </span>
              <span className="text-[11px] font-bold text-ink">{t("toast")}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
