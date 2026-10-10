import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/src/messages/en.json";
import ar from "@/src/messages/ar.json";
import PdfViewer from "./pdf-viewer";

const pdfjs = vi.hoisted(() => ({ getDocument: vi.fn(), GlobalWorkerOptions: { workerSrc: "" } }));
vi.mock("pdfjs-dist", () => pdfjs);

let intersectionCallback: IntersectionObserverCallback;
let resizeCallback: ResizeObserverCallback;
const scrollIntoView = vi.fn();

function makeDocument(numPages = 3, pendingRenders = false) {
  const renders = new Map<number, { cancel: ReturnType<typeof vi.fn>; promise: Promise<void> }>();
  const pages = new Map<number, { cleanup: ReturnType<typeof vi.fn> }>();
  const getPage = vi.fn(async (number: number) => {
    const page = {
      cleanup: vi.fn(),
      getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
      render: vi.fn(() => {
        let rejectRender: (error: Error) => void = () => {};
        const promise = pendingRenders
          ? new Promise<void>((_, reject) => { rejectRender = reject; })
          : Promise.resolve();
        const task = { promise, cancel: vi.fn(() => rejectRender(Object.assign(new Error("cancelled"), { name: "RenderingCancelledException" }))) };
        renders.set(number, task);
        return task;
      }),
    };
    pages.set(number, page);
    return page;
  });
  const document = { numPages, getPage, destroy: vi.fn().mockResolvedValue(undefined) };
  const task = { promise: Promise.resolve(document), destroy: vi.fn().mockResolvedValue(undefined) };
  return { task, document, renders, pages };
}

function viewer(url = "/lecture.pdf", locale = "en") {
  return (
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : en}>
      <div dir={locale === "ar" ? "rtl" : "ltr"}>
        <PdfViewer url={url} title="Lecture notes" downloadUrl="/download.pdf" />
      </div>
    </NextIntlClientProvider>
  );
}

async function loaded() {
  return screen.findByText("1 / 3");
}

beforeEach(() => {
  pdfjs.getDocument.mockReset();
  pdfjs.getDocument.mockReturnValue(makeDocument().task);
  scrollIntoView.mockReset();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersectionCallback = callback; }
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(632);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PdfViewer", () => {
  it("keeps drawn pages under React StrictMode's double effect run", async () => {
    render(<StrictMode>{viewer()}</StrictMode>);
    await loaded();
    const first = await screen.findByRole("img", { name: /1/ });
    await waitFor(() => expect((first as HTMLCanvasElement).width).toBeGreaterThan(0));
    // Let any stale cleanup from the first (discarded) effect run settle.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect((first as HTMLCanvasElement).width).toBeGreaterThan(0);
  });
  it("loads pages at capped device pixel ratio on white canvases", async () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const view = render(viewer());
    await loaded();
    await waitFor(() => expect(view.container.querySelectorAll("canvas")).toHaveLength(3));
    expect(pdfjs.getDocument).toHaveBeenCalledWith({ url: "/lecture.pdf", withCredentials: false, isEvalSupported: false });
    const canvas = view.container.querySelector("canvas")!;
    await waitFor(() => expect(canvas.width).toBe(1200));
    expect(canvas.height).toBe(1600);
    expect(canvas.style.width).toBe("600px");
    expect(canvas).toHaveClass("bg-white");
  });

  it("navigates and disables previous/next at the document ends", async () => {
    render(viewer());
    await loaded();
    const previous = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: "Next page" });
    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(next).toBeDisabled();
    fireEvent.click(previous);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("keeps the current page in view when zooming or fitting width", async () => {
    render(viewer());
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(scrollIntoView.mock.contexts.at(-1)).toHaveAttribute("data-page-number", "2");
    scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Fit to width" }));
    expect(scrollIntoView.mock.contexts.at(-1)).toHaveAttribute("data-page-number", "2");
  });

  it("keeps the page counter left-to-right in Arabic", async () => {
    render(viewer("/lecture.pdf", "ar"));
    const counter = await screen.findByText(/1 \/ 3/);
    expect(counter).toHaveAttribute("dir", "ltr");
  });

  it("zooms by quarter steps, honors manual zoom on resize, and restores fit width", async () => {
    render(viewer());
    await loaded();
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    act(() => resizeCallback([{ contentRect: { width: 332 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(screen.getByText("125%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fit to width" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    act(() => resizeCallback([{ contentRect: { width: 332 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("keeps downloading allowed", async () => {
    render(viewer());
    await loaded();
    const link = screen.getByRole("link", { name: "Download" });
    expect(link).toHaveAttribute("href", "/download.pdf");
    expect(link).toHaveAttribute("download");
  });

  it.each(["NetworkError", "PasswordException", "InvalidPDFException"])("offers open and download on %s", async (name) => {
    pdfjs.getDocument.mockReturnValue({ promise: Promise.reject(Object.assign(new Error("failed"), { name })), destroy: vi.fn().mockResolvedValue(undefined) });
    render(viewer());
    expect(await screen.findByText("We couldn't display this file here")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const open = screen.getByRole("link", { name: "Open in new tab" });
    expect(open).toHaveAttribute("href", "/lecture.pdf");
    expect(open).toHaveAttribute("target", "_blank");
    expect(open.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute("download");
  });

  it("destroys loading tasks on URL change and unmount and ignores a stale load", async () => {
    let resolveOld!: (doc: ReturnType<typeof makeDocument>["document"]) => void;
    const old = { promise: new Promise((resolve) => { resolveOld = resolve; }), destroy: vi.fn().mockResolvedValue(undefined) };
    const next = makeDocument();
    pdfjs.getDocument.mockReturnValueOnce(old).mockReturnValueOnce(next.task);
    const view = render(viewer());
    view.rerender(viewer("/new.pdf"));
    await loaded();
    expect(old.destroy).toHaveBeenCalledTimes(1);
    const stale = makeDocument(100);
    await act(async () => resolveOld(stale.document));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(stale.document.getPage).not.toHaveBeenCalled();
    view.unmount();
    expect(next.task.destroy).toHaveBeenCalledTimes(1);
  });

  it("renders a bounded window for large PDFs and cancels off-screen work", async () => {
    const large = makeDocument(120, true);
    pdfjs.getDocument.mockReturnValue(large.task);
    const view = render(viewer());
    await screen.findByText("1 / 120");
    await waitFor(() => expect(large.renders.size).toBe(3));
    const target = view.container.querySelector('[data-page-number="50"]')!;
    act(() => intersectionCallback([
      { target, isIntersecting: true, intersectionRatio: 0.8, boundingClientRect: { top: 0 } } as IntersectionObserverEntry,
    ], {} as IntersectionObserver));
    await screen.findByText("50 / 120");
    await waitFor(() => expect(view.container.querySelectorAll("canvas")).toHaveLength(5));
    await waitFor(() => expect(large.renders.has(52)).toBe(true));
    expect(large.renders.get(1)!.cancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(large.pages.get(2)!.cleanup).toHaveBeenCalled());
    expect(view.container.querySelector('canvas[aria-label="Page 48"]')).toBeInTheDocument();
    expect(view.container.querySelector('canvas[aria-label="Page 53"]')).not.toBeInTheDocument();
  });

  it("keeps the indicator on the page occupying the viewport at high zoom", async () => {
    const view = render(viewer());
    await loaded();
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    for (let step = 0; step < 8; step++) fireEvent.click(zoomIn);
    const container = screen.getByRole("region", { name: "Lecture notes" });
    const first = view.container.querySelector('[data-page-number="1"]')!;
    const second = view.container.querySelector('[data-page-number="2"]')!;
    const toolbar = screen.getByRole("toolbar");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 632, 800));
    vi.spyOn(toolbar, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 632, 56));
    const firstRect = vi.spyOn(first, "getBoundingClientRect").mockReturnValue(new DOMRect(0, -1617, 1800, 2400));
    const secondRect = vi.spyOn(second, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 799, 1800, 2400));
    act(() => intersectionCallback([
      { target: first, isIntersecting: true } as IntersectionObserverEntry,
      { target: second, isIntersecting: true } as IntersectionObserverEntry,
    ], {} as IntersectionObserver));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    firstRect.mockReturnValue(new DOMRect(0, -2100, 1800, 2400));
    secondRect.mockReturnValue(new DOMRect(0, 316, 1800, 2400));
    fireEvent.scroll(container);
    await screen.findByText("2 / 3");
  });

  it("inherits RTL, localizes controls and uses dark backgrounds with white pages", async () => {
    const view = render(viewer("/lecture.pdf", "ar"));
    const previous = await screen.findByRole("button", { name: "الصفحة السابقة" });
    const toolbar = previous.closest('[role="toolbar"]')!;
    expect(toolbar).not.toHaveAttribute("dir");
    expect(previous.querySelector(".ltr\\:hidden")).toBeInTheDocument();
    expect(previous.querySelector(".rtl\\:hidden")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Lecture notes" })).toHaveClass("dark:bg-slate-900");
    expect(view.container.querySelector("canvas")).toHaveClass("bg-white");
    const formatter = new Intl.NumberFormat("ar");
    expect(screen.getByText(`${formatter.format(1)} / ${formatter.format(3)}`)).toBeInTheDocument();
  });

  it("shows full screen only when supported and targets the viewer container", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: requestFullscreen });
    const view = render(viewer());
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(requestFullscreen.mock.instances[0]).toBe(screen.getByRole("region", { name: "Lecture notes" }));
    view.unmount();
    Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
    render(viewer());
    await loaded();
    expect(screen.queryByRole("button", { name: "Full screen" })).not.toBeInTheDocument();
  });
});
