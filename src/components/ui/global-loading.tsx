import Image from "next/image";
import logoMark from "@/src/assets/logo-icon.png";
import { useTranslations } from "next-intl";

interface GlobalLoadingProps {
  message?: string;
  variant?: "screen" | "content";
}

export function GlobalLoading({
  message,
  variant = "screen",
}: GlobalLoadingProps = {}) {
  const t = useTranslations("globalLoading");
  const resolvedMessage = message ?? t("journey");
  return (
    <div
      className={`global-loading${variant === "content" ? " global-loading--content" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={resolvedMessage}
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
        <span>{resolvedMessage}</span>
      </div>

      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
