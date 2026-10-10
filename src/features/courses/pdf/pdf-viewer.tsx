"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type PDFDocumentProxy, type PDFPageProxy, type RenderTask } from "pdfjs-dist";
import { clampZoom, fitWidthScale, pagesToRender } from "./page-window";
import PdfToolbar from "./pdf-toolbar";
import PdfFallback from "./pdf-fallback";

// Kept in this client-only, dynamically imported module so PDF.js stays out of
// the player bundle. The bundler emits the matching worker as a local asset.
// Webpack/Turbopack resolution must be checked by the owner's build/browser gate.
GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type PdfViewerProps = { url: string; title: string; downloadUrl: string };
type PageSize = { width: number; height: number };

export default function PdfViewer(props: PdfViewerProps) {
  // A new URL starts a fresh session immediately, including page and zoom state.
  return <PdfDocument key={props.url} {...props} />;
}

function PdfDocument({ url, title, downloadUrl }: PdfViewerProps) {
  const t = useTranslations("courseDetail.pdfViewer");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const manualZoomRef = useRef(false);
  // Page to keep in view after a zoom/fit-width changes every page height.
  const zoomAnchorRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState<{ document: PDFDocumentProxy; firstPageSize: PageSize } | null>(null);
  const [failed, setFailed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [sizes, setSizes] = useState<Record<number, PageSize>>({});
  const [supportsFullscreen] = useState(() => typeof HTMLElement !== "undefined" && typeof HTMLElement.prototype.requestFullscreen === "function");
  const document = loaded?.document;

  useEffect(() => {
    let active = true;
    // Pass the plan's safe-loading options as an object to the installed API.
    const options = { url, withCredentials: false, isEvalSupported: false };
    let task: PDFDocumentLoadingTask;
    try {
      task = getDocument(options);
      loadingTaskRef.current = task;
    } catch {
      // Also handle synchronous worker/initialization failures.
      queueMicrotask(() => { if (active) setFailed(true); });
      return () => { active = false; };
    }
    void (async () => {
      try {
        const pdf = await task.promise;
        if (!active) return;
        const page = await pdf.getPage(1);
        if (!active) return;
        const viewport = page.getViewport({ scale: 1 });
        const firstPageSize = { width: viewport.width, height: viewport.height };
        setScale(fitWidthScale(containerRef.current?.clientWidth ?? viewport.width + 32, viewport.width));
        setLoaded({ document: pdf, firstPageSize });
      } catch {
        // Includes network/CORS, PasswordException and InvalidPDFException.
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
      loadingTaskRef.current = null;
      void task.destroy().catch(() => {});
    };
  }, [url]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !loaded || failed) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!manualZoomRef.current && entry) {
        setScale(fitWidthScale(entry.contentRect.width, loaded.firstPageSize.width));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [loaded, failed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !document || failed) return;
    const visible = new Set<Element>();
    let frame: number | undefined;
    function updateCurrentPage() {
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const toolbarHeight = container.querySelector('[role="toolbar"]')?.getBoundingClientRect().height ?? 0;
      const top = bounds.top + toolbarHeight;
      const visibleHeight = (page: Element) => {
        const rect = page.getBoundingClientRect();
        return Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, top));
      };
      const primary = [...visible].sort((a, b) => visibleHeight(b) - visibleHeight(a))[0];
      if (primary) setCurrentPage(Number(primary.getAttribute("data-page-number")));
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      updateCurrentPage();
    }, { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] });
    // Observer thresholds alone miss changes between tall, zoomed pages.
    function onScroll() {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        updateCurrentPage();
      });
    }
    container.querySelectorAll("[data-page-number]").forEach((page) => observer.observe(page));
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", onScroll);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [document, failed]);

  const recordSize = useCallback((number: number, size: PageSize) => {
    setSizes((previous) => {
      if (previous[number]?.width === size.width && previous[number]?.height === size.height) return previous;
      return { ...previous, [number]: size };
    });
  }, []);
  const renderFailed = useCallback(() => setFailed(true), []);

  function navigate(page: number) {
    if (!document) return;
    const next = Math.max(1, Math.min(document.numPages, page));
    setCurrentPage(next);
    containerRef.current?.querySelector(`[data-page-number="${next}"]`)?.scrollIntoView({ block: "start", behavior: "auto" });
  }

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    zoomAnchorRef.current = null;
    if (anchor === null) return;
    containerRef.current?.querySelector(`[data-page-number="${anchor}"]`)?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [scale]);

  function zoom(amount: number) {
    manualZoomRef.current = true;
    const next = clampZoom(scale + amount);
    if (next !== scale) zoomAnchorRef.current = currentPage;
    setScale(next);
  }

  function fitWidth() {
    manualZoomRef.current = false;
    if (!containerRef.current || !loaded) return;
    const next = fitWidthScale(containerRef.current.clientWidth, loaded.firstPageSize.width);
    // Only anchor when the scale changes; otherwise no re-layout would consume it.
    if (next !== scale) zoomAnchorRef.current = currentPage;
    setScale(next);
  }

  function fullscreen() {
    // Mobile browsers can reject full screen even when the API exists.
    void containerRef.current?.requestFullscreen().catch(() => {});
  }

  const window = document ? pagesToRender(currentPage, document.numPages) : [];
  const number = new Intl.NumberFormat(locale);

  return (
    <div ref={containerRef} role="region" aria-label={title} tabIndex={0} className="h-[min(75dvh,56rem)] w-full overflow-auto overscroll-contain rounded-xl bg-[#ECEAE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5FB4] dark:bg-slate-900">
      {failed ? <PdfFallback url={url} downloadUrl={downloadUrl} /> : loaded && document ? (
        <>
          <PdfToolbar currentPage={currentPage} totalPages={document.numPages} scale={scale} downloadUrl={downloadUrl}
            onPrevious={() => navigate(currentPage - 1)} onNext={() => navigate(currentPage + 1)}
            onZoomIn={() => zoom(0.25)} onZoomOut={() => zoom(-0.25)} onFitWidth={fitWidth}
            onFullscreen={supportsFullscreen ? fullscreen : undefined} />
          <div className="flex min-w-full w-max flex-col items-center gap-4 p-4">
            {Array.from({ length: document.numPages }, (_, index) => {
              const pageNumber = index + 1;
              const size = sizes[pageNumber] ?? loaded.firstPageSize;
              return (
                <div key={pageNumber} data-page-number={pageNumber} className="relative shrink-0 scroll-mt-28 bg-white shadow-sm" style={{ width: size.width * scale, height: size.height * scale }}>
                  {window.includes(pageNumber) && <PdfCanvas key={`${pageNumber}:${scale}`} document={document} pageNumber={pageNumber} scale={scale} size={size} label={t("page", { number: number.format(pageNumber) })} onSize={recordSize} onError={renderFailed} />}
                </div>
              );
            })}
          </div>
        </>
      ) : <div role="status" className="flex h-full animate-pulse items-center justify-center text-sm text-[#5F6573] dark:text-slate-300">{t("loading")}</div>}
    </div>
  );
}

function PdfCanvas({ document, pageNumber, scale, size, label, onSize, onError }: {
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  size: PageSize;
  label: string;
  onSize: (number: number, size: PageSize) => void;
  onError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const generations = generationRef;
    const generation = ++generations.current;
    let active = true;
    let page: PDFPageProxy | undefined;
    let renderTask: RenderTask | undefined;
    const render = (async () => {
      try {
        page = await document.getPage(pageNumber);
        if (!active) return;
        const base = page.getViewport({ scale: 1 });
        onSize(pageNumber, { width: base.width, height: base.height });
        const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${base.width * scale}px`;
        canvas.style.height = `${base.height * scale}px`;
        renderTask = page.render({ canvas, viewport, background: "rgb(255,255,255)" });
        await renderTask.promise;
      } catch (error) {
        if (active && !(error instanceof Error && error.name === "RenderingCancelledException")) onError();
      } finally {
        if (!active) page?.cleanup();
      }
    })();
    return () => {
      active = false;
      renderTask?.cancel();
      // Wait for cancellation before releasing PDF.js resources and pixel memory.
      // Each zoom uses a new canvas, so pending work never reuses the next canvas.
      void render.finally(() => {
        page?.cleanup();
        // A re-run (e.g. React StrictMode in development) may already be drawing on
        // this canvas; only free the pixels if no newer render owns it.
        if (generations.current !== generation) return;
        canvas.width = 0;
        canvas.height = 0;
      });
    };
  }, [document, pageNumber, scale, onSize, onError]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className="block bg-white" style={{ width: size.width * scale, height: size.height * scale }} />;
}
