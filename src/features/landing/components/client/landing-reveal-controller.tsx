"use client";

import { useEffect } from "react";

const revealSelector = ".landing-shell [data-reveal]";

export default function LandingRevealController() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".landing-shell");
    const elements = document.querySelectorAll<HTMLElement>(revealSelector);

    if (!shell || elements.length === 0) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    elements.forEach((element) => {
      const delay = Number(element.dataset.revealDelay ?? 0);
      element.style.setProperty(
        "--reveal-delay",
        `${Number.isFinite(delay) ? Math.max(delay, 0) : 0}ms`,
      );
    });

    shell.dataset.revealReady = "true";

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.dataset.revealState = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          element.dataset.revealState = "visible";
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}
