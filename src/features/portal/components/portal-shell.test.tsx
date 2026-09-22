import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentPortalShell from "@/src/features/portal/components/portal-shell";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

const arabicMessages = {
  brand: { name: "علمني", tagline: "منصة التعليم الذكي" },
  studentLanding: {
    nav: {
      dashboard: "لوحتي",
      myCourses: "كورساتي",
      courses: "الدروس",
      logout: "تسجيل الخروج",
    },
  },
  studentPortal: {
    sidebarLabel: "بوابة الطالب",
    collapseSidebar: "تصغير القائمة الجانبية",
    expandSidebar: "توسيع القائمة الجانبية",
    openMenu: "فتح قائمة بوابة الطالب",
    closeMenu: "إغلاق القائمة",
  },
};

const englishMessages = {
  brand: { name: "Elemni", tagline: "Smart learning platform" },
  studentLanding: {
    nav: {
      dashboard: "My dashboard",
      myCourses: "My courses",
      courses: "Courses",
      logout: "Log out",
    },
  },
  studentPortal: {
    sidebarLabel: "Student portal",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    openMenu: "Open student portal menu",
    closeMenu: "Close menu",
  },
};

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
    expect(screen.getByRole("link", { name: "لوحتي" })).toHaveClass(
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

  it("removes collapsed navigation labels from the icon layout", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arabicMessages}>
        <StudentPortalShell user={null}>
          <p>محتوى الدورة</p>
        </StudentPortalShell>
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "تصغير القائمة الجانبية" }));

    const dashboardLabel = screen.getByText("لوحتي");
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
    expect(screen.getByRole("link", { name: "My courses" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("Course content")).toBeInTheDocument();
  });
});
