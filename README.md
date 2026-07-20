# Loning Digital

Loning Digital is a public directory and product showcase for UMKM in Desa Loning, Petarukan, Pemalang. Visitors discover local businesses and contact sellers directly through WhatsApp. This is not an e-commerce system: there is no cart, checkout, payment gateway, order, invoice, shipping, rating, or review model.

## Architecture

- The Vite, React 19, TypeScript, and Tailwind CSS frontend remains at the repository root.
- The Fastify TypeScript API and management layer live in `backend/`.
- PostgreSQL is accessed through Drizzle ORM and the `postgres` driver.
- TanStack Query loads public, authenticated-session, and management server state.
- Public UMKM/product responses contain only published records. Products also require a published parent UMKM.
- The public homepage retains its existing search, category, detail-dialog, and WhatsApp interaction model.

## Roles and Security

- `admin`: manages users, owner assignments, every UMKM/product, publication state, and audit activity.
- `owner`: manages only assigned UMKMs and their products. Owners cannot access admin endpoints or publish records.
- Authentication uses Argon2id password hashes and opaque random server-side sessions.
- The browser receives an HTTP-only `loning_session` cookie. Raw sessions are never stored in PostgreSQL or browser storage.
- Authenticated mutations require an in-memory CSRF token in the `X-CSRF-Token` header and a matching allowed `Origin`.
- CORS uses an explicit credentialed origin allowlist. Production requires secure cookies and refuses wildcard/multiple origins.
- Login attempts are rate-limited and persisted failures temporarily lock an account.

## Prerequisites

- Node.js LTS and npm
- Docker Desktop with Docker Compose for local PostgreSQL
- PostgreSQL, preferably an Aiven PostgreSQL service for deployment

The project is tested with Node.js `v26.4.0`; the declared supported range is Node.js `>=20 <27`. Native `argon2` and `sharp` installed and built successfully in this environment.

## Local Development Without Aiven

Local development uses PostgreSQL 16 in Docker with local-only credentials and a named volume bound to `127.0.0.1:5432`.

```powershell
Copy-Item backend\.env.example backend\.env
npm run db:local:setup
npm run dev:all
```

The setup waits for PostgreSQL, applies migrations, and runs the idempotent seed. Liveness is `http://localhost:3001/api/health`, readiness is `http://localhost:3001/api/ready`, and the login page is `http://localhost:3000/login`.

An unauthenticated `GET /api/auth/session` returns the safe `401` envelope and the frontend treats it as a normal signed-out state. It does not retry or remain on `Memuat data`. Transient backend failures show a recoverable `Coba Lagi` state.

`npm run db:local:reset` is destructive and removes the named local database volume. Docker Desktop must be running.

## Installation

```bash
npm install
npm --prefix backend install
copy .env.example .env.local
copy backend\.env.example backend\.env
```

On macOS/Linux, use `cp .env.example .env.local` and `cp backend/.env.example backend/.env`.

Root `.env.local`:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

Backend `backend/.env` must include a database and local development origin:

```dotenv
DATABASE_URL=postgresql://loning:loning_local_dev@localhost:5432/loning_digital
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
COOKIE_SECURE=false
```

See `backend/.env.example` for session TTL, lockout, rate-limit, proxy, and bootstrap-admin settings. Never commit `.env` files or real credentials.

If `DATABASE_URL is required` appears, the backend exits rather than serving fake catalog data. Copy the backend example and run `npm run db:local:setup`. Aiven is optional during local development.

## Database and Aiven

Create an Aiven PostgreSQL service and copy its complete connection URL into `backend/.env`, retaining `sslmode=require`. The driver uses the connection URL's TLS behavior and does not globally disable certificate verification.

Apply the additive migrations and preserve the existing deterministic seed:

```bash
npm --prefix backend run db:migrate
npm --prefix backend run db:seed
```

The existing five UMKMs and five products remain published with stable UUIDs and display order. Re-running the seed is idempotent.

Create the first administrator once, using temporary environment variables only:

```bash
set BOOTSTRAP_ADMIN_EMAIL=admin@example.com
set BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-12-character-passphrase
set BOOTSTRAP_ADMIN_DISPLAY_NAME=Administrator
npm --prefix backend run admin:create
```

On macOS/Linux, use `export` instead of `set`. The command hashes the password, creates the admin with `must_change_password`, writes an audit entry, and does not print the password. Remove the temporary variables after the command.

Expired or revoked sessions can be purged manually or by a hosting scheduler:

```bash
npm --prefix backend run sessions:cleanup
npm --prefix backend run media:cleanup
```

## Development

Run both applications with one command:

```bash
npm run dev:all
```

Or use two terminals:

```bash
npm run dev:frontend
npm run dev:backend
```

The frontend is available at `http://localhost:3000`; the API is available at `http://localhost:3001`.

## Routes

Public:

- `/`
- `/api/health`
- `/api/umkms`
- `/api/umkms/:id`
- `/api/products`
- `/api/products/:id`

Authentication and management frontend:

- `/login`
- `/change-password`
- `/dashboard`
- `/dashboard/umkms`
- `/dashboard/products`
- `/dashboard/users` (admin)
- `/dashboard/audit` (admin)

The backend management families are `/api/auth/*`, `/api/manage/umkms`, `/api/manage/products`, `/api/admin/users`, and `/api/admin/audit-logs`. Successful responses use `{ "data": ... }`; errors use the established `{ "error": { "message": "...", "code": "..." } }` envelope.

## Build and Test

```bash
npm run lint
npm run typecheck
npm run build:frontend
npm run build:backend
npm run build:all
npm run test:backend
npm run test:frontend
npm run test:integration
npm run test:integration:local
npm run test:e2e
npm run test:e2e:local
npm run test:all
npm --prefix backend run db:generate
```

Both integration commands own the local lifecycle: they start and wait for PostgreSQL, apply idempotent migrations and seed/E2E setup, start the backend with `backend/.env`, run the authenticated smoke test, and stop only that backend process. The PostgreSQL volume is preserved.

## Deployment

Deploy the root Vite output as a static SPA and configure the hosting provider to fall back unknown frontend paths to `index.html`, including `/login` and `/dashboard/*`. Set production `VITE_API_URL` to the deployed API URL ending in `/api`.

Deploy `backend/` with `npm run build` and `npm start`. Set `CORS_ORIGIN` to one exact frontend origin, `COOKIE_SECURE=true`, and configure the same-site/cross-site topology so the HTTP-only cookie is sent. If frontend and backend are on different sites, document and configure the required secure cookie/CORS policy deliberately rather than weakening defaults.

`public/_redirects` supplies the Netlify SPA fallback for login and dashboard deep links. Production requires an explicit PostgreSQL URL and S3-compatible media storage; local filesystem media is rejected in production. Schedule both cleanup scripts with the hosting platform.

## Limitations

Managed media supports one primary UMKM/product image. Development uses ignored `backend/storage/`; production requires S3-compatible storage. Uploads are decoded, normalized to WebP card/thumbnail variants, metadata-stripped, bounded, and authorization-checked. Existing external URLs remain a fallback. Phase 3 still excludes public registration, OAuth, MFA, password recovery, galleries, cropping, video/document uploads, automatic external downloads, commerce transactions, payments, orders, invoices, shipping, ratings, reviews, verification badges, commissions, analytics, notifications, and real-time features.

## Troubleshooting

- CORS or login cookie errors: check that `CORS_ORIGIN`, `VITE_API_URL`, cookie security, protocol, and browser origin agree.
- Login remains on `Memuat data`: restart the frontend after changing `.env`, then inspect `GET /api/auth/session` in Browser Network. A normal signed-out request is one settled `401`; a connection failure should show `Coba Lagi`.
- Missing `DATABASE_URL`: create `backend/.env` from `backend/.env.example`; backend startup and database scripts intentionally fail without it.
- Database not ready: run `npm run db:local:logs` and `npm run db:local:wait`; `/api/ready` returns `503` until PostgreSQL accepts connections.
- Aiven SSL errors: use the complete Aiven URL with `sslmode=require` and do not add a global insecure certificate bypass.
- Forced password change: a new or reset account must use `/change-password` before dashboard routes become available.
- Browser acceptance: run `npm run test:e2e:local`. The command starts local PostgreSQL, migrates/seeds, starts both apps, waits for health/readiness, runs Playwright, and stops only the processes it starts. Install a Playwright browser with `npx playwright install chromium` when required.
