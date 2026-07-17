import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default async function CtaBar() {
  const t = await getTranslations("studentLanding.hero");

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 px-4 pb-16">
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
      <Link
        href="/login"
        className="text-sm font-semibold text-brand-600 hover:text-brand-700 motion-safe:transition-colors"
      >
        {t("ctaSignin")}
      </Link>
    </div>
  );
}
