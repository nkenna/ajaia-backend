# Document Sharing Feature

## Overview

Implements a simple sharing model so that a document owner can share a document with another user by email. Shared users receive either `read` or `edit` access, and the API enforces these permissions on every document operation.

## Database

### New model: `DocumentShare`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | UUID primary key |
| `documentId` | `String` | FK to `Document` |
| `sharedWithId` | `String` | FK to `User` |
| `permission` | `String` | `"read"` (default) or `"edit"` |
| `createdAt` | `DateTime` | Timestamp |

Unique constraint on `[documentId, sharedWithId]`.

### Updated models

- `User` — added `sharedDocuments DocumentShare[]` relation
- `Document` — added `shares DocumentShare[]` relation

### Migration

```
20260710124634_add_document_sharing
```

Run `npx prisma migrate dev` to apply, then `npx prisma generate` to update the client.

## Types

| Type | Purpose |
|------|---------|
| `ShareDocumentInputData` | `{ documentId, userId, sharedWithEmail, permission? }` |
| `UnshareDocumentInputData` | `{ documentId, userId, shareId }` |
| `ListDocumentSharesInputData` | `{ documentId, userId }` |
| `ListSharedDocumentsInputData` | `{ userId }` |
| `DocumentShareWithUser` | Share record + recipient user info |
| `DocumentWithAccess` | `Document` + `accessType: "owner" | "shared"` + optional `permission` |

## Service methods

| Method | Access | Description |
|--------|--------|-------------|
| `hasDocumentAccess(id, userId)` | private | Returns `true` if owner or in `DocumentShare` |
| `hasEditPermission(id, userId)` | private | Returns `true` if owner or share permission is `"edit"` |
| `getDocument(input)` | public | Fetches document and returns `DocumentWithAccess` |
| `shareDocument(input)` | owner only | Creates a share by target user email |
| `unshareDocument(input)` | owner only | Deletes a share by `shareId` |
| `listDocumentShares(input)` | owner only | Lists shares with recipient info |
| `listSharedDocuments(input)` | shared user | Lists documents shared with the requester |

### Permission matrix

| Operation | Owner | Shared (`read`) | Shared (`edit`) |
|-----------|-------|-----------------|-----------------|
| View document | ✅ | ✅ | ✅ |
| View versions | ✅ | ✅ | ✅ |
| Rename / update content / restore | ✅ | ❌ | ✅ |
| Delete | ✅ | ❌ | ✅ |
| Import into document | ✅ | ❌ | ✅ |
| Attach file | ✅ | ❌ | ✅ |
| Share / unshare / list shares | ✅ | ❌ | ❌ |

## API Endpoints

All sharing endpoints require authentication.

### Share a document

```
POST /documents/:id/share
```

Request body:

```json
{
  "email": "collaborator@example.com",
  "permission": "read"
}
```

Response `201`:

```json
{
  "id": "share-uuid",
  "documentId": "doc-uuid",
  "sharedWithId": "user-uuid",
  "permission": "read",
  "createdAt": "2026-07-10T13:00:00.000Z"
}
```

### Unshare a document

```
DELETE /documents/:id/share/:shareId
```

Response `204 No Content`

### List document shares

```
GET /documents/:id/shares
```

Response `200`:

```json
[
  {
    "id": "share-uuid",
    "documentId": "doc-uuid",
    "sharedWithId": "user-uuid",
    "permission": "read",
    "createdAt": "2026-07-10T13:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com"
    }
  }
]
```

### List documents shared with me

```
GET /documents/shared-with-me
```

Response `200`:

```json
[
  {
    "id": "doc-uuid",
    "name": "Shared Doc",
    "accessType": "shared",
    "permission": "read",
    ...
  }
]
```

### Get document (owner or shared)

```
GET /documents/:id
```

Returns the document with `accessType: "owner"` or `"shared"`. Returns `403` if the requester has no access.

## Files changed

| File | Change |
|------|--------|
| `prisma/models/documentShare.prisma` | New `DocumentShare` model |
| `prisma/models/user.prisma` | Added `sharedDocuments` relation |
| `prisma/models/document.prisma` | Added `shares` relation |
| `src/modules/document/document.types.ts` | New sharing types |
| `src/modules/document/document.service.ts` | Sharing methods + permission checks |
| `src/modules/document/document.controller.ts` | Share/unshare/list shares/list shared-with-me handlers |
| `src/modules/document/document.routes.ts` | New share routes |
| `src/modules/document/document.validator.ts` | New share validators |

## Notes

- Sharing is identified by recipient email. The target user must already exist in the system.
- Owners cannot share documents with themselves.
- Duplicate shares are rejected.
- The existing `getOwnedDocument` endpoint now uses the unified `getDocument` method, so owners and authorized shared users can fetch the same document through the same route.
