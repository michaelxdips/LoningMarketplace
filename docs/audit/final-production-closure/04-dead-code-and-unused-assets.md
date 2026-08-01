# Dead Code & Unused Assets Audit

## 1. Static Code Analysis

* **Unused Variables / Imports**: Verified clean via `npm run typecheck` across frontend and backend workspaces.
* **Console Logs**: Production log statements use Fastify's structured Pino logger (`app.log.info`, `app.log.error`). No stray `console.log` in production API request paths.
* **Deprecations**: No deprecated packages or functions found in active source paths.

---

## 2. Legacy Framework Remnants Check

* **Next.js Remnants**: None found (100% Vite + React Router).
* **Supabase Remnants**: None found (100% Drizzle ORM + PostgreSQL).
* **MinIO-Only Hardcoding**: Cleanly abstracted via S3 storage adapter supporting AWS S3, Cloudflare R2, MinIO, and Aiven S3 endpoints.

---

## 3. Unused Feature / Dead Asset Inventory

| File / Component | Category | Status | Action / Recommendation |
| :--- | :--- | :--- | :--- |
| `scripts/slice-seed-images.mjs` | Dev Script | `TEST-ONLY` | Retain for local seed asset generation. |
| `scripts/import-seed-images.mjs` | Dev Script | `TEST-ONLY` | Retain for local seed processing. |
| `backend/src/scripts/seed-hash.ts` | Utility | `TEST-ONLY` | Retain for hash verification. |
