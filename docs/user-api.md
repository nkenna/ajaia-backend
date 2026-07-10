# User API — Frontend Integration Guide

This document describes the `user` module so frontend developers can implement
self-service account management (view/update profile, change password, delete
account). It is generated from the source in `src/modules/user`.

> **Base path:** the router (`userRouter`) is mounted at **`/api/v1/users`**.
> All routes require `Authorization: Bearer <accessToken>`. There is **no
> admin/other-user path** — every endpoint operates on the authenticated user
> (`req.user.id`).

---

## Authentication

All routes require a valid access token. Send:
```
Authorization: Bearer <accessToken>
```
Unauthenticated requests → `401 Unauthorized`.

---

## Endpoints

### GET `/api/v1/users/me` — get profile

**Auth required.** Returns the authenticated user.

**Success — `200 OK`**
```json
{
  "id": "c2f…uuid",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "createdAt": "2026-07-10T10:00:00.000Z",
  "updatedAt": "2026-07-10T10:00:00.000Z"
}
```

> `passwordHash` is **never** returned.

**Errors:** `401` if not authenticated; `400` "User not found".

---

### PATCH `/api/v1/users/me` — update profile

**Auth required.** Updates **only `firstName` and `lastName`**. The email is
immutable through this endpoint.

**Body** (all optional, non-empty strings)
```json
{ "firstName": "Augusta", "lastName": "Ada" }
```

**Success — `200 OK`** → the updated user (no `passwordHash`).

**Errors:** `400` validation (empty string) or "User not found".

---

### POST `/api/v1/users/me/password` — change password

**Auth required.** Verifies the current password, then updates it. On success
it **revokes all refresh tokens and deletes all sessions**, logging the user
out of every other device. The caller must re-authenticate (log in again) to
get a new token.

**Body**
```json
{ "currentPassword": "old-secret", "newPassword": "new-secret" }
```

**Success — `200 OK`**
```json
{ "success": true }
```

**Errors:** `400` validation (new password < 8 chars); `400` "Current password
is incorrect"; `400` "User not found".

---

### DELETE `/api/v1/users/me` — delete account

**Auth required.** Requires the password to confirm, then deletes the user.
This cascades to the user's projects, documents, versions, sessions, refresh
tokens, and files.

**Body**
```json
{ "password": "current-secret" }
```

**Success — `200 OK`**
```json
{ "success": true }
```

**Errors:** `400` "Password is required to delete the account"; `400` "Password
is incorrect"; `400` "User not found".

> After deletion the access token is invalid — clear all client-side tokens.

---

## Error responses

Validation failures → **`400`** with the express-validator array:
```json
{ "errors": [ { "type": "field", "msg": "New password must be at least 8 characters", "path": "newPassword", "location": "body" } ] }
```

Domain errors → handled by `src/middlewares/errorHandler.ts`:
```json
{ "status": "error", "message": "Current password is incorrect" }
```

---

## TypeScript types (reference)

```ts
interface UpdateUserInfoInputData {
  userId: string;
  firstName?: string;
  lastName?: string;
}
interface ChangePasswordInputData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}
interface GetUserInfoInputData { userId: string; }
interface DeleteAccountInputData { userId: string; password: string; }
```

---

## Notes / TODO for frontend awareness

- **Self-service only** — there is no way to read/update another user; all
  routes are `/me`.
- **Email is read-only** here — `updateUserInfo` rejects email changes. If you
  need email change, that requires a separate verification flow (not
  implemented).
- **Password change logs you out everywhere** (sessions + refresh tokens
  revoked). Prompt the user to log in again.
- **Account deletion is irreversible** and removes all the user's data
  (projects, documents, files). Confirm in the UI before calling.
- Mounted under `/api/v1/users` in `src/routes.ts`.
