import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/src/messages/en.json";
import arabicMessages from "@/src/messages/ar.json";
import AuthModal from "@/src/features/landing/components/client/auth-modal";
import { GoogleSignInButton } from "./google-sign-in-button";

const mocks = vi.hoisted(() => ({
  loadGoogleIdentity: vi.fn(),
  initialize: vi.fn(),
  renderButton: vi.fn(),
  router: { replace: vi.fn() },
  fetch: vi.fn(),
}));

vi.mock("@/src/features/auth/google-identity", () => ({
  loadGoogleIdentity: mocks.loadGoogleIdentity,
}));
vi.mock("@/src/i18n/navigation", () => ({ useRouter: () => mocks.router }));

function renderButton(props: Parameters<typeof GoogleSignInButton>[0] = {}, locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? arabicMessages : messages}>
      <GoogleSignInButton {...props} />
    </NextIntlClientProvider>,
  );
}

async function credentialReceived() {
  await waitFor(() => expect(mocks.initialize).toHaveBeenCalled());
  const { callback } = mocks.initialize.mock.calls[0][0];
  await act(async () => { await callback({ credential: "tok" }); });
}

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "web-client-id");
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.loadGoogleIdentity.mockResolvedValue({
      initialize: mocks.initialize, renderButton: mocks.renderButton,
    });
  });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("renders nothing without client id", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    const { container } = render(<GoogleSignInButton />);
    expect(container).toBeEmptyDOMElement();
    expect(mocks.loadGoogleIdentity).not.toHaveBeenCalled();
  });

  it("posts credential and redirects new user to onboarding", async () => {
    const sessionChanged = vi.fn();
    window.addEventListener("student-session-changed", sessionChanged, { once: true });
    mocks.fetch.mockResolvedValue(Response.json({ is_new_user: true }));
    renderButton({ returnTo: "/my-courses" });
    await credentialReceived();
    expect(mocks.fetch).toHaveBeenCalledWith("/api/student/auth/google", expect.objectContaining({
      method: "POST", body: JSON.stringify({ credential: "tok" }),
    }));
    expect(sessionChanged).toHaveBeenCalledWith(expect.objectContaining({ detail: "login" }));
    expect(mocks.router.replace).toHaveBeenCalledWith("/onboarding");
  });

  it("existing user goes to returnTo", async () => {
    mocks.fetch.mockResolvedValue(Response.json({ is_new_user: false }));
    renderButton({ returnTo: "/my-courses" });
    await credentialReceived();
    expect(mocks.router.replace).toHaveBeenCalledWith("/my-courses");
  });

  it("shows notStudent message on 403", async () => {
    mocks.fetch.mockResolvedValue(Response.json({ detail: "STUDENT_ACCOUNT_REQUIRED" }, { status: 403 }));
    renderButton();
    await credentialReceived();
    expect(screen.getByRole("alert")).toHaveTextContent(messages.auth.google.notStudent);
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("cancel shows no error", async () => {
    renderButton();
    await waitFor(() => expect(mocks.renderButton).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("existing user defaults to onboarding", async () => {
    mocks.fetch.mockResolvedValue(Response.json({ is_new_user: false }));
    renderButton();
    await credentialReceived();
    expect(mocks.router.replace).toHaveBeenCalledWith("/onboarding");
  });

  it("lets the modal handle an existing sign-in without leaving the page", async () => {
    const onSignedIn = vi.fn();
    mocks.fetch.mockResolvedValue(Response.json({ is_new_user: false }));
    renderButton({ onSignedIn });
    await credentialReceived();
    expect(onSignedIn).toHaveBeenCalledOnce();
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("closes the modal and sends a new user to onboarding", async () => {
    const onSignedIn = vi.fn();
    mocks.fetch.mockResolvedValue(Response.json({ is_new_user: true }));
    renderButton({ onSignedIn });
    await credentialReceived();
    expect(onSignedIn).toHaveBeenCalledOnce();
    expect(mocks.router.replace).toHaveBeenCalledWith("/onboarding");
  });

  it("uses the current locale for the official button", async () => {
    renderButton({}, "ar");
    await waitFor(() => expect(mocks.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
      theme: "outline", size: "large", text: "continue_with", locale: "ar",
    })));
    expect(mocks.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: "web-client-id", ux_mode: "popup" }));
    expect(screen.getByText(arabicMessages.auth.google.divider)).toBeInTheDocument();
  });

  it("shows a generic error for other backend failures", async () => {
    mocks.fetch.mockResolvedValue(Response.json({ detail: "Not configured" }, { status: 503 }));
    renderButton();
    await credentialReceived();
    expect(screen.getByRole("alert")).toHaveTextContent(messages.auth.google.error);
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("shows unavailable if the Google script cannot load", async () => {
    mocks.loadGoogleIdentity.mockRejectedValue(new Error("Script blocked"));
    renderButton();
    expect(await screen.findByRole("alert")).toHaveTextContent(messages.auth.google.unavailable);
  });
});


describe("Google sign-in in the auth modal", () => {
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it.each([true, false])("preserves parent success (profile lookup fails: %s)", async (profileFails) => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "web-client-id");
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.loadGoogleIdentity.mockResolvedValue({
      initialize: mocks.initialize, renderButton: mocks.renderButton,
    });
    mocks.fetch.mockResolvedValueOnce(Response.json({ is_new_user: false }));
    if (profileFails) mocks.fetch.mockRejectedValueOnce(new Error("Network unavailable"));
    else mocks.fetch.mockResolvedValueOnce(Response.json({
      id: 1, name: "Ali", email: "ali@example.com", phone_number: null,
      role: "STUDENT", is_active: true, created_at: "2026-10-19T00:00:00Z",
    }));
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthModal isOpen initialMode="signin" onClose={onClose} onSuccess={onSuccess} />
      </NextIntlClientProvider>,
    );
    await credentialReceived();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(profileFails ? "Student" : "Ali"));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.fetch).toHaveBeenNthCalledWith(2, "/api/student/auth/me", expect.any(Object));
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });
});
