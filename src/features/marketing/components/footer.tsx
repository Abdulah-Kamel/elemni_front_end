import { getTranslations } from "next-intl/server";
import { GraduationCap } from "lucide-react";

const FOOTER_LINKS = ["privacy", "terms", "help", "contact"] as const;

export async function Footer() {
  const t = await getTranslations("footer");
  const brand = await getTranslations("brand");

  return (
    <footer className="bg-brand-900 py-16">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xl font-bold text-white">
          <GraduationCap className="size-6" />
          {brand("name")}
        </div>
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((key) => (
            <a
              key={key}
              href="#"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {t(key)}
            </a>
          ))}
        </nav>
        <p className="mt-8 text-sm text-white/40">{t("rights")}</p>
        <p className="mt-1 text-sm text-white/40">{t("madeIn")}</p>
      </div>
    </footer>
  );
}
