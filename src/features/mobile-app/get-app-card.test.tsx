import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import GetAppCard, { GET_APP_DISMISSED_KEY } from "./get-app-card";

const messages = {
  mobileAppPromo: {
    title: "Get the Elemni app",
    body: "Watch your lessons and track your progress from your phone.",
    download: "Download for Android",
    dismiss: "Hide",
  },
};

const APK = "https://elemni.b-cdn.net/app/elemni-android.apk";

function renderCard(url: string | null) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GetAppCard downloadUrl={url} />
    </NextIntlClientProvider>,
  );
}

describe("GetAppCard", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("renders nothing when no download link is configured", () => {
    const { container } = renderCard(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("links to the APK", async () => {
    renderCard(APK);
    const link = await screen.findByRole("link", { name: "Download for Android" });
    expect(link).toHaveAttribute("href", APK);
  });

  it("stays hidden after the student dismisses it", async () => {
    renderCard(APK);
    fireEvent.click(await screen.findByRole("button", { name: "Hide" }));
    expect(screen.queryByRole("link", { name: "Download for Android" })).not.toBeInTheDocument();
    expect(localStorage.getItem(GET_APP_DISMISSED_KEY)).toBe("1");

    cleanup();
    const { container } = renderCard(APK);
    expect(container).toBeEmptyDOMElement();
  });
});
