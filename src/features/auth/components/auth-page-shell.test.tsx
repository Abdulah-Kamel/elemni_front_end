import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import AuthPageShell from "./auth-page-shell";

describe("AuthPageShell", () => {
  it("renders its provided children for the requested locale", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <AuthPageShell locale="ar">
          <div>form body</div>
        </AuthPageShell>
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("form body")).toBeInTheDocument();
  });
});
