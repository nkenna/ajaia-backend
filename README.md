# ajaia-backend

Backend API for Ajaia, a document management and editing platform. Built with Node.js, Express, and Prisma (PostgreSQL).

## Features

- **Authentication**: email/password signup and login, JWT access + refresh tokens, secure logout, session management (`jose`, `argon2`, `cookie-parser`).
- **Projects**: create, list, and delete projects that own documents.
- **Documents**: create, rename, edit, list, and delete documents stored as Editor.js JSON + rendered HTML.
- **Version history**: every content update and restore creates a new version; full version listing and restore support.
- **Sharing**: owner can share a document with another registered user (`read` or `edit` permission) via email.
- **File import**: upload a file and import it as a new document or into an existing one. **Only `.md`, `.txt`, and `.docx` are supported for now.**
- **Security**: `helmet`, CORS, global rate limiting (`express-rate-limit`), input validation (`express-validator`), structured logging (`winston` + `morgan`).

## Tech stack

- Node.js + Express 5
- Prisma 7 + `@prisma/adapter-pg` (PostgreSQL)
- `jose` (JWT), `argon2` (password hashing)
- `multer` (uploads), `mammoth` (docx → HTML conversion)
- `helmet`, `cors`, `express-rate-limit`, `winston`

## Getting started

```bash
npm install
cp .env.example .env   # configure DATABASE_URL, JWT secrets, etc.
npx prisma migrate dev
npm run dev            # or: npm run build && npm start
```

Health check: `GET /health`. API root: `/api/v1`.

## Database

The backend uses PostgreSQL via Prisma. It connects through the [Supabase connection pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler) using two URLs:

- `DATABASE_URL` — transaction-mode pooler (port `6543`, `?pgbouncer=true`), used by the running app.
- `DIRECT_URL` — session-mode pooler (port `5432`), used by Prisma migrations.

Required variables (`.env`):

```dotenv
# Transaction-mode pooler (app runtime)
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session-mode pooler (Prisma migrations)
DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
```

Other database-related variables (all optional, with defaults): `UPLOAD_DIR` (`uploads`), `MAX_FILE_SIZE` (10 MB), `DB_POOL_MAX` (50), `CORS_ORIGIN`.

> Never commit real credentials. Replace `<PROJECT_REF>` and `<PASSWORD>` with your Supabase project reference and database password.

## File format support

Inbound file imports accept only these extensions (see `src/modules/document/document.upload.ts`):

- `.txt` — parsed as plain text
- `.md` — parsed as plain text (Markdown source preserved)
- `.docx` — converted to HTML with `mammoth`

Other extensions are rejected with a `415`-style error in the upload filter. Export formats (handled by the frontend) additionally include PDF, HTML, and JSON.

## API disclosure (AI usage)

This project was built with the assistance of AI coding tools. The disclosure below is provided for transparency.

### Which AI tools you used

- **Kilo** (CLI coding agent, powered by a frontier LLM) — used for scaffolding, implementing modules, and writing this README.
- Occasional use of a general-purpose LLM for brainstorming API shapes and debugging error messages.

### Where AI materially sped up your work

- **Module scaffolding**: rapid generation of the Express route/controller/service/validator/type structure for auth, projects, documents, and users, following a consistent pattern.
- **Prisma schema modeling**: drafting the `User`, `Project`, `Document`, `VersionHistory`, `File`, and `DocumentShare` models and their relations.
- **File import pipeline**: implementing the `multer` upload filter, `mammoth` docx-to-HTML conversion, and plain-text/Markdown handling.
- **Validation and security boilerplate**: `express-validator` chains, `helmet`/CORS/rate-limit wiring, and `winston` logging setup.

### What AI-generated output you changed or rejected

- **Docx HTML conversion**: the initial suggestion rendered imported `.docx` content as a generic HTML string; it was adjusted to also store Editor.js-shaped `content` so imported documents are editable in the editor, not just viewable.
- **Versioning approach**: rejected a naive "overwrite latest" design in favor of append-only version history with restore, to preserve an audit trail.
- **Slug generation**: tightened the AI-proposed slug logic to enforce the lowercase alphanumeric + hyphen pattern (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and handle collisions with numeric suffixes.
- **Error handling**: replaced flat `try/catch` blocks returning ad-hoc messages with a centralized `errorHandler` and consistent validation-error responses.
- **Auth token storage**: moved away from storing the access token purely in localStorage toward cookie-based session handling with refresh rotation.

### How you verified correctness, UX quality, and implementation reliability

- **Type safety / build**: `npm run build` (TypeScript `tsc`) and `npm run typecheck` must pass; Prisma client is generated from the schema.
- **Correctness**: route handlers, services, and validators were cross-checked against the Prisma schema; access-control helpers (`hasDocumentAccess`, `hasEditPermission`, owner-only gates) were reviewed for each document operation.
- **UX quality**: API errors return consistent JSON shapes (`{ errors: [...] }` or `{ message }`) that the frontend consumes with user-facing toasts; the `/health` endpoint and a root status route make deployment checks straightforward.
- **Implementation reliability**: security middleware (helmet, rate limiting, CORS, input validation) is wired globally in `src/app.ts`; uploads use `memoryStorage` with a size limit and an extension allowlist; database writes that span multiple records use Prisma transactions with a timeout.
