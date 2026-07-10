# Auth API — Frontend Integration Guide

This document describes the `auth` module so frontend developers can implement
registration, login, logout, and token handling. It is generated from the source
in `src/modules/auth`.

Base URL: **`/api/v1/auth`** (the router is mounted with `app.use("/api/v1/auth", authRouter)`).

---

## Out of scope (intentionally omitted)

Due to **time and environment constraints**, the following auth features are
**not implemented** in this module and are therefore unavailable to the frontend:

- **Forgot password** — no endpoint to request a password-reset link or code.
- **Reset password** — no endpoint to set a new password from a reset token.
- **Email verification** — no verification flow, no verification token, and no
  email-confirmation/`verified` state on the user. Accounts created via
  `POST /api/v1/auth/register` are usable immediately.

If these are needed later, they would be added as new routes in
`src/modules/auth` (e.g. `POST /api/v1/auth/forgot-password`,
`POST /api/v1/auth/reset-password`, `POST /api/v1/auth/verify-email`) together with any
required models/fields. The endpoints documented below are the only auth
endpoints that exist.

---

## Auth flow

```
1. Register / Login
   POST /api/v1/auth/register | POST /api/v1/auth/login
        │
        ├─ validate input (400 if invalid)
        ├─ create Session + RefreshToken (DB)
        ├─ sign accessToken (JWT, 15m)
        └─ respond 200/201 with { user, accessToken, refreshToken, sessionToken }

2. Authenticated requests
   Send:  Authorization: Bearer <accessToken>
   (protected routes read the token; see "Token usage" below)

3. Logout
   POST /api/v1/auth/logout  { sessionToken }
        └─ revoke refresh tokens + delete session  → 204

4. (Future) Refresh
   A refresh endpoint is NOT implemented yet. The issued refreshToken
   currently cannot be exchanged for a new accessToken via the API.
```

---

## Tokens

The backend issues **three** tokens on register and login. Store all three
securely (e.g. `accessToken` in memory, `refreshToken` + `sessionToken` in
httpOnly cookies or secure storage).

| Token | Type | TTL | Purpose |
|-------|------|-----|---------|
| `accessToken` | JWT (HS256, signed with `JWT_SECRET`) | **15 minutes** | Sent as `Authorization: Bearer <token>` on API calls. Payload: `{ sub: userId, sessionId }`. |
| `refreshToken` | Opaque random hex (64 chars), stored in DB | **30 days** | Long-lived credential. **No refresh route exists yet** — cannot currently be exchanged. |
| `sessionToken` | Opaque random hex (64 chars) | 30 days | Identifies the `Session` row. **Required by `POST /api/v1/auth/logout`**. |

> Because there is no token-refresh endpoint yet, plan for the access token
> expiring after 15 minutes. When implemented, the frontend will POST the
> `refreshToken` to obtain a new `accessToken`.

---

## Endpoints

### POST `/api/v1/auth/register`

Create a user, start a session, and return tokens. A default project is also
created for the user in the background (not in the response).

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | valid email, normalized |
| `password` | string | min 8 characters |
| `firstName` | string | non-empty, trimmed |
| `lastName` | string | non-empty, trimmed |

```json
{
  "email": "ada@example.com",
  "password": "supersecret",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```

**Success — `201 Created`**

```json
{
  "user": {
    "id": "c2f…uuid",
    "email": "ada@example.com",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "createdAt": "2026-07-10T10:00:00.000Z",
    "updatedAt": "2026-07-10T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiI…",
  "refreshToken": "a1b2c3…64-hex-chars",
  "sessionToken": "d4e5f6…64-hex-chars"
}
```

> `passwordHash` is **never** returned.

---

### POST `/api/v1/auth/login`

Authenticate an existing user and return tokens.

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | valid email, normalized |
| `password` | string | non-empty |

```json
{ "email": "ada@example.com", "password": "supersecret" }
```

**Success — `200 OK`**

```json
{
  "user": {
    "id": "c2f…uuid",
    "email": "ada@example.com",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "createdAt": "2026-07-10T10:00:00.000Z",
    "updatedAt": "2026-07-10T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiI…",
  "refreshToken": "a1b2c3…64-hex-chars",
  "sessionToken": "d4e5f6…64-hex-chars"
}
```

> Invalid credentials return a generic `Invalid email or password` error (same
> message for wrong email or wrong password) to avoid user enumeration.

---

### POST `/api/v1/auth/logout`

End the session. Revokes the session's refresh tokens and deletes the session.

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `sessionToken` | string | required, the value from login/register |

```json
{ "sessionToken": "d4e5f6…64-hex-chars" }
```

**Success — `204 No Content`** (empty body)

---

## Error responses

Validation failures return **`400 Bad Request`** with the express-validator
error array:

```json
{
  "errors": [
    { "type": "field", "msg": "Password must be at least 8 characters", "path": "password", "location": "body" }
  ]
}
```

Business/domain errors (e.g. `User with this email already exists`,
`Invalid email or password`, `Session not found`) are thrown and handled by the
app's global error middleware — surface the `message` to the user. The exact
status code depends on that middleware (not part of this module).

---

## Token usage (recommended frontend behavior)

1. After `register`/`login`, persist:
   - `accessToken` → in-memory / React state (short-lived, 15m).
   - `refreshToken` + `sessionToken` → httpOnly cookie or secure storage.
2. Attach the access token to every authenticated request:

   ```
   Authorization: Bearer <accessToken>
   ```
3. When the backend introduces a refresh route, call it with `refreshToken`
   to mint a new `accessToken` before the old one expires.
4. On logout, call `POST /api/v1/auth/logout` with the stored `sessionToken`, then
   clear all three tokens client-side.
5. The `shareToken` URL param is **not** an auth token — it is used for public
   document sharing (see the document module docs).

---

## TypeScript types (reference)

```ts
interface RegisterInputData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginInputData {
  email: string;
  password: string;
}

interface RegisterResult {
  user: { id: string; email: string; firstName: string; lastName: string; createdAt: Date; updatedAt: Date };
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
}

interface LoginResult {
  user: { id: string; email: string; firstName: string; lastName: string; createdAt: Date; updatedAt: Date };
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
}

interface LogoutInputData {
  sessionToken: string;
}
```

---

## Known gaps / TODO for frontend awareness

- **No refresh endpoint** — access tokens expire in 15 min with no API to
  renew them yet.
- **No protected-route auth middleware wired** in this module — the
  `accessToken` is issued and intended for `Authorization: Bearer`, but route
  guards are not enforced server-side here yet.
- **`sessionToken` is required for logout** — if it is lost, the session can
  only be ended by expiry or server-side cleanup.
- Registering a user **also creates a `default` project** (fire-and-forget);
  this is not reflected in the register response.
