# AI-Native Workflow — ajaia-backend

This document describes how the `ajaia-backend` was built using an AI-native development workflow: an AI coding agent (Kilo) drove most of the implementation, with a human reviewing, correcting, and verifying every change.

## Overview

The backend was not written by hand from a blank file. Instead, requirements were translated into natural-language prompts and the AI agent produced complete modules (routes, controllers, services, validators, types, schema). The human then reviewed the output, corrected the parts that were wrong or naive, and verified behavior before accepting.

```text
Requirement (prompt)
      │
      ▼
AI agent drafts module + schema + tests/checks
      │
      ▼
Human review ──► reject / edit ──► re-prompt
      │
      ▼
Verification (typecheck, schema cross-check, access-control review)
      │
      ▼
Accepted into codebase
```

## Tooling

- **Kilo** (CLI coding agent, frontier LLM) — primary implementation tool. Used for scaffolding, module generation, and writing docs.
- **General-purpose LLM** (ad hoc) — brainstorming API shapes and debugging error messages.
- **Local verification** — `tsc`/`npm run build`, Prisma schema, `git` for change tracking.

## Stage-by-stage workflow

### 1. Scaffolding the module structure

The app follows a strict layered pattern per resource:

```text
src/modules/<resource>/
  ├─ <resource>.routes.ts      # Express router + validators
  ├─ <resource>.controller.ts  # HTTP in/out, calls service
  ├─ <resource>.service.ts     # business logic, Prisma calls
  ├─ <resource>.validator.ts   # express-validator chains
  ├─ <resource>.types.ts       # input/output types
  └─ <resource>.upload.ts      # multer + file processing (documents)
```

The AI generated this skeleton consistently across `auth`, `users`, `projects`, and `documents`, so every resource is navigable the same way.

### 2. Data modeling with Prisma

The AI drafted the schema and the relations:

- `User` → owns `Project`s and `Document`s
- `Project` → owns `Document`s
- `Document` → has many `VersionHistory` rows, optional `File`, and many `DocumentShare`s
- `DocumentShare` → links a `Document` to a shared `User` with `read`/`edit` permission

The Prisma client is generated and wrapped in a pooled adapter (`@prisma/adapter-pg`) configured from `src/config/config.ts` (`src/lib/prisma.ts`).

### 3. Feature implementation, module by module

Each feature was implemented as a self-contained prompt:

- **Auth**: JWT access + refresh tokens (`jose`), password hashing (`argon2`), cookie-based sessions.
- **Documents**: create / rename / edit / delete, with append-only `VersionHistory` and restore.
- **Sharing**: owner-only share by email, `read`/`edit` permission, shared-with-me listing.
- **File import**: `multer` upload → `mammoth` docx→HTML, plus `.txt`/`.md` plain-text handling, stored as Editor.js-shaped `content` + `contentHtml`.

### 4. Security & reliability wiring

The AI wired global middleware in `src/app.ts`:

- `helmet` (secure headers)
- `cors` (configurable origin)
- `express-rate-limit` (100 req / 15 min)
- `express-validator` chains per route
- `winston` + `morgan` structured logging
- centralized `errorHandler`

Multi-record writes (create document + version, import + link file) use Prisma `$transaction` with a 10s timeout.

### 5. Human-in-the-loop correction

The AI's first drafts were reviewed and corrected rather than accepted blindly. Notable edits/rejections:

- **Versioning**: replaced "overwrite latest" with append-only history + restore.
- **Docx import**: made imported content editable (Editor.js `content`) instead of HTML-only.
- **Slug logic**: enforced `^[a-z0-9]+(?:-[a-z0-9]+)*$` with numeric collision suffixes.
- **Error handling**: centralized into one `errorHandler` returning consistent JSON.
- **Token storage**: moved toward backend cookie sessions with refresh rotation.

### 6. Verification gate

Before any change was considered done:

- `npm run build` / `npm run typecheck` (TypeScript `tsc`) passed.
- Route/validator/service inputs matched the Prisma schema.
- Access-control helpers (`hasDocumentAccess`, `hasEditPermission`, owner-only gates) reviewed per document operation.
- Security middleware confirmed active in `src/app.ts`.

## Why this workflow

- **Speed**: consistent scaffolding and boilerplate (validators, middleware, schema) were produced in seconds.
- **Consistency**: every module follows the same shape, lowering cognitive load.
- **Safety**: the human review + verification gate catches the AI's common failure modes (missing authz, naive data models, dropped structure).

## Caveats

- AI output still requires a human who understands the domain (auth, RDBMS modeling, security) to validate it.
- The `.env` secrets and Supabase pooler URLs must never be committed; only placeholders belong in docs.
- Only `.md`, `.txt`, and `.docx` imports are supported today; other formats are rejected by the upload filter.
