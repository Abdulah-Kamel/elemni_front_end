// Shared class recipes for the attempt screens (Question*.dc.html palette:
// ink #0F172A borders with offset shadows, sky primary, slate surfaces).

export const focusRing =
  "outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:focus-visible:outline-sky-400";

export const card = "rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

export const inkEdge = "border-2 border-slate-900 dark:border-sky-300";
export const inkShadow = "shadow-[3px_3px_0_#0F172A] dark:shadow-[3px_3px_0_#020617]";

export const primaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full ${inkEdge} ${inkShadow} bg-sky-700 px-6 text-[15px] font-bold text-white transition-[transform,box-shadow,background-color] hover:bg-sky-800 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-x-0 disabled:active:translate-y-0 dark:bg-sky-600 dark:hover:bg-sky-500 ${focusRing}`;

export const secondaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full ${inkEdge} bg-white px-5 text-[15px] font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 ${focusRing}`;

export const chip = "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300";

export const muted = "text-slate-500 dark:text-slate-400";

/** Selectable answer surfaces (option cards, filled selects). */
export const selectedSurface = `${inkEdge} ${inkShadow} bg-sky-50 dark:bg-sky-950/40`;
export const idleSurface =
  "border-2 border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600";
