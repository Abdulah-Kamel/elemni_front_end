"use client";

import { useEffect, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";

/** Animated numeral that always holds its final value in the DOM. */
export default function StudyCounter({
  value,
  format = (n: number) => String(n),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const [text, setText] = useState(() => format(value));

  useMotionValueEvent(motionValue, "change", (latest) => {
    setText(format(Math.round(latest)));
  });

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, motionValue, reduceMotion]);

  return (
    <span className={className} aria-live="off">
      {text}
    </span>
  );
}
