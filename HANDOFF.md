# Loning Maju Technical Hand-off

Loning Maju is the Desa Loning public UMKM directory and product showcase. The public visual system remains the source of truth for the homepage, cards, dialogs, navigation, accessibility behavior, and direct WhatsApp inquiry flow.

The declared Node.js support range is `>=20 <27`; this implementation was verified with Node.js `v26.4.0`, including native `argon2` and `sharp` installation.

The public brand is **Loning Maju**. Internal or persistent compatibility identifiers remain `marketplace-loning-local`, `loning_digital`, `loning`, `loning_postgres_data`, `loning_session`, and `media/{uuid}`. These values belong to local infrastructure, database, authentication, and media contracts; they are not public branding.

## Public Application

The frontend remains at the repository root and uses Vite, React 19, TypeScript, Tailwind CSS, TanStack Query, React Router, Motion, and Lucide icons. `/` mounts the existing homepage. Public UMKM and product data is loaded from the Fastify API; filtering is server-backed and the existing detail dialog uses already-loaded collections without a request on open.

Editorial content such as `FAQS`, `BENEFIT_CARDS`, and `VILLAGE_ANNOUNCEMENTS` remains frontend static data. No business data or authentication token is stored in `localStorage` or `sessionStorage`.

## Phase 2 Management Layer

The backend is an independent Fastify + TypeScript ESM service under `backend/`. PostgreSQL persistence uses Drizzle ORM. The additive Phase 2 migration adds:

- `user_role` and `publication_status` enums;
- `users` for active admin/owner accounts and Argon2id password hashes;
- `sessions` for one-way hashed opaque sessions and CSRF hashes;
- `audit_logs` for append-only privileged activity;
- ownership and publication fields on `umkms` and `products`.

The Phase 1 migration is not rewritten. Existing deterministic UMKM/product UUIDs and display ordering remain intact, and the Phase 2 migration/seed keeps them published.

## Roles

- Admins can manage users, owner assignment, all UMKMs/products, publication, archive/restore, and audit logs.
- Owners can manage only assigned UMKMs and child products. They cannot access admin routes, assign accounts, or publish content.
- UMKM creation and UMKM publication are admin-only by default.
- Owner-created products start as drafts. Admin publication requires a published parent UMKM.
- Archive and restore are soft state transitions. Restore returns content to draft.

## Authentication and CSRF

Authentication uses Argon2id and opaque random session tokens. Only a SHA-256 token hash is stored in PostgreSQL. The raw token is held by the browser only in the HTTP-only `loning_session` cookie with `SameSite=Lax`, `Secure` in production, path `/`, and an explicit expiry.

Successful login and `/api/auth/session` return a raw CSRF token. The frontend holds it only in TanStack Query memory and sends it as `X-CSRF-Token` on authenticated mutations. Mutations also require the configured exact `Origin`. Logout and password changes revoke sessions as required. Login has both IP rate limiting and persisted account failure lockout.

## Backend API Families

- Public: `/api/health`, `/api/umkms`, `/api/products` and detail routes. Only published records and products with published parents are public.
- Auth: `/api/auth/login`, `/api/auth/session`, `/api/auth/logout`, `/api/auth/change-password`.
- Management: `/api/manage/umkms` and `/api/manage/products`, including detail, PATCH, publish/unpublish where authorized, soft DELETE archive, and restore.
- Admin: `/api/admin/users` with create/update/reset/revoke-session actions and `/api/admin/audit-logs`.

All responses use `{ data: ... }` or the shared error envelope. Request bodies use explicit validation allowlists; protected fields such as IDs, timestamps, publication state, ownership, and display order are not client-controlled.

## Frontend Routes

- `/` public homepage
- `/login` public login
- `/change-password` authenticated forced or voluntary password change
- `/dashboard` authenticated summary
- `/dashboard/umkms` and `/dashboard/umkms/:id` authorized UMKM management; `/new` admin-only
- `/dashboard/products` and `/dashboard/products/:id` authorized product management; `/new` admin/owner
- `/dashboard/users`, `/dashboard/users/:id`, `/dashboard/users/new`, `/dashboard/audit` admin-only

Protected and role guards run before sensitive screens render. A forced-password account is routed to `/change-password`; an unauthenticated dashboard request goes to `/login`.

## Operations

```bash
npm install
npm run dev:all
npm run lint
npm run typecheck
npm run test:backend
npm run test:frontend
npm run test:harness-safety
npm run verify:seed-determinism
npm run test:integration:isolated
npm run test:e2e:isolated
npm run test:e2e:zoom-native:isolated
npm run build
npm run test:all
npm run db:migrate
npm run db:seed:dev
npm run db:bootstrap-admin
npm --prefix backend run sessions:cleanup
npm --prefix backend run media:cleanup
```

`test:integration` dan `test-integration-local.mjs` mendelegasikan ke harness isolated. Integration, E2E, native zoom, migration scenarios, dan verifier determinism membuat Compose project, database, port, volume, dan media directory disposable milik invocation tersebut; semuanya dibersihkan pada success, failure, atau signal yang dapat ditangani. Tidak ada fallback ke development Compose atau database persisten.

Seed harus memakai profile explicit:

- `db:seed:dev`: development loopback dengan `NODE_ENV`, `APP_ENV`, dan `DATABASE_ENVIRONMENT` semuanya `development`, plus `ALLOW_SEED=1`.
- `db:seed:test`: hanya child seed harness disposable; `ALLOW_SEED=1` tidak diwariskan ke migration, server, Vitest, Playwright, fixture setup, atau runner.
- `db:seed:preview`: disabled dan sengaja gagal.
- `db:seed`: legacy compatibility alias yang sengaja gagal.

`db:bootstrap-admin` membuat tepat satu `superadmin` tanpa default password. Command membutuhkan temporary `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_DISPLAY_NAME`, `ALLOW_ADMIN_BOOTSTRAP=1`, dan `BOOTSTRAP_CONFIRM=CREATE_SUPERADMIN`; command menolak target production-like yang tidak dinyatakan secara explicit dan menolak bila Super Admin sudah ada. `admin:create` adalah legacy compatibility alias yang sengaja gagal. Bootstrap tidak dijalankan otomatis oleh migration, seed, atau startup.

## Local Development Without Aiven

```powershell
Copy-Item backend\.env.example backend\.env
npm run db:local:setup
npm run dev:all
```

Docker Compose runs PostgreSQL 16 locally at `localhost:5432` using database `loning_digital`, user `loning`, and password `loning_local_dev`. The setup waits for the database, applies migrations, and runs `db:seed:dev` under the explicit development guard. `npm run db:local:reset` removes the named development volume and is destructive. Aiven is not required locally; switching later changes only `backend/.env`.

`/api/health` is liveness and `/api/ready` is a bounded database readiness check. If `DATABASE_URL` is missing, the backend exits and the frontend keeps its honest retry/error state instead of serving mock data.

The signed-out session contract is `GET /api/auth/session` returning a safe `401`; `useSession` normalizes that response to settled `null` without retrying. Transient `5xx` responses retry once, network/backend failures settle into a retryable guard state, and authenticated requests continue to clear protected caches on `401`.

## Deployment Notes

Use Aiven's complete PostgreSQL URL with `sslmode=require`. Deploy the frontend as a static SPA with `index.html` fallback for `/login` and `/dashboard/*`. Configure the backend with one exact frontend `CORS_ORIGIN`, credentialed CORS, and `COOKIE_SECURE=true` in production. Production startup runs migration followed by the server; it never runs seed or bootstrap. Schedule `sessions:cleanup` through the hosting platform if desired.

Managed media supports one primary UMKM/product image. Development uses ignored `backend/storage/`; production requires S3-compatible storage. Uploads are decoded, normalized to WebP card/thumbnail variants, metadata-stripped, bounded, and authorization-checked. Existing external URLs remain a fallback. This phase excludes registration, OAuth, MFA, password recovery, multi-image galleries, cropping, video/document uploads, automatic external downloads, commerce, payments, orders, shipping, inventory quantities, ratings, reviews, verification, commissions, analytics, notifications, and real-time features.

## Verification Status

Repository safety, seed target refusal, clean seed repeatability, same-target idempotency, source tests, build, isolated integration, isolated E2E, native zoom, and the complete aggregate gate are required before Wave 1 closure. These gates use only local disposable resources and do not require a production or shared `DATABASE_URL`.
