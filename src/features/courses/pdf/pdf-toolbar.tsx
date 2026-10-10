"use client";

import { ChevronLeft, ChevronRight, Download, Maximize2, Scan, ZoomIn, ZoomOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const buttonClass = "inline-flex min-h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E4E2DC] bg-white px-2 text-sm font-semibold text-[#15181E] transition hover:bg-[#F4F3EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700";

export default function PdfToolbar({
  currentPage, totalPages, scale, downloadUrl, onPrevious, onNext,
  onZoomIn, onZoomOut, onFitWidth, onFullscreen,
}: {
  currentPage: number;
  totalPages: number;
  scale: number;
  downloadUrl: string;
  onPrevious: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFullscreen?: () => void;
}) {
  const t = useTranslations("courseDetail.pdfViewer");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return (
    <div role="toolbar" aria-label={t("toolbar")} className="sticky start-0 top-0 z-10 flex w-full flex-wrap items-center justify-center gap-2 border-b border-[#E4E2DC] bg-[#F4F3EF] p-2 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-1">
        <button type="button" className={buttonClass} aria-label={t("previousPage")} title={t("previousPage")} disabled={currentPage <= 1} onClick={onPrevious}>
          <ChevronRight className="size-4 ltr:hidden" aria-hidden="true" />
          <ChevronLeft className="size-4 rtl:hidden" aria-hidden="true" />
        </button>
        <span dir="ltr" className="min-w-16 whitespace-nowrap px-1 text-center text-sm font-semibold text-[#15181E] dark:text-white" aria-label={t("pageIndicator", { current: number.format(currentPage), total: number.format(totalPages) })}>
          {number.format(currentPage)} / {number.format(totalPages)}
        </span>
        <button type="button" className={buttonClass} aria-label={t("nextPage")} title={t("nextPage")} disabled={currentPage >= totalPages} onClick={onNext}>
          <ChevronLeft className="size-4 ltr:hidden" aria-hidden="true" />
          <ChevronRight className="size-4 rtl:hidden" aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={buttonClass} aria-label={t("zoomOut")} title={t("zoomOut")} disabled={scale <= 0.5} onClick={onZoomOut}><ZoomOut className="size-4" aria-hidden="true" /></button>
        <span className="min-w-12 whitespace-nowrap text-center text-xs font-semibold text-[#15181E] dark:text-white">{percent.format(scale)}</span>
        <button type="button" className={buttonClass} aria-label={t("zoomIn")} title={t("zoomIn")} disabled={scale >= 3} onClick={onZoomIn}><ZoomIn className="size-4" aria-hidden="true" /></button>
        <button type="button" className={buttonClass} aria-label={t("fitWidth")} title={t("fitWidth")} onClick={onFitWidth}><Scan className="size-4" aria-hidden="true" /></button>
        {onFullscreen && <button type="button" className={buttonClass} aria-label={t("fullscreen")} title={t("fullscreen")} onClick={onFullscreen}><Maximize2 className="size-4" aria-hidden="true" /></button>}
        <a href={downloadUrl} download className={buttonClass} aria-label={t("download")} title={t("download")}><Download className="size-4" aria-hidden="true" /><span className="sr-only sm:not-sr-only">{t("download")}</span></a>
      </div>
    </div>
  );
}
