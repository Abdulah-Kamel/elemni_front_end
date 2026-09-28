type VisibilityLoopOptions = {
  startLoop: () => void;
  stopLoop: () => void;
  renderStaticFrame: () => void;
  threshold?: number;
};

/** Coordinates renderer lifetime with viewport, tab visibility, and reduced motion. */
export function observeWhiteboardVisibility(
  element: Element,
  { startLoop, stopLoop, renderStaticFrame, threshold = 0.1 }: VisibilityLoopOptions,
) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inViewport = false;
  let running = false;
  let staticFrameRendered = false;

  const sync = () => {
    const shouldRender = inViewport && document.visibilityState !== "hidden";
    if (motionQuery.matches) {
      if (running) {
        stopLoop();
        running = false;
      }
      if (shouldRender && !staticFrameRendered) {
        stopLoop();
        renderStaticFrame();
        staticFrameRendered = true;
      } else if (!shouldRender && staticFrameRendered) {
        stopLoop();
        staticFrameRendered = false;
      }
      return;
    }

    if (staticFrameRendered) {
      stopLoop();
      staticFrameRendered = false;
    }

    if (shouldRender && !running) {
      startLoop();
      running = true;
    } else if (!shouldRender && running) {
      stopLoop();
      running = false;
    }
  };

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio >= threshold);
    sync();
  }, { threshold });
  intersectionObserver.observe(element);
  document.addEventListener("visibilitychange", sync);
  motionQuery.addEventListener("change", sync);

  return () => {
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", sync);
    motionQuery.removeEventListener("change", sync);
    if (running || staticFrameRendered) stopLoop();
    running = false;
    staticFrameRendered = false;
  };
}
