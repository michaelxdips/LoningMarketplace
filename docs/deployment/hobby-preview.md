# Hobby Cloud Preview Deployment

## Phase 0 — Actual State Reconstruction

- Repository root: `C:/Users/Michael/Documents/Marketplace-Loning`
- Branch: `phase1-public-discovery`
- HEAD: `1e0930685de1e0f2f8c5c396374b12ccf2be795c`
- Worktree: clean (`git status --short` empty)
- Tags:
  - `v1.4.0-preview.1` -> `38a6ee4fd333b7ec2d6a51800a66bef91f2d6d48`
  - `v1.4.0-preview.2` -> `169db5cc2f0a2847dc5c0f3777b8ef0614100f66`
  - `v1.5.0-preview.1` -> `1e0930685de1e0f2f8c5c396374b12ccf2be795c` (== HEAD)
- Remote: `https://github.com/michaelxdips/LoningMarketplace.git` (no credentials in URL)
- Stray `backend/backend`: none
- Historical migrations `0005`–`0009`: no diff
- Phase 0 protected files (`frontend/vite.config.ts`, `backend/tests/migration-0008-contract.test.ts`): no diff

## Existing deployment manifests

- `render.yaml`: single backend web service (`rootDir backend`, `plan free`, health `/api/health`, `autoDeploy true`).
  Currently split-origin oriented: no static-site service for frontend.
- `backend/railway.toml`: nixpacks builder, `npm ci && npm run build`, `npm start`, healthcheck `/api/health`.

## Active auth/CORS/cookie/CSP contract (from source)

- Cookie: `env.SESSION_COOKIE_NAME`, `path '/'`, `httpOnly true`, `sameSite 'lax'`, `secure env.COOKIE_SECURE` (`auth.ts:32,36,37`)
- CORS: `@fastify/cors`, `origin env.CORS_ORIGIN` (single explicit URL, no wildcard, no comma), `credentials true` (`app.ts:37`)
- Production enforcement (`env.ts:56-57`, `app.ts:30`):
  - `COOKIE_SECURE` must be true
  - `CORS_ORIGIN` must be explicit (not `*`, no comma)
  - `MEDIA_STORAGE_DRIVER` must be `s3`
- `trustProxy: env.TRUST_PROXY` (`app.ts:31`)
- CSP `frameSrc`: `["'self'", "https://www.openstreetmap.org"]` (`app.ts:34`)
- Static serving: `@fastify/static` registered ONLY in non-production for `/media/` (`app.ts:39`).
  No frontend asset serving. No SPA fallback. No `index.html` serving.

## Health endpoints

- `GET /api/health` -> `{ status: 'ok' }`
- `GET /api/ready` -> `200 { status: 'ok' }` if DB reachable within 1s, else `503`

## Start command

- backend: `npm start` -> `node dist/src/index.js` (after `npm run build` -> `tsc -p tsconfig.json`)

## Phase 1 — Topology Decision

**Selected: Option A — Same-origin preview.**

Rationale:
- Cookie `SameSite=Lax` + credentialed CORS with single explicit origin.
- Split-origin (separate Render subdomains under `.onrender.com`) would require cross-site credentialed fetch from a static SPA. `SameSite=Lax` does not reliably send cookies on cross-site XHR/fetch in modern browsers. That would force `SameSite=None; Secure`, weakening the cookie contract, which the safety rules forbid without explicit browser evidence and security review.
- Same-origin keeps `SameSite=Lax`, single CORS origin equal to the serving origin, no `SameSite=None`, no permissive CORS.
- Cost: requires a production-safe static-serving adapter so one Render Web Service serves both `/api/*` (Fastify routes) and the built React/Vite assets with SPA fallback.

Adapter requirements (to implement in Phase 2):
- serve hashed frontend assets from `frontend/dist`
- serve `index.html` for `/`
- SPA fallback for public paths (`/produk/:slug`, `/umkm/:slug`, `/faq`, `/tentang-desa`, dashboard)
- NEVER rewrite `/api/*` 404 to `index.html`
- correct content types
- retain Helmet security headers
- no filesystem path exposure
- deep-link support
- use established Fastify static-serving integration (`@fastify/static`, already a dependency)

## Phase 1–2 — Adapter Implementation & Verification (DONE)

Adapter added to `backend/src/app.ts`:
- `resolveFrontendDist()` resolves `frontend/dist` from three candidate paths (Render cwd, local monorepo, compiled dist/src).
- In production only: registers `@fastify/static` at prefix `/` with `cacheControl`, `maxAge: '1y'`, `immutable: true`.
- SPA fallback via `setNotFoundHandler`: serves cached `index.html` buffer for GET non-asset, non-`/api/`, non-`/media/` paths.
- API 404 stays JSON (never rewritten to index.html).
- Asset 404 stays 404 (extension regex check).
- Non-production path unchanged.

Local smoke test (NODE_ENV=production, no DB):
- `/` → 200 text/html (index.html)
- `/api/health` → 200 `{"status":"ok"}`
- `/umkm/dapur-loning` → 200 text/html (SPA deep link)
- `/faq` → 200 text/html (SPA deep link)
- `/api/nonexistent` → 404 JSON `{"error":{"message":"Route not found","code":"NOT_FOUND"}}`
- `/assets/nonexistent.js` → 404 (asset not rewritten)

`render.yaml` updated for same-origin:
- `rootDir` removed (service at repo root)
- `buildCommand: npm ci && npm run build` (builds both workspaces)
- `startCommand: npm start --workspace=backend`
- `autoDeploy: false` (controlled)
- name: `loning-preview`
- All secret env vars remain `sync: false`

Backend: 166/166 tests pass. Lint 0. Typecheck 0. Production build (frontend + backend) pass.
Deployment-config test: 11/11 pass.

## Phase 3 — Commit, Clean-Clone Verification, Tag (DONE)

Branch: `deployment/hobby-preview`
Commit: `bb8e8433a94b9b7e0e308f8940921c26206abf58` — `chore(deploy): prepare hobby cloud preview`
Changed files: `backend/src/app.ts`, `render.yaml`, `docs/deployment/hobby-preview.md`
Excluded: no `.env`, no secrets, no node_modules/dist/storage.
Secret scan: clean (only false-positive `X-CSRF-Token` header name in app.ts).
Historical migrations 0005–0009: no diff.
Phase 0 protected files: no diff.

Clean-clone verification (disposable `/tmp/loning-clean-v15p2`):
- `npm ci`: exit 0
- lint: exit 0
- typecheck: exit 0
- unit tests: 166/166 pass (14 files)
- production build (VITE_PUBLIC_SITE_URL=https://site.example.invalid VITE_API_URL=https://api.example.invalid/api): exit 0
- harness safety: 3 valid accepted, 19 refused
- existing-data migration: PASS (audit PASS, EXISTING_DATA_MIGRATION_PASS)
- `git diff --check`: OK
- `git status --short`: 0 lines (clean)
- clone removed safely

Tag: `v1.5.0-preview.2` -> `bb8e8433a94b9b7e0e308f8940921c26206abf58`
- `v1.5.0-preview.1` unchanged: `1e0930685de1e0f2f8c5c396374b12ccf2be795c`
- `v1.4.0-preview.1` unchanged: `38a6ee4fd333b7ec2d6a51800a66bef91f2d6d48`
- `v1.4.0-preview.2` unchanged: `169db5cc2f0a2847dc5c0f3777b8ef0614100f66`

## Phase 3 — Push Gate (BLOCKED)

`PUSH_AUTHORIZED = NO`. Push commands prepared, not executed:

```
git push origin deployment/hobby-preview
git push origin v1.5.0-preview.2
```

Push target: `https://github.com/michaelxdips/LoningMarketplace.git`
Commit to push: `bb8e8433a94b9b7e0e308f8940921c26206abf58`
Tag to push: `v1.5.0-preview.2`
No force push. No unrelated branches.

## Phase 4+ — Cloud Access Pending

Phases 4–17 require:
- Neon login and database provisioning (manual)
- Render login and service creation (manual)
- Cloudflare R2 or S3-compatible bucket provisioning (manual)
- Secret entry through provider UI (manual)
- Browser runtime acceptance against deployed URLs (manual or Hermes with browser tools after deployment)

These cannot proceed without user action.
