import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import AuthPageShell from "./auth-page-shell";

describe("AuthPageShell", () => {
  it("renders its provided children for the requested locale", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="ar" messages={{}}>
          <AuthPageShell locale="ar">
            <div>form body</div>
          </AuthPageShell>
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText("form body")).toBeInTheDocument();
  });
});
