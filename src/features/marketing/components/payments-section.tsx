import { getTranslations } from "next-intl/server";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export default async function PaymentsSection() {
  const t = await getTranslations("payments");

  return (
    <Section id="payments">
      <Reveal>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-brand-600">{t("subtitle")}</p>
        </div>
      </Reveal>
      <Reveal>
        <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-brand-100 bg-brand-50 px-6 py-5 text-center text-base font-bold text-brand-700">
          {t("checkoutDescription")}
        </p>
      </Reveal>
    </Section>
  );
}
