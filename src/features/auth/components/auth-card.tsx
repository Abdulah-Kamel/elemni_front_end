import type { ReactNode } from "react";

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="w-full max-w-[500px] rounded-2xl border border-[#E2E0EF] bg-white px-5 py-7 shadow-[0_12px_36px_rgba(53,37,205,0.05)] sm:px-10 sm:py-9">
      {children}
    </section>
  );
}
