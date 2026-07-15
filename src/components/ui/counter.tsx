"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

export function Counter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);
  const [display, setDisplay] = useState(0);
  const locale = useLocale();

  const format = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US"),
    [locale],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || counted.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        counted.current = true;
        io.disconnect();

        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (reduced) {
          setDisplay(value);
          return;
        }

        const duration = 1500;
        const startTime = performance.now();

        const animate = (now: number) => {
          const t = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(value * eased));
          if (t < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      },
      { threshold: 0.15 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {format.format(display)}
      {suffix}
    </span>
  );
}
