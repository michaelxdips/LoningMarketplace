# 11 — Testing

## 🧪 Strategi Pengujian

| Layer | Tool | Lokasi | Perintah |
|---|---|---|---|
| Unit + Component (frontend) | Vitest + Testing Library + jsdom | `frontend/src/**/*.test.tsx` (30 file) | `npm run test:frontend` |
| Backend unit | Vitest | `backend/tests/` (21 file) | `npm run test:backend` |
| E2E (desktop + mobile) | Playwright | `e2e/*.spec.ts` (8+ file) | `npm run test:e2e:isolated` |
| E2E native zoom 200% | Playwright | `e2e/zoom-native.spec.ts` | `npm run test:e2e:zoom-native:isolated` |
| Integration smoke | Custom harness | `scripts/integration-smoke.mjs` | `npm run test:integration:isolated` |
| Migration (existing) | Custom harness | `scripts/run-isolated.mjs` | `npm run test:migration:existing:isolated` |
| Repository/harness safety | node --test | `scripts/repository-safety.test.mjs` | `npm run test:harness-safety` |

## 🚀 Harness Isolated (disposable)

`scripts/run-isolated.mjs` menjalankan integration/E2E/migration pada **Compose project, database, port, volume, dan media directory disposable** — dibersihkan pada success/failure/signal. Tidak ada fallback ke development Compose.

## ✅ Perintah Lengkap

```bash
npm run test:frontend              # unit + component
npm run test:backend               # backend unit
npm run test:unit                  # semua unit
npm run lint && npm run typecheck
npm run test:harness-safety        # cek harness disposable DB safety
npm run verify:seed-determinism    # repeatability + idempotency seed
npm run test:migration:existing:isolated
npm run test:integration:isolated
npm run test:e2e:isolated
npm run test:e2e:zoom-native:isolated
npm run verify:full:isolated       # semua isolated verifikasi
npm run test:all                   # gate lengkap (safety + unit + build + isolated)
```

> `npm run test:all` = `check:repository-safety` → `test:repository-safety` → `test:harness-safety` → `test:unit` → `build` → `test:integration:isolated` → `test:e2e:isolated` → `test:e2e:zoom-native:isolated` → `test:migration:existing:isolated`.

## 🛡️ Repository & Seed Safety

| Perintah | Fungsi |
|---|---|
| `npm run check:secrets` | Scan secret |
| `npm run check:repository` | Hygiene check |
| `npm run check:repository-safety` | secrets + hygiene |
| `npm run verify:seed-determinism` | Seed clean repeatability + same-target idempotency |
| `npm run precloud:check` | Pre-deploy check |

## 🌱 Seed Guard

- `db:seed:dev` → development loopback (wajib `NODE_ENV=development` + `APP_ENV` + `DATABASE_ENVIRONMENT` + `ALLOW_SEED=1`).
- `db:seed:test` → hanya child harness disposable; `ALLOW_SEED=1` tidak diwariskan.
- `db:seed:preview` dan `db:seed` → disabled, sengaja gagal.

## 🧩 Playwright Config

- `playwright.config.ts`: desktop (1440×900) + mobile (390×844, isMobile, touch).
- `webServer`: otomatis jalankan backend (`/api/ready`) + frontend (`/login`) dengan rate-limit dinaikkan (10000) agar test tidak kena 429.
- Install browser: `npx playwright install chromium`.

## 📈 Coverage & Kualitas

- `npm run lint` → TypeScript lint semua workspace.
- `npm run typecheck` → type check semua workspace.
- Vitest coverage tidak wajib, namun banyak test `.test.ts(x)` berdampingan dengan sumbernya.

## ➡️ Lanjut

Berikutnya: [12 — Commands Cheatsheet](12-commands-cheatsheet.md).
