# 16 — Testing Infrastructure

> Pelengkap [11 — Testing](11-testing.md). Fokus pada **harness isolated** dan **safety self-test** yang merupakan bagian unik proyek ini.

## 🧪 Harness Isolated (`scripts/run-isolated.mjs`)

Mode: `integration`, `e2e`, `full`, `migration`, `zoom-native`.

### Apa yang dilakukan

1. Cari **5 port kosong** (postgres, minio, minio-console, frontend, backend).
2. Hapus **semua env application-specific** dari proses (mencegah kebocoran `DATABASE_URL`/S3/seed keys produksi ke test).
3. Bangun env disposable: `NODE_ENV=test`, compose project `marketplace-loning-(test|e2e)-{invocationId}`, DB `loning_{invocationId}_test`, media filesystem di `.phase0-runtime/`.
4. `assertDisposableDatabase()` — validasi target disposable.
5. Preflight Docker compose config + tolak bila project sudah punya resource.
6. `docker compose up -d postgres minio` → wait sehat.
7. **MinIO restart persistence test** — upload objek deterministik, restart container, verifikasi checksum SHA-256 + bytes, hapus objek.
8. Migrate + seed:test (+ e2e:setup untuk e2e/full).
9. Jalankan test (Playwright / integration smoke / migration scenario).
10. Teardown `docker compose down --volumes --remove-orphans` + hapus artifact root — **selalu**, pada success/failure/signal.

### Cleanup Guarantee

Signal handler `SIGINT`/`SIGTERM`/`SIGHUP` → teardown → exit 1. `finally` memastikan cleanup selalu jalan.

## 🧩 Compose Test (`compose.test.yaml`)

- **postgres**: `postgres:16-alpine`, `tmpfs` untuk data (ephemeral, hilang saat down), port `127.0.0.1:${DISPOSABLE_DB_PORT}:5432`.
- **minio**: `minio/minio` dengan root `minioadmin`, port `${DISPOSABLE_MINIO_PORT}:9000` + console `:9001`.
- User/password test: `loning_test` / `loning_disposable_only`.

## 🛡️ Harness Safety Self-Test (`scripts/test-disposable-db-safety.mjs`)

Test unit (node:assert) yang memvalidasi kontrak executable:

- `assertDisposableDatabase` menerima 3 baseline valid + menolak ~19 kasus invalid (wrong NODE_ENV, missing flag, invalid project, malformed URL, remote host, port 5432, `loning_digital`, production-like, missing suffix, SSL URL, empty user/pass, dsb).
- Verifikasi bahwa **tidak ada script** yang memanggil legacy `db:seed` (harus `db:seed:test`/`db:seed:dev`).
- Verifikasi `render.yaml` tidak mengandung `db:seed`/`db:bootstrap-admin`/`admin:create`.
- Verifikasi `compose.test.yaml` memakai port env disposable (bukan default).
- Verifikasi `run-isolated.mjs` & `verify-seed-determinism.mjs` memakai `ALLOW_SEED=1` + profile `test` + `APP_ENV=test` + `DATABASE_ENVIRONMENT=test` + `SEED_PROFILE=test`.

## 🔍 Pre-cloud Check (`scripts/precloud-check.mjs`)

Mode static (default) & `--production` (probe storage):
1. `npm run lint` + `typecheck`.
2. Storage check (`storage:check`, atau `--probe` untuk test tulis/hapus S3).
3. `test:unit`.
4. Build dengan `VITE_PUBLIC_SITE_URL`.

## 📈 Coverage Overview (final)

| Layer | File | Diuji oleh |
|---|---|---|
| Disposable DB safety | `scripts/lib/disposable-db-safety.mjs` | `test-disposable-db-safety.mjs` |
| Repository safety | `scripts/repository-safety.mjs` | `repository-safety.test.mjs` |
| Seed determinism | `scripts/verify-seed-determinism.mjs` | `verify:seed-determinism` |
| Integration smoke | `scripts/integration-smoke.mjs` | `test:integration:isolated` |
| Migration existing-data | `run-isolated.mjs migration` | `test:migration:existing:isolated` |

## ➡️ Kembali

[Indeks dokumentasi](README.md).
