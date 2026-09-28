import { afterEach, describe, expect, it, vi } from "vitest";
import { observeWhiteboardVisibility } from "./whiteboard-visibility-controller";

class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver;
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  disconnected = false;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    FakeIntersectionObserver.latest = this;
  }

  observe = vi.fn();
  disconnect = () => { this.disconnected = true; };
  enter(ratio = 0.5) {
    this.callback([{ isIntersecting: true, intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  leave() {
    this.callback([{ isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

describe("observeWhiteboardVisibility", () => {
  const originalObserver = globalThis.IntersectionObserver;
  const originalVisibility = Object.getOwnPropertyDescriptor(document, "visibilityState");
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");

  const setMatchMedia = (matches: boolean) => Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver;
    if (originalVisibility) Object.defineProperty(document, "visibilityState", originalVisibility);
    if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
    else Reflect.deleteProperty(window, "matchMedia");
    vi.restoreAllMocks();
  });

  it("starts only while in view and the document is visible, then disconnects", () => {
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    setMatchMedia(false);
    const start = vi.fn();
    const stop = vi.fn();
    const cleanup = observeWhiteboardVisibility(document.createElement("div"), {
      startLoop: start,
      stopLoop: stop,
      renderStaticFrame: vi.fn(),
    });
    const observer = FakeIntersectionObserver.latest;

    expect(start).not.toHaveBeenCalled();
    observer.enter(0.05);
    expect(start).not.toHaveBeenCalled();
    observer.enter(0.5);
    expect(start).toHaveBeenCalledTimes(1);
    observer.enter(0.8);
    expect(start).toHaveBeenCalledTimes(1);
    observer.leave();
    expect(stop).toHaveBeenCalledTimes(1);
    cleanup();
    expect(observer.disconnected).toBe(true);
  });

  it("pauses and resumes with document visibility", () => {
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    setMatchMedia(false);
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const start = vi.fn();
    const stop = vi.fn();
    const cleanup = observeWhiteboardVisibility(document.createElement("div"), {
      startLoop: start,
      stopLoop: stop,
      renderStaticFrame: vi.fn(),
    });
    FakeIntersectionObserver.latest.enter();
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    visibility = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("renders one frame under reduced motion without starting a loop", () => {
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    setMatchMedia(true);
    const start = vi.fn();
    const renderStatic = vi.fn();
    const cleanup = observeWhiteboardVisibility(document.createElement("div"), {
      startLoop: start,
      stopLoop: vi.fn(),
      renderStaticFrame: renderStatic,
    });
    const observer = FakeIntersectionObserver.latest;
    observer.enter();
    observer.enter();
    expect(renderStatic).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    observer.leave();
    observer.enter();
    expect(renderStatic).toHaveBeenCalledTimes(2);
    cleanup();
  });
});
