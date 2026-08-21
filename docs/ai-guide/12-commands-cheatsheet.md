# 12 — Commands Cheatsheet

Semua perintah dijalankan dari **root repository** (kecuali disebut `--workspace`).

## 🚀 Development

| Perintah | Fungsi |
|---|---|
| `npm install` | Install semua workspace |
| `npm run dev` | Alias `dev:local` (setup penuh) |
| `npm run dev:local` | DB up → wait → migrate → seed:dev → dev:all |
| `npm run dev:all` | Frontend (:3000) + backend (:3001) bersamaan |
| `npm run dev:frontend` | Frontend saja |
| `npm run dev:backend` | Backend saja |

## 🗄️ Database

| Perintah | Fungsi |
|---|---|
| `npm run db:local:up` | Start PostgreSQL container |
| `npm run db:local:down` | Stop container |
| `npm run db:local:wait` | Tunggu PostgreSQL ready |
| `npm run db:local:logs` | Lihat log PostgreSQL |
| `npm run db:local:setup` | Up + wait + migrate + seed:dev |
| `npm run db:migrate` | Jalankan migrasi (tanpa seed) |
| `npm run db:seed:dev` | Seed development (guarded) |
| `npm run db:seed:test` | Seed test (harness) |
| `npm run db:bootstrap-admin` | Buat superadmin |
| `npm run db:local:reset` | ⚠️ Hapus volume dev (destruktif) |
| `npm run db:local:reset-safe` | Reset data dev tanpa hapus volume |
| `npm run verify:seed-determinism` | Verifikasi seed deterministik |

## 🏗️ Build

| Perintah | Fungsi |
|---|---|
| `npm run build` | Build semua (wajib `VITE_PUBLIC_SITE_URL`) |
| `npm run build:frontend` | Build frontend |
| `npm run build:backend` | Build backend |
| `npm run lint` | TypeScript lint semua |
| `npm run typecheck` | Type check semua |
| `npm run clean` | Hapus artifact build |

## 🧪 Testing

| Perintah | Fungsi |
|---|---|
| `npm run test:frontend` | Unit + component (Vitest) |
| `npm run test:backend` | Backend unit |
| `npm run test:unit` | Semua unit |
| `npm run test:harness-safety` | Harness disposable safety |
| `npm run test:integration` | Alias `test:integration:isolated` |
| `npm run test:integration:isolated` | Integration isolated |
| `npm run test:e2e` | Playwright langsung |
| `npm run test:e2e:isolated` | E2E isolated |
| `npm run test:e2e:zoom-native:isolated` | E2E native zoom |
| `npm run test:migration:existing:isolated` | Migration isolated |
| `npm run verify:full:isolated` | Semua isolated verifikasi |
| `npm run test:all` | Gate lengkap |

## 🛡️ Safety & Maintenance

| Perintah | Fungsi |
|---|---|
| `npm run check:secrets` | Scan secret |
| `npm run check:repository` | Hygiene check |
| `npm run check:repository-safety` | secrets + hygiene |
| `npm run test:repository-safety` | Test repository safety |
| `npm run precloud:check` | Pre-deploy check |
| `npm --prefix backend run sessions:cleanup` | Bersihkan session expired |
| `npm --prefix backend run media:cleanup` | Bersihkan media orphan |
| `npm --prefix backend run analytics:retention:apply` | Terapkan retensi analytics |
| `npm --prefix backend run db:generate` | Generate migrasi baru |
| `npm --prefix backend run db:audit` | Audit DB |
| `npm --prefix backend run storage:check` | Cek storage media |
| `npm --prefix backend run media:audit` | Audit media |

## 🔑 Bootstrap Super Admin (contoh PowerShell)

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
$env:BOOTSTRAP_ADMIN_USERNAME="superadmin"
$env:BOOTSTRAP_ADMIN_PASSWORD="ganti-password-12-karakter"
$env:BOOTSTRAP_ADMIN_DISPLAY_NAME="Administrator"
$env:ALLOW_ADMIN_BOOTSTRAP="1"
$env:BOOTSTRAP_CONFIRM="CREATE_SUPERADMIN"
npm run db:bootstrap-admin
Remove-Item Env:BOOTSTRAP_ADMIN_* ; Remove-Item Env:ALLOW_ADMIN_BOOTSTRAP
```

## 🌱 Seed Development (contoh PowerShell)

```powershell
$env:NODE_ENV="development"
$env:APP_ENV="development"
$env:DATABASE_ENVIRONMENT="development"
$env:ALLOW_SEED="1"
$env:SEED_DEVELOPMENT_PASSWORD="password-seed"
npm run db:seed:dev
Remove-Item Env:ALLOW_SEED
```

## 🏁 URL Lokal

| URL | Keterangan |
|---|---|
| http://localhost:3000 | Frontend (homepage) |
| http://localhost:3001/api/health | Backend liveness |
| http://localhost:3001/api/ready | Backend readiness |
| http://localhost:3000/login | Login dashboard |

---

> Kembali ke [indeks](README.md).
