import "./globals.css";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "404 | Elemni",
  description: "The requested page could not be found.",
};

export default async function GlobalNotFound() {
  const t = await getTranslations({ locale: "ar", namespace: "notFound" });
  return (
    <html lang="ar">
      <body className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <main className="flex min-h-screen items-center justify-center px-6">
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
      </body>
    </html>
  );
}
