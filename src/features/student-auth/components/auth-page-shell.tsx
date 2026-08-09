import type { ReactNode } from "react";
import AuthChrome from "./auth-chrome";

export default function AuthPageShell({ children, locale }: { children: ReactNode; locale: string }) {
  return <AuthChrome locale={locale}>{children}</AuthChrome>;
}
