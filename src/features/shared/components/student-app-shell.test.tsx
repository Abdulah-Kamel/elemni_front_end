import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import StudentAppShell from "./student-app-shell";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("StudentAppShell", () => {
  it("renders authenticated student content inside the shared portal navigation", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <StudentAppShell user={{ id: 1, name: "أحمد علي" } as never} active="courses">
          <p>محتوى الدورة</p>
        </StudentAppShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("navigation", { name: "بوابة الطالب" })).toBeInTheDocument();
    expect(screen.getByText("محتوى الدورة")).toBeInTheDocument();
  });
});
