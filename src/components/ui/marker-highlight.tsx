import React from "react";
import { cn } from "@/src/lib/cn";

interface MarkerHighlightProps {
  children: React.ReactNode;
  color?: "yellow" | "sky" | "pink" | "purple" | "emerald" | "orange";
  variant?: 1 | 2 | 3 | 4;
  className?: string;
}

const colorMap = {
  yellow: "bg-amber-300/85 dark:bg-amber-400/70 text-slate-950",
  sky: "bg-sky-300/85 dark:bg-sky-400/70 text-slate-950",
  pink: "bg-pink-300/85 dark:bg-pink-400/70 text-slate-950",
  purple: "bg-purple-300/85 dark:bg-purple-400/70 text-slate-950",
  emerald: "bg-emerald-300/85 dark:bg-emerald-400/70 text-slate-950",
  orange: "bg-orange-300/85 dark:bg-orange-400/70 text-slate-950",
};

const organicShapes = {
  1: { borderRadius: "30% 70% 20% 80% / 70% 30% 80% 20%", transform: "-rotate-1 skew-x-2 scale-x-105" },
  2: { borderRadius: "20% 80% 40% 60% / 60% 40% 70% 30%", transform: "rotate-1 -skew-x-3 scale-x-105" },
  3: { borderRadius: "40% 60% 30% 70% / 80% 20% 80% 20%", transform: "-rotate-1 skew-x-1 scale-x-105" },
  4: { borderRadius: "15% 85% 25% 75% / 75% 25% 75% 25%", transform: "rotate-1 scale-x-105" },
};

export function MarkerHighlight({
  children,
  color = "yellow",
  variant = 1,
  className,
}: MarkerHighlightProps) {
  const shape = organicShapes[variant] || organicShapes[1];

  return (
    <span className={cn("relative inline-block px-1.5 z-10", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 bottom-1 h-[52%] -z-10 pointer-events-none transition-all duration-300",
          shape.transform,
          colorMap[color]
        )}
        style={{
          borderRadius: shape.borderRadius,
        }}
      />
      {children}
    </span>
  );
}

export default MarkerHighlight;
