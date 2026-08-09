import { GraduationCap } from "lucide-react";

interface GlobalLoadingProps {
  message?: string;
  variant?: "screen" | "content";
}

export function GlobalLoading({
  message = "نجهز لك رحلتك التعليمية",
  variant = "screen",
}: GlobalLoadingProps = {}) {
  return (
    <div
      className={`global-loading${variant === "content" ? " global-loading--content" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="global-loading__mark" aria-hidden="true">
        <span className="global-loading__orbit">
          <span className="global-loading__dot global-loading__dot--one" />
          <span className="global-loading__dot global-loading__dot--two" />
          <span className="global-loading__dot global-loading__dot--three" />
        </span>
        <span className="global-loading__icon">
          <GraduationCap />
        </span>
      </div>

      <div className="global-loading__copy">
        <strong>علمني</strong>
        <span>{message}</span>
      </div>

      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}
