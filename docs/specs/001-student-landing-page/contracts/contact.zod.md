# Contract: POST /v1/contact

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Rationale / Decision: see `../research.md` R5. The "Contact Us" section submits
a Server Action which proxies to this endpoint. In v1, when the endpoint does
not exist, the section renders a `mailto:` fallback instead — never a fake
success (constitution Article V).

## Request

- Method: `POST`
- Path: `/v1/contact`
- Headers: `Accept-Language: ar|en`, `Content-Type: application/json`, `X-Request-Id: <correlationId>`
- Auth: public (rate-limited at the edge)
- Cache: NEVER (`cache: "no-store"`) — contact submissions are mutations and
  are not cached (Article X). Server Action MUST NOT auto-retry a POST
  (Article VIII — preventing double-send the same way we prevent double-charge).

## Request body

```json
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "subject": "Question about pricing",
  "message": "I want to know...",
  "locale": "ar"
}
```

## Success Response (202 Accepted)

```json
{
  "data": {
    "id": "990e8400-...",
    "status": "received"
  }
}
```

The server acknowledges reception only. The UI stays in `submitting` until this
202 arrives, then transitions to `success` (Article V — never optimistic).

## Error responses

See `common-error.md`. The relevant types for this endpoint:

| Type | When | UI handling |
|------|------|-------------|
| `Validation` | Bad email, empty name, oversized message | Inline localized field messages |
| `RateLimited` | Edge throttling | "Try again shortly" |
| `Upstream` / `Network` | Backend down | "Something went wrong, please try again" + retry |

## zod schema (planned: `src/features/student-landing/schemas/contact.ts`)

```ts
import { z } from "zod";

export const ContactInputSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().max(120).optional(),
  message: z.string().min(1).max(2000),
  locale: z.enum(["ar", "en"]),
});

export const ContactResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    status: z.enum(["received", "queued"]),
  }),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
```

## Server Action (planned)

`src/features/student-landing/actions/submit-contact.ts`:

```text
"use server";
1. zod-parse the input.formData for fast feedback (NOT trust — Article XII).
2. Gate: no-auth for v1 public contact (UX gate only).
3. Call `src/lib/api/contact.ts` → POST /v1/contact with server-only credentials.
4. Map response to typed error taxonomy; never return raw API errors.
5. On success: revalidate scoped tags (none needed for contact — Article X).
6. Return `{ ok: true, id }` or `{ ok: false, error }` to the client.
```

**Notes**:
- The Server Action is a public HTTP endpoint (Article XII). Input zod is for
  feedback, NOT authorization — the backend revalidates.
- No client-side rate limiting — that is theater (Article V). Rate limiting is
  enforced server-side via the typed `RateLimited` error.
- `mailto:` fallback details: when `API_URL`/contact endpoint is absent, render
  a `mailto:<contact-email>` link populated from `messages/<locale>.json` and
  hide the form. Never render a submit button that fakes success.