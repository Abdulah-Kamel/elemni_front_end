import type { Variants } from "motion/react";

export const portalContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const portalItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export const portalCardLiftClass =
  "transition duration-300 hover:-translate-y-1 motion-reduce:hover:translate-y-0 motion-reduce:transition-none";

export const portalImageZoomClass =
  "transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100 motion-reduce:transition-none";

export function scrollIntoViewById(
  id: string,
  options?: ScrollIntoViewOptions,
) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({
      ...options,
      behavior: reduceMotion ? "auto" : (options?.behavior ?? "smooth"),
    });
}
