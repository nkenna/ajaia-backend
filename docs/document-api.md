# Document API — Frontend Integration Guide

This document describes the `document` module so frontend developers can
implement document CRUD, versioning, sharing, and file uploads. It is
generated from the source in `src/modules/document`.

> **Base path:** the router (`documentRouter`) is intended to be mounted at
> **`/api/v1/documents`** (e.g. `app.use("/api/v1/documents", documentRouter)`).
> As of writing, only `/api/v1/auth` is wired in `src/routes.ts`, so the
> document routes still need to be mounted there.

---

## Authentication

All routes require `Authorization: Bearer <accessToken>` **except**
`GET /shared/:shareToken`, which is a **public** share link (anyone with the
token can read the document).

---

## Data model

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (uuid) | |
| `slug` | string | unique **per project** (`@@unique([projectId, slug])`) |
| `shareToken` | string (uuid) | globally unique; the public share-link id |
| `name` | string | display name |
| `projectId` | string | owning project |
| `userId` | string | owner |
| `currentVersion` | int | starts at 1, incremented on every save/restore |
| `content` | JSON | current document content (see format below) |
| `contentHtml` | string? | optional rendered HTML |
| `versions` | VersionHistory[] | history (returned on detail/share endpoints) |
| `files` | File[] | attached/uploaded files |
| `createdAt` / `updatedAt` | datetime | |

### Content format

`content` is a JSON value. The server is agnostic to the editor; the shape
produced by the built-in upload parser is:

- Plain text / Markdown upload:
  ```json
  { "type": "doc", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "..." } ] } ] }
  ```
- `.docx` upload (via `mammoth`):
  ```json
  { "type": "doc", "html": "<p>...</p>" }
  ```

Send whatever your rich-text editor produces; store its JSON back in
`content` on save. `contentHtml` is optional and only used for preview/search.

---

## Endpoints

### POST `/api/v1/documents` — create

**Auth required.** Creates a document inside a project the user owns and seeds
version 1.

**Body**

| Field | Type | Rules |
|-------|------|-------|
| `projectId` | string | must belong to the user |
| `name` | string | non-empty |
| `slug` | string | `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique in the project |
| `content` | JSON? | optional; defaults to empty doc |
| `contentHtml` | string? | optional |

**Success — `201 Created`** → the created `Document`.

**Errors:** `400` validation; `400` "Project not found" / "You do not have
permission to create a document in this project" / "A document with this slug
already exists in this project".

---

### GET `/api/v1/documents/shared/:shareToken` — open by share link (PUBLIC)

**No auth.** Anyone with the token can read the document (and its version
history).

**Success — `200 OK`** → the `Document` with `versions` included (newest first).

**Errors:** `400` missing token; `400` "Document not found".

> Build share URLs like `/doc/shared/<shareToken>`. The `slug` is **not** part
> of the share link — only `shareToken` matters.

---

### GET `/api/v1/documents` — list (owner)

**Auth required.** Returns the user's documents, newest activity first.
Optional query: `?projectId=<id>` to scope to one project.

**Success — `200 OK`** → `Document[]`.

**Errors:** `400` "Document not found" / permission (only if a filtered
project is not owned).

---

### GET `/api/v1/documents/:id` — get owned

**Auth required.** Returns the document only if the caller owns it (includes
`versions`).

**Success — `200 OK`**. **Errors:** `400` "Document not found" / "You do not
have permission to access this document".

---

### GET `/api/v1/documents/:id/versions` — version history

**Auth required.** Returns `VersionHistory[]` for the document (newest first),
each with `versionNumber`, `content`, `contentHtml`, `createdAt`.

**Errors:** `400` not found / permission.

---

### PUT `/api/v1/documents/:id/rename` — rename

**Auth required.** Updates both `name` **and** `slug`. The `slug` must be
valid (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and unique within the project; otherwise
the request fails. `shareToken` is **not** changed, so existing share links
keep working. If you only want to change the display name, send the current
slug back unchanged.

**Body:** `name` (required), `slug` (required).

**Success — `200 OK`** → updated `Document`. **Errors:** `400` not found /
permission / "A document with this slug already exists in this project".

---

### PUT `/api/v1/documents/:id/content` — save content

**Auth required.** Saves new content, bumps `currentVersion`, and appends a new
`VersionHistory` row (non-destructive — history is preserved).

**Body**

| Field | Type | Rules |
|-------|------|-------|
| `content` | JSON | required |
| `contentHtml` | string? | optional |

**Success — `200 OK`** → updated `Document` (with new `currentVersion`).
**Errors:** `400` not found / permission.

---

### POST `/api/v1/documents/:id/restore` — restore a version

**Auth required.** Copies a past version's content into a **new** version
(`currentVersion + 1`); the old version remains in history.

**Body:** `versionNumber` (int ≥ 1, required).

**Success — `200 OK`** → updated `Document`. **Errors:** `400` not found /
permission / "Version not found".

---

### DELETE `/api/v1/documents/:id` — delete

**Auth required.** Removes the document (and cascades to its `versions` and
`files`).

**Success — `204 No Content`**. **Errors:** `400` not found / permission.

---

### POST `/api/v1/documents/import` — upload a file → new document (multipart)

**Auth required.** Accepts a file upload (`.txt`, `.md`, `.docx`), parses it,
creates a new document from its content, and links the `File` record.

**Request:** `multipart/form-data` with field **`file`** (required). Optional
fields: `name` (defaults to the filename), `projectId` (defaults to the user's
first project), `contentHtml`.

- Allowed extensions: **`.txt`, `.md`, `.docx`** (other types → `400`).
- Max file size: **10 MB**.
- `.docx` is parsed to HTML via `mammoth`; `.txt`/`.md` become plain text.

**Success — `201 Created`** → the created `Document`. **Errors:** `400`
unsupported type / no file / permission on `projectId`.

---

### POST `/api/v1/documents/:id/import` — upload file → import into existing draft

**Auth required.** Multipart `file` (required). Parsed content is saved as a
new version of the existing document, and the `File` is linked.

**Success — `200 OK`** → updated `Document`. **Errors:** same as above plus
ownership/permission.

---

### POST `/api/v1/documents/:id/files` — attach an uploaded file

**Auth required.** Multipart `file` (required). The uploaded file is linked to
the document as an attachment (no content change). Both the document and the
file must belong to the user.

**Success — `200 OK`** → the updated `File` record. **Errors:** `400` not
found / permission (document or file).

---

## Error responses

Validation failures → **`400`** with the express-validator array:
```json
{ "errors": [ { "type": "field", "msg": "Name is required", "path": "name", "location": "body" } ] }
```

Domain errors → handled by `src/middlewares/errorHandler.ts`:
```json
{ "status": "error", "message": "You do not have permission to access this document" }
```

Unauthenticated requests to protected routes → **`401 Unauthorized`**.

---

## TypeScript types (reference)

```ts
interface CreateDocumentInputData {
  userId: string; projectId: string; name: string; slug: string;
  content?: unknown; contentHtml?: string;
}
interface RenameDocumentInputData { id: string; userId: string; name: string; slug: string; }
interface UpdateDocumentContentInputData { id: string; userId: string; content: unknown; contentHtml?: string; }
interface ListVersionsInputData { documentId: string; userId: string; }
interface RestoreVersionInputData { documentId: string; userId: string; versionNumber: number; }
interface DeleteDocumentInputData { id: string; userId: string; }
interface ListDocumentsInputData { userId: string; projectId?: string; }
interface ImportFileAsDocumentInputData {
  userId: string; projectId?: string; name: string; content: unknown; contentHtml?: string; fileId: string;
}
interface ImportFileIntoDocumentInputData {
  documentId: string; userId: string; content: unknown; contentHtml?: string; fileId: string;
}
interface AttachFileInputData { documentId: string; userId: string; fileId: string; }
```

---

## Notes / TODO for frontend awareness

- **Mount the router** in `src/routes.ts` under `/api/v1/documents`.
- **Share link is public** — `GET /shared/:shareToken` needs no token; guard it
  in the UI if you only want owners to see it.
- **Uploads are multipart** with the field name `file`; allowed types are
  `.txt`, `.md`, `.docx` (≤ 10 MB).
- **`shareToken` is stable** — regenerating it is not implemented, so a share
  link, once created, does not rotate.
- **Rename updates `slug`** — send the existing slug unchanged if you only want
  to change the display name; the public `shareToken` is never rotated.
