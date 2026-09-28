import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentPortalShell from "@/src/features/portal/components/portal-shell";
import arMessages from "@/src/messages/ar.json";
import enMessages from "@/src/messages/en.json";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

const arabicMessages = arMessages;
const englishMessages = enMessages;

describe("StudentPortalShell", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("collapses the desktop sidebar and persists the preference", () => {
    window.localStorage.clear();

    render(
      <NextIntlClientProvider locale="ar" messages={arabicMessages}>
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
    const dashboardLink = within(within(screen.getByRole("complementary")).getByRole("navigation", { name: "بوابة الطالب" })).getByRole("link", { name: arMessages.studentLanding.nav.dashboard });
    expect(dashboardLink).toHaveClass(
      "mx-auto",
      "size-12",
      "justify-center",
    );
  });

  it("renders authenticated student content inside the shared portal navigation", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arabicMessages}>
        <StudentPortalShell user={{ id: 1, name: "أحمد علي" } as never} active="courses">
          <p>محتوى الدورة</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("navigation", { name: "بوابة الطالب" })).toBeInTheDocument();
    expect(screen.getByText("محتوى الدورة")).toBeInTheDocument();
  });

  it("shows the current course title in the portal topbar", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arabicMessages}>
        <StudentPortalShell
          user={{ id: 1, name: "أحمد علي" } as never}
          active="courses"
          title="كورس التفاضل"
        >
          <p>محتوى الدورة</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    const topbar = screen.getByRole("banner");
    expect(screen.getByText("كورس التفاضل", { selector: "p" })).toHaveClass(
      "truncate",
    );
    expect(topbar).toHaveTextContent("كورس التفاضل");
  });

  it("removes collapsed navigation labels from the icon layout", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arabicMessages}>
        <StudentPortalShell user={null}>
          <p>محتوى الدورة</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "تصغير القائمة الجانبية" }));

    const dashboardLabel = within(screen.getByRole("complementary")).getByText(arMessages.studentLanding.nav.dashboard);
    expect(dashboardLabel).toHaveClass("sr-only");
    expect(dashboardLabel).not.toHaveClass("relative");
  });

  it("uses left-to-right direction and localized labels for English pages", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={englishMessages}>
        <StudentPortalShell user={null} active="courses">
          <p>Course content</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    const shell = container.querySelector(".student-portal-shell");

    expect(shell).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("navigation", { name: "Student portal" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "My courses" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("Course content")).toBeInTheDocument();
  });
});
