"use client";

import { Download, ExternalLink, FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PdfFallback({ url, downloadUrl }: { url: string; downloadUrl: string }) {
  const t = useTranslations("courseDetail.pdfViewer");
  return (
    <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-4 px-5 py-10 text-center text-[#15181E] dark:text-white">
      <FileWarning className="size-10 text-[#0A5FB4] dark:text-sky-300" aria-hidden="true" />
      <div className="max-w-md">
        <h3 className="text-lg font-bold">{t("fallbackTitle")}</h3>
        <p className="mt-2 text-sm leading-6 text-[#5F6573] dark:text-slate-300">{t("fallbackBody")}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E4E2DC] bg-white px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] dark:border-slate-700 dark:bg-slate-800">
          <ExternalLink className="size-4" aria-hidden="true" />{t("openInNewTab")}
        </a>
        <a href={downloadUrl} download className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0A5FB4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#084A8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] focus-visible:ring-offset-2">
          <Download className="size-4" aria-hidden="true" />{t("download")}
        </a>
      </div>
    </div>
  );
}
