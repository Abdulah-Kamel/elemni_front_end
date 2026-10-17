import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import enMessages from "@/src/messages/en.json";
import MobileApp from "./mobile-app";

const APK = "https://elemni.b-cdn.net/app/elemni-android.apk";

function renderSection(url: string | null) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <MobileApp downloadUrl={url} />
    </NextIntlClientProvider>,
  );
}

describe("MobileApp landing section", () => {
  afterEach(() => cleanup());

  it("is hidden until a download link is configured", () => {
    const { container } = renderSection(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the Android download and no store badges", () => {
    renderSection(APK);
    expect(screen.getByRole("link", { name: /Download the Android app/ })).toHaveAttribute("href", APK);
    expect(screen.queryByText("App Store")).not.toBeInTheDocument();
    expect(screen.queryByText("Google Play")).not.toBeInTheDocument();
  });

  it("does not promise quizzes the app does not have yet", () => {
    renderSection(APK);
    expect(screen.queryByText(/quizzes/i)).not.toBeInTheDocument();
  });
});
