import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StudentAuthForm from "./student-auth-form";

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("StudentAuthForm", () => {
  it("renders the register submit button disabled in server HTML until hydration completes", () => {
    const markup = renderToStaticMarkup(<StudentAuthForm mode="register" />);
    const document = new DOMParser().parseFromString(markup, "text/html");
    const submitButton = document.querySelector('button[type="submit"]');

    expect(submitButton).not.toBeNull();
    expect(submitButton?.hasAttribute("disabled")).toBe(true);
  });

  it("enables the register submit button after the client hydrates", async () => {
    render(<StudentAuthForm mode="register" />);

    const submitButton = screen.getByRole("button", { name: "إنشاء الحساب" });

    await waitFor(() => expect(submitButton).toBeEnabled());
  });
});
