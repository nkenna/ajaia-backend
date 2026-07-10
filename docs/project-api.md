# Project API — Frontend Integration Guide

This document describes the `project` module so frontend developers can
implement project CRUD (create, list, edit, delete). It is generated from the
source in `src/modules/project`.

> **Base path:** the router (`projectRouter`) is intended to be mounted at
> **`/api/v1/projects`** (e.g. `app.use("/api/v1/projects", projectRouter)`).
> As of writing, only `/api/v1/auth` is wired in `src/routes.ts`, so the
> project routes still need to be mounted there.

All project endpoints require an **authenticated user**. The controller reads
the user id from `req.user.id` (set by the auth middleware). If that is
missing the endpoint returns `401 Unauthorized`.

---

## Data model

A `Project` belongs to a `User` (`userId`). Slugs are **unique per user**
(enforced at the service layer; the DB also has a global `@unique` on `slug`).

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (uuid) | auto-generated |
| `slug` | string | globally unique; must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `name` | string | display name |
| `description` | string? | optional |
| `userId` | string | owner |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

---

## Endpoints

### POST `/api/v1/projects`

Create a project for the authenticated user.

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | non-empty, trimmed |
| `slug` | string | lowercase alphanumeric + hyphens (`my-project`) |
| `description` | string? | optional, trimmed |

```json
{ "name": "Marketing Site", "slug": "marketing-site", "description": "Landing page copy" }
```

**Success — `201 Created`**

```json
{
  "id": "b3f…uuid",
  "slug": "marketing-site",
  "name": "Marketing Site",
  "description": "Landing page copy",
  "userId": "c2f…uuid",
  "createdAt": "2026-07-10T10:00:00.000Z",
  "updatedAt": "2026-07-10T10:00:00.000Z"
}
```

**Errors**
- `400` validation failure.
- `400` "A project with this slug already exists for this user" (slug taken
  by this user) or "Slug must be lowercase alphanumeric and hyphen-separated".

---

### GET `/api/v1/projects/:userId`

List the authenticated user's projects (newest first).

> **Note:** although the route captures `:userId` from the URL and the
> validator requires it, the controller **ignores the URL param** and lists
> projects for the **currently authenticated user** (`req.user.id`). Pass the
> authenticated user's id in the path (or any value — it is only used as a
> fallback if `req.user` is absent). The recommended client behavior is to
> call `GET /api/v1/projects/me` style with the logged-in user's id.

**Success — `200 OK`**

```json
[
  {
    "id": "b3f…uuid",
    "slug": "marketing-site",
    "name": "Marketing Site",
    "description": "Landing page copy",
    "userId": "c2f…uuid",
    "createdAt": "2026-07-10T10:00:00.000Z",
    "updatedAt": "2026-07-10T10:00:00.000Z"
  }
]
```

**Errors**
- `401` if not authenticated.
- `400` if `userId` path param is missing.

---

### PUT `/api/v1/projects/:id`

Edit a project the user owns.

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | non-empty, trimmed |
| `slug` | string | lowercase alphanumeric + hyphens |
| `description` | string? | optional, trimmed |

```json
{ "name": "Marketing Site v2", "slug": "marketing-site-v2" }
```

**Success — `200 OK`** — returns the updated project (same shape as create).

**Errors**
- `400` validation failure.
- `400` "A project with this slug already exists for this user" (when the new
  slug collides with another of the user's projects).
- `400` "You do not have permission to access this project" (not the owner).
- `400` "Project not found" (unknown id).

---

### DELETE `/api/v1/projects/:id`

Delete a project the user owns.

**Success — `204 No Content`** (empty body).

**Errors**
- `401` if not authenticated.
- `400` "You do not have permission to access this project" (not the owner).
- `400` "Project not found" (unknown id).

> Deleting a project cascades to its `documents` and `files` (per the Prisma
> relations), so associated documents/files are removed with it.

---

## Error responses

Validation failures return **`400 Bad Request`** with the express-validator
error array:

```json
{
  "errors": [
    { "type": "field", "msg": "Slug must be lowercase alphanumeric and hyphen-separated", "path": "slug", "location": "body" }
  ]
}
```

Domain errors (`Project not found`, `You do not have permission to access this
project`, slug conflicts) are thrown and handled by the global error handler
(`src/middlewares/errorHandler.ts`), which responds with
`{ "status": "error", "message" }`.

---

## TypeScript types (reference)

```ts
interface CreateProjectInputData {
  userId: string;
  name: string;
  slug: string;
  description?: string;
}

interface EditProjectInputData {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
}

interface DeleteProjectInputData {
  id: string;
  userId: string;
}

interface ListProjectsInputData {
  userId: string;
}
```

---

## Notes / TODO for frontend awareness

- **Mount the router:** add `projectRouter` to `src/routes.ts` under
  `/api/v1/projects` (currently only auth is wired).
- **No single-project GET:** there is no `GET /:id` to fetch one project by
  id; use the list endpoint and filter client-side, or add one.
- **List route quirk:** `GET /:userId` uses the authenticated user, not the
  URL param, for ownership. The `:userId` segment is effectively required only
  to satisfy the route/validator.
- **Slug is permanent-ish:** editing changes the slug; update any shared links
  accordingly (documents use their own `shareToken`, which is unaffected).
- **Default project:** registration creates a `default` project for the user
  (`slug: default-<userId>`); it will appear in the list response.
