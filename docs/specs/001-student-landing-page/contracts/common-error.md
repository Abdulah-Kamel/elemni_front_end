# Common Error Taxonomy

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Constitution Article VIII requires that API errors be mapped to a typed taxonomy
and that components branch on the **type**, never on a status code or a message
string. A raw throw is never surfaced to the user.

## Error type

`type:` (enum — one of the following). All other fields are optional.

| Type | HTTP status range | Meaning | UI handling |
|------|-------------------|---------|-------------|
| `Unauthorized` | 401 | No valid session for an authenticated read | Route to sign-in (none in v1 catalog reads) |
| `Forbidden` | 403 | Authenticated but not allowed | Show a localized "not available" message |
| `NotFound` | 404 | Resource does not exist | Render empty-state / fallback content |
| `Validation` | 422 | Request did not pass backend validation | Inline localized field errors (Contact form) |
| `RateLimited` | 429 | Too many requests | Show "try again shortly" + retry hint |
| `Conflict` | 409 | Concurrent modification | Show "try again" (Contact: rare) |
| `Upstream` | 502, 503, 504, 500 | Backend / network failure | Render catalog fallback; show retry for Contact |
| `Network` | (no response) | Timeout / DNS / offline | Same as `Upstream` |

## Response shape (assumed)

```json
{
  "error": {
    "type": "Upstream",
    "message": "localized message",
    "fields": { "email": "localized field error" },
    "requestId": "..."
  }
}
```

`requestId` is echoed back from the client-supplied request ID header for
cross-boundary tracing (Article VIII).

## Frontend mapping

`src/lib/api/` is the single place that maps HTTP responses to this taxonomy.
Components branch on `error.type` only. Localized messages come from
`messages/<locale>.json` keyed by `errorType.<type>` (NEVER from `error.message`
shown to the user as-is — it is logged/traced, not displayed).