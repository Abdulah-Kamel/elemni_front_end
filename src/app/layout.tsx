import type { ReactNode } from "react";

// <html> and <body> are rendered by app/[locale]/layout.tsx, which knows the
// locale from the URL, so lang/dir are correct in the server HTML (and pages
// can still be statically rendered). global-not-found.tsx renders its own.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
