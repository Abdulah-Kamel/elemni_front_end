# Video Analytics Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution method (chosen by the user):** every task is delegated to the OpenAI Codex CLI through the `codex-delegate` skill, using the **Model** line on each task. The orchestrator writes each brief from this plan + the spec, dispatches, re-runs the gates, reviews the diff, and **commits** (Codex never commits; "Commit" steps below are orchestrator steps).

**Goal:** Students watch course videos through signed BunnyStream URLs with heartbeat telemetry, resume, completion, watch limits, curriculum progress and a dashboard "Continue Watching" tile — with correct backend accounting.

**Architecture:** Backend (`elemni`) gets two accounting fixes. Frontend (`elemni_front_end`) adds typed contracts, five thin BFF routes, a framework-free player.js bridge and heartbeat controller, a React session hook, a preview card, and wires them into the existing learner page, curriculum and dashboard.

**Tech Stack:** FastAPI + SQLAlchemy async + pytest (backend); Next.js 16, React 19, TanStack Query 5, next-intl 4, Vitest 4 + Testing Library, Playwright (frontend).

**Spec:** `docs/superpowers/specs/2026-10-04-video-analytics-integration-design.md`

## Global Constraints

- Frontend repo: `/home/abdullahkm/projects/Elemni/elemni_front_end`, branch `feat/video-analytics`. Backend repo: `/home/abdullahkm/projects/Elemni/elemni`, branch `feat/video-analytics-accounting` (create from `main`; leave the untracked `env` file alone).
- Read `elemni_front_end/CLAUDE.md` and `AGENTS.md`. Next.js 16: consult `node_modules/next/dist/docs/` before framework changes.
- Browser never calls the backend directly and never sees tokens; all authenticated calls go through `src/app/api/student/**` BFF routes using `authenticatedBackendFetch`.
- Import alias `@/*` = repo root, e.g. `@/src/lib/student-api/client`. No barrel files. Feature-first placement.
- All user-facing strings in `src/messages/en.json` **and** `src/messages/ar.json`. Arabic is the default locale (RTL). Logical Tailwind utilities only (`ms-`, `pe-`, `start-`, …), never `ml-`/`left-`.
- Files are LF; preserve line endings, keep diffs proportional.
- `HEARTBEAT_INTERVAL_MS = 20_000`. Ambiguous-failure retries `[1_000, 3_000]` ms. Ready timeout 10 s, probe 500 ms, method timeout 3 s, seek confirmation ±2 s within 5 s, exit flush cap 4 s.
- Backend error `detail` strings are matched exactly as listed in Task 2.
- Frontend gates: `npm run test:unit -- <paths>`, `npm run build` (TypeScript gate), `npm run lint`. E2E: `npm run test:e2e -- tests/e2e/video-analytics.spec.ts`.
- Backend gate (needs the dockerized Postgres on `localhost:5432`, which is running): `UV_PROJECT_ENVIRONMENT=$HOME/.cache/elemni-test-venv uv run --frozen pytest tests/video_analytics -q -p no:cacheprovider` from `elemni/`. The repo `.venv` is root-owned from Docker — do not use or modify it.

## Review Focus

1. Two tabs on the same video: the displaced tab must show "Playback paused here" and must **not** call `/playback` on its own (no takeover loop). → Task 8 test `does not auto-recover on session loss`.
2. Item with both video and document: opening the document must not mark the item complete. → Task 10 test `document open on a video item sends no progress PUT`.
3. Completion refetch changes `next_item_id` while a video plays: the player must keep showing the same item. → Task 10 test `keeps the selected item after progress refetch`.
4. Pause pressed while a heartbeat is in flight: the `paused` heartbeat must still be sent, after the in-flight one, with the latest position. → Task 7 test `queues pause behind an in-flight heartbeat`.
5. Arabic locale: times render as Latin `m:ss` inside an LTR span and the views-remaining plural is correct for 0/1/2/11. → Task 9 test `renders Arabic resume time and plurals`.

## File Map

Backend (`elemni`):
- Modify `src/video_analytics/service.py` — `_create_attempt` seeding (B1), heartbeat credit (B2), new `_inheritable_ranges`.
- Modify `tests/video_analytics/test_service.py` — 3 new tests, rewrite `test_multi_day_resume_completion` day 1.

Frontend (`elemni_front_end`):
- Modify `src/lib/student-api/contract.ts` — video DTOs.
- Modify `src/lib/student-api/backend.ts` (+ new `backend.test.ts`) — `retryAfter`.
- Modify `src/lib/student-api/client.ts` (+ new `client.test.ts`) — `retryAfterSec`.
- Create `src/lib/student-api/video-errors.ts` (+ test) — error classifier.
- Create `src/lib/student-api/route-params.ts` — id/number validation for BFF routes.
- Create `src/app/api/student/video-analytics/**/route.ts` (5 routes) + `src/app/api/student/video-analytics/routes.test.ts`.
- Modify `src/lib/student-api/session.ts` (+ tests) — refresh when access cookie missing; `hasStudentSession()`.
- Modify page guards in `src/app/[locale]/{dashboard,onboarding,my-courses,explore}/**/page.tsx`.
- Create `src/lib/student-api/video-analytics.ts` (+ test) — browser transport.
- Modify `src/features/student/query-keys.ts`; create `src/features/student/hooks/use-video-analytics-queries.ts` (+ test).
- Create `src/features/courses/video/format-playback-time.ts` (+ test).
- Create `src/features/courses/video/player-bridge.ts` (+ test).
- Create `src/features/courses/video/heartbeat-controller.ts` (+ test).
- Create `src/features/courses/video/use-video-session.ts` (+ test).
- Create `src/features/courses/video/video-preview-card.tsx` (+ test), `src/features/courses/video/video-lesson.tsx`.
- Modify `src/features/courses/components/learner-player.tsx`, `course-detail.tsx`, `curriculum-accordion.tsx`, `learner-curriculum-sidebar.tsx`, `src/app/[locale]/my-courses/[courseId]/page.tsx`.
- Modify `src/lib/student-api/adapters.ts`, `src/features/teachers/types.ts`, `src/features/teachers/components/client/teacher-profile-view.tsx` — remove dead `videoUrl`.
- Modify `src/features/dashboard/components/student-dashboard.tsx`; create `src/features/dashboard/continue-watching.ts` (+ test).
- Modify `src/messages/{en,ar}.json`.
- Create `tests/e2e/video-analytics.spec.ts`.

Task order: 1 (backend) is independent. Frontend: 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13.

---

### Task 1: Backend accounting fixes (B1 + B2)

**Model:** `gpt-6-astra`, effort `high` — subtle accounting with concurrency-sensitive code; correctness matters more than speed.
**Repo:** `elemni` (branch `feat/video-analytics-accounting`).

**Files:**
- Modify: `src/video_analytics/service.py` (`_create_attempt` ~L228-261; heartbeat credit ~L575-590)
- Modify: `tests/video_analytics/test_service.py`

**Interfaces:**
- Consumes: `merge_ranges`, `calculate_unique_seconds`, `calculate_watched_percent` from `src/video_analytics/utils.py`.
- Produces: no API change. New private method `VideoAnalyticsService._inheritable_ranges(user_id: int, item_id: int, duration: int) -> list[list[int]]`.

- [ ] **Step 1: Write the failing tests** — append to `tests/video_analytics/test_service.py`:

```python
def _signed_stream():
    stream = MagicMock()
    stream.generate_signed_embed_url.return_value = "https://signed.test/video"
    return stream


async def _heartbeats(db, service, user_id, session_id, first_sequence, positions, elapsed=60):
    """Send `playing` heartbeats, pretending `elapsed` seconds passed before each."""
    sequence = first_sequence
    result = None
    for position in positions:
        session = await db.get(VideoPlaybackSession, session_id)
        session.last_heartbeat_at = datetime.now(UTC) - timedelta(seconds=elapsed)
        await db.commit()
        result = await service.heartbeat(session_id, user_id, sequence, position, "playing")
        sequence += 1
        if result["completed"]:
            break
    return result, sequence


@pytest.mark.asyncio
async def test_replay_after_completion_starts_without_inherited_credit(factory, stream_ids):
    user_id, _, item_id, _ = await _context(
        factory, stream_ids["SCIENCE"], max_watch_count=3, duration=100
    )
    async with factory() as db:
        service = VideoAnalyticsService(db)
        service._create_bunny_stream = MagicMock(return_value=_signed_stream())
        first = await service.get_playback_url(item_id, user_id)
        result, _ = await _heartbeats(db, service, user_id, first["session_id"], 1, [0, 60, 100])
        assert result["completed"] is True

        replay = await service.get_playback_url(item_id, user_id, position_sec=0)
        assert replay["attempt_id"] != first["attempt_id"]
        attempt = await db.get(VideoWatchAttempt, replay["attempt_id"])
        assert attempt.watched_ranges == []
        assert attempt.credited_unique_seconds == 0

        result, _ = await _heartbeats(db, service, user_id, replay["session_id"], 1, [0, 30])
        assert result["completed"] is False


@pytest.mark.asyncio
async def test_new_attempt_after_expiry_inherits_only_watched_ranges(factory, stream_ids):
    user_id, _, item_id, _ = await _context(
        factory, stream_ids["SCIENCE"], max_watch_count=3, duration=100
    )
    async with factory() as db:
        service = VideoAnalyticsService(db)
        service._create_bunny_stream = MagicMock(return_value=_signed_stream())
        first = await service.get_playback_url(item_id, user_id)
        _, sequence = await _heartbeats(db, service, user_id, first["session_id"], 1, [0, 60])
        # Seek to 80 and pause immediately: checkpoint moves, no credit is earned.
        await service.heartbeat(first["session_id"], user_id, sequence, 80, "paused")

        attempt = await db.get(VideoWatchAttempt, first["attempt_id"])
        attempt.last_activity_at = datetime.now(UTC) - timedelta(hours=25)
        await db.commit()
        assert await service.expire_inactive_attempts() == 1

        second = await service.get_playback_url(item_id, user_id)
        attempt2 = await db.get(VideoWatchAttempt, second["attempt_id"])
        assert attempt2.watched_ranges == [[0, 60]]
        assert attempt2.credited_unique_seconds == 60
        assert attempt2.last_position_seconds == 80


@pytest.mark.asyncio
async def test_seek_forward_does_not_credit_the_seek_target(factory, stream_ids):
    user_id, _, item_id, _ = await _context(
        factory, stream_ids["SCIENCE"], max_watch_count=3, duration=1000
    )
    async with factory() as db:
        service = VideoAnalyticsService(db)
        service._create_bunny_stream = MagicMock(return_value=_signed_stream())
        playback = await service.get_playback_url(item_id, user_id)
        session_id = playback["session_id"]
        _, sequence = await _heartbeats(db, service, user_id, session_id, 1, [0, 800])
        result, _ = await _heartbeats(db, service, user_id, session_id, sequence, [820], elapsed=20)

        attempt = await db.get(VideoWatchAttempt, playback["attempt_id"])
        assert calculate_unique_seconds(attempt.watched_ranges) == 80
        assert attempt.credited_unique_seconds == 80
        assert result["watched_percent"] == 8
        assert result["completed"] is False
```

- [ ] **Step 2: Rewrite day 1 of `test_multi_day_resume_completion`** so attempt 1 genuinely watches 0→872 (the old test relied on the checkpoint-seeding bug). Replace the block from `# Send heartbeat moving to 872s` through `assert res["completed"] is False` with:

```python
        # Genuinely watch 0:00 → 14:32 in ≤60 s steps (server credits elapsed time only).
        positions = [0, *range(60, 872, 60), 872]
        res, _ = await _heartbeats(db, service, user_id, session_id, 1, positions)
        assert res["accepted"] is True
        assert res["completed"] is False
```

Keep the later assertions `attempt2.last_position_seconds == 872` and `attempt2.credited_unique_seconds == 872` unchanged — they must now hold because attempt 2 inherits attempt 1's real ranges `[[0, 872]]`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `UV_PROJECT_ENVIRONMENT=$HOME/.cache/elemni-test-venv uv run --frozen pytest tests/video_analytics/test_service.py -q -p no:cacheprovider -k "replay_after_completion or inherits_only or seek_forward or multi_day"`
Expected: `test_replay_after_completion…` FAIL (credited 100 ≠ 0), `test_new_attempt_after_expiry…` FAIL (ranges `[[0, 80]]`), `test_seek_forward…` FAIL (credited 820 ≠ 80); `test_multi_day…` PASS (still passes with old seeding).

- [ ] **Step 4: Implement B1** — in `_create_attempt` replace the seeding block:

```python
        progress = await self.db.get(VideoWatchProgress, (enrollment.user_id, item.id))
        initial_position = progress.last_position_seconds if progress else 0
        inherited_ranges = await self._inheritable_ranges(
            enrollment.user_id, item.id, duration
        )
        initial_credited = calculate_unique_seconds(inherited_ranges)
        initial_percent = (
            calculate_watched_percent(initial_credited, duration)
            if initial_credited > 0
            else 0
        )
```

and in the `VideoWatchAttempt(...)` constructor use `watched_ranges=inherited_ranges,` (keep `last_position_seconds=initial_position`, `credited_unique_seconds=initial_credited`, `credited_percent=initial_percent`). Add the method right after `_create_attempt`:

```python
    async def _inheritable_ranges(
        self, user_id: int, item_id: int, duration: int
    ) -> list[list[int]]:
        """Watched ranges a new attempt may carry over.

        Only an attempt that expired incomplete hands over its *actually
        credited* ranges, so multi-day resume never re-requires watched
        sections. A completed attempt (a replay) or no history starts fresh;
        the resume checkpoint alone never grants credit.
        """
        if duration <= 0:
            return []
        previous = await self.db.scalar(
            select(VideoWatchAttempt)
            .where(
                VideoWatchAttempt.user_id == user_id,
                VideoWatchAttempt.item_id == item_id,
                VideoWatchAttempt.status != "active",
            )
            .order_by(VideoWatchAttempt.started_at.desc(), VideoWatchAttempt.id.desc())
            .limit(1)
        )
        if previous is None or previous.status != "expired":
            return []
        ranges: list[list[int]] = []
        for start, end in previous.watched_ranges or []:
            ranges = merge_ranges(ranges, [max(0, int(start)), min(int(end), duration)])
        return ranges
```

Ensure `merge_ranges` and `calculate_unique_seconds` are imported at the top of `service.py` (add to the existing `from src.video_analytics.utils import …` if missing).

- [ ] **Step 5: Implement B2** — in `heartbeat`, replace

```python
                    attempt.credited_unique_seconds = max(
                        attempt.credited_unique_seconds,
                        end,
                        calculate_unique_seconds(attempt.watched_ranges),
                    )
```

with

```python
                    # Credit is unique watched time only; a playback position
                    # is not proof of viewing.
                    attempt.credited_unique_seconds = max(
                        attempt.credited_unique_seconds,
                        calculate_unique_seconds(attempt.watched_ranges),
                    )
```

- [ ] **Step 6: Run the whole video-analytics suite**

Run: `UV_PROJECT_ENVIRONMENT=$HOME/.cache/elemni-test-venv uv run --frozen pytest tests/video_analytics -q -p no:cacheprovider`
Expected: all PASS (including `test_jump_cannot_complete_from_position_alone` and the four tests above).

- [ ] **Step 7: Commit** (orchestrator, in `elemni`)

```bash
git switch -c feat/video-analytics-accounting
git add src/video_analytics/service.py tests/video_analytics/test_service.py
git commit -m "fix(video-analytics): credit only watched ranges; replays start fresh"
```

---

### Task 2: Contracts, error transport, and error classifier

**Model:** `gpt-6.1-sol`, effort `medium` — typed plumbing with small, exact behaviour.

**Files:**
- Modify: `src/lib/student-api/contract.ts`, `src/lib/student-api/backend.ts`, `src/lib/student-api/client.ts`
- Create: `src/lib/student-api/video-errors.ts`
- Test: `src/lib/student-api/backend.test.ts`, `src/lib/student-api/client.test.ts`, `src/lib/student-api/video-errors.test.ts`

**Interfaces:**
- Produces (contract.ts): `PlaybackDto`, `HeartbeatState`, `HeartbeatRequestDto`, `HeartbeatDto`, `VideoProgressDto`, `LastWatchedDto`, `ItemVideoProgressDto`; `EnrollmentProgressDto.video_progress?: ItemVideoProgressDto[]`; `PublicItemDto.duration_seconds?: number | null`, `PublicItemDto.max_watch_count?: number | null`.
- Produces (backend.ts): `BackendError.retryAfter?: string`; `backendErrorResponse` sets `Retry-After` header when present.
- Produces (client.ts): `new StudentApiError(status, code, detail?, retryAfterSec?)`, field `retryAfterSec?: number`.
- Produces (video-errors.ts): `type VideoErrorKind`, `classifyVideoError(error: unknown): VideoErrorKind`, `isAmbiguousFailure(error: unknown): boolean`.

- [ ] **Step 1: Add DTOs to `contract.ts`** (append; extend the two existing interfaces):

```ts
export interface ItemVideoProgressDto {
  item_id: number;
  last_position_sec: number;
  watched_percent: number;
  is_completed: boolean;
}

export interface PlaybackDto {
  embed_url: string;
  attempt_id: number;
  session_id: number;
  attempt_status: "active";
  expires_in: number;
  allowance_remaining: number | null;
  allowance_source: "base" | "grant";
  completed_attempts: number;
}

export type HeartbeatState = "playing" | "paused" | "ended";

export interface HeartbeatRequestDto {
  sequence: number;
  position_sec: number;
  state: HeartbeatState;
}

export interface HeartbeatDto {
  accepted: boolean;
  duplicate: boolean;
  completed: boolean;
  watched_percent: number;
  last_position_sec: number;
}

export interface VideoProgressDto {
  item_id: number;
  attempt_id: number | null;
  attempt_status: "active" | "completed" | "expired" | "none";
  last_position_sec: number;
  watched_percent: number;
  completed_attempts: number;
  allowance_remaining: number | null;
  allowance_source: "base" | "grant" | null;
  last_watched_at: string | null;
  completed_at: string | null;
}

export interface LastWatchedDto {
  course_id: number;
  course_title: string;
  lesson_id: number;
  lesson_title: string;
  item_id: number;
  item_title: string;
  last_position_sec: number;
  watched_percent: number;
  is_completed: boolean;
  last_watched_at: string;
}
```

In `PublicItemDto` add `duration_seconds?: number | null;` and `max_watch_count?: number | null;`. In `EnrollmentProgressDto` add `video_progress?: ItemVideoProgressDto[];`.

- [ ] **Step 2: Write failing tests**

`src/lib/student-api/backend.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/env", () => ({ env: { API_URL: "http://backend.test" } }));

import { backendErrorResponse, backendFetch } from "./backend";

afterEach(() => vi.unstubAllGlobals());

describe("backend Retry-After passthrough", () => {
  it("captures Retry-After on backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ detail: "Heartbeat throttled" }), {
        status: 429,
        headers: { "Retry-After": "15", "Content-Type": "application/json" },
      }),
    ));
    const result = await backendFetch("/x");
    expect(result).toEqual({
      ok: false,
      error: { status: 429, code: "BACKEND_ERROR_429", detail: "Heartbeat throttled", retryAfter: "15" },
    });
  });

  it("re-emits Retry-After from backendErrorResponse", () => {
    const response = backendErrorResponse({ status: 503, code: "BACKEND_ERROR_503", retryAfter: "1" });
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("1");
  });

  it("omits Retry-After when absent", () => {
    expect(backendErrorResponse({ status: 409, code: "X" }).headers.get("Retry-After")).toBeNull();
  });
});
```

`src/lib/student-api/client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentApiError, studentApiFetch } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("studentApiFetch errors", () => {
  it("exposes detail and Retry-After seconds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ code: "BACKEND_ERROR_429", detail: "Heartbeat throttled" }), {
        status: 429,
        headers: { "Retry-After": "15" },
      }),
    ));
    const error = await studentApiFetch("/api/x").catch((caught) => caught);
    expect(error).toBeInstanceOf(StudentApiError);
    expect(error).toMatchObject({ status: 429, code: "BACKEND_ERROR_429", detail: "Heartbeat throttled", retryAfterSec: 15 });
  });

  it("ignores a non-numeric Retry-After", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response("{}", { status: 503, headers: { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" } }),
    ));
    const error = await studentApiFetch("/api/x").catch((caught) => caught);
    expect(error.retryAfterSec).toBeUndefined();
  });

  it("maps a network failure to SERVICE_UNAVAILABLE", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const error = await studentApiFetch("/api/x").catch((caught) => caught);
    expect(error).toMatchObject({ status: 503, code: "SERVICE_UNAVAILABLE" });
  });
});
```

`src/lib/student-api/video-errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { StudentApiError } from "./client";
import { classifyVideoError, isAmbiguousFailure } from "./video-errors";

const err = (status: number, detail?: string, code = `BACKEND_ERROR_${status}`) =>
  new StudentApiError(status, code, detail);

describe("classifyVideoError", () => {
  it.each([
    [err(401, undefined, "SESSION_EXPIRED"), "unauthenticated"],
    [err(403, "Watch limit reached (2)"), "watch-limit"],
    [err(403, "Not enrolled in this course"), "not-enrolled"],
    [err(403, "Not authorized"), "forbidden"],
    [err(403, "Account is disabled"), "forbidden"],
    [err(409, "Session is no longer active"), "session-lost"],
    [err(409, "Attempt has expired"), "attempt-ended"],
    [err(409, "Attempt is no longer active"), "attempt-ended"],
    [err(409, "Video stream is not ready"), "processing"],
    [err(409, "Video stream is not configured"), "unavailable"],
    [err(409, "Video duration is unavailable"), "unavailable"],
    [err(409, "Reserved grant is unavailable"), "unavailable"],
    [err(429, "Heartbeat throttled"), "transient"],
    [err(503, "Database transaction conflict; please retry"), "transient"],
    [err(503, undefined, "SERVICE_UNAVAILABLE"), "transient"],
    [err(404, "Video not found"), "unavailable"],
    [err(422, "Invalid playback position"), "unavailable"],
    [new TypeError("boom"), "transient"],
  ])("classifies %o as %s", (error, kind) => {
    expect(classifyVideoError(error)).toBe(kind);
  });
});

describe("isAmbiguousFailure", () => {
  it("is true only for the BFF/network SERVICE_UNAVAILABLE", () => {
    expect(isAmbiguousFailure(err(503, undefined, "SERVICE_UNAVAILABLE"))).toBe(true);
    expect(isAmbiguousFailure(err(503, "Database transaction conflict; please retry"))).toBe(false);
    expect(isAmbiguousFailure(err(429))).toBe(false);
    expect(isAmbiguousFailure(new TypeError("x"))).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:unit -- src/lib/student-api/backend.test.ts src/lib/student-api/client.test.ts src/lib/student-api/video-errors.test.ts`
Expected: FAIL (`retryAfter` missing, `retryAfterSec` undefined, `video-errors` module not found).

- [ ] **Step 4: Implement**

`backend.ts` — add `retryAfter?: string;` to `BackendError`; in the `!response.ok` branch:

```ts
      const retryAfter = response.headers.get("Retry-After") ?? undefined;
      return {
        ok: false,
        error: {
          status: response.status,
          code: typeof body?.code === "string" ? body.code : `BACKEND_ERROR_${response.status}`,
          ...(typeof body?.detail === "string" ? { detail: body.detail } : {}),
          ...(retryAfter ? { retryAfter } : {}),
        },
      };
```

and `backendErrorResponse`:

```ts
export function backendErrorResponse(error: BackendError) {
  const status = error.status >= 400 && error.status <= 599 ? error.status : 502;
  return Response.json(
    { code: error.code || `BACKEND_ERROR_${status}`, ...(error.detail ? { detail: error.detail } : {}) },
    { status, ...(error.retryAfter ? { headers: { "Retry-After": error.retryAfter } } : {}) },
  );
}
```

`client.ts` — constructor gains `retryAfterSec?: number` (stored as `readonly retryAfterSec?: number`); in the `!response.ok` branch:

```ts
    // Optional chaining: existing unit tests mock fetch with plain objects that have no headers.
    const retryAfterHeader = response.headers?.get("Retry-After") ?? null;
    const retryAfterSec = retryAfterHeader && /^\d+$/.test(retryAfterHeader.trim())
      ? Number(retryAfterHeader.trim())
      : undefined;
    throw new StudentApiError(
      response.status,
      typeof body?.code === "string" ? body.code : `BACKEND_ERROR_${response.status}`,
      typeof body?.detail === "string" ? body.detail : undefined,
      retryAfterSec,
    );
```

`video-errors.ts`:

```ts
import { StudentApiError } from "./client";

export type VideoErrorKind =
  | "unauthenticated"
  | "watch-limit"
  | "not-enrolled"
  | "forbidden"
  | "session-lost"
  | "attempt-ended"
  | "processing"
  | "unavailable"
  | "transient";

// Detail strings come from elemni/src/video_analytics/service.py.
export function classifyVideoError(error: unknown): VideoErrorKind {
  if (!(error instanceof StudentApiError)) return "transient";
  const detail = error.detail ?? "";
  switch (error.status) {
    case 401:
      return "unauthenticated";
    case 403:
      if (detail.startsWith("Watch limit reached")) return "watch-limit";
      if (detail === "Not enrolled in this course") return "not-enrolled";
      return "forbidden";
    case 409:
      if (detail === "Session is no longer active") return "session-lost";
      if (detail === "Attempt has expired" || detail === "Attempt is no longer active") return "attempt-ended";
      if (detail === "Video stream is not ready") return "processing";
      return "unavailable";
    case 429:
    case 503:
      return "transient";
    default:
      return "unavailable";
  }
}

/** The request may or may not have reached the backend (network error or BFF timeout). */
export function isAmbiguousFailure(error: unknown) {
  return error instanceof StudentApiError && error.status === 503 && error.code === "SERVICE_UNAVAILABLE";
}
```

- [ ] **Step 5: Run tests to verify they pass** — same command as Step 3. Expected: PASS. Also run `npm run test:unit -- src/lib/student-api src/app/api` (existing route tests use `backendErrorResponse`) → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/student-api/contract.ts src/lib/student-api/backend.ts src/lib/student-api/backend.test.ts src/lib/student-api/client.ts src/lib/student-api/client.test.ts src/lib/student-api/video-errors.ts src/lib/student-api/video-errors.test.ts
git commit -m "feat(video): video DTOs, Retry-After passthrough, error classifier"
```

---

### Task 3: BFF routes

**Model:** `gpt-6-luna`, effort `medium` — five mechanical passthrough handlers following an existing pattern.

**Files:**
- Create: `src/lib/student-api/route-params.ts`
- Create: `src/app/api/student/video-analytics/last-watched/route.ts`, `items/[itemId]/progress/route.ts`, `items/[itemId]/playback/route.ts`, `sessions/[sessionId]/heartbeat/route.ts`, `sessions/[sessionId]/end/route.ts`
- Test: `src/app/api/student/video-analytics/routes.test.ts`

**Interfaces:**
- Consumes: `authenticatedBackendFetch` (`session.ts`), `backendErrorResponse` (`backend.ts`), DTOs from Task 2.
- Produces: HTTP endpoints under `/api/student/video-analytics/…` (table in spec §1). `parsePositiveId(raw: string): number | null`, `isNonNegativeFinite(value: unknown): value is number`.

- [ ] **Step 1: Write the failing tests** — `src/app/api/student/video-analytics/routes.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticatedBackendFetch: vi.fn(),
  backendErrorResponse: vi.fn((error: { status: number; code: string; detail?: string; retryAfter?: string }) =>
    Response.json(
      { code: error.code, ...(error.detail ? { detail: error.detail } : {}) },
      { status: error.status, ...(error.retryAfter ? { headers: { "Retry-After": error.retryAfter } } : {}) },
    ),
  ),
}));

vi.mock("@/src/lib/student-api/session", () => ({ authenticatedBackendFetch: mocks.authenticatedBackendFetch }));
vi.mock("@/src/lib/student-api/backend", () => ({ backendErrorResponse: mocks.backendErrorResponse }));

import { GET as getLastWatched } from "./last-watched/route";
import { GET as getProgress } from "./items/[itemId]/progress/route";
import { POST as postPlayback } from "./items/[itemId]/playback/route";
import { POST as postHeartbeat } from "./sessions/[sessionId]/heartbeat/route";
import { POST as postEnd } from "./sessions/[sessionId]/end/route";

const itemParams = (itemId: string) => ({ params: Promise.resolve({ itemId }) });
const sessionParams = (sessionId: string) => ({ params: Promise.resolve({ sessionId }) });
const post = (body?: string, headers?: Record<string, string>) =>
  new Request("http://localhost/x", { method: "POST", ...(body === undefined ? {} : { body }), headers });

beforeEach(() => {
  mocks.authenticatedBackendFetch.mockReset();
  mocks.authenticatedBackendFetch.mockResolvedValue({ ok: true, status: 200, data: { ok: 1 } });
  mocks.backendErrorResponse.mockClear();
});

describe("GET last-watched", () => {
  it("proxies to the backend", async () => {
    const response = await getLastWatched();
    expect(response.status).toBe(200);
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/last-watched",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("passes a 404 through", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false, error: { status: 404, code: "BACKEND_ERROR_404", detail: "No video watch history found" },
    });
    const response = await getLastWatched();
    expect(response.status).toBe(404);
  });
});

describe("GET item progress", () => {
  it.each(["0", "-1", "1.5", "abc", "9007199254740993"])("rejects id %s without calling the backend", async (id) => {
    const response = await getProgress(new Request("http://localhost/x"), itemParams(id));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_ID" });
    expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
  });

  it("proxies a valid id", async () => {
    await getProgress(new Request("http://localhost/x"), itemParams("42"));
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/my-progress/42",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});

describe("POST playback", () => {
  it("forwards an absent body as absent", async () => {
    await postPlayback(post(), itemParams("42"));
    const init = mocks.authenticatedBackendFetch.mock.calls[0][1];
    expect(mocks.authenticatedBackendFetch.mock.calls[0][0]).toBe("/api/v1/video-analytics/videos/42/playback");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("forwards only position_sec", async () => {
    await postPlayback(post(JSON.stringify({ position_sec: 872.5, extra: true })), itemParams("42"));
    expect(mocks.authenticatedBackendFetch.mock.calls[0][1].body).toBe(JSON.stringify({ position_sec: 872.5 }));
  });

  it.each(['{"position_sec":-1}', '{"position_sec":"5"}', "not json", "[]", '{"position_sec":null}'])(
    "rejects body %s",
    async (body) => {
      const response = await postPlayback(post(body), itemParams("42"));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ code: "INVALID_PLAYBACK" });
      expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
    },
  );

  it("passes the watch-limit 403 detail through", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false, error: { status: 403, code: "BACKEND_ERROR_403", detail: "Watch limit reached (2)" },
    });
    const response = await postPlayback(post(), itemParams("42"));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ detail: "Watch limit reached (2)" });
  });
});

describe("POST heartbeat", () => {
  const valid = { sequence: 3, position_sec: 12.5, state: "playing" };

  it("forwards exactly sequence, position_sec, state", async () => {
    await postHeartbeat(post(JSON.stringify({ ...valid, junk: 1 })), sessionParams("105"));
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/sessions/105/heartbeat",
      expect.objectContaining({ method: "POST", body: JSON.stringify(valid), cache: "no-store" }),
    );
  });

  it.each([
    { ...valid, sequence: 0 },
    { ...valid, sequence: 1.5 },
    { ...valid, position_sec: -1 },
    { ...valid, position_sec: "1" },
    { ...valid, state: "buffering" },
    {},
  ])("rejects %o", async (body) => {
    const response = await postHeartbeat(post(JSON.stringify(body)), sessionParams("105"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_HEARTBEAT" });
  });

  it("passes 429 with Retry-After through", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false, error: { status: 429, code: "BACKEND_ERROR_429", detail: "Heartbeat throttled", retryAfter: "15" },
    });
    const response = await postHeartbeat(post(JSON.stringify(valid)), sessionParams("105"));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("15");
  });
});

describe("POST end", () => {
  it("accepts a sendBeacon-style request without parsing its body", async () => {
    const response = await postEnd(post("garbage", { "Content-Type": "text/plain;charset=UTF-8" }), sessionParams("105"));
    expect(response.status).toBe(200);
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/video-analytics/sessions/105/end",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(mocks.authenticatedBackendFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it("rejects a bad session id", async () => {
    const response = await postEnd(post(), sessionParams("x"));
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- src/app/api/student/video-analytics/routes.test.ts`
Expected: FAIL (route modules not found).

- [ ] **Step 3: Implement**

`src/lib/student-api/route-params.ts`:

```ts
export function parsePositiveId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export const invalidIdResponse = () => Response.json({ code: "INVALID_ID" }, { status: 400 });
```

`last-watched/route.ts`:

```ts
import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { LastWatchedDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function GET() {
  const result = await authenticatedBackendFetch<LastWatchedDto>("/api/v1/video-analytics/last-watched", {
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
```

`items/[itemId]/progress/route.ts`:

```ts
import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { VideoProgressDto } from "@/src/lib/student-api/contract";
import { invalidIdResponse, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

export async function GET(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const itemId = parsePositiveId((await params).itemId);
  if (itemId === null) return invalidIdResponse();
  const result = await authenticatedBackendFetch<VideoProgressDto>(
    `/api/v1/video-analytics/my-progress/${itemId}`,
    { cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
```

`items/[itemId]/playback/route.ts`:

```ts
import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { PlaybackDto } from "@/src/lib/student-api/contract";
import { invalidIdResponse, isNonNegativeFinite, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

const invalidPlayback = () => Response.json({ code: "INVALID_PLAYBACK" }, { status: 400 });

export async function POST(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const itemId = parsePositiveId((await params).itemId);
  if (itemId === null) return invalidIdResponse();

  // An absent body means "keep the backend checkpoint"; never inject position 0.
  const raw = await request.text();
  let body: string | undefined;
  if (raw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return invalidPlayback();
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return invalidPlayback();
    const position = (parsed as { position_sec?: unknown }).position_sec;
    if (!isNonNegativeFinite(position)) return invalidPlayback();
    body = JSON.stringify({ position_sec: position });
  }

  const result = await authenticatedBackendFetch<PlaybackDto>(
    `/api/v1/video-analytics/videos/${itemId}/playback`,
    { method: "POST", ...(body ? { body } : {}), cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
```

`sessions/[sessionId]/heartbeat/route.ts`:

```ts
import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { HeartbeatDto, HeartbeatRequestDto } from "@/src/lib/student-api/contract";
import { invalidIdResponse, isNonNegativeFinite, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

const STATES = new Set(["playing", "paused", "ended"]);
const invalidHeartbeat = () => Response.json({ code: "INVALID_HEARTBEAT" }, { status: 400 });

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionId = parsePositiveId((await params).sessionId);
  if (sessionId === null) return invalidIdResponse();

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return invalidHeartbeat();
  }
  const candidate = (parsed ?? {}) as Partial<Record<keyof HeartbeatRequestDto, unknown>>;
  if (
    !Number.isSafeInteger(candidate.sequence) ||
    (candidate.sequence as number) < 1 ||
    !isNonNegativeFinite(candidate.position_sec) ||
    typeof candidate.state !== "string" ||
    !STATES.has(candidate.state)
  ) {
    return invalidHeartbeat();
  }
  const body: HeartbeatRequestDto = {
    sequence: candidate.sequence as number,
    position_sec: candidate.position_sec,
    state: candidate.state as HeartbeatRequestDto["state"],
  };

  const result = await authenticatedBackendFetch<HeartbeatDto>(
    `/api/v1/video-analytics/sessions/${sessionId}/heartbeat`,
    { method: "POST", body: JSON.stringify(body), cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
```

`sessions/[sessionId]/end/route.ts`:

```ts
import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { invalidIdResponse, parsePositiveId } from "@/src/lib/student-api/route-params";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

// Called by fetch(keepalive) and navigator.sendBeacon; the body is never read.
export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const sessionId = parsePositiveId((await params).sessionId);
  if (sessionId === null) return invalidIdResponse();
  const result = await authenticatedBackendFetch<{ status: string }>(
    `/api/v1/video-analytics/sessions/${sessionId}/end`,
    { method: "POST", cache: "no-store" },
  );
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
```

- [ ] **Step 4: Run to verify pass** — same command as Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-api/route-params.ts src/app/api/student/video-analytics
git commit -m "feat(video): BFF routes for video analytics"
```

---

### Task 4: Session refresh when the access cookie is missing

**Model:** `gpt-6.1-sol`, effort `high` — auth path; small diff, high blast radius.

**Files:**
- Modify: `src/lib/student-api/session.ts`
- Modify guards: `src/app/[locale]/dashboard/page.tsx`, `onboarding/page.tsx`, `my-courses/page.tsx`, `my-courses/[courseId]/page.tsx`, `explore/page.tsx`, `explore/teachers/page.tsx`, `explore/teachers/[id]/page.tsx`
- Test: `src/lib/student-api/session.test.ts`

**Interfaces:**
- Produces: `hasStudentSession(): Promise<boolean>` (access **or** refresh cookie present). `authenticatedBackendFetch` refreshes first when the access cookie is missing.

- [ ] **Step 1: Write failing tests** — append to `session.test.ts` (reuse its existing `mocks`, cookie and `./backend` mocks; the backend mock already answers `/api/v1/auth/refresh` with `fresh-access`). Read the existing file first and match its import of `authenticatedBackendFetch`. Add:

```ts
describe("missing access cookie", () => {
  beforeEach(() => {
    mocks.accessToken = "";
    mocks.refreshToken = "valid-refresh";
    mocks.refreshCount = 0;
    mocks.requestCount = 0;
  });

  it("refreshes before calling the backend", async () => {
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(mocks.refreshCount).toBe(1);
    expect(result.ok).toBe(true);
    expect(mocks.accessToken).toBe("fresh-access");
  });

  it("returns SESSION_REQUIRED without any call when no refresh cookie exists", async () => {
    mocks.refreshToken = "";
    const result = await authenticatedBackendFetch("/api/v1/my/courses");
    expect(result).toEqual({ ok: false, error: { status: 401, code: "SESSION_REQUIRED" } });
    expect(mocks.refreshCount).toBe(0);
  });
});

describe("hasStudentSession", () => {
  it.each([
    ["a", "", true],
    ["", "r", true],
    ["", "", false],
  ])("access=%s refresh=%s → %s", async (access, refresh, expected) => {
    mocks.accessToken = access;
    mocks.refreshToken = refresh;
    await expect(hasStudentSession()).resolves.toBe(expected);
  });
});
```

If the existing backend mock does not return success for non-refresh paths when called with `Authorization: Bearer fresh-access`, extend it so that a request bearing `fresh-access` returns `{ ok: true, status: 200, data: {} }` (keep existing behaviour for other tokens). Import `hasStudentSession` alongside `authenticatedBackendFetch`.

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- src/lib/student-api/session.test.ts`
Expected: FAIL (`SESSION_REQUIRED` returned instead of refreshing; `hasStudentSession` not exported).

- [ ] **Step 3: Implement** — refactor `session.ts`:
  1. Extract the existing refresh block (dedupe via `inFlightRefresh`, `setSession`, returns `TokenDto | null`) into `async function refreshAccessToken(): Promise<TokenDto | null>` that reads the refresh cookie itself and returns `null` if absent. Inside it, wrap `setSession(...)` in `try { … } catch { /* Server Components cannot set cookies; the refreshed token still serves this request. */ }`.
  2. Rewrite the head of `authenticatedBackendFetch`:

```ts
  let accessToken = await getAccessToken();
  if (!accessToken) {
    if (!(await getRefreshToken())) {
      return { ok: false, error: { status: 401, code: "SESSION_REQUIRED" } };
    }
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      await clearSession().catch(() => undefined);
      return { ok: false, error: { status: 401, code: "SESSION_EXPIRED" } };
    }
    accessToken = refreshed.access_token;
  }
```

  and make the existing 401-retry path call `refreshAccessToken()` (behaviour unchanged otherwise).
  3. Add:

```ts
export async function hasStudentSession() {
  return Boolean((await getAccessToken()) || (await getRefreshToken()));
}
```

  4. In each listed page guard replace `!(await getAccessToken())` with `!(await hasStudentSession())` and fix the import. Do **not** change `login/page.tsx` / `register/page.tsx` (they redirect *away* when logged in) or `public.ts` / API routes.
  5. In `my-courses/[courseId]/page.tsx` also preserve the deep link in the login redirect: accept `searchParams: Promise<{ teacher?: string; item?: string }>` and build

```ts
  const nextQuery = new URLSearchParams();
  if (teacher?.trim()) nextQuery.set("teacher", teacher.trim());
  if (item && /^\d+$/.test(item)) nextQuery.set("item", item);
  const suffix = nextQuery.size ? `?${nextQuery}` : "";
  const nextPath = locale === "ar" ? `/my-courses/${courseId}${suffix}` : `/${locale}/my-courses/${courseId}${suffix}`;
  if (!(await hasStudentSession())) {
    redirect(`${locale === "ar" ? "" : `/${locale}`}/login?next=${encodeURIComponent(nextPath)}`);
  }
```

  (Task 10 later passes `item` into `CourseDetail`.)

- [ ] **Step 4: Run to verify pass**

Run: `npm run test:unit -- src/lib/student-api/session.test.ts src/app/api/student`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-api/session.ts src/lib/student-api/session.test.ts "src/app/[locale]"
git commit -m "fix(auth): refresh when the access cookie expired; keep deep links through login"
```

---

### Task 5: Browser transport, query hooks, time formatting

**Model:** `gpt-6-luna`, effort `medium` — thin wrappers and a pure formatter.

**Files:**
- Create: `src/lib/student-api/video-analytics.ts` (+ `video-analytics.test.ts`)
- Modify: `src/features/student/query-keys.ts`
- Create: `src/features/student/hooks/use-video-analytics-queries.ts` (+ `use-video-analytics-queries.test.tsx`)
- Create: `src/features/courses/video/format-playback-time.ts` (+ test)

**Interfaces:**
- Consumes: `studentApiFetch`, `StudentApiError` (client.ts), DTOs.
- Produces:
  - `getLastWatched(): Promise<LastWatchedDto>`
  - `getVideoProgress(itemId: number): Promise<VideoProgressDto>`
  - `requestPlayback(itemId: number, positionSec?: number): Promise<PlaybackDto>`
  - `sendHeartbeat(sessionId: number, body: HeartbeatRequestDto): Promise<HeartbeatDto>`
  - `endSessionUrl(sessionId: number): string`
  - `endSession(sessionId: number, options?: { beacon?: boolean }): Promise<void>`
  - `studentQueryKeys.lastWatched()`, `studentQueryKeys.videoProgress(itemId: number)`, `studentQueryKeys.coursePrefix(courseId: number)`
  - `useLastWatched(enabled?: boolean)`, `useVideoProgress(itemId: number | null)`
  - `useVideoProgressCache(courseId: number): { applyHeartbeat(itemId: number, data: HeartbeatDto, durationSec: number | null | undefined): void; invalidateAfterPlayback(itemId: number): void }`
  - `formatPlaybackTime(totalSeconds: number): string`

- [ ] **Step 1: Write failing tests**

`src/features/courses/video/format-playback-time.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatPlaybackTime } from "./format-playback-time";

describe("formatPlaybackTime", () => {
  it.each([
    [0, "0:00"], [5.9, "0:05"], [65, "1:05"], [872, "14:32"],
    [3600, "1:00:00"], [3725, "1:02:05"], [-3, "0:00"], [Number.NaN, "0:00"],
  ])("%s → %s", (input, expected) => {
    expect(formatPlaybackTime(input)).toBe(expected);
  });
});
```

`src/lib/student-api/video-analytics.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { endSession, requestPlayback, sendHeartbeat } from "./video-analytics";

const ok = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
afterEach(() => vi.unstubAllGlobals());

describe("video analytics transport", () => {
  it("omits the playback body when no position is given", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await requestPlayback(42);
    expect(fetchMock).toHaveBeenCalledWith("/api/student/video-analytics/items/42/playback", expect.objectContaining({ method: "POST" }));
    expect((fetchMock.mock.calls[0] as unknown[])[1]).not.toHaveProperty("body");
  });

  it("sends position 0 explicitly", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await requestPlayback(42, 0);
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body).toBe('{"position_sec":0}');
  });

  it("posts heartbeats as JSON", async () => {
    const fetchMock = vi.fn(async () => ok({ accepted: true }));
    vi.stubGlobal("fetch", fetchMock);
    await sendHeartbeat(105, { sequence: 1, position_sec: 3, state: "playing" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/student/video-analytics/sessions/105/heartbeat",
      expect.objectContaining({ method: "POST", body: '{"sequence":1,"position_sec":3,"state":"playing"}' }),
    );
  });

  it("uses sendBeacon when asked and it enqueues", async () => {
    const beacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    vi.stubGlobal("fetch", fetchMock);
    await endSession(105, { beacon: true });
    expect(beacon).toHaveBeenCalledWith("/api/student/video-analytics/sessions/105/end");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to keepalive fetch when sendBeacon refuses", async () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(() => false) });
    const fetchMock = vi.fn(async () => ok({}));
    vi.stubGlobal("fetch", fetchMock);
    await endSession(105, { beacon: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/student/video-analytics/sessions/105/end",
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
  });

  it("never throws from endSession", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await expect(endSession(105)).resolves.toBeUndefined();
  });
});
```

`src/features/student/hooks/use-video-analytics-queries.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import { studentQueryKeys } from "../query-keys";
import { useVideoProgressCache } from "./use-video-analytics-queries";

function setup(detail: StudentCourseDetailDto) {
  const client = new QueryClient();
  client.setQueryData(studentQueryKeys.course(7, undefined), detail);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useVideoProgressCache(7), { wrapper });
  return { client, cache: result.current };
}

const detail = (videoProgress: unknown[]) => ({
  course: {},
  teacher: null,
  enrollment: { progress: { completed_item_ids: [], video_progress: videoProgress } },
}) as unknown as StudentCourseDetailDto;

describe("useVideoProgressCache.applyHeartbeat", () => {
  it("writes position-based percent for the item", () => {
    const { client, cache } = setup(detail([]));
    cache.applyHeartbeat(42, { accepted: true, duplicate: false, completed: false, watched_percent: 10, last_position_sec: 50 }, 200);
    const updated = client.getQueryData<StudentCourseDetailDto>(studentQueryKeys.course(7, undefined));
    expect(updated?.enrollment?.progress.video_progress).toEqual([
      { item_id: 42, last_position_sec: 50, watched_percent: 25, is_completed: false },
    ]);
  });

  it("keeps completion sticky", () => {
    const { client, cache } = setup(detail([{ item_id: 42, last_position_sec: 190, watched_percent: 95, is_completed: true }]));
    cache.applyHeartbeat(42, { accepted: true, duplicate: false, completed: false, watched_percent: 5, last_position_sec: 10 }, 200);
    const entry = client.getQueryData<StudentCourseDetailDto>(studentQueryKeys.course(7, undefined))
      ?.enrollment?.progress.video_progress?.[0];
    expect(entry).toMatchObject({ last_position_sec: 10, watched_percent: 5, is_completed: true });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- src/features/courses/video/format-playback-time.test.ts src/lib/student-api/video-analytics.test.ts src/features/student/hooks/use-video-analytics-queries.test.tsx`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

`format-playback-time.ts`:

```ts
export function formatPlaybackTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}` : `${minutes}:${ss}`;
}
```

`video-analytics.ts`:

```ts
import { studentApiFetch } from "./client";
import type {
  HeartbeatDto,
  HeartbeatRequestDto,
  LastWatchedDto,
  PlaybackDto,
  VideoProgressDto,
} from "./contract";

const BASE = "/api/student/video-analytics";

export const getLastWatched = () => studentApiFetch<LastWatchedDto>(`${BASE}/last-watched`);

export const getVideoProgress = (itemId: number) =>
  studentApiFetch<VideoProgressDto>(`${BASE}/items/${itemId}/progress`);

export function requestPlayback(itemId: number, positionSec?: number) {
  return studentApiFetch<PlaybackDto>(`${BASE}/items/${itemId}/playback`, {
    method: "POST",
    ...(positionSec === undefined ? {} : { body: JSON.stringify({ position_sec: positionSec }) }),
  });
}

export function sendHeartbeat(sessionId: number, body: HeartbeatRequestDto) {
  return studentApiFetch<HeartbeatDto>(`${BASE}/sessions/${sessionId}/heartbeat`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const endSessionUrl = (sessionId: number) => `${BASE}/sessions/${sessionId}/end`;

/** Best effort; never throws. `beacon` is for pagehide, where fetch may be cancelled. */
export async function endSession(sessionId: number, { beacon = false }: { beacon?: boolean } = {}) {
  const url = endSessionUrl(sessionId);
  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    if (navigator.sendBeacon(url)) return;
  }
  await fetch(url, { method: "POST", keepalive: true, cache: "no-store" }).catch(() => undefined);
}
```

`query-keys.ts` — add:

```ts
  coursePrefix: (courseId: number) => [...studentQueryKeys.all, "course", courseId] as const,
  lastWatched: () => [...studentQueryKeys.all, "last-watched"] as const,
  videoProgress: (itemId: number) => [...studentQueryKeys.all, "video-progress", itemId] as const,
```

`use-video-analytics-queries.ts`:

```ts
"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StudentApiError } from "@/src/lib/student-api/client";
import type { HeartbeatDto, ItemVideoProgressDto, StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import { getLastWatched, getVideoProgress } from "@/src/lib/student-api/video-analytics";
import { studentQueryKeys } from "../query-keys";

const noRetryOn = (statuses: number[]) => (failureCount: number, error: unknown) =>
  !(error instanceof StudentApiError && statuses.includes(error.status)) && failureCount < 1;

export function useLastWatched(enabled = true) {
  return useQuery({
    queryKey: studentQueryKeys.lastWatched(),
    queryFn: getLastWatched,
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: noRetryOn([401, 403, 404]),
  });
}

export function useVideoProgress(itemId: number | null) {
  return useQuery({
    queryKey: studentQueryKeys.videoProgress(itemId ?? 0),
    queryFn: () => getVideoProgress(itemId as number),
    enabled: itemId !== null,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: noRetryOn([401, 403, 404, 409]),
  });
}

export function useVideoProgressCache(courseId: number) {
  const queryClient = useQueryClient();
  return useMemo(() => ({
    applyHeartbeat(itemId: number, data: HeartbeatDto, durationSec: number | null | undefined) {
      queryClient.setQueriesData<StudentCourseDetailDto>(
        { queryKey: studentQueryKeys.coursePrefix(courseId) },
        (detail) => {
          if (!detail?.enrollment) return detail;
          const progress = detail.enrollment.progress;
          const list = progress.video_progress ?? [];
          const existing = list.find((entry) => entry.item_id === itemId);
          const percent = durationSec && durationSec > 0
            ? Math.min(100, Math.floor((data.last_position_sec * 100) / durationSec))
            : existing?.watched_percent ?? 0;
          const next: ItemVideoProgressDto = {
            item_id: itemId,
            last_position_sec: data.last_position_sec,
            watched_percent: percent,
            is_completed: Boolean(existing?.is_completed || data.completed),
          };
          return {
            ...detail,
            enrollment: {
              ...detail.enrollment,
              progress: {
                ...progress,
                video_progress: existing
                  ? list.map((entry) => (entry.item_id === itemId ? next : entry))
                  : [...list, next],
              },
            },
          };
        },
      );
    },
    invalidateAfterPlayback(itemId: number) {
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.myCourses() });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.coursePrefix(courseId) });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.videoProgress(itemId) });
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.lastWatched() });
    },
  }), [queryClient, courseId]);
}
```

- [ ] **Step 4: Run to verify pass** — same command as Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/student-api/video-analytics.ts src/lib/student-api/video-analytics.test.ts src/features/student src/features/courses/video/format-playback-time.ts src/features/courses/video/format-playback-time.test.ts
git commit -m "feat(video): browser transport, query hooks, playback time format"
```

---

### Task 6: player.js bridge

**Model:** `gpt-6.1-sol`, effort `high` — protocol + security checks + timers; pure TypeScript.

**Files:**
- Create: `src/features/courses/video/player-bridge.ts`
- Test: `src/features/courses/video/player-bridge.test.ts`

**Interfaces:**
- Produces:

```ts
export interface TimeUpdate { seconds: number; duration: number }
export type PlayerEvent = "play" | "pause" | "seeked" | "ended" | "error";
export interface PlayerBridge {
  ready: Promise<void>;
  on(event: "timeupdate", cb: (update: TimeUpdate) => void): () => void;
  on(event: PlayerEvent, cb: (value: unknown) => void): () => void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(): Promise<number>;
  getPaused(): Promise<boolean>;
  destroy(): void;
}
export function createPlayerBridge(
  iframe: HTMLIFrameElement,
  embedUrl: string,
  options?: { readyTimeoutMs?: number; probeIntervalMs?: number; methodTimeoutMs?: number },
): PlayerBridge;
```

Error messages used as values: `PLAYER_READY_TIMEOUT`, `PLAYER_DESTROYED`, `PLAYER_METHOD_TIMEOUT`, `PLAYER_BAD_VALUE`.

- [ ] **Step 1: Write the failing tests** — `player-bridge.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayerBridge } from "./player-bridge";

const EMBED = "https://iframe.mediadelivery.net/embed/1/abc?token=t&expires=1";
const ORIGIN = "https://iframe.mediadelivery.net";

let iframe: HTMLIFrameElement;
let posted: Record<string, unknown>[];

function receive(data: unknown, { origin = ORIGIN, source }: { origin?: string; source?: unknown } = {}) {
  window.dispatchEvent(new MessageEvent("message", {
    data: typeof data === "string" ? data : JSON.stringify(data),
    origin,
    source: (source ?? iframe.contentWindow) as MessageEventSource,
  }));
}
const fromPlayer = (event: string, value?: unknown, listener?: string) =>
  ({ context: "player.js", version: "0.0.11", event, value, listener });

beforeEach(() => {
  vi.useFakeTimers();
  iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  posted = [];
  vi.spyOn(iframe.contentWindow as Window, "postMessage").mockImplementation((message: unknown, targetOrigin?: unknown) => {
    expect(targetOrigin).toBe(ORIGIN);
    posted.push(JSON.parse(message as string));
  });
});

afterEach(() => {
  iframe.remove();
  vi.useRealTimers();
});

describe("createPlayerBridge", () => {
  it("probes ready with one listener id until ready, then subscribes to events", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    iframe.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(1_000);
    const probes = posted.filter((m) => m.method === "addEventListener" && m.value === "ready");
    expect(probes.length).toBeGreaterThanOrEqual(2);
    expect(new Set(probes.map((m) => m.listener)).size).toBe(1);

    receive(fromPlayer("ready", {}, probes[0].listener as string));
    await expect(bridge.ready).resolves.toBeUndefined();
    const subscribed = posted.filter((m) => m.method === "addEventListener" && m.value !== "ready").map((m) => m.value);
    expect(subscribed.sort()).toEqual(["ended", "error", "pause", "play", "seeked", "timeupdate"]);

    const before = posted.length;
    receive(fromPlayer("ready", {}, probes[0].listener as string));
    vi.advanceTimersByTime(2_000);
    expect(posted.length).toBe(before); // ready handled once, probing stopped
  });

  it("ignores messages from other origins or sources", async () => {
    const bridge = createPlayerBridge(iframe, EMBED, { readyTimeoutMs: 1_000 });
    receive(fromPlayer("ready"), { origin: "https://evil.example" });
    receive(fromPlayer("ready"), { source: window });
    vi.advanceTimersByTime(1_000);
    await expect(bridge.ready).rejects.toThrow("PLAYER_READY_TIMEOUT");
  });

  it("times out even if the iframe never fires load", async () => {
    const bridge = createPlayerBridge(iframe, EMBED, { readyTimeoutMs: 10_000 });
    vi.advanceTimersByTime(10_000);
    await expect(bridge.ready).rejects.toThrow("PLAYER_READY_TIMEOUT");
  });

  it("accepts object payloads and validates timeupdate numbers", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const updates: unknown[] = [];
    bridge.on("timeupdate", (u) => updates.push(u));
    window.dispatchEvent(new MessageEvent("message", {
      data: fromPlayer("timeupdate", { seconds: 12.5, duration: 100 }),
      origin: ORIGIN,
      source: iframe.contentWindow as MessageEventSource,
    }));
    receive(fromPlayer("timeupdate", { seconds: "x", duration: 100 }));
    receive(fromPlayer("timeupdate", { seconds: Infinity, duration: 100 }));
    expect(updates).toEqual([{ seconds: 12.5, duration: 100 }]);
  });

  it("emits play/pause/ended/seeked/error to subscribers and supports unsubscribe", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const seen: string[] = [];
    const off = bridge.on("play", () => seen.push("play"));
    bridge.on("ended", () => seen.push("ended"));
    receive(fromPlayer("play"));
    off();
    receive(fromPlayer("play"));
    receive(fromPlayer("ended"));
    expect(seen).toEqual(["play", "ended"]);
  });

  it("resolves getters by listener id and times them out", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const time = bridge.getCurrentTime();
    const request = posted.at(-1)!;
    expect(request.method).toBe("getCurrentTime");
    receive(fromPlayer("getCurrentTime", 31.2, request.listener as string));
    await expect(time).resolves.toBe(31.2);

    const paused = bridge.getPaused();
    vi.advanceTimersByTime(3_000);
    await expect(paused).rejects.toThrow("PLAYER_METHOD_TIMEOUT");
  });

  it("posts setCurrentTime", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    bridge.setCurrentTime(872);
    expect(posted.at(-1)).toMatchObject({ context: "player.js", method: "setCurrentTime", value: 872 });
  });

  it("destroy unsubscribes, rejects pending work and ignores later messages", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    receive(fromPlayer("ready"));
    await bridge.ready;
    const seen: string[] = [];
    bridge.on("play", () => seen.push("play"));
    const pending = bridge.getCurrentTime();
    bridge.destroy();
    expect(posted.filter((m) => m.method === "removeEventListener").length).toBe(6);
    await expect(pending).rejects.toThrow("PLAYER_DESTROYED");
    receive(fromPlayer("play"));
    expect(seen).toEqual([]);
  });

  it("rejects ready when destroyed before ready", async () => {
    const bridge = createPlayerBridge(iframe, EMBED);
    bridge.destroy();
    await expect(bridge.ready).rejects.toThrow("PLAYER_DESTROYED");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- src/features/courses/video/player-bridge.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `player-bridge.ts`:

```ts
// Minimal client for the open player.js postMessage protocol implemented by
// Bunny Stream's embed (https://bunny.net/docs/stream/playback-api).
const CONTEXT = "player.js";
const VERSION = "0.0.11";
const EVENTS = ["play", "pause", "timeupdate", "seeked", "ended", "error"] as const;

export interface TimeUpdate { seconds: number; duration: number }
export type PlayerEvent = "play" | "pause" | "seeked" | "ended" | "error";

export interface PlayerBridge {
  ready: Promise<void>;
  on(event: "timeupdate", cb: (update: TimeUpdate) => void): () => void;
  on(event: PlayerEvent, cb: (value: unknown) => void): () => void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(): Promise<number>;
  getPaused(): Promise<boolean>;
  destroy(): void;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function createPlayerBridge(
  iframe: HTMLIFrameElement,
  embedUrl: string,
  { readyTimeoutMs = 10_000, probeIntervalMs = 500, methodTimeoutMs = 3_000 }: {
    readyTimeoutMs?: number; probeIntervalMs?: number; methodTimeoutMs?: number;
  } = {},
): PlayerBridge {
  const origin = new URL(embedUrl).origin;
  let nextId = 1;
  const newId = () => `elemni-${nextId++}`;
  const readyListenerId = newId();
  const eventListenerIds = new Map<string, string>();
  const callbacks = new Map<string, Set<(value: unknown) => void>>();
  const pending = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  let destroyed = false;
  let isReady = false;

  let resolveReady!: () => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  ready.catch(() => undefined);

  const post = (message: Record<string, unknown>) => {
    if (destroyed) return;
    iframe.contentWindow?.postMessage(JSON.stringify({ context: CONTEXT, version: VERSION, ...message }), origin);
  };

  const parse = (data: unknown): Record<string, unknown> | null => {
    let value = data;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        return null;
      }
    }
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    return record.context === CONTEXT ? record : null;
  };

  const emit = (event: string, value: unknown) => {
    callbacks.get(event)?.forEach((cb) => cb(value));
  };

  const probe = () => post({ method: "addEventListener", value: "ready", listener: readyListenerId });
  const probeTimer = setInterval(probe, probeIntervalMs);
  const deadline = setTimeout(() => {
    if (isReady) return;
    stopProbing();
    rejectReady(new Error("PLAYER_READY_TIMEOUT"));
  }, readyTimeoutMs);

  function stopProbing() {
    clearInterval(probeTimer);
    clearTimeout(deadline);
    iframe.removeEventListener("load", probe);
  }

  function handleReady() {
    if (isReady) return;
    isReady = true;
    stopProbing();
    for (const event of EVENTS) {
      const id = newId();
      eventListenerIds.set(event, id);
      post({ method: "addEventListener", value: event, listener: id });
    }
    resolveReady();
  }

  const onMessage = (message: MessageEvent) => {
    if (destroyed || message.origin !== origin || message.source !== iframe.contentWindow) return;
    const data = parse(message.data);
    if (!data || typeof data.event !== "string") return;
    const listener = typeof data.listener === "string" ? data.listener : undefined;
    const waiter = listener ? pending.get(listener) : undefined;
    if (listener && waiter) {
      pending.delete(listener);
      clearTimeout(waiter.timer);
      waiter.resolve(data.value);
      return;
    }
    if (data.event === "ready") {
      handleReady();
      return;
    }
    if (data.event === "timeupdate") {
      const value = data.value as { seconds?: unknown; duration?: unknown } | null;
      if (!value || !isFiniteNumber(value.seconds) || !isFiniteNumber(value.duration)) return;
      emit("timeupdate", { seconds: value.seconds, duration: value.duration });
      return;
    }
    if ((EVENTS as readonly string[]).includes(data.event)) emit(data.event, data.value);
  };

  // Listen before the first probe so an early ready reply is never missed.
  window.addEventListener("message", onMessage);
  iframe.addEventListener("load", probe);
  probe();

  function call(method: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (destroyed) {
        reject(new Error("PLAYER_DESTROYED"));
        return;
      }
      const id = newId();
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("PLAYER_METHOD_TIMEOUT"));
      }, methodTimeoutMs);
      pending.set(id, { resolve, reject, timer });
      post({ method, listener: id });
    });
  }

  return {
    ready,
    on(event: string, cb: (value: never) => void) {
      const set = callbacks.get(event) ?? new Set();
      set.add(cb as (value: unknown) => void);
      callbacks.set(event, set);
      return () => {
        set.delete(cb as (value: unknown) => void);
      };
    },
    setCurrentTime(seconds: number) {
      if (isFiniteNumber(seconds) && seconds >= 0) post({ method: "setCurrentTime", value: seconds });
    },
    async getCurrentTime() {
      const value = await call("getCurrentTime");
      if (!isFiniteNumber(value)) throw new Error("PLAYER_BAD_VALUE");
      return value;
    },
    async getPaused() {
      return Boolean(await call("getPaused"));
    },
    destroy() {
      if (destroyed) return;
      for (const [event, id] of eventListenerIds) post({ method: "removeEventListener", value: event, listener: id });
      destroyed = true;
      stopProbing();
      window.removeEventListener("message", onMessage);
      for (const waiter of pending.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error("PLAYER_DESTROYED"));
      }
      pending.clear();
      callbacks.clear();
      if (!isReady) rejectReady(new Error("PLAYER_DESTROYED"));
    },
  } as PlayerBridge;
}
```

- [ ] **Step 4: Run to verify pass** — same command as Step 2. Expected: PASS. Fix the implementation, not the tests, if a test fails (except where jsdom cannot construct `MessageEvent` with a `source`; then report it).

- [ ] **Step 5: Commit**

```bash
git add src/features/courses/video/player-bridge.ts src/features/courses/video/player-bridge.test.ts
git commit -m "feat(video): player.js bridge for the Bunny embed"
```

---

### Task 7: Heartbeat controller

**Model:** `gpt-6.1-sol`, effort `high` — state machine with timers, ordering and retry rules.

**Files:**
- Create: `src/features/courses/video/heartbeat-controller.ts`
- Test: `src/features/courses/video/heartbeat-controller.test.ts`

**Interfaces:**
- Consumes: `HeartbeatDto`, `HeartbeatRequestDto`, `HeartbeatState`; `classifyVideoError`, `isAmbiguousFailure`, `VideoErrorKind`; `StudentApiError` (for `retryAfterSec`).
- Produces:

```ts
export const HEARTBEAT_INTERVAL_MS = 20_000;
export type InterruptReason = "session-lost" | "attempt-ended" | "network";
export interface HeartbeatControllerOptions {
  send(body: HeartbeatRequestDto): Promise<HeartbeatDto>;
  onProgress?(data: HeartbeatDto): void;
  onCompleted(data: HeartbeatDto): void;
  onInterrupted(reason: InterruptReason): void;
  onFatal(kind: VideoErrorKind): void;
  intervalMs?: number;
  retryDelaysMs?: readonly number[];
}
export interface HeartbeatController {
  updatePosition(seconds: number): void;
  playing(): void;
  paused(): void;
  ended(): void;
  flush(): Promise<void>;
  stop(): void;
  readonly stopped: boolean;
}
export function createHeartbeatController(options: HeartbeatControllerOptions): HeartbeatController;
```

- [ ] **Step 1: Write the failing tests** — `heartbeat-controller.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentApiError } from "@/src/lib/student-api/client";
import type { HeartbeatDto, HeartbeatRequestDto } from "@/src/lib/student-api/contract";
import { createHeartbeatController, HEARTBEAT_INTERVAL_MS } from "./heartbeat-controller";

const okData = (overrides: Partial<HeartbeatDto> = {}): HeartbeatDto => ({
  accepted: true, duplicate: false, completed: false, watched_percent: 1, last_position_sec: 1, ...overrides,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

let sent: HeartbeatRequestDto[];
let replies: Array<ReturnType<typeof deferred<HeartbeatDto>>>;
const callbacks = {
  onProgress: vi.fn(), onCompleted: vi.fn(), onInterrupted: vi.fn(), onFatal: vi.fn(),
};

function make() {
  return createHeartbeatController({
    ...callbacks,
    send: (body) => {
      sent.push(body);
      const reply = deferred<HeartbeatDto>();
      replies.push(reply);
      return reply.promise;
    },
  });
}
const settle = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
  sent = [];
  replies = [];
  Object.values(callbacks).forEach((fn) => fn.mockReset());
});
afterEach(() => vi.useRealTimers());

describe("heartbeat controller", () => {
  it("sends playing immediately, then every 20 s with increasing sequence", async () => {
    const c = make();
    c.updatePosition(10);
    c.playing();
    expect(sent).toEqual([{ sequence: 1, position_sec: 10, state: "playing" }]);
    replies[0].resolve(okData());
    await settle();
    c.updatePosition(30);
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS - 1);
    expect(sent).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent[1]).toEqual({ sequence: 2, position_sec: 30, state: "playing" });
  });

  it("sends pause and ended immediately and stops ticking", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData());
    await settle();
    c.updatePosition(42);
    c.paused();
    expect(sent[1]).toMatchObject({ sequence: 2, state: "paused", position_sec: 42 });
    replies[1].resolve(okData());
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS * 3);
    expect(sent).toHaveLength(2);
    c.playing();
    expect(sent[2]).toMatchObject({ sequence: 3, state: "playing" }); // resume is immediate
  });

  it("queues pause behind an in-flight heartbeat with the latest position", async () => {
    const c = make();
    c.updatePosition(5);
    c.playing();
    c.updatePosition(9);
    c.paused();
    expect(sent).toHaveLength(1);
    c.updatePosition(11);
    replies[0].resolve(okData());
    await settle();
    expect(sent[1]).toEqual({ sequence: 2, position_sec: 11, state: "paused" });
  });

  it("collapses repeated queued states", async () => {
    const c = make();
    c.playing();
    c.paused();
    c.playing();
    c.paused();
    replies[0].resolve(okData());
    await settle();
    expect(sent.map((b) => b.state)).toEqual(["playing", "paused"]);
  });

  it("retries an ambiguous failure with the same sequence and body, then interrupts", async () => {
    const c = make();
    c.updatePosition(7);
    c.playing();
    replies[0].reject(new StudentApiError(503, "SERVICE_UNAVAILABLE"));
    await settle();
    c.updatePosition(99);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(sent[1]).toEqual(sent[0]);
    replies[1].reject(new StudentApiError(503, "SERVICE_UNAVAILABLE"));
    await settle();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(sent[2]).toEqual(sent[0]);
    replies[2].reject(new StudentApiError(503, "SERVICE_UNAVAILABLE"));
    await settle();
    expect(callbacks.onInterrupted).toHaveBeenCalledWith("network");
    expect(c.stopped).toBe(true);
  });

  it("holds after 429 for Retry-After and keeps a queued pause", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData());
    await settle();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    replies[1].reject(new StudentApiError(429, "BACKEND_ERROR_429", "Heartbeat throttled", 15));
    await settle();
    c.paused();
    await vi.advanceTimersByTimeAsync(14_999);
    expect(sent).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(sent[2]).toMatchObject({ state: "paused", sequence: 3 });
  });

  it("reports completion once and stops", async () => {
    const c = make();
    c.playing();
    replies[0].resolve(okData({ completed: true, watched_percent: 91 }));
    await settle();
    expect(callbacks.onCompleted).toHaveBeenCalledTimes(1);
    expect(c.stopped).toBe(true);
    c.paused();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    expect(sent).toHaveLength(1);
  });

  it.each([
    ["Session is no longer active", "session-lost"],
    ["Attempt has expired", "attempt-ended"],
  ])("409 %s interrupts with %s", async (detail, reason) => {
    const c = make();
    c.playing();
    replies[0].reject(new StudentApiError(409, "BACKEND_ERROR_409", detail));
    await settle();
    expect(callbacks.onInterrupted).toHaveBeenCalledWith(reason);
    expect(c.stopped).toBe(true);
  });

  it("403 watch limit is fatal", async () => {
    const c = make();
    c.playing();
    replies[0].reject(new StudentApiError(403, "BACKEND_ERROR_403", "Watch limit reached (2)"));
    await settle();
    expect(callbacks.onFatal).toHaveBeenCalledWith("watch-limit");
  });

  it("flush resolves after the queue drains", async () => {
    const c = make();
    c.playing();
    c.paused();
    let flushed = false;
    void c.flush().then(() => { flushed = true; });
    await settle();
    expect(flushed).toBe(false);
    replies[0].resolve(okData());
    await settle();
    replies[1].resolve(okData());
    await settle();
    expect(flushed).toBe(true);
  });

  it("stop is idempotent and resolves flush", async () => {
    const c = make();
    c.playing();
    const flushing = c.flush();
    c.stop();
    c.stop();
    await expect(flushing).resolves.toBeUndefined();
  });

  it("ignores pause before any play", () => {
    const c = make();
    c.paused();
    expect(sent).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- src/features/courses/video/heartbeat-controller.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `heartbeat-controller.ts`:

```ts
import { StudentApiError } from "@/src/lib/student-api/client";
import type { HeartbeatDto, HeartbeatRequestDto, HeartbeatState } from "@/src/lib/student-api/contract";
import { classifyVideoError, isAmbiguousFailure, type VideoErrorKind } from "@/src/lib/student-api/video-errors";

// Backend rejects playing→playing heartbeats < 15 s apart and caps credit per
// heartbeat at 60 s of server-measured elapsed time.
export const HEARTBEAT_INTERVAL_MS = 20_000;
const DEFAULT_RETRY_DELAYS_MS = [1_000, 3_000] as const;
const DEFAULT_HOLD_SEC = 2;

export type InterruptReason = "session-lost" | "attempt-ended" | "network";

export interface HeartbeatControllerOptions {
  send(body: HeartbeatRequestDto): Promise<HeartbeatDto>;
  onProgress?(data: HeartbeatDto): void;
  onCompleted(data: HeartbeatDto): void;
  onInterrupted(reason: InterruptReason): void;
  onFatal(kind: VideoErrorKind): void;
  intervalMs?: number;
  retryDelaysMs?: readonly number[];
}

export interface HeartbeatController {
  updatePosition(seconds: number): void;
  playing(): void;
  paused(): void;
  ended(): void;
  flush(): Promise<void>;
  stop(): void;
  readonly stopped: boolean;
}

export function createHeartbeatController(options: HeartbeatControllerOptions): HeartbeatController {
  const intervalMs = options.intervalMs ?? HEARTBEAT_INTERVAL_MS;
  const retryDelays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  let playerState: "idle" | HeartbeatState = "idle";
  let position = 0;
  let sequence = 1;
  let busy = false;
  let stopped = false;
  const queue: HeartbeatState[] = [];
  let tickTimer: ReturnType<typeof setTimeout> | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let flushWaiters: Array<() => void> = [];

  const clearTick = () => {
    if (tickTimer) clearTimeout(tickTimer);
    tickTimer = null;
  };

  const settleFlush = () => {
    if (stopped || (!busy && queue.length === 0 && !holdTimer && !retryTimer)) {
      const waiters = flushWaiters;
      flushWaiters = [];
      waiters.forEach((resolve) => resolve());
    }
  };

  const stopInternal = () => {
    stopped = true;
    clearTick();
    if (holdTimer) clearTimeout(holdTimer);
    if (retryTimer) clearTimeout(retryTimer);
    holdTimer = null;
    retryTimer = null;
    queue.length = 0;
    busy = false;
    settleFlush();
  };

  const scheduleTick = (sentAt: number) => {
    clearTick();
    if (stopped || playerState !== "playing") return;
    tickTimer = setTimeout(() => {
      tickTimer = null;
      if (playerState === "playing" && queue.length === 0) enqueue("playing");
    }, Math.max(0, sentAt + intervalMs - Date.now()));
  };

  function enqueue(state: HeartbeatState) {
    if (stopped) return;
    if (queue.at(-1) === state) return;
    queue.push(state);
    pump();
  }

  function pump() {
    if (busy || stopped || holdTimer || retryTimer) return;
    const state = queue.shift();
    if (!state) {
      settleFlush();
      return;
    }
    busy = true;
    attempt({ sequence, position_sec: position, state }, 0, Date.now());
  }

  function attempt(body: HeartbeatRequestDto, retryIndex: number, sentAt: number) {
    options.send(body).then(
      (data) => {
        if (stopped) return;
        sequence = body.sequence + 1;
        busy = false;
        options.onProgress?.(data);
        if (data.completed) {
          stopInternal();
          options.onCompleted(data);
          return;
        }
        if (body.state === "playing") scheduleTick(sentAt);
        pump();
      },
      (error: unknown) => {
        if (stopped) return;
        if (isAmbiguousFailure(error)) {
          if (retryIndex < retryDelays.length) {
            retryTimer = setTimeout(() => {
              retryTimer = null;
              if (!stopped) attempt(body, retryIndex + 1, Date.now());
            }, retryDelays[retryIndex]);
            return;
          }
          stopInternal();
          options.onInterrupted("network");
          return;
        }
        const kind = classifyVideoError(error);
        if (kind === "transient") {
          sequence = body.sequence + 1;
          busy = false;
          if (body.state !== "playing") queue.unshift(body.state); // transitions are never dropped
          const holdSec = error instanceof StudentApiError && error.retryAfterSec !== undefined
            ? error.retryAfterSec
            : DEFAULT_HOLD_SEC;
          holdTimer = setTimeout(() => {
            holdTimer = null;
            if (playerState === "playing" && queue.length === 0) enqueue("playing");
            else pump();
          }, holdSec * 1_000);
          return;
        }
        stopInternal();
        if (kind === "session-lost" || kind === "attempt-ended") options.onInterrupted(kind);
        else options.onFatal(kind);
      },
    );
  }

  return {
    updatePosition(seconds: number) {
      if (Number.isFinite(seconds) && seconds >= 0) position = seconds;
    },
    playing() {
      if (stopped || playerState === "playing") return;
      playerState = "playing";
      enqueue("playing");
    },
    paused() {
      if (stopped || playerState !== "playing") return;
      playerState = "paused";
      clearTick();
      enqueue("paused");
    },
    ended() {
      if (stopped || playerState === "ended" || playerState === "idle") return;
      playerState = "ended";
      clearTick();
      enqueue("ended");
    },
    flush() {
      return new Promise<void>((resolve) => {
        flushWaiters.push(resolve);
        settleFlush();
      });
    },
    stop() {
      if (!stopped) stopInternal();
    },
    get stopped() {
      return stopped;
    },
  };
}
```

- [ ] **Step 4: Run to verify pass** — same command as Step 2. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/courses/video/heartbeat-controller.ts src/features/courses/video/heartbeat-controller.test.ts
git commit -m "feat(video): heartbeat controller with queued transitions and retries"
```

---

### Task 8: `useVideoSession` hook

**Model:** `gpt-6-astra`, effort `high` — async lifecycle, generation guards, teardown ordering, browser lifecycle events; the riskiest integration unit.

**Files:**
- Create: `src/features/courses/video/use-video-session.ts`
- Test: `src/features/courses/video/use-video-session.test.tsx`

**Interfaces:**
- Consumes: `requestPlayback`, `sendHeartbeat`, `endSession` (Task 5), `useVideoProgressCache` (Task 5), `createPlayerBridge`/`PlayerBridge` (Task 6), `createHeartbeatController`/`HeartbeatController`/`InterruptReason` (Task 7), `classifyVideoError`/`VideoErrorKind` (Task 2).
- Produces:

```ts
export type VideoSessionStatus =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "seeking" }
  | { kind: "playing" }
  | { kind: "interrupted"; reason: InterruptReason }
  | { kind: "error"; reason: VideoErrorKind | "player-timeout" | "player-error" };

export interface UseVideoSessionResult {
  status: VideoSessionStatus;
  embedUrl: string | null;
  isCompleted: boolean;
  lastPositionSec: number;
  start(positionSec: number): void;
  iframeRef(node: HTMLIFrameElement | null): void;
}

export function useVideoSession(args: {
  itemId: number;
  courseId: number;
  durationSec: number | null | undefined;
  initiallyCompleted: boolean;
  onUnauthenticated?: () => void;
}): UseVideoSessionResult;

export async function confirmSeek(bridge: Pick<PlayerBridge, "getCurrentTime">, target: number, timeoutMs?: number): Promise<boolean>;
```

The hook's component is keyed by item id (Task 9), so "item switch" = unmount.

- [ ] **Step 1: Write the failing tests** — `use-video-session.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StudentApiError } from "@/src/lib/student-api/client";

const transport = vi.hoisted(() => ({
  requestPlayback: vi.fn(),
  sendHeartbeat: vi.fn(),
  endSession: vi.fn(async () => undefined),
}));
vi.mock("@/src/lib/student-api/video-analytics", () => transport);

type Handler = (value?: unknown) => void;
const fakeBridge = vi.hoisted(() => ({
  handlers: new Map<string, Set<Handler>>(),
  readyResolve: null as null | (() => void),
  readyReject: null as null | ((e: Error) => void),
  currentTime: 0,
  paused: true,
  setCurrentTime: vi.fn(),
  destroy: vi.fn(),
}));
vi.mock("./player-bridge", () => ({
  createPlayerBridge: vi.fn(() => {
    fakeBridge.handlers = new Map();
    const ready = new Promise<void>((resolve, reject) => {
      fakeBridge.readyResolve = resolve;
      fakeBridge.readyReject = reject;
    });
    return {
      ready,
      on: (event: string, cb: Handler) => {
        const set = fakeBridge.handlers.get(event) ?? new Set();
        set.add(cb);
        fakeBridge.handlers.set(event, set);
        return () => set.delete(cb);
      },
      setCurrentTime: (s: number) => { fakeBridge.setCurrentTime(s); fakeBridge.currentTime = s; },
      getCurrentTime: async () => fakeBridge.currentTime,
      getPaused: async () => fakeBridge.paused,
      destroy: fakeBridge.destroy,
    };
  }),
}));

import { confirmSeek, useVideoSession } from "./use-video-session";

const emit = (event: string, value?: unknown) => fakeBridge.handlers.get(event)?.forEach((cb) => cb(value));
const playback = (sessionId = 105) => ({
  embed_url: "https://iframe.mediadelivery.net/embed/1/abc?token=t&expires=1",
  attempt_id: 10, session_id: sessionId, attempt_status: "active", expires_in: 3600,
  allowance_remaining: 1, allowance_source: "base", completed_attempts: 0,
});
const heartbeatOk = { accepted: true, duplicate: false, completed: false, watched_percent: 10, last_position_sec: 30 };

function setup() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const onUnauthenticated = vi.fn();
  const hook = renderHook(() => useVideoSession({ itemId: 42, courseId: 7, durationSec: 100, initiallyCompleted: false, onUnauthenticated }), { wrapper });
  const attachIframe = () => act(() => hook.result.current.iframeRef(document.createElement("iframe")));
  return { ...hook, attachIframe, onUnauthenticated };
}

async function startAndPlay(view: ReturnType<typeof setup>, position = 30) {
  transport.requestPlayback.mockResolvedValueOnce(playback());
  transport.sendHeartbeat.mockResolvedValue(heartbeatOk);
  await act(async () => view.result.current.start(position));
  view.attachIframe();
  fakeBridge.paused = false;
  await act(async () => { fakeBridge.readyResolve?.(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  Object.values(transport).forEach((fn) => fn.mockReset());
  transport.endSession.mockResolvedValue(undefined);
  fakeBridge.currentTime = 0;
  fakeBridge.paused = true;
  fakeBridge.setCurrentTime.mockReset();
  fakeBridge.destroy.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("useVideoSession", () => {
  it("ignores a double start while starting", async () => {
    const view = setup();
    transport.requestPlayback.mockReturnValue(new Promise(() => undefined));
    act(() => { view.result.current.start(0); view.result.current.start(0); });
    expect(transport.requestPlayback).toHaveBeenCalledTimes(1);
    expect(view.result.current.status).toEqual({ kind: "starting" });
  });

  it("seeks to the resume position, confirms it, then sends the first playing heartbeat", async () => {
    const view = setup();
    await startAndPlay(view, 30);
    expect(fakeBridge.setCurrentTime).toHaveBeenCalledWith(30);
    expect(view.result.current.status).toEqual({ kind: "playing" });
    expect(transport.sendHeartbeat).toHaveBeenCalledWith(105, { sequence: 1, position_sec: 30, state: "playing" });
  });

  it("ends a superseded playback response's session", async () => {
    const view = setup();
    let resolveFirst!: (value: unknown) => void;
    transport.requestPlayback.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }));
    act(() => view.result.current.start(0));
    view.unmount();
    await act(async () => { resolveFirst(playback(999)); });
    expect(transport.endSession).toHaveBeenCalledWith(999);
  });

  it("flushes a paused heartbeat before ending the session on unmount", async () => {
    const view = setup();
    await startAndPlay(view, 30);
    transport.sendHeartbeat.mockClear();
    fakeBridge.currentTime = 44;
    act(() => emit("timeupdate", { seconds: 44, duration: 100 }));
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(transport.sendHeartbeat).toHaveBeenCalledWith(105, expect.objectContaining({ state: "paused", position_sec: 44 }));
    const heartbeatOrder = transport.sendHeartbeat.mock.invocationCallOrder.at(-1)!;
    const endOrder = transport.endSession.mock.invocationCallOrder.at(-1)!;
    expect(endOrder).toBeGreaterThan(heartbeatOrder);
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: false });
  });

  it("does not auto-recover on session loss", async () => {
    const view = setup();
    await startAndPlay(view, 30);
    transport.sendHeartbeat.mockRejectedValueOnce(new StudentApiError(409, "BACKEND_ERROR_409", "Session is no longer active"));
    act(() => emit("pause"));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(view.result.current.status).toEqual({ kind: "interrupted", reason: "session-lost" });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(transport.requestPlayback).toHaveBeenCalledTimes(1);
  });

  it("marks completion and keeps the status playing", async () => {
    const view = setup();
    await startAndPlay(view, 0);
    expect(transport.sendHeartbeat).toHaveBeenCalled();
    transport.sendHeartbeat.mockResolvedValueOnce({ ...heartbeatOk, completed: true });
    act(() => emit("pause"));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(view.result.current.isCompleted).toBe(true);
    expect(view.result.current.status.kind).toBe("playing");
  });

  it("ends via sendBeacon on pagehide", async () => {
    const view = setup();
    await startAndPlay(view, 0);
    act(() => { window.dispatchEvent(new Event("pagehide")); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(transport.endSession).toHaveBeenCalledWith(105, { beacon: true });
  });

  it("maps a watch-limit playback error", async () => {
    const view = setup();
    transport.requestPlayback.mockRejectedValueOnce(new StudentApiError(403, "BACKEND_ERROR_403", "Watch limit reached (2)"));
    await act(async () => view.result.current.start(0));
    expect(view.result.current.status).toEqual({ kind: "error", reason: "watch-limit" });
  });

  it("reports player-timeout when the player never becomes ready", async () => {
    const view = setup();
    transport.requestPlayback.mockResolvedValueOnce(playback());
    await act(async () => view.result.current.start(0));
    view.attachIframe();
    await act(async () => { fakeBridge.readyReject?.(new Error("PLAYER_READY_TIMEOUT")); });
    expect(view.result.current.status).toEqual({ kind: "error", reason: "player-timeout" });
  });

  it("calls onUnauthenticated on 401", async () => {
    const view = setup();
    transport.requestPlayback.mockRejectedValueOnce(new StudentApiError(401, "SESSION_EXPIRED"));
    await act(async () => view.result.current.start(0));
    expect(view.onUnauthenticated).toHaveBeenCalled();
  });
});

describe("confirmSeek", () => {
  it("resolves true within tolerance and false on timeout", async () => {
    vi.useFakeTimers();
    let current = 0;
    const bridge = { getCurrentTime: async () => current };
    const ok = confirmSeek(bridge, 30, 5_000);
    current = 29;
    await vi.advanceTimersByTimeAsync(600);
    await expect(ok).resolves.toBe(true);

    current = 0;
    const late = confirmSeek(bridge, 30, 5_000);
    await vi.advanceTimersByTimeAsync(5_500);
    await expect(late).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- src/features/courses/video/use-video-session.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `use-video-session.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoProgressCache } from "@/src/features/student/hooks/use-video-analytics-queries";
import { endSession, requestPlayback, sendHeartbeat } from "@/src/lib/student-api/video-analytics";
import { classifyVideoError, type VideoErrorKind } from "@/src/lib/student-api/video-errors";
import { createHeartbeatController, type HeartbeatController, type InterruptReason } from "./heartbeat-controller";
import { createPlayerBridge, type PlayerBridge } from "./player-bridge";

const SEEK_TOLERANCE_SEC = 2;
const SEEK_TIMEOUT_MS = 5_000;
const SEEK_POLL_MS = 500;
const EXIT_FLUSH_CAP_MS = 4_000;

export type VideoSessionStatus =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "seeking" }
  | { kind: "playing" }
  | { kind: "interrupted"; reason: InterruptReason }
  | { kind: "error"; reason: VideoErrorKind | "player-timeout" | "player-error" };

export interface UseVideoSessionResult {
  status: VideoSessionStatus;
  embedUrl: string | null;
  isCompleted: boolean;
  lastPositionSec: number;
  start(positionSec: number): void;
  iframeRef(node: HTMLIFrameElement | null): void;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function confirmSeek(
  bridge: Pick<PlayerBridge, "getCurrentTime">,
  target: number,
  timeoutMs = SEEK_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await bridge.getCurrentTime().catch(() => null);
    if (current !== null && Math.abs(current - target) <= SEEK_TOLERANCE_SEC) return true;
    await delay(SEEK_POLL_MS);
  }
  return false;
}

interface ActiveSession {
  id: number;
  generation: number;
  bridge: PlayerBridge | null;
  controller: HeartbeatController | null;
  ended: boolean;
}

export function useVideoSession({
  itemId,
  courseId,
  durationSec,
  initiallyCompleted,
  onUnauthenticated,
}: {
  itemId: number;
  courseId: number;
  durationSec: number | null | undefined;
  initiallyCompleted: boolean;
  onUnauthenticated?: () => void;
}): UseVideoSessionResult {
  const cache = useVideoProgressCache(courseId);
  const [status, setStatus] = useState<VideoSessionStatus>({ kind: "idle" });
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [isCompleted, setIsCompleted] = useState(initiallyCompleted);
  const [lastPositionSec, setLastPositionSec] = useState(0);

  const generationRef = useRef(0);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionRef = useRef<ActiveSession | null>(null);
  const positionRef = useRef(0);
  const targetRef = useRef(0);
  const callbacksRef = useRef({ cache, onUnauthenticated, durationSec });
  callbacksRef.current = { cache, onUnauthenticated, durationSec };

  const fail = useCallback((reason: VideoErrorKind | "player-timeout" | "player-error") => {
    if (reason === "unauthenticated") callbacksRef.current.onUnauthenticated?.();
    if (mountedRef.current) setStatus({ kind: "error", reason });
  }, []);

  /** Ends the current session. Controlled exits flush a final `paused` checkpoint first. */
  const endCurrent = useCallback(async ({ beacon }: { beacon: boolean }) => {
    const session = sessionRef.current;
    if (!session || session.ended) return;
    session.ended = true;
    sessionRef.current = null;
    session.bridge?.destroy();
    const controller = session.controller;
    if (controller && !controller.stopped && !beacon) {
      controller.updatePosition(positionRef.current);
      controller.paused();
      await Promise.race([controller.flush(), delay(EXIT_FLUSH_CAP_MS)]);
    }
    controller?.stop();
    await endSession(session.id, { beacon });
    callbacksRef.current.cache.invalidateAfterPlayback(itemId);
  }, [itemId]);

  const start = useCallback((positionSec: number) => {
    if (startingRef.current) return;
    startingRef.current = true;
    const generation = ++generationRef.current;
    void endCurrent({ beacon: false });
    setEmbedUrl(null);
    setStatus({ kind: "starting" });
    requestPlayback(itemId, positionSec).then(
      (data) => {
        startingRef.current = false;
        if (!mountedRef.current || generation !== generationRef.current) {
          void endSession(data.session_id);
          return;
        }
        sessionRef.current = { id: data.session_id, generation, bridge: null, controller: null, ended: false };
        targetRef.current = positionSec;
        positionRef.current = positionSec;
        setLastPositionSec(positionSec);
        setEmbedUrl(data.embed_url);
        setStatus({ kind: "seeking" });
      },
      (error: unknown) => {
        startingRef.current = false;
        if (!mountedRef.current || generation !== generationRef.current) return;
        fail(classifyVideoError(error));
      },
    );
  }, [endCurrent, fail, itemId]);

  // Wire the bridge + controller once the signed iframe is mounted.
  useEffect(() => {
    const session = sessionRef.current;
    if (!iframe || !embedUrl || !session || session.bridge) return;
    const bridge = createPlayerBridge(iframe, embedUrl);
    session.bridge = bridge;
    let seekConfirmed = false;
    let pendingPlay = false;

    const ensureController = () => {
      if (session.controller) return session.controller;
      const controller = createHeartbeatController({
        send: (body) => sendHeartbeat(session.id, body),
        onProgress: (data) => {
          callbacksRef.current.cache.applyHeartbeat(itemId, data, callbacksRef.current.durationSec);
          if (mountedRef.current) setLastPositionSec(data.last_position_sec);
        },
        onCompleted: () => {
          if (mountedRef.current) setIsCompleted(true);
          callbacksRef.current.cache.invalidateAfterPlayback(itemId);
        },
        onInterrupted: (reason) => {
          session.bridge?.destroy();
          callbacksRef.current.cache.invalidateAfterPlayback(itemId);
          if (mountedRef.current && sessionRef.current === session) {
            setLastPositionSec(positionRef.current);
            setStatus({ kind: "interrupted", reason });
          }
        },
        onFatal: (kind) => {
          session.bridge?.destroy();
          if (sessionRef.current === session) fail(kind);
        },
      });
      controller.updatePosition(positionRef.current);
      session.controller = controller;
      return controller;
    };

    bridge.on("timeupdate", ({ seconds }) => {
      positionRef.current = seconds;
      session.controller?.updatePosition(seconds);
    });
    bridge.on("play", () => {
      if (seekConfirmed) ensureController().playing();
      else pendingPlay = true;
    });
    bridge.on("pause", () => session.controller?.paused());
    bridge.on("ended", () => session.controller?.ended());
    bridge.on("error", () => {
      if (sessionRef.current === session) fail("player-error");
    });

    bridge.ready.then(async () => {
      const max = callbacksRef.current.durationSec && callbacksRef.current.durationSec > 0
        ? callbacksRef.current.durationSec
        : Number.POSITIVE_INFINITY;
      const target = Math.min(Math.max(0, targetRef.current), max);
      if (target > 0) {
        bridge.setCurrentTime(target);
        if (!(await confirmSeek(bridge, target))) {
          if (sessionRef.current === session) fail("player-timeout");
          return;
        }
      }
      if (sessionRef.current !== session) return;
      positionRef.current = (await bridge.getCurrentTime().catch(() => target));
      seekConfirmed = true;
      if (mountedRef.current) setStatus({ kind: "playing" });
      const paused = await bridge.getPaused().catch(() => true);
      if (pendingPlay || !paused) ensureController().playing();
    }, () => {
      if (sessionRef.current === session) fail("player-timeout");
    });
  }, [embedUrl, fail, iframe, itemId]);

  // pagehide → best-effort beacon; bfcache restore → session is gone.
  useEffect(() => {
    const onPageHide = () => { void endCurrent({ beacon: true }); };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && mountedRef.current) {
        setStatus((current) => (current.kind === "playing" || current.kind === "seeking"
          ? { kind: "interrupted", reason: "session-lost" }
          : current));
      }
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [endCurrent]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      void endCurrent({ beacon: false });
    };
  }, [endCurrent]);

  return {
    status,
    embedUrl,
    isCompleted,
    lastPositionSec,
    start,
    iframeRef: setIframe,
  };
}
```

- [ ] **Step 4: Run to verify pass** — same command as Step 2. Expected: PASS. If `act` + fake-timer interplay makes a test flaky, adjust **timing helpers in the test** (e.g. extra `advanceTimersByTimeAsync`), never the asserted behaviour.

- [ ] **Step 5: Lint the hook** — `npx eslint src/features/courses/video/use-video-session.ts` → no errors (the `callbacksRef.current = …` assignment during render may trip `react-hooks/refs`; if so, move it into a `useEffect(() => { callbacksRef.current = … })` with no deps array).

- [ ] **Step 6: Commit**

```bash
git add src/features/courses/video/use-video-session.ts src/features/courses/video/use-video-session.test.tsx
git commit -m "feat(video): playback session hook (seek, telemetry, teardown)"
```

---

### Task 9: Preview card, VideoLesson and LearnerPlayer integration

**Model:** `gpt-6.1-sol`, effort `medium` — UI composition against fixed interfaces, i18n.

**Files:**
- Create: `src/features/courses/video/video-preview-card.tsx` (+ `video-preview-card.test.tsx`)
- Create: `src/features/courses/video/video-lesson.tsx`
- Modify: `src/features/courses/components/learner-player.tsx`
- Modify: `src/messages/en.json`, `src/messages/ar.json` (`courseDetail.video` object)

**Interfaces:**
- Consumes: `useVideoProgress` (Task 5), `useVideoSession` (Task 8), `formatPlaybackTime` (Task 5), `WHATSAPP_URL` (`@/src/features/contact/contact-details`), `useRouter` from `@/src/i18n/navigation`.
- Produces:

```ts
export type PreviewVariant =
  | { kind: "watch-limit" }
  | { kind: "resume"; positionSec: number }
  | { kind: "completed" }
  | { kind: "start" };
export function resolvePreviewVariant(progress: VideoProgressDto): PreviewVariant;
export type PreviewCardState =
  | { kind: "loading" }
  | { kind: "error"; reason: VideoErrorKind | "player-timeout" | "player-error" }
  | { kind: "interrupted"; positionSec: number }
  | { kind: "ready"; progress: VideoProgressDto };
export default function VideoPreviewCard(props: { state: PreviewCardState; onStart(positionSec: number): void; onRetry(): void }): JSX.Element;
export default function VideoLesson(props: { item: PublicItemDto; lesson: PublicLessonDto; courseId: number; completed: boolean; onCompleted(): void }): JSX.Element;
```

- `LearnerPlayer` gains props `courseId: number` and `completed: boolean`.

- [ ] **Step 1: Add messages** — under `courseDetail` add `"video": { … }` in both files:

en.json:

```json
"video": {
  "resumeFrom": "Resume from <time></time>",
  "resume": "Resume",
  "startWatching": "Start watching",
  "play": "Play",
  "completedTitle": "You've completed this video",
  "watchAgain": "Watch again",
  "viewsRemaining": "{count, plural, =0 {No more views available} one {# more view available} other {# more views available}}",
  "watchLimitTitle": "Watch limit reached",
  "watchLimitBody": "Contact your teacher to request extra views.",
  "contactSupport": "Contact us on WhatsApp",
  "processing": "This video is still being processed. Try again in a few minutes.",
  "unavailable": "This video is unavailable right now. Contact support if this continues.",
  "notEnrolled": "You no longer have access to this course.",
  "interruptedTitle": "Playback paused here",
  "interruptedBody": "This video was opened somewhere else or the connection dropped.",
  "loadingPlayer": "Loading the player…",
  "reachedPercent": "Reached {percent}%"
}
```

ar.json:

```json
"video": {
  "resumeFrom": "كمّل من <time></time>",
  "resume": "كمّل",
  "startWatching": "ابدأ المشاهدة",
  "play": "تشغيل",
  "completedTitle": "خلّصت الفيديو ده",
  "watchAgain": "شاهد تاني",
  "viewsRemaining": "{count, plural, =0 {مفيش مشاهدات إضافية} one {متبقي مشاهدة واحدة} two {متبقي مشاهدتين} few {متبقي # مشاهدات} many {متبقي # مشاهدة} other {متبقي # مشاهدة}}",
  "watchLimitTitle": "وصلت للحد الأقصى للمشاهدات",
  "watchLimitBody": "تواصل مع المدرس لطلب مشاهدات إضافية.",
  "contactSupport": "كلّمنا على واتساب",
  "processing": "الفيديو لسه بيتجهز. جرّب تاني بعد شوية.",
  "unavailable": "الفيديو مش متاح دلوقتي. كلّم الدعم لو المشكلة استمرت.",
  "notEnrolled": "مبقاش عندك صلاحية للكورس ده.",
  "interruptedTitle": "التشغيل وقف هنا",
  "interruptedBody": "الفيديو اتفتح في مكان تاني أو الاتصال اتقطع.",
  "loadingPlayer": "جاري تحميل المشغّل…",
  "reachedPercent": "وصلت لـ {percent}٪"
}
```

- [ ] **Step 2: Write failing tests** — `video-preview-card.test.tsx` (check `src/test/setup.ts` and an existing component test such as `src/features/courses/components/coupon-input.test.tsx` for how `NextIntlClientProvider` is wired; use the real `src/messages/{en,ar}.json`):

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/src/messages/en.json";
import ar from "@/src/messages/ar.json";
import type { VideoProgressDto } from "@/src/lib/student-api/contract";
import VideoPreviewCard, { resolvePreviewVariant } from "./video-preview-card";

const progress = (overrides: Partial<VideoProgressDto> = {}): VideoProgressDto => ({
  item_id: 42, attempt_id: null, attempt_status: "none", last_position_sec: 0, watched_percent: 0,
  completed_attempts: 0, allowance_remaining: null, allowance_source: null,
  last_watched_at: null, completed_at: null, ...overrides,
});

function renderCard(state: Parameters<typeof VideoPreviewCard>[0]["state"], locale: "en" | "ar" = "en") {
  const onStart = vi.fn();
  const onRetry = vi.fn();
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      <VideoPreviewCard state={state} onStart={onStart} onRetry={onRetry} />
    </NextIntlClientProvider>,
  );
  return { onStart, onRetry };
}

describe("resolvePreviewVariant", () => {
  it.each([
    [progress({ allowance_remaining: 0, attempt_status: "completed", completed_attempts: 2 }), { kind: "watch-limit" }],
    [progress({ allowance_remaining: 0, attempt_status: "active", last_position_sec: 50 }), { kind: "resume", positionSec: 50 }],
    [progress({ attempt_status: "active", last_position_sec: 872 }), { kind: "resume", positionSec: 872 }],
    [progress({ attempt_status: "completed", completed_attempts: 1, last_position_sec: 95 }), { kind: "completed" }],
    [progress({ attempt_status: "expired", last_position_sec: 40 }), { kind: "resume", positionSec: 40 }],
    [progress(), { kind: "start" }],
  ])("%o → %o", (input, expected) => {
    expect(resolvePreviewVariant(input)).toEqual(expected);
  });
});

describe("VideoPreviewCard", () => {
  it("resumes from the saved position", () => {
    const { onStart } = renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 872 }) });
    expect(screen.getByText((_, el) => el?.tagName === "P" && el.textContent === "Resume from 14:32")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(onStart).toHaveBeenCalledWith(872);
  });

  it("shows the watch-limit card without a play action", () => {
    renderCard({ kind: "ready", progress: progress({ allowance_remaining: 0, attempt_status: "none" }) });
    expect(screen.getByText("Watch limit reached")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /play|resume|watch again/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Contact us on WhatsApp" })).toBeInTheDocument();
  });

  it("offers watch again from zero after completion, with remaining views", () => {
    const { onStart } = renderCard({ kind: "ready", progress: progress({ attempt_status: "completed", completed_attempts: 1, allowance_remaining: 1 }) });
    expect(screen.getByText("1 more view available")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Watch again" }));
    expect(onStart).toHaveBeenCalledWith(0);
  });

  it("shows processing copy with retry", () => {
    const { onRetry } = renderCard({ kind: "error", reason: "processing" });
    expect(screen.getByText(/still being processed/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: en.courseDetail.retry }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("offers resume from an interruption", () => {
    const { onStart } = renderCard({ kind: "interrupted", positionSec: 61 });
    expect(screen.getByText("Playback paused here")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(onStart).toHaveBeenCalledWith(61);
  });

  it("renders Arabic resume time and plurals", () => {
    renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 872, allowance_remaining: 2 }) }, "ar");
    const time = screen.getByText("14:32");
    expect(time.closest("[dir='ltr']")).not.toBeNull();
    expect(screen.getByText("متبقي مشاهدتين")).toBeInTheDocument();
  });

  it.each([[0, "مفيش مشاهدات إضافية"], [11, "متبقي 11 مشاهدة"]])("Arabic plural for %s", (count, text) => {
    renderCard({ kind: "ready", progress: progress({ attempt_status: "active", last_position_sec: 5, allowance_remaining: count === 0 ? 0 : count }) }, "ar");
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:unit -- src/features/courses/video/video-preview-card.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `video-preview-card.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { PlayCircle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { WHATSAPP_URL } from "@/src/features/contact/contact-details";
import type { VideoProgressDto } from "@/src/lib/student-api/contract";
import type { VideoErrorKind } from "@/src/lib/student-api/video-errors";
import { formatPlaybackTime } from "./format-playback-time";

export type PreviewVariant =
  | { kind: "watch-limit" }
  | { kind: "resume"; positionSec: number }
  | { kind: "completed" }
  | { kind: "start" };

export function resolvePreviewVariant(progress: VideoProgressDto): PreviewVariant {
  if (progress.allowance_remaining === 0 && progress.attempt_status !== "active") return { kind: "watch-limit" };
  if (progress.attempt_status === "active" && progress.last_position_sec > 0) {
    return { kind: "resume", positionSec: progress.last_position_sec };
  }
  if (progress.completed_attempts > 0) return { kind: "completed" };
  if (progress.last_position_sec > 0) return { kind: "resume", positionSec: progress.last_position_sec };
  return { kind: "start" };
}

export type PreviewCardState =
  | { kind: "loading" }
  | { kind: "error"; reason: VideoErrorKind | "player-timeout" | "player-error" }
  | { kind: "interrupted"; positionSec: number }
  | { kind: "ready"; progress: VideoProgressDto };

const primaryButton =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0A5FB4] px-5 text-sm font-bold text-white transition hover:bg-[#084A8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1015]";

function Time({ seconds }: { seconds: number }) {
  return <span dir="ltr" className="tabular-nums">{formatPlaybackTime(seconds)}</span>;
}

export default function VideoPreviewCard({
  state,
  onStart,
  onRetry,
}: {
  state: PreviewCardState;
  onStart: (positionSec: number) => void;
  onRetry: () => void;
}) {
  const t = useTranslations("courseDetail");
  const tv = useTranslations("courseDetail.video");

  let body: ReactNode;
  if (state.kind === "loading") {
    body = <div role="status" aria-label={tv("loadingPlayer")} className="h-11 w-40 animate-pulse rounded-xl bg-white/10" />;
  } else if (state.kind === "error") {
    const message = state.reason === "processing"
      ? tv("processing")
      : state.reason === "not-enrolled"
        ? tv("notEnrolled")
        : state.reason === "watch-limit"
          ? tv("watchLimitTitle")
          : state.reason === "unavailable" || state.reason === "forbidden"
            ? tv("unavailable")
            : t("videoLoadError");
    body = (
      <>
        <p role="alert" className="max-w-sm text-sm leading-6 text-slate-200">{message}</p>
        {state.reason === "watch-limit" ? (
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm font-bold text-sky-300 underline">{tv("contactSupport")}</a>
        ) : state.reason !== "not-enrolled" && (
          <button type="button" onClick={onRetry} className={primaryButton}>
            <RotateCcw className="size-4" aria-hidden="true" />{t("retry")}
          </button>
        )}
      </>
    );
  } else if (state.kind === "interrupted") {
    body = (
      <>
        <p className="text-lg font-black text-white">{tv("interruptedTitle")}</p>
        <p className="max-w-sm text-sm leading-6 text-slate-300">{tv("interruptedBody")}</p>
        <button type="button" onClick={() => onStart(state.positionSec)} className={primaryButton}>
          <PlayCircle className="size-4" aria-hidden="true" />{tv("resume")}
        </button>
      </>
    );
  } else {
    const variant = resolvePreviewVariant(state.progress);
    const remaining = state.progress.allowance_remaining;
    const footnote = remaining !== null && variant.kind !== "watch-limit"
      ? <p className="text-xs text-slate-400">{tv("viewsRemaining", { count: remaining })}</p>
      : null;
    if (variant.kind === "watch-limit") {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv("watchLimitTitle")}</p>
          <p className="max-w-sm text-sm leading-6 text-slate-300">{tv("watchLimitBody")}</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm font-bold text-sky-300 underline">{tv("contactSupport")}</a>
        </>
      );
    } else if (variant.kind === "resume") {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv.rich("resumeFrom", { time: () => <Time seconds={variant.positionSec} /> })}</p>
          <button type="button" onClick={() => onStart(variant.positionSec)} className={primaryButton}>
            <PlayCircle className="size-4" aria-hidden="true" />{tv("resume")}
          </button>
          {footnote}
        </>
      );
    } else if (variant.kind === "completed") {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv("completedTitle")}</p>
          <button type="button" onClick={() => onStart(0)} className={primaryButton}>
            <RotateCcw className="size-4" aria-hidden="true" />{tv("watchAgain")}
          </button>
          {footnote}
        </>
      );
    } else {
      body = (
        <>
          <p className="text-lg font-black text-white">{tv("startWatching")}</p>
          <button type="button" onClick={() => onStart(0)} className={primaryButton}>
            <PlayCircle className="size-4" aria-hidden="true" />{tv("play")}
          </button>
          {footnote}
        </>
      );
    }
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-[#0D1015] p-6 text-center">
      {body}
    </div>
  );
}
```

- [ ] **Step 5: Implement `video-lesson.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "@/src/i18n/navigation";
import { useVideoProgress } from "@/src/features/student/hooks/use-video-analytics-queries";
import type { PublicItemDto, PublicLessonDto } from "@/src/lib/student-api/contract";
import { classifyVideoError } from "@/src/lib/student-api/video-errors";
import { useTranslations } from "next-intl";
import VideoPreviewCard, { type PreviewCardState } from "./video-preview-card";
import { useVideoSession } from "./use-video-session";

export default function VideoLesson({
  item,
  lesson,
  courseId,
  completed,
  onCompleted,
}: {
  item: PublicItemDto;
  lesson: PublicLessonDto;
  courseId: number;
  completed: boolean;
  onCompleted: () => void;
}) {
  const tv = useTranslations("courseDetail.video");
  const router = useRouter();
  const session = useVideoSession({
    itemId: item.id,
    courseId,
    durationSec: item.duration_seconds,
    initiallyCompleted: completed,
    onUnauthenticated: () => router.replace("/login"),
  });
  const showPlayer = session.embedUrl !== null && (session.status.kind === "seeking" || session.status.kind === "playing");
  const progressQuery = useVideoProgress(showPlayer ? null : item.id);

  useEffect(() => {
    if (session.isCompleted) onCompleted();
  }, [session.isCompleted, onCompleted]);

  if (showPlayer) {
    return (
      <div className="relative size-full">
        <iframe
          ref={session.iframeRef}
          src={session.embedUrl ?? undefined}
          title={`${lesson.title} - ${item.title}`}
          className="size-full border-0 [color-scheme:light]"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {session.status.kind === "seeking" && (
          <div role="status" className="absolute inset-0 flex items-center justify-center bg-[#0D1015]/80 text-sm text-white">
            {tv("loadingPlayer")}
          </div>
        )}
      </div>
    );
  }

  let state: PreviewCardState;
  if (session.status.kind === "interrupted") state = { kind: "interrupted", positionSec: session.lastPositionSec };
  else if (session.status.kind === "error") state = { kind: "error", reason: session.status.reason };
  else if (session.status.kind === "starting" || progressQuery.isPending) state = { kind: "loading" };
  else if (progressQuery.isError) state = { kind: "error", reason: classifyVideoError(progressQuery.error) };
  else state = { kind: "ready", progress: progressQuery.data };

  return (
    <VideoPreviewCard
      state={state}
      onStart={session.start}
      // A failed progress load is refetched; any other failure starts a fresh session at the last position.
      onRetry={() => (progressQuery.isError ? void progressQuery.refetch() : session.start(session.lastPositionSec))}
    />
  );
}
```

- [ ] **Step 6: Integrate in `learner-player.tsx`**
  - Add props `courseId: number` and `completed: boolean`. Add `const [liveCompleted, setLiveCompleted] = useState(false);` and `const markCompleted = useCallback(() => setLiveCompleted(true), []);`. Reset `liveCompleted` when `activeContent?.item.id` changes using the "adjust state during render" pattern: keep `const [completedFor, setCompletedFor] = useState<number | null>(null)` instead of a boolean — `markCompleted` sets `completedFor` to the current item id, and `const showCompleted = completed || completedFor === activeContent?.item.id`.
  - Video branch: `assetUrl` for videos is no longer `bunny_stream_embed_url`. Compute `const isVideo = activeContent.type === "video";` and for videos skip the `!assetUrl` empty-state (only documents need `assetUrl`). Inside the aspect-video container, render `<VideoLesson key={activeContent.item.id} item={activeContent.item} lesson={activeContent.lesson} courseId={courseId} completed={completed} onCompleted={markCompleted} />` instead of the iframe and the iframe error block (documents keep the existing iframe + `iframeFailed` logic unchanged).
  - In the info bar, after the lesson title `<p>`, render when `showCompleted`:

```tsx
<span className="mt-2 inline-flex rounded-full bg-[#E6F4EC] px-2 py-1 text-[11px] font-bold text-[#16784A] dark:bg-emerald-400/10 dark:text-emerald-400">
  {t("completedStatus")}
</span>
```

- [ ] **Step 7: Run tests**

Run: `npm run test:unit -- src/features/courses`
Expected: PASS, except existing tests that rely on `bunny_stream_embed_url` rendering an iframe (e.g. `course-detail.container.test.tsx`) — those are updated in Task 10; note any failures and leave them for Task 10.

- [ ] **Step 8: Commit**

```bash
git add src/features/courses/video src/features/courses/components/learner-player.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat(video): preview card and signed-URL player in the learner view"
```

---

### Task 10: Course page integration — gating, progress PUT, selection freeze, deep link, curriculum progress

**Model:** `gpt-6.1-sol`, effort `medium` — edits across existing components with clear rules.

**Files:**
- Modify: `src/features/courses/components/course-detail.tsx`, `curriculum-accordion.tsx`, `learner-curriculum-sidebar.tsx`
- Modify: `src/app/[locale]/my-courses/[courseId]/page.tsx` (pass `initialItemId`)
- Modify: `src/lib/student-api/adapters.ts`, `src/features/teachers/types.ts`, `src/features/teachers/components/client/teacher-profile-view.tsx`
- Test: `src/features/courses/components/course-detail.container.test.tsx` (update + add)

**Interfaces:**
- Consumes: `LearnerPlayer` props `courseId`, `completed` (Task 9); `ItemVideoProgressDto` (Task 2).
- Produces: `CourseDetail` prop `initialItemId?: number`; `LearnerCurriculumSidebar` / `CurriculumAccordion` prop `videoProgressPercent?: ReadonlyMap<number, number>`; `ItemRow` prop `progressPercent?: number`.

- [ ] **Step 1: Update the existing fixtures and mock the player** in `course-detail.container.test.tsx`:
  - In the shared `course` fixture set item 101's `bunny_stream_embed_url: null` (the backend never fills it; `has_video: true` already makes it a video).
  - Add, next to the other `vi.mock` calls:

```tsx
vi.mock("@/src/features/courses/video/video-lesson", () => ({
  default: ({ item, lesson }: { item: { id: number; title: string }; lesson: { title: string } }) => (
    <div data-testid="video-lesson" data-item-id={item.id} title={`${lesson.title} - ${item.title}`} />
  ),
}));
```

  - In `it("embeds the first playable lesson for an enrolled student")` change the first assertion to
    `expect(await screen.findByTitle("مقدمة في النهايات - فيديو الشرح")).toHaveAttribute("data-item-id", "101");`
    (the `findByTitle` calls elsewhere keep working because the mock carries the same `title`).

- [ ] **Step 2: Add failing tests** — append to `course-detail.container.test.tsx`:

```tsx
describe("CourseDetail video analytics integration", () => {
  const videoItem = (id: number, title: string, extra: Partial<StudentCourseDetailDto["course"]["chapters"][number]["lessons"][number]["items"][number]> = {}) => ({
    id, title, order: id, duration_minutes: 10, duration_seconds: 600,
    has_video: true, has_document: false, has_exam: false,
    bunny_stream_embed_url: null, document_path: null, exam_id: null, ...extra,
  });

  function fixtureWith(
    items: StudentCourseDetailDto["course"]["chapters"][number]["lessons"][number]["items"],
    progress: Partial<NonNullable<StudentCourseDetailDto["enrollment"]>["progress"]> = {},
  ): StudentCourseDetailDto {
    const lesson = { ...course.chapters[0].lessons[0], items };
    const nextCourse = { ...course, chapters: [{ ...course.chapters[0], lessons: [lesson] }] };
    const enrollment = detail.enrollment!;
    return {
      ...detail,
      course: nextCourse,
      enrollment: { ...enrollment, course: nextCourse, progress: { ...enrollment.progress, ...progress } },
    };
  }

  function renderWith(fixture: StudentCourseDetailDto, props: { initialItemId?: number } = {}) {
    fetchMock.mockImplementation((input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/student/my-courses/12/progress" && init?.method === "PUT") {
        return Promise.resolve({ ok: true, status: 200, json: async () => fixture.enrollment?.progress });
      }
      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => fixture });
      }
      if (url === "/api/student/auth/me") {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 1, name: "الطالب" }) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: "not found" }) });
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail courseId={12} teacherSlug="ahmad-ali" grades={[]} streams={[]} {...props} />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );
    return { queryClient };
  }

  const progressPuts = () =>
    fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === "/api/student/my-courses/12/progress" && (init as RequestInit | undefined)?.method === "PUT");

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => cleanup());

  it("treats has_video items as playable even without an embed URL", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ")], { next_item_id: 201 }));
    expect(await screen.findByTestId("video-lesson")).toHaveAttribute("data-item-id", "201");
  });

  it("does not send a progress PUT when opening a video", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], { next_item_id: 201 }));
    await screen.findByTestId("video-lesson");
    fireEvent.click(screen.getByTestId("learner-curriculum-item-202"));
    await waitFor(() => expect(screen.getByTestId("video-lesson")).toHaveAttribute("data-item-id", "202"));
    expect(progressPuts()).toHaveLength(0);
  });

  it("document open on a video item sends no progress PUT", async () => {
    renderWith(detail);
    await screen.findByTestId("video-lesson");
    const item = screen.getByTestId("learner-curriculum-item-101");
    fireEvent.click(within(item).getByRole("button", { name: "عرض الملف" }));
    await waitFor(() =>
      expect(document.querySelector('iframe[src="https://cdn.elemni.test/lesson.pdf"]')).not.toBeNull());
    expect(progressPuts()).toHaveLength(0);
  });

  it("marks a document-only item complete on open", async () => {
    renderWith(detail);
    await screen.findByTestId("video-lesson");
    fireEvent.click(screen.getByTestId("learner-curriculum-item-102"));
    await waitFor(() => expect(progressPuts()).toHaveLength(1));
    expect((progressPuts()[0][1] as RequestInit).body).toBe(JSON.stringify({ item_id: 102, completed: true }));
  });

  it("keeps the selected item after progress refetch", async () => {
    const { queryClient } = renderWith(
      fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], { next_item_id: 201 }),
    );
    expect(await screen.findByTestId("video-lesson")).toHaveAttribute("data-item-id", "201");
    act(() => {
      queryClient.setQueriesData<StudentCourseDetailDto>({ queryKey: ["student", "course", 12] }, (current) =>
        current?.enrollment
          ? { ...current, enrollment: { ...current.enrollment, progress: { ...current.enrollment.progress, next_item_id: 202 } } }
          : current);
    });
    expect(screen.getByTestId("video-lesson")).toHaveAttribute("data-item-id", "201");
  });

  it("opens the deep-linked item first", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], { next_item_id: 201 }), { initialItemId: 202 });
    expect(await screen.findByTestId("video-lesson")).toHaveAttribute("data-item-id", "202");
  });

  it("shows a position bar for a partially watched video and counts video completion", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], {
      next_item_id: 201,
      completed_item_ids: [],
      video_progress: [
        { item_id: 201, last_position_sec: 290, watched_percent: 48, is_completed: false },
        { item_id: 202, last_position_sec: 600, watched_percent: 100, is_completed: true },
      ],
    }));
    await screen.findByTestId("video-lesson");
    expect(within(screen.getByTestId("learner-curriculum-item-201")).getByRole("progressbar"))
      .toHaveAttribute("aria-valuenow", "48");
    expect(within(screen.getByTestId("learner-curriculum-item-202")).getByText(arMessages.courseDetail.completedStatus))
      .toBeInTheDocument();
  });
});
```

Add `act` to the `@testing-library/react` import at the top of the file.

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:unit -- src/features/courses/components/course-detail.container.test.tsx`
Expected: the new tests FAIL.

- [ ] **Step 4: Implement in `course-detail.tsx`**
  - Add prop `initialItemId?: number`.
  - Add helper `const isPlayable = (item: PublicItemDto) => item.has_video || Boolean(absoluteDocumentUrl(item.document_path));` and replace every `Boolean(item.bunny_stream_embed_url) || Boolean(absoluteDocumentUrl(item.document_path))` with `isPlayable(item)`; replace `x.bunny_stream_embed_url ? playVideo : openDocument` / `type: … bunny_stream_embed_url ? "video" : "document"` with `has_video`.
  - Preferred initial item: `const preferredItemId = enrolled ? initialItemId ?? resumeItemId : null;` and use it in `firstPlayableContent` and `resumeLocation` instead of `resumeItemId`.
  - Selection freeze (adjust state during render, before `visibleActiveContent` is used):

```tsx
  if (enrolled && activeContent === null && firstPlayableContent) {
    setActiveContent({
      ...firstPlayableContent,
      type: firstPlayableContent.item.has_video ? "video" : "document",
    });
  }
```

  - `playVideo`: remove `progressMutation.mutate(...)`. `openDocument`: `if (enrolled && !item.has_video) progressMutation.mutate({ itemId: item.id });`.
  - Effective completion + progress map:

```tsx
  const videoProgress = detail?.enrollment?.progress.video_progress ?? [];
  const completedItemIds = Array.from(new Set([
    ...(detail?.enrollment?.progress.completed_item_ids ?? []),
    ...videoProgress.filter((entry) => entry.is_completed).map((entry) => entry.item_id),
  ]));
  const videoProgressPercent = new Map(videoProgress.map((entry) => [entry.item_id, entry.watched_percent]));
```

  Pass `completedItemIds` and `videoProgressPercent` to `LearnerCurriculumSidebar`, and `courseId={courseId}` + `completed={visibleActiveContent ? completedItemIds.includes(visibleActiveContent.item.id) : false}` to `LearnerPlayer`.
- [ ] **Step 5: Curriculum** — `learner-curriculum-sidebar.tsx`: add optional prop `videoProgressPercent?: ReadonlyMap<number, number>` and pass it to `CurriculumAccordion`. `curriculum-accordion.tsx`: add the same optional prop to `CurriculumAccordion` and `LessonRow`, pass `progressPercent={videoProgressPercent?.get(item.id)}` to `ItemRow`. In `ItemRow` replace both `item.bunny_stream_embed_url` checks with `item.has_video`, and in both video branches render under the meta `<span>`:

```tsx
{!completed && progressPercent !== undefined && progressPercent > 0 && progressPercent < 100 && (
  <span
    role="progressbar"
    aria-valuenow={progressPercent}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={t("video.reachedPercent", { percent: progressPercent })}
    className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[#E4E2DC] dark:bg-slate-700"
  >
    <span className="block h-full rounded-full bg-[#0A5FB4] dark:bg-sky-400" style={{ width: `${progressPercent}%` }} />
  </span>
)}
```

- [ ] **Step 6: Deep link** — `my-courses/[courseId]/page.tsx`: parse `item` (`/^\d+$/` and > 0, else `undefined`) and pass `initialItemId={parsedItem}` to `CourseDetail`.
- [ ] **Step 7: Dead `videoUrl`** — remove `videoUrl: item.bunny_stream_embed_url ?? undefined` from `adapters.ts`, `videoUrl?: string` from `src/features/teachers/types.ts`, and in `teacher-profile-view.tsx` replace the `item.videoUrl ? <a …>{item.title}</a> : …` conditional with the non-link branch only. Run `rg -n "videoUrl|bunny_stream_embed_url" src` — only `contract.ts` and tests fixtures may still mention `bunny_stream_embed_url`.
- [ ] **Step 8: Run tests**

Run: `npm run test:unit -- src/features/courses src/features/teachers src/lib/student-api`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/courses src/features/teachers src/lib/student-api/adapters.ts "src/app/[locale]/my-courses/[courseId]/page.tsx"
git commit -m "feat(video): gate on has_video, freeze selection, deep link, curriculum progress"
```

---

### Task 11: Dashboard "Continue Watching"

**Model:** `gpt-6-luna`, effort `high` — one pure helper plus a contained tile change.

**Files:**
- Create: `src/features/dashboard/continue-watching.ts` (+ `continue-watching.test.ts`)
- Modify: `src/features/dashboard/components/student-dashboard.tsx`
- Modify: `src/messages/{en,ar}.json` (`studentDashboard.ui`)

**Interfaces:**
- Consumes: `useLastWatched` (Task 5), `formatPlaybackTime` (Task 5), `LastWatchedDto`, `EnrollmentDto`.
- Produces: `resolveContinueWatching(lastWatched: LastWatchedDto | undefined, enrollments: EnrollmentDto[]): { lastWatched: LastWatchedDto; enrollment: EnrollmentDto } | null`.

- [ ] **Step 1: Messages** — add to `studentDashboard.ui`: en `"continueWatching": "Continue watching"`, `"continueAt": "at <time></time>"`, `"videoReached": "Reached {percent}% of this video"`; ar `"continueWatching": "كمّل المشاهدة"`, `"continueAt": "عند <time></time>"`, `"videoReached": "وصلت لـ {percent}٪ من الفيديو"`.

- [ ] **Step 2: Failing test** — `continue-watching.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { EnrollmentDto, LastWatchedDto } from "@/src/lib/student-api/contract";
import { resolveContinueWatching } from "./continue-watching";

const lw = (overrides: Partial<LastWatchedDto> = {}): LastWatchedDto => ({
  course_id: 5, course_title: "Physics 101", lesson_id: 12, lesson_title: "Kinematics",
  item_id: 42, item_title: "Lecture 1", last_position_sec: 872, watched_percent: 48,
  is_completed: false, last_watched_at: "2026-10-02T08:50:00Z", ...overrides,
});
const enrollment = (courseId: number) => ({ course_id: courseId, course: { id: courseId } }) as unknown as EnrollmentDto;

describe("resolveContinueWatching", () => {
  it("returns the enrollment for an unfinished, enrolled video", () => {
    const result = resolveContinueWatching(lw(), [enrollment(3), enrollment(5)]);
    expect(result?.enrollment.course_id).toBe(5);
    expect(result?.lastWatched.item_id).toBe(42);
  });
  it("ignores a course the student is not enrolled in", () => {
    expect(resolveContinueWatching(lw(), [enrollment(3)])).toBeNull();
  });
  it("ignores a completed video", () => {
    expect(resolveContinueWatching(lw({ is_completed: true }), [enrollment(5)])).toBeNull();
  });
  it("handles no data", () => {
    expect(resolveContinueWatching(undefined, [enrollment(5)])).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify failure** — `npm run test:unit -- src/features/dashboard/continue-watching.test.ts` → FAIL.

- [ ] **Step 4: Implement** `continue-watching.ts`:

```ts
import type { EnrollmentDto, LastWatchedDto } from "@/src/lib/student-api/contract";

export function resolveContinueWatching(lastWatched: LastWatchedDto | undefined, enrollments: EnrollmentDto[]) {
  if (!lastWatched || lastWatched.is_completed) return null;
  const enrollment = enrollments.find((entry) => entry.course_id === lastWatched.course_id);
  return enrollment ? { lastWatched, enrollment } : null;
}
```

  In `student-dashboard.tsx`:
  - `const lastWatchedQuery = useLastWatched();` and `const continueWatching = resolveContinueWatching(lastWatchedQuery.data, enrollments);`.
  - `const tileEnrollment = continueWatching?.enrollment ?? primary;` — render the Resume tile when `tileEnrollment` exists, using `tileEnrollment` everywhere the tile used `primary` (cover, title, subject, expiry).
  - When `continueWatching` is set, inside the tile: the eyebrow `<span>` shows `tUi("continueWatching")`; under the `<h2>` render `<p className="mt-2 text-sm text-white">{lesson_title} › {item_title} · {tUi.rich("continueAt", { time: () => <span dir="ltr" className="tabular-nums">{formatPlaybackTime(last_position_sec)}</span> })}</p>` instead of the completion line; the progress bar uses `watched_percent` with `aria-label={tUi("videoReached", { percent })}`; both links point to `` `/my-courses/${course_id}?item=${item_id}` ``. Otherwise the tile is unchanged.
  - Loading/error/404 of `lastWatchedQuery` → `continueWatching` is `null` → unchanged tile.

- [ ] **Step 5: Run tests** — `npm run test:unit -- src/features/dashboard` → PASS (existing `student-dashboard.analysis.test.tsx` must still pass; if it renders the dashboard, mock `useLastWatched` there to return `{ data: undefined }`).

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard src/messages/en.json src/messages/ar.json
git commit -m "feat(video): continue-watching tile on the dashboard"
```

---

### Task 12: End-to-end test with a fake Bunny player

**Model:** `gpt-6.1-sol`, effort `medium` — Playwright mocks plus a tiny player.js receiver page.

**Files:**
- Create: `tests/e2e/video-analytics.spec.ts`

**Interfaces:**
- Consumes: BFF paths (Task 3), `CourseDetail` deep link (Task 10), UI copy (Task 9, English locale at `/en/...`).

- [ ] **Step 1: Write the test** — `tests/e2e/video-analytics.spec.ts`. The enrolled page is client-fetched; mock every BFF call with `page.route` and give the browser a fake access cookie so the server guard passes (BFF routes are mocked, so the cookie is never validated).

```ts
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
```

(`"Done"` is the current English `courseDetail.completedStatus`; read it from `src/messages/en.json` if it changed.)

- [ ] **Step 2: Run**

Run: `npm run test:e2e -- tests/e2e/video-analytics.spec.ts`
Expected: 3 passed. If the cookie domain differs (Playwright `baseURL` is `http://127.0.0.1:3101`), keep `127.0.0.1`.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/video-analytics.spec.ts
git commit -m "test(video): e2e with a fake Bunny player.js receiver"
```

---

### Task 13: Full gates and whole-branch review

**Model:** gates are run by the orchestrator; review by `gpt-6-astra`, effort `high`, `--read-only`.

- [ ] **Step 1: Frontend gates** (orchestrator, in `elemni_front_end`): `npm run lint`, `npm run build`, `npm run test`. All must pass.
- [ ] **Step 2: Backend gate** (orchestrator, in `elemni`): the backend command from Global Constraints. All must pass.
- [ ] **Step 3: Whole-branch Codex review** — read-only brief listing the spec path, this plan path, both branches' diffs (`git diff main...feat/video-analytics` in the frontend, `git diff main...feat/video-analytics-accounting` in the backend) and the Review Focus list; ask for defects ranked by severity with file:line evidence. Verify each finding before acting; fix confirmed ones via delta briefs on the owning task's Codex session.
- [ ] **Step 4: Manual Bunny check** (requires a real library; record results in the PR description): player.js `ready`/`timeupdate` shapes, `setCurrentTime` seek, and whether playback continues past the 1 h signed-URL expiry.
- [ ] **Step 5: Hand off** — report gate output, review results, and the manual-check result to the user; branch integration follows `superpowers:finishing-a-development-branch`.
