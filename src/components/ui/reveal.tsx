export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      data-reveal
      data-reveal-delay={delay}
      className={className}
    >
      {children}
    </div>
  );
}
