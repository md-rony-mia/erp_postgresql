# Firestore → PostgreSQL migration notes

This completes the migration that was only half-done in the repo (schema/connection
scaffolding existed in `src/db`, but nothing in the app actually used it — every screen
was still reading/writing Firestore). Everything now runs on Postgres.

## What changed

- **Database**: one generic `documents` table (`collection`, `doc_id`, `data jsonb`,
  `updated_at`), defined in `src/db/schema.ts`. This mirrors the Firestore data model
  faithfully — every collection the app used (products, customers, invoices, users,
  branches, settings, workflows, documents, error_logs, ...) lives here as rows, keyed by
  `(collection, doc_id)`. See the comment in `schema.ts` for why a generic store was
  chosen over per-entity typed tables — you can migrate specific hot tables (invoices,
  products) to strict typed columns later without touching this.
- **Backend** (`src/server/`): `auth.ts` (JWT + bcrypt), `dataStore.ts` (generic CRUD +
  atomic branch-stock increment via a row-locked transaction), `realtime.ts` (WebSocket
  pub/sub that replaces Firestore's `onSnapshot`), `routes.ts` (the full REST API,
  every handler wrapped so a DB error returns a clean 500 instead of crashing the
  process). Wired into `server.ts` alongside the existing Gemini proxy.
- **Frontend**: `src/lib/dataClient.ts` replaces `src/lib/firebase.ts` with the same
  exported function names/shapes (`saveDocToFirestore`, `fetchCollectionFromFirestore`,
  `subscribeToCollection`, `syncCollectionToFirestore`, `signIn`, `onAuthStateChange`,
  etc.), so most components needed only an import-path change. `Login.tsx`, `App.tsx`'s
  auth effect, `BranchManagementView.tsx`, and `BankingAndLoanView.tsx` had real logic
  changes (Firestore profile lookups, direct SDK calls) and were rewritten accordingly.
  `firestoreQueries.ts`, `errorLogger.ts`, `branchStockManager.ts` were rewritten against
  the new API.
- **Removed**: `firebase`/`firebase-admin` packages, `src/lib/firebase.ts`,
  `src/lib/firebase-admin.ts`, `src/middleware/auth.ts` (was dead code — nothing
  imported it), `firestore.rules`, `firebase-blueprint.json`.
- **Auth**: JWT sessions (30-day expiry by default, `JWT_TTL` in env) with bcrypt
  password hashes stored inside each user's document. Role-based checks
  (`requireAdmin`) gate admin-only endpoints.
- **Real-time**: a single WebSocket endpoint at `/ws` (same origin, same port — no
  separate infra). Clients authenticate with their JWT, subscribe to collections by
  name, and receive the full fresh array on every change — same contract the app
  already expected from `onSnapshot`.

## What you need to do

1. **Set env vars** (see `.env.example`): your existing `SQL_HOST` / `SQL_DB_NAME` /
   `SQL_USER` / `SQL_PASSWORD` / `SQL_ADMIN_USER` / `SQL_ADMIN_PASSWORD`, plus a new
   `JWT_SECRET` — generate one with `openssl rand -base64 48`. All Firebase env vars can
   be deleted.
2. **Push the schema** to your Cloud SQL instance:
   ```
   npx drizzle-kit push --config=src/db/drizzle.config.ts --force
   ```
   This creates the single `documents` table. (I ran this exact command against a local
   throwaway Postgres in my sandbox to confirm it works — I have no network path to your
   actual Cloud SQL instance from here, so this step is untested against your real DB.)
3. **Install deps**: `npm install` (adds `bcryptjs`, `jsonwebtoken`, `ws`; drops
   `firebase`, `firebase-admin`).
4. **Bootstrap your first admin account** — there's no data migration from Firebase Auth
   (passwords aren't exportable from Firebase), so create the first user via:
   ```
   curl -X POST http://localhost:3000/api/auth/bootstrap \
     -H "Content-Type: application/json" \
     -d '{"name":"Rony Mia","email":"ronymia2022@gmail.com","username":"admin_rony","password":"<choose one>"}'
   ```
   This only works once (while the `users` collection is empty). After that, log in
   normally from the app, and use Settings → Users to add everyone else (their
   passwords are freshly set by whoever creates the account, or via the "Reset
   Password" temp-password flow — see below).
5. **Cloud SQL connection format** — double check `SQL_HOST`. The current pool config
   (`src/db/index.ts`) connects over plain `host`/`user`/`password`/`database`, which
   works for a public/proxied TCP endpoint. If you're using the Cloud SQL Auth Proxy or
   a Unix socket, you'll need to adjust the `Pool` config to pass a `host` in the
   `/cloudsql/INSTANCE_CONNECTION_NAME` socket-path form instead — I didn't change this
   since I don't know which connection method your Cloud SQL instance uses.

## Known limitations / things I simplified

- **No email delivery.** There was no SMTP configured, so "send password reset email"
  is now "admin generates a temporary password and relays it manually" (shown once in
  the response — copy it down, it isn't stored anywhere in plaintext). If you want real
  email delivery later, wire `POST /api/auth/admin-reset-password` up to an email
  provider (SES, Resend, etc.) instead of returning the password directly.
- **`sync`/full-replace writes are not batched.** `syncCollection` upserts items one at
  a time in a loop rather than a single bulk statement. Fine at this app's data volume;
  worth revisiting if any collection grows into the tens of thousands of rows.
- **WebSocket broadcasts the full collection**, not a diff — same as Firestore's
  `onSnapshot` did. For very large collections (thousands of rows) this means every
  connected client re-downloads the whole array on any single change. Not a problem at
  current scale; if a specific collection grows large, that one can get a dedicated
  diffed/paginated endpoint later.
- **Generic JSONB store vs. typed tables.** Reporting/analytics that would benefit from
  real SQL (joins, aggregates, indexes on business fields) currently has to happen in
  application code after fetching full collections — Postgres can't help there yet since
  everything sits inside a `data jsonb` blob. If a specific report becomes slow, that's
  the sign to promote that one collection to a typed table.

## What I verified before handing this off

- `npx tsc --noEmit` — clean
- `npx vitest run` — 33/33 tests passing
- `npx vite build` — frontend builds
- `esbuild` server bundle — builds and runs
- End-to-end against a real local Postgres 16 (installed in my sandbox, not your Cloud
  SQL): bootstrap → login → wrong-password rejection → `/auth/me` → CRUD on a
  collection → atomic branch-stock increment/decrement → unauthenticated access
  rejected → admin registers a user → duplicate email rejected → non-admin blocked from
  registering (403) → admin temp-password reset invalidates the old password → user
  changes their own password → WebSocket subscribe + live broadcast on a write from a
  second client.
- Found and fixed a real bug during this testing: async route handlers weren't wrapped,
  so a dropped DB connection crashed the whole Node process instead of returning a 500.
  Fixed with an `ah()` wrapper on every route plus a final Express error-handling
  middleware.

I have not tested against your actual Cloud SQL instance, and have not touched your
GitHub repo — this zip is the modified source tree for you to review and merge in
yourself (or ask me to open a PR, if you'd rather hand me write access to try that).
