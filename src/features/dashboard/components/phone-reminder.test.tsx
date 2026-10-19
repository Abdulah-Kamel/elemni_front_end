import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStudentProfile } from "@/src/features/student/hooks/use-student-queries";
import { studentApiFetch } from "@/src/lib/student-api/client";
import en from "@/src/messages/en.json";
import { PhoneReminder } from "./phone-reminder";

vi.mock("@/src/lib/student-api/client", () => ({
  StudentApiError: class extends Error {},
  studentApiFetch: vi.fn(),
  isStudentUnauthorized: () => false,
}));

const t = en.studentDashboard.phoneReminder;
const dismissedKey = "elemni-phone-reminder-dismissed";
let phone: string | null;
const clients: QueryClient[] = [];

/** Shows the reminder the way the dashboard does: only while the backend profile has no phone. */
function ReminderForProfile() {
  const { data } = useStudentProfile();
  return data && data.phone_number == null ? <PhoneReminder /> : null;
}

function renderReminder() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={en}>
        <ReminderForProfile />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("PhoneReminder", () => {
  beforeEach(() => {
    phone = null;
    sessionStorage.clear();
    vi.mocked(studentApiFetch).mockReset();
    vi.mocked(studentApiFetch).mockImplementation(async (path, options) => {
      if (path === "/api/student/profile" && options?.method === "PUT") {
        phone = JSON.parse(options.body as string).phone_number.replaceAll(" ", "");
      }
      if (path === "/api/student/profile") return { phone_number: phone, grade_id: 1, stream_id: 2, subject_ids: [] };
      throw new Error(`Unexpected request: ${path}`);
    });
  });

  afterEach(() => {
    cleanup();
    clients.splice(0).forEach((client) => client.clear());
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("saves only the phone and hides once the profile has it", async () => {
    renderReminder();
    fireEvent.change(await screen.findByLabelText(t.label), { target: { value: "+20 100 000 0000" } });
    fireEvent.click(screen.getByRole("button", { name: t.save }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: t.title })).not.toBeInTheDocument());
    expect(studentApiFetch).toHaveBeenCalledWith("/api/student/profile", {
      method: "PUT", body: JSON.stringify({ phone_number: "+20 100 000 0000" }),
    });
    expect(phone).toBe("+201000000000");
    expect(sessionStorage.getItem(dismissedKey)).toBeNull();
  });

  it("stays hidden for the rest of the browser session once dismissed", async () => {
    const first = renderReminder();
    fireEvent.click(await screen.findByRole("button", { name: t.dismiss }));
    expect(screen.queryByRole("heading", { name: t.title })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(dismissedKey)).toBe("1");
    first.unmount();
    renderReminder();
    await waitFor(() => expect(studentApiFetch).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("heading", { name: t.title })).not.toBeInTheDocument();
    cleanup();
    sessionStorage.clear();
    renderReminder();
    expect(await screen.findByRole("heading", { name: t.title })).toBeInTheDocument();
  });

  it.each(["", "abc", "123456789", "123456789012345678901"])("rejects the invalid phone %j", async (value) => {
    renderReminder();
    const input = await screen.findByLabelText(t.label);
    fireEvent.change(input, { target: { value } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(t.invalid);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(studentApiFetch).not.toHaveBeenCalledWith("/api/student/profile", expect.objectContaining({ method: "PUT" }));
  });

  it("shows an inline error when saving fails", async () => {
    renderReminder();
    const input = await screen.findByLabelText(t.label);
    vi.mocked(studentApiFetch).mockRejectedValueOnce(new Error("Unavailable"));
    fireEvent.change(input, { target: { value: "01000000000" } });
    fireEvent.click(screen.getByRole("button", { name: t.save }));
    expect(await screen.findByRole("alert")).toHaveTextContent(t.error);
    expect(input).toHaveValue("01000000000");
    expect(screen.getByRole("button", { name: t.save })).toBeEnabled();
  });

  it("can be dismissed when session storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    renderReminder();
    fireEvent.click(await screen.findByRole("button", { name: t.dismiss }));
    expect(screen.queryByRole("heading", { name: t.title })).not.toBeInTheDocument();
  });
});
