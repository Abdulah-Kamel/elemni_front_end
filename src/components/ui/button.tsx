import { cn } from "@/src/lib/cn";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "purple";
  className?: string;
} & React.ComponentPropsWithoutRef<"button">) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold motion-safe:transition-all motion-safe:duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary: "bg-accent-500 text-white hover:bg-accent-600",
    outline:
      "border border-brand-200 text-brand-700 hover:bg-brand-50",
    purple: "bg-brand-600 text-white hover:bg-brand-700",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "amber",
  className,
}: {
  children: React.ReactNode;
  tone?: "amber" | "brand" | "success";
  className?: string;
}) {
  const tones = {
    amber: "bg-accent-400/15 text-accent-600",
    brand: "bg-brand-100 text-brand-700",
    success: "bg-success-500/15 text-success-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
