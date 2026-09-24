import Image from "next/image";
import logoMark from "@/src/assets/logo-icon.png";

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
          <Image src={logoMark} alt="" width={40} height={40} className="size-10 object-contain" />
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
