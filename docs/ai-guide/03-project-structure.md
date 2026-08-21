# 03 — Project Structure

Peta lengkap repository. Berkas yang ditandai ⭐ adalah yang **paling penting** untuk dipahami agent.

```
LoningMarketplace/
├── AGENTS.md                        ⭐ Pintu masuk AI agent
├── README.md                        Dokumentasi publik (lengkap, bahasa Indonesia)
├── DESIGN.md                        Spesifikasi visual & design tokens
├── HANDOFF.md                       Catatan hand-off teknis antar fase
├── package.json                     ⭐ Root: workspaces + semua script npm
├── package-lock.json
├── compose.yaml                     Docker Compose PostgreSQL lokal
├── compose.test.yaml                Compose untuk harness test
├── render.yaml                      Konfigurasi deploy Render (backend)
├── vercel.json                      Konfigurasi deploy Vercel (frontend + rewrite)
├── playwright.config.ts             Konfigurasi E2E (desktop + mobile)
├── playwright.zoom-native.config.ts Konfigurasi E2E native zoom 200%
│
├── frontend/                        📦 Workspace React SPA
│   ├── package.json
│   ├── vite.config.ts               ⭐ Vite + Tailwind plugin + alias + validasi site URL
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── index.html
│   ├── .env / .env.example          VITE_API_URL, VITE_PUBLIC_SITE_URL
│   ├── public/                      Statis: logo, favicon, hero, robots.txt, _redirects
│   └── src/
│       ├── main.tsx                 ⭐ Router + semua route + guard + lazy loading
│       ├── App.tsx                  ⭐ Homepage publik (komposisi section + dialog)
│       ├── index.css                ⭐ Design tokens (Tailwind 4) & global styles
│       ├── types.ts                 ⭐ Interface bersama (UMKM, Product, Category)
│       ├── data.ts                  Konten statis (FAQ, benefit cards, guide steps)
│       ├── config/brand.ts          Brand metadata
│       ├── components/
│       │   ├── layout/              Navbar, Footer, PublicPageShell
│       │   ├── home/                Hero, Category, FeaturedProducts, FeaturedBusinesses, Mission, FAQ, CTA…
│       │   ├── dashboard/           DashboardShell, Guards, ResourceList, Ui
│       │   ├── business/            BusinessCard, UMKMImage
│       │   ├── product/             ProductCard, ProductImage, ProductGallery, GalleryManager
│       │   ├── discovery/           DiscoverySearchForm
│       │   └── shared/              Dialogs (WhatsApp, UMKM, Product), Toast, EmptyState, ErrorBoundary…
│       ├── hooks/
│       │   ├── useAuth.ts           ⭐ session + CSRF + login/logout
│       │   ├── useProducts.ts / useUMKMs.ts
│       │   ├── useManagement.ts     ⭐ mutation dashboard (auto-CSRF)
│       │   └── discovery/useDiscoveryUrlState.ts   State katalog di URL
│       ├── lib/
│       │   ├── api.ts               ⭐ klien HTTP + error envelope + retry
│       │   ├── management.ts        ⭐ klien API dashboard
│       │   ├── auth.ts              ⭐ tipe session/capability
│       │   ├── seo.ts               metadata/canonical/JSON-LD
│       │   ├── analytics.ts         track public event (non-blocking)
│       │   ├── location.ts          parse koordinat Google/OSM + embed URL
│       │   ├── catalog-url.ts       parse/serialize state katalog URL
│       │   ├── price.ts, share.ts, slug (via backend), siteUrl.ts, idempotency.ts
│       │   └── umkmStatus.ts, auditEvents.ts
│       └── pages/                   Halaman route (20+ file)
│
├── backend/                         📦 Workspace Fastify API
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── .env / .env.example          ⭐ environment schema
│   ├── drizzle/                     ⭐ 17 migrasi SQL (0000–0016) + meta journal
│   └── src/
│       ├── index.ts                 ⭐ entry point
│       ├── app.ts                   ⭐ Fastify factory + plugin + error handler
│       ├── config/env.ts            ⭐ Zod env schema + aturan produksi
│       ├── auth/
│       │   ├── policy.ts            ⭐ role → capability matrix
│       │   ├── guards.ts            ⭐ authenticate/origin/csrf/requireCapability
│       │   └── security.ts          Argon2id + token + SHA-256
│       ├── db/
│       │   ├── client.ts            postgres + drizzle
│       │   ├── schema.ts            ⭐ definisi tabel (sumber kebenaran)
│       │   ├── repository.ts        ⭐ semua query DB
│       │   ├── migrate.ts           runner migrasi idempotent
│       │   ├── seed.ts              ⭐ seed guarded (dev/test/preview)
│       │   ├── seeds/development|test|shared/
│       │   ├── target-safety.ts     guard target seed (refuse production)
│       │   ├── public-integrity.ts / location-integrity.ts / backfill-slugs.ts
│       ├── domain/
│       │   ├── phone.ts             normalisasi WhatsApp 628…
│       │   └── location.ts          normalisasi koordinat
│       ├── errors/domain.ts         error domain (SlugConflictError)
│       ├── lib/
│       │   ├── slug.ts              ⭐ slugify + alokasi retry
│       │   ├── csv.ts               CSV aman (BOM + anti formula injection)
│       │   └── idempotency.ts       cache idempotency in-memory
│       ├── media/
│       │   ├── storage.ts           ⭐ FS + S3 storage, safe key, public URL
│       │   └── processor.ts         ⭐ Sharp WebP (card + thumbnail)
│       ├── routes/
│       │   ├── health.ts, auth.ts, umkms.ts, products.ts
│       │   ├── manage.ts            ⭐ manajemen UMKM/produk (besar)
│       │   ├── admin.ts             ⭐ manajemen user + audit
│       │   ├── media.ts, media-serve.ts, events.ts, analytics.ts, sitemap.ts
│       │   └── validation.ts, types.ts
│       └── scripts/                 admin-create, cleanup, audit, reset-guard…
│   └── tests/                       21 file test backend
│
├── e2e/                             📦 Playwright spec (8+ file) + helpers + fixtures
├── scripts/                         Harness: run-isolated, repository-safety, seed verify, wait-for-postgres…
├── assets/                          Aset seed (logo + 65 gambar produk/UMKM)
├── docs/
│   ├── ai-guide/                    ⭐ DOKUMENTASI INI
│   ├── audit/…                      Riwayat audit fase (referensi)
│   └── *.md                         Dokumen versi/fitur historis
└── scratch/                         Skrip eksperimen (bukan produksi)
```

## 📦 Workspace & Script

Root `package.json` mendefinisikan `workspaces: ["frontend", "backend"]` dan semua script orchestration. Lihat [12 — Commands Cheatsheet](12-commands-cheatsheet.md).

## 🧭 Navigasi cepat berdasarkan tugas

| Tugas | Buka file |
|---|---|
| Tambah endpoint publik baru | `backend/src/routes/*.ts` + `backend/src/db/repository.ts` |
| Ubah skema DB | `backend/src/db/schema.ts` → `npm --prefix backend run db:generate` |
| Ubah permission role | `backend/src/auth/policy.ts` |
| Ubah halaman publik | `frontend/src/App.tsx` + `frontend/src/components/home/*` |
| Tambah route dashboard | `frontend/src/main.tsx` (route) + `frontend/src/components/dashboard/*` |
| Ubah form/validasi | `frontend/src/pages/ManagementForms.tsx` + `backend/src/routes/validation.ts` |
| Ubah styling/theme | `frontend/src/index.css` (tokens) + `DESIGN.md` |

## ➡️ Lanjut

Berikutnya: [04 — Database](04-database.md).
