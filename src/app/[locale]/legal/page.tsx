import { getTranslations } from "next-intl/server";

export default async function LegalPage() {
  const t = await getTranslations("legal");

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t("title")}
        </h1>

        {/* Terms & Conditions */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("terms.title")}
          </h2>
          <div className="mt-6 space-y-6">
            {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`terms.sections.${i}.heading`)}
                </h3>
                <p className="mt-2 text-base text-gray-600 leading-relaxed">
                  {t(`terms.sections.${i}.content`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Refund Policy */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("refund.title")}
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            {t("refund.intro")}
          </p>

          {/* Eligibility */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("refund.eligibility.title")}
            </h3>
            <ul className="mt-3 list-disc list-inside space-y-2 text-base text-gray-600">
              {([0, 1, 2] as const).map((i) => (
                <li key={i}>{t(`refund.eligibility.items.${i}`)}</li>
              ))}
            </ul>
          </div>

          {/* Non-Refundable */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("refund.nonRefundable.title")}
            </h3>
            <ul className="mt-3 list-disc list-inside space-y-2 text-base text-gray-600">
              {([0, 1, 2, 3] as const).map((i) => (
                <li key={i}>{t(`refund.nonRefundable.items.${i}`)}</li>
              ))}
            </ul>
          </div>

          {/* Process */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("refund.process.title")}
            </h3>
            <ol className="mt-3 list-decimal list-inside space-y-2 text-base text-gray-600">
              {([0, 1, 2, 3] as const).map((i) => (
                <li key={i}>{t(`refund.process.steps.${i}`)}</li>
              ))}
            </ol>
          </div>

          {/* Contact */}
          <p className="mt-8 text-base text-gray-600">
            {t("refund.contact")}
          </p>
        </section>
      </div>
    </main>
  );
}
