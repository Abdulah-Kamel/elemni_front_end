import { expect, test, type Page } from "@playwright/test";

const EMBED_ORIGIN = "https://iframe.mediadelivery.net";
const EMBED_URL = `${EMBED_ORIGIN}/embed/1/fake-guid?token=t&expires=9999999999`;

// Minimal player.js receiver: answers ready, getters, setCurrentTime, and autoplays.
const FAKE_PLAYER = `<!doctype html><html><body style="margin:0;background:#000">
<script>
  let current = 0; let paused = true; const listeners = {};
  const send = (msg) => parent.postMessage(JSON.stringify({ context: "player.js", version: "0.0.11", ...msg }), "*");
  const fire = (event, value) => (listeners[event] || []).forEach((listener) => send({ event, value, listener }));
  window.addEventListener("message", (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.context !== "player.js") return;
    if (m.method === "addEventListener") {
      (listeners[m.value] = listeners[m.value] || []).push(m.listener);
      if (m.value === "ready") send({ event: "ready", value: {}, listener: m.listener });
    } else if (m.method === "getCurrentTime") send({ event: "getCurrentTime", value: current, listener: m.listener });
    else if (m.method === "getPaused") send({ event: "getPaused", value: paused, listener: m.listener });
    else if (m.method === "setCurrentTime") {
      current = m.value; fire("seeked");
      paused = false; fire("play");
      setInterval(() => { if (!paused) { current += 1; fire("timeupdate", { seconds: current, duration: 1800 }); } }, 1000);
    }
  });
</script></body></html>`;

const course = {
  id: 1, title: "Physics 101", description: null, img: null, price: 100, subject_name: "Physics",
  grade_id: 1, stream_id: 1, total_duration_minutes: 30, lesson_count: 1, use_chapters: false,
  is_subscribed: true, created_at: "2026-09-01T00:00:00Z", teacher_name: "T", teacher_slug: "t",
  chapters: [{ id: 1, title: "Ch", order: 1, lessons: [{ id: 11, title: "Kinematics", description: null, order: 1, duration_minutes: 30,
    items: [{ id: 101, title: "Lecture 1", order: 1, duration_minutes: 30, duration_seconds: 1800, has_video: true,
      has_document: false, has_exam: false, bunny_stream_embed_url: null, document_path: null, exam_id: null }] }] }],
};
const enrollment = {
  id: 1, course_id: 1, purchased_at: "2026-09-01T00:00:00Z", expires_at: "2027-09-01T00:00:00Z",
  course_price: 100, total_paid: 100, currency: "EGP", payment_status: "completed", course,
  progress: { completion_percent: 0, completed_item_ids: [], last_item_id: 101, last_lesson_id: 11,
    next_item_id: 101, next_lesson_id: 11, last_opened_at: null, video_progress: [] },
};

async function mockLearner(page: Page, overrides: { progress?: object; heartbeat?: { status: number; body: object } } = {}) {
  await page.context().addCookies([{ name: "elemni_access", value: "e2e", domain: "127.0.0.1", path: "/" }]);
  await page.route(`${EMBED_ORIGIN}/**`, (route) => route.fulfill({ contentType: "text/html", body: FAKE_PLAYER }));
  await page.route("**/api/student/auth/me", (route) => route.fulfill({ json: {
    id: 1, email: "s@e.test", name: "Student", phone_number: null, role: "STUDENT", is_active: true, created_at: "2026-01-01T00:00:00Z" } }));
  await page.route("**/api/student/my-courses", (route) => route.fulfill({ json: { items: [enrollment] } }));
  await page.route("**/api/student/my-courses/1**", (route) => route.fulfill({ json: { enrollment, course, teacher: null } }));
  await page.route("**/api/student/video-analytics/items/101/progress", (route) => route.fulfill({ json: {
    item_id: 101, attempt_id: 10, attempt_status: "active", last_position_sec: 30, watched_percent: 2,
    completed_attempts: 0, allowance_remaining: 1, allowance_source: "base", last_watched_at: null, completed_at: null,
    ...overrides.progress } }));
  await page.route("**/api/student/video-analytics/items/101/playback", (route) => route.fulfill({ json: {
    embed_url: EMBED_URL, attempt_id: 10, session_id: 105, attempt_status: "active", expires_in: 3600,
    allowance_remaining: 1, allowance_source: "base", completed_attempts: 0 } }));
  const heartbeats: unknown[] = [];
  await page.route("**/api/student/video-analytics/sessions/105/heartbeat", async (route) => {
    heartbeats.push(route.request().postDataJSON());
    const reply = overrides.heartbeat ?? { status: 200, body: { accepted: true, duplicate: false, completed: true, watched_percent: 91, last_position_sec: 31 } };
    await route.fulfill({ status: reply.status, json: reply.body });
  });
  await page.route("**/api/student/video-analytics/sessions/105/end", (route) => route.fulfill({ json: { status: "ok" } }));
  return { heartbeats };
}

test("resume seeks, reports a heartbeat and shows completion", async ({ page }) => {
  const { heartbeats } = await mockLearner(page);
  await page.goto("/en/my-courses/1?item=101");
  await expect(page.getByText("Resume from 0:30")).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect.poll(() => heartbeats.length).toBeGreaterThan(0);
  expect(heartbeats[0]).toMatchObject({ sequence: 1, state: "playing" });
  expect((heartbeats[0] as { position_sec: number }).position_sec).toBeGreaterThanOrEqual(28);
  await expect(page.locator("#course-player").getByText("Done")).toBeVisible();
});

test("watch limit blocks playback", async ({ page }) => {
  await mockLearner(page, { progress: { attempt_status: "completed", completed_attempts: 2, allowance_remaining: 0 } });
  await page.goto("/en/my-courses/1?item=101");
  await expect(page.getByText("Watch limit reached")).toBeVisible();
  await expect(page.getByRole("button", { name: /Resume|Play|Watch again/ })).toHaveCount(0);
});

test("a displaced session offers resume instead of retrying", async ({ page }) => {
  await mockLearner(page, { heartbeat: { status: 409, body: { code: "BACKEND_ERROR_409", detail: "Session is no longer active" } } });
  await page.goto("/en/my-courses/1?item=101");
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByText("Playback paused here")).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
});
