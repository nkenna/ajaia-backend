# Ajaia — Project Submission

A document management and editing platform with a React frontend and an Express/Prisma backend, supporting document creation, versioning, sharing, and file import/export.

## Live URLs

- **Frontend**: https://ajaia-web.vercel.app
- **Backend API**: https://ajaia-backend-6anf.onrender.com

## Demo Materials

- **Google Drive folder** (source, screenshots, extras): https://drive.google.com/drive/folders/1CyqX478TKrEbtnp3v8FmHFbrT-y0E--M?usp=sharing
- **Walkthrough video**: https://drive.google.com/file/d/1yJQuG9LtahFZFFaJyrPfezr6SLPOWbEo/view?usp=sharing

## Test User Credentials

- **Email**: striderkapp@gmail.com
- **Password**: 1234567890

## File Format Support

Only `.md`, `.txt`, and `.docx` are supported for file import at this time (enforced by the backend upload filter). Export additionally supports PDF, HTML, and JSON.

## AI Workflow (Backend)

The backend was developed with the assistance of AI coding tools (Kilo CLI coding agent) following an iterative, verify-as-you-go workflow:

1. **Scaffolding** — AI generated the consistent Express module structure (routes → controller → service → validator → types) and the Prisma schema (`User`, `Project`, `Document`, `VersionHistory`, `File`, `DocumentShare`).
2. **Implementation** — Features were built module by module (auth, projects, documents, sharing, file import). The AI proposed drafts that were then reviewed and tightened: append-only version history instead of overwrite, stricter slug validation, and Editor.js-shaped content for imported `.docx` files.
3. **Security & reliability** — AI wired global middleware (`helmet`, CORS, rate limiting, `express-validator`) and suggested a centralized error handler and Prisma transactions for multi-record writes.
4. **Verification** — Each change was checked with `tsc` typecheck/build, cross-referenced against the Prisma schema, and reviewed for correct access-control gates before being accepted.

AI-suggested output that was changed or rejected is detailed in the backend `README.md` (AI disclosure section).

## Tech Stack

- **Backend**: Node.js, Express 5, Prisma 7 + PostgreSQL (Supabase pooler), JWT (`jose`), `argon2`, `multer`, `mammoth`, `helmet`, `express-rate-limit`, `winston`.
- **Frontend**: React 19, Vite, Tailwind CSS v4, shadcn/ui, Editor.js, React Router.
