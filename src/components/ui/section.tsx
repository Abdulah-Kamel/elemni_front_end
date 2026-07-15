import { cn } from "@/src/lib/cn";

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("py-16 md:py-24", className)}
    >
      <div className="mx-auto max-w-6xl px-4">{children}</div>
    </section>
  );
}
