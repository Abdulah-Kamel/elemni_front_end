import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentPortalShell from "@/src/features/portal/components/portal-shell";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("StudentPortalShell", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("collapses the desktop sidebar and persists the preference", () => {
    window.localStorage.clear();

    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <StudentPortalShell user={null}>
          <p>محتوى الدورة</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    const toggle = screen.getByRole("button", { name: "تصغير القائمة الجانبية" });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-sidebar-collapsed",
      "false",
    );

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "توسيع القائمة الجانبية" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("complementary")).toHaveAttribute(
      "data-sidebar-collapsed",
      "true",
    );
    expect(window.localStorage.getItem("student-sidebar-collapsed")).toBe("true");
  });

  it("renders authenticated student content inside the shared portal navigation", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <StudentPortalShell user={{ id: 1, name: "أحمد علي" } as never} active="courses">
          <p>محتوى الدورة</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("navigation", { name: "بوابة الطالب" })).toBeInTheDocument();
    expect(screen.getByText("محتوى الدورة")).toBeInTheDocument();
  });
});
