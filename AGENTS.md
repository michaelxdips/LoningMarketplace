# AGENTS.md — Panduan Memulai untuk AI Agent

> **Proyek:** Loning Maju — Direktori Digital UMKM Desa Loning, Petarukan, Pemalang
> **Bahasa:** Dokumentasi & UI berbahasa **Indonesia**; kode & identifier berbahasa Inggris.
> **Lisensi:** Apache-2.0

Dokumen ini adalah **pintu masuk** untuk AI agent (atau developer baru) yang membaca repository ini.
Untuk pemahaman menyeluruh, ikuti urutan dokumen di [`docs/ai-guide/`](docs/ai-guide/README.md).

---

## 1. Apa proyek ini?

**Loning Maju** adalah **direktori publik + etalase produk** untuk UMKM di Desa Loning.
Ini **BUKAN** e-commerce: tidak ada keranjang, checkout, pembayaran, pesanan, atau rating.
Seluruh transaksi terjadi **offline via WhatsApp** — pengunjung melihat katalog lalu menghubungi penjual langsung.

- **Publik (tanpa login):** telusuri produk & UMKM, filter kategori, peta lokasi, detail via slug canonical, kontak WhatsApp.
- **Dashboard (login):** manajemen UMKM/produk/user, publikasi (draft → published → archived), audit log, analitik inquiry.

## 2. Tech stack ringkas

| Layer | Teknologi |
|---|---|
| Frontend | React 19 + Vite 6 + TypeScript 5.8 (strict) + Tailwind CSS 4 + TanStack Query 5 + React Router 7 |
| Backend | Fastify 5 + TypeScript ESM + Drizzle ORM 0.45 + Zod 4 |
| Database | PostgreSQL 16 (lokal via Docker; produksi via Aiven) |
| Media | Sharp (WebP) + S3-compatible storage (Cloudflare R2 di produksi) |
| Auth | Argon2id + session token (cookie HTTP-only) + CSRF |
| Testing | Vitest (unit), Testing Library (component), Playwright (E2E desktop+mobile) |
| Repo | npm workspaces monorepo (`frontend/` + `backend/`) |

## 3. Layout paling penting (file kunci)

```
LoningMarketplace/
├── frontend/                  # React SPA (Vite)
│   ├── src/main.tsx           # Router + semua route + guard
│   ├── src/App.tsx            # Homepage publik
│   ├── src/lib/api.ts         # Klien HTTP + autentikasi
│   ├── src/lib/management.ts  # Klien API dashboard
│   ├── src/lib/auth.ts        # Tipe session & helper
│   ├── src/components/dashboard/Guards.tsx  # Guard route (auth+role)
│   └── src/types.ts           # Interface bersama (UMKM, Product)
├── backend/                   # Fastify API
│   ├── src/app.ts             # Fastify app factory (plugin + route wiring)
│   ├── src/config/env.ts      # Schema & validasi environment (Zod)
│   ├── src/db/schema.ts       # ★ DEFINISI TABEL (Drizzle) — sumber kebenaran
│   ├── src/db/repository.ts   # ★ Semua query DB (data access layer)
│   ├── src/db/migrate.ts      # Runner migrasi idempotent
│   ├── src/auth/policy.ts     # ★ Role → capability matrix
│   ├── src/auth/guards.ts     # authenticate/origin/csrf/requireCapability
│   ├── src/routes/*.ts        # Handler per family (umkms, products, manage, admin, auth, media, events, sitemap…)
│   ├── src/media/             # Storage (FS/S3) + processor (Sharp)
│   └── drizzle/               # File migrasi SQL (0000–0016)
├── e2e/                       # Playwright spec
├── scripts/                   # Harness test/seed/verifikasi isolated
├── docs/ai-guide/             # ★ DOKUMENTASI INI
├── compose.yaml               # PostgreSQL lokal
├── render.yaml / vercel.json  # Konfigurasi deploy
└── package.json               # Script npm root (workspaces)
```

## 4. Aturan cepat sebelum menulis kode

1. **Jangan sentuh `frontend/dist/`, `backend/dist/`, `node_modules/`** — hasil build/generated.
2. **Skema DB di `backend/src/db/schema.ts`** adalah sumber kebenaran tunggal. Perubahan tabel = migrasi baru lewat `npm --prefix backend run db:generate` (jangan edit `drizzle/*.sql` manual kecuali paham dampaknya).
3. **Semua endpoint terproteksi wajib** melalui guard `guards.secured` (`authenticate` + `origin` + `csrf`) dan cek capability dari `auth/policy.ts`.
4. **Respons selalu dibungkus** `{ data: … }` atau `{ error: { message, code } }`.
5. **Public hanya menampilkan `published`** dan produk dengan parent UMKM `published` — logika ini ada di `repository.ts` (predikat `listUMKMs`/`listProducts`).
6. **Nomor WhatsApp** harus dinormalisasi `628…` (lihat `backend/src/domain/phone.ts`).
7. **Production tidak menjalankan seed/bootstrap** — hanya `migrate` lalu server.
8. **Jangan commit `.env` atau secret.** File `.env` masuk `.gitignore`.

## 5. Perintah yang paling sering dipakai

```bash
npm install                 # install semua workspace
npm run dev:local           # DB + migrate + seed + dev server (setup penuh)
npm run dev:all             # frontend(:3000) + backend(:3001) saja
npm run lint && npm run typecheck
npm run test:frontend / npm run test:backend
npm run build               # wajib VITE_PUBLIC_SITE_URL
npm run db:migrate          # terapkan migrasi
```

Daftar lengkap: [`docs/ai-guide/12-commands-cheatsheet.md`](docs/ai-guide/12-commands-cheatsheet.md).

## 6. Di mana mulai membaca?

Baca berurutan:
1. [`docs/ai-guide/01-project-overview.md`](docs/ai-guide/01-project-overview.md) — konteks bisnis & fitur.
2. [`docs/ai-guide/02-architecture.md`](docs/ai-guide/02-architecture.md) — arsitektur & diagram.
3. [`docs/ai-guide/04-database.md`](docs/ai-guide/04-database.md) — skema & ER diagram.
4. [`docs/ai-guide/06-auth-and-security.md`](docs/ai-guide/06-auth-and-security.md) — alur login, CSRF, role.
5. [`docs/ai-guide/05-api-reference.md`](docs/ai-guide/05-api-reference.md) — semua endpoint.
6. [`docs/ai-guide/13-safety-and-data-protection.md`](docs/ai-guide/13-safety-and-data-protection.md) — ⚠️ guard keamanan data (WAJIB dibaca sebelum seed/reset/deploy).
7. [`docs/ai-guide/14-migrations-and-seed.md`](docs/ai-guide/14-migrations-and-seed.md) — pipeline migrasi & seed.

Diagram Mermaid mandiri tersedia di [`docs/ai-guide/diagrams/`](docs/ai-guide/diagrams/).

---

## 7. Konvensi & catatan penting

- **Brand publik:** "Loning Maju". Identifier internal (`marketplace-loning-local`, `loning_digital`, `loning`, `loning_postgres_data`, `loning_session`, `media/{uuid}`) adalah **kontrak kompatibilitas** — jangan diganti.
- **Slug canonical:** `/produk/:slug` dan `/umkm/:slug`; identitas juga menerima UUID. Logika predikat ada di `repository.ts` → `publicIdentifierPredicate`.
- **Seed hanya boleh di DB development/test disposable**, dengan profile eksplisit + `ALLOW_SEED=1`. Alias `db:seed` dan `admin:create` **sengaja hard-fail**.
- **Idempotency:** endpoint create UMKM/product mendukung header `Idempotency-Key` (cache in-memory, lihat `backend/src/lib/idempotency.ts`).
- **CSV export** aman dari formula injection (prefix `'`), UTF-8 BOM (`backend/src/lib/csv.ts`).
