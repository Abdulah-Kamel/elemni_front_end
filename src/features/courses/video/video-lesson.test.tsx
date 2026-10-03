import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import en from "@/src/messages/en.json";
import { StudentApiError } from "@/src/lib/student-api/client";
import type { PublicItemDto, PublicLessonDto } from "@/src/lib/student-api/contract";
import VideoLesson from "./video-lesson";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), getVideoProgress: vi.fn() }));
vi.mock("@/src/i18n/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/src/lib/student-api/video-analytics", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/src/lib/student-api/video-analytics")>(),
  getVideoProgress: mocks.getVideoProgress,
}));

const item: PublicItemDto = {
  id: 42, title: "Lecture 1", order: 1, duration_minutes: 2, duration_seconds: 100,
  has_video: true, has_document: false, has_exam: false, bunny_stream_embed_url: null,
  document_path: null, exam_id: null,
};
const lesson: PublicLessonDto = {
  id: 12, title: "Kinematics", description: null, order: 1, duration_minutes: 2, items: [item],
};

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.getVideoProgress.mockReset();
});
afterEach(cleanup);

describe("VideoLesson", () => {
  it("redirects to login once when the progress query returns 401", async () => {
    mocks.getVideoProgress.mockRejectedValue(new StudentApiError(401, "SESSION_EXPIRED"));
    const client = new QueryClient();
    const onCompleted = vi.fn();
    const ui = (completed: boolean) => (
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en" messages={en}>
          <VideoLesson item={item} lesson={lesson} courseId={7} completed={completed} onCompleted={onCompleted} />
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
    const view = render(ui(false));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    view.rerender(ui(true));
    expect(mocks.replace).toHaveBeenCalledTimes(1);
  });
});
