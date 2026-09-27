import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-bold text-primary">404</p>
        <h1 className="text-3xl font-black">{t("title")}</h1>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{t("description")}</p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
