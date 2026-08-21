# Full Project Scan — Refactor & Rebranding ke Loning Maju

**Tanggal audit:** 22 Juli 2026  
**Repository:** `C:/Users/Michael/Documents/LoningMarketplace`  
**Mode:** audit read-only; tidak ada source code, dependency, konfigurasi runtime, schema, atau data yang diubah oleh audit ini.

> [!NOTE]
> Laporan ini dipublikasikan ke repository setelah hasil audit dan rencana dokumentasinya disetujui. Publikasi laporan merupakan satu-satunya perubahan repository pada tahap audit.

## A. Executive Summary

### Status kesiapan

**READY WITH BLOCKERS.** Refactor dan rebranding aman dimulai setelah keputusan pemilik project pada bagian Q ditetapkan. Baseline aktif sehat: lint/typecheck, 91 unit/component/API tests, build frontend/backend, dan audit database semuanya lulus. Tidak ditemukan masalah integritas data pada database lokal.

### Risiko terbesar

1. Identifier persisten (`loning_session`, `loning_digital`, volume database, storage URL/key) tidak boleh diganti serentak hanya untuk kosmetik.
2. Identitas publik tersebar di source dan dokumentasi; belum ada source of truth brand.
3. Metadata browser masih template generik dan bahasa dokumen salah, sehingga rebranding UI saja tetap menghasilkan identitas SEO yang keliru.
4. Working tree sudah berisi perubahan besar sebelum audit. Implementasi harus dimulai dari snapshot/commit baseline yang disepakati agar rollback dapat dipercaya.
5. Schema Drizzle tidak mendeklarasikan dua `image_source_check` yang ada di migration aktif; source schema dan migration tidak sepenuhnya kongruen.

### Statistik ringkas

| Metrik | Hasil |
|---|---:|
| Referensi exact `Loning Digital` | 11 occurrence / 8 file |
| Referensi slug/project lama `marketplace-loning-local` | 9 occurrence / 6 file |
| Referensi database `loning_digital` | 10 occurrence / 7 file |
| Referensi cookie `loning_session` | 14 occurrence / 11 file |
| Metadata/package lama atau generik | 14 occurrence / 8 file |
| Referensi `Desa Loning` | 28 occurrence; mayoritas geografis, bukan otomatis brand lama |
| Area terdampak | 8: public UI, dashboard/auth, metadata, backend log, package, local infra, tests, docs |
| Critical / High / Medium / Low / Informational | 0 / 2 / 7 / 6 / 5 |
| Automated tests yang dijalankan | 91 passed, 0 failed, 0 skipped |
| Database audit lokal | PASS |

> [!NOTE]
> Jumlah di atas memisahkan exact occurrence. Generated output, `node_modules`, artefak Playwright, dan dependency metadata tidak dihitung sebagai source actionable. `Desa Loning` tetap nama wilayah yang sah kecuali pemilik project memutuskan perubahan narasi.

## B. Detected Technology Stack

| Area | Teknologi terverifikasi | Bukti |
|---|---|---|
| Monorepo | npm workspaces (`frontend`, `backend`) | [package.json:L7-L10](file:///C:/Users/Michael/Documents/LoningMarketplace/package.json#L7-L10) |
| Runtime | Node.js `>=20 <27`, ESM | [package.json:L5-L6](file:///C:/Users/Michael/Documents/LoningMarketplace/package.json#L5-L6) |
| Frontend | React 19, TypeScript, Vite 6, React Router 7 | [frontend/package.json](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/package.json), [main.tsx:L38-L68](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/main.tsx#L38-L68) |
| Styling | Tailwind CSS 4 plus project CSS tokens | [frontend/package.json](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/package.json), [index.css](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/index.css) |
| Client state | TanStack Query; local React state | [main.tsx:L31-L36](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/main.tsx#L31-L36), [App.tsx:L29-L57](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/App.tsx#L29-L57) |
| Backend | Fastify 5, TypeScript | [backend/package.json](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/package.json), [app.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/app.ts) |
| Validation | Zod | [validation.ts:L1-L15](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/routes/validation.ts#L1-L15) |
| Database | PostgreSQL 16, Drizzle ORM, postgres.js | [compose.yaml:L2-L13](file:///C:/Users/Michael/Documents/LoningMarketplace/compose.yaml#L2-L13), [schema.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/schema.ts) |
| Authentication | Opaque HTTP-only cookie session; Argon2id; hashed token and CSRF | [schema.ts:L53-L57](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/schema.ts#L53-L57), [auth.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/routes/auth.ts) |
| Authorization | `admin` / `owner`, route guards and repository scoping | [repository.ts:L41-L57](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/repository.ts#L41-L57) |
| Media | Sharp processing; filesystem local or S3-compatible storage | [storage.ts:L21-L45](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/media/storage.ts#L21-L45), [processor.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/media/processor.ts) |
| Unit/component/API tests | Vitest, Testing Library, Fastify inject | [frontend/package.json](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/package.json), [backend/package.json](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/package.json) |
| Browser tests | Playwright desktop 1440×900 dan mobile 390×844 | [playwright.config.ts:L11-L14](file:///C:/Users/Michael/Documents/LoningMarketplace/playwright.config.ts#L11-L14) |
| Local infrastructure | Docker Compose PostgreSQL | [compose.yaml](file:///C:/Users/Michael/Documents/LoningMarketplace/compose.yaml) |
| CI/CD / production deployment | Tidak ditemukan workflow CI, Dockerfile, reverse proxy, atau deployment config aktif | Repository map; `supabase/snippets` kosong |
| Monitoring / analytics | Tidak ditemukan telemetry, analytics, error tracking, atau metrics project | Full source/config scan |

## C. Repository Map

| Path | Fungsi / source of truth |
|---|---|
| [`frontend/`](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend) | SPA publik dan dashboard. Entry: [main.tsx](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/main.tsx); public composition: [App.tsx](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/App.tsx). |
| [`backend/`](file:///C:/Users/Michael/Documents/LoningMarketplace/backend) | Fastify API, auth, repository, media, scripts. Entry: [index.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/index.ts); bootstrap: [app.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/app.ts). |
| [`backend/src/db/schema.ts`](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/schema.ts) | Declarative schema Drizzle aktif. |
| [`backend/drizzle/`](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/drizzle) | Riwayat migration SQL; 5 migration `0000`–`0004`. Jangan rename migration historis. |
| [`backend/src/db/seeds/`](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/seeds) | Fixture development dan E2E deterministik. |
| [`e2e/`](file:///C:/Users/Michael/Documents/LoningMarketplace/e2e) | Browser/API lifecycle tests dan browser diagnostic observer. |
| [`scripts/`](file:///C:/Users/Michael/Documents/LoningMarketplace/scripts) | Orkestrasi local DB, integration, E2E, seed determinism. |
| [`compose.yaml`](file:///C:/Users/Michael/Documents/LoningMarketplace/compose.yaml) | PostgreSQL lokal dan volume persisten lokal. |
| [`README.md`](file:///C:/Users/Michael/Documents/LoningMarketplace/README.md) | Setup/operator overview; bukan source of truth runtime. |
| [`HANDOFF.md`](file:///C:/Users/Michael/Documents/LoningMarketplace/HANDOFF.md) | Contract teknis dan operasional. |
| [`DESIGN.md`](file:///C:/Users/Michael/Documents/LoningMarketplace/DESIGN.md) | Visual system dan UX intent. |
| [`metadata.json`](file:///C:/Users/Michael/Documents/LoningMarketplace/metadata.json) | Metadata proyek eksternal; tidak dikonsumsi runtime frontend yang terdeteksi. |
| `dist/`, `node_modules/`, `test-results/` | Generated/local output; dikecualikan dari source occurrence. |
| `assets/.aistudio/`, `markers*.json` | Artefak tooling lokal; tidak terhubung ke runtime aktif yang terdeteksi. |
| `supabase/snippets/` | Kosong; bukan deployment aktif. |

### Source of truth aktual

- Brand: **belum tunggal**; tersebar di React copy, docs, metadata, package, dan log.
- Environment: [backend/src/config/env.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/config/env.ts), `backend/.env.example`, `frontend/.env.example`.
- API contract: route Zod schemas + response mapping; tidak ada OpenAPI.
- Permission model: guards, management routes, dan repository role scoping.
- Fixture: seed module per environment dan setup E2E.
- Deployment production: **belum tersedia di repository**.

## D. Brand Reference Inventory

### D1. Public/display identity — rename ke `Loning Maju`

| Existing | Lokasi utama | Klasifikasi |
|---|---|---|
| `Loning Digital` | [README.md:L1-L3](file:///C:/Users/Michael/Documents/LoningMarketplace/README.md#L1-L3), [metadata.json:L2](file:///C:/Users/Michael/Documents/LoningMarketplace/metadata.json#L2), [HANDOFF.md:L1-L3](file:///C:/Users/Michael/Documents/LoningMarketplace/HANDOFF.md#L1-L3), [DESIGN.md:L1](file:///C:/Users/Michael/Documents/LoningMarketplace/DESIGN.md#L1), [data.ts:L46](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/data.ts#L46), [Footer.tsx:L93](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/components/layout/Footer.tsx#L93), [AboutVillageSection.tsx:L55](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/components/home/AboutVillageSection.tsx#L55), [index.ts:L12](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/index.ts#L12) | Rename now |
| Split wordmark `Loning` + `Digital` | [Navbar.tsx](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/components/layout/Navbar.tsx), [LoginPage.tsx:L11](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/pages/LoginPage.tsx#L11), dashboard shell | Rename now; scan JSX fragments, bukan exact string saja |
| Generic browser title `My Google AI Studio App` | [index.html:L2-L6](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/index.html#L2-L6) | Replace immediately with Loning Maju metadata |
| Generic root package `react-example` | [package.json:L2](file:///C:/Users/Michael/Documents/LoningMarketplace/package.json#L2), root lockfile | Rename package metadata |
| Package `loning-digital-frontend/backend` | workspace manifests and root lockfile | Rename package metadata; regenerate one authoritative lockfile |

### D2. Geographic identity — jangan blind replace

`Desa Loning`, `Loning`, `Petarukan`, dan `Pemalang` banyak digunakan sebagai lokasi, asal produk, alamat, atau nama fixture. Contoh: [HeroSection.tsx:L35-L45](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/components/home/HeroSection.tsx#L35-L45), [AboutVillageSection.tsx:L48-L55](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/components/home/AboutVillageSection.tsx#L48-L55), [WhatsAppInquiryDialog.tsx:L58-L59](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/components/shared/WhatsAppInquiryDialog.tsx#L58-L59), dan seed [umkms.ts:L10](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/seeds/development/umkms.ts#L10). Nilai tersebut bukan otomatis brand lama. Review copy diperlukan; nama wilayah dan nama usaha harus dipertahankan.

### D3. Internal/local identifier — kompatibilitas

| Identifier | Bukti | Keputusan audit |
|---|---|---|
| `marketplace-loning-local` | [package.json:L16-L21](file:///C:/Users/Michael/Documents/LoningMarketplace/package.json#L16-L21), scripts local/E2E, reset guard | Local only. Rename terkoordinasi atau pertahankan; reset guard dan semua scripts harus atomik. |
| `loning_digital` | [compose.yaml:L5-L13](file:///C:/Users/Michael/Documents/LoningMarketplace/compose.yaml#L5-L13), env example, local scripts, docs | Database persisten. Keep by default; rename butuh dump/restore atau dual deployment. |
| `loning_postgres_data` | [compose.yaml:L10-L19](file:///C:/Users/Michael/Documents/LoningMarketplace/compose.yaml#L10-L19) | Persistent local volume. Jangan rename tanpa migrasi data. |
| `loning_session` | [env.ts:L12](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/config/env.ts#L12), tests, examples | Keep through first public release or accept forced logout/session rotation. |
| `media/{uuid}/...` | [media.ts:L29](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/routes/media.ts#L29) | Brand-neutral. Do not rename. |
| API `/api/*` | [app.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/app.ts) | Brand-neutral. Do not rename. |

### D4. Identity yang tidak ditemukan

Tidak ditemukan domain publik lama, social handle, email sender runtime, PWA manifest/name, favicon/logo file runtime, canonical URL, Open Graph, Twitter Card, sitemap, robots, structured data, analytics property, error tracking project, queue, webhook, token issuer/audience, atau telemetry namespace. Ini adalah **gap konfigurasi/keputusan**, bukan bukti bahwa layanan eksternal tidak ada di luar repository.

## E. Rename Matrix

| Existing Value | Proposed Value | Category | Scope | Compatibility Risk | Required Migration | Notes / Decision |
|---|---|---|---|---|---|---|
| Loning Digital | Loning Maju | Display name | UI/docs/log | Low | No | Rename now |
| LoningDigital split wordmark | Loning Maju | Short name | Navbar/auth/dashboard | Low | No | Rename now |
| Belum ada typed brand config | `brand = { name, shortName, description }` | Source of truth | Frontend shared module | Low | No | Add minimum config; no framework |
| LoningMarketplace | `loning-maju` | Repository slug | Git/hosting/local path | Medium | Remote/path update | Business decision; code imports unaffected |
| react-example | `loning-maju` | Root package | npm workspace metadata | Low | Lockfile refresh | Rename now |
| loning-digital-frontend | `loning-maju-frontend` | Package | npm workspace | Low | Lockfile refresh | Rename now |
| loning-digital-backend | `loning-maju-backend` | Package | npm workspace | Low | Lockfile refresh | Rename now |
| marketplace-loning-local | `loning-maju-local` | Docker project | Local scripts | Medium | Compose project transition | Optional; rename atomically |
| loning_digital | keep `loning_digital` initially | Database | Persistent infra | High | Dump/restore if renamed | Keep internal name |
| loning_postgres_data | keep initially | Docker volume | Persistent local data | High | Volume copy/restore | Keep internal name |
| loning | keep initially | DB user | Persistent credentials | High | Role/grant rotation | Do not rename for branding |
| media bucket | Not defined | Storage | Production | Unknown | Provider-specific | Requires business decision |
| `media/{uuid}` | unchanged | Object keys | Public URLs/storage | High if changed | Object copy + URL compatibility | Do not rename |
| no env prefix | Keep current variable names | Environment | Runtime | Medium | Alias only if renamed | Variables are descriptive, not branded |
| loning_session | keep, then optional `loning_maju_session` | Cookie | Browser sessions | High | Dual-read/rotation | Requires session policy decision |
| no public domain | TBD | Domain | SEO/deployment | High | DNS/TLS/redirect | Requires business decision |
| no sender identity | TBD | Email | External service | Unknown | Provider config | No email feature currently |
| no PWA identity | `Loning Maju` if PWA is added | PWA | Browser install | Low | New manifest | Requires product decision |
| generic title | `Loning Maju — Direktori UMKM Desa Loning` | SEO | Browser metadata | Low | No | Rename now |
| absent meta description/social | Approved Loning Maju copy/assets | SEO/social | Public web | Low | Cache reindex | Requires copy/asset approval |
| no analytics identity | TBD or none | Analytics | External | Unknown | Provider config | Requires decision only if analytics desired |
| no error tracking project | TBD or none | Monitoring | External | Unknown | Provider config | Requires decision only if monitoring desired |
| UI phrase “marketplace” | “direktori”, “etalase”, or approved copy | Product terminology | Dashboard/docs | Low | No | Avoid e-commerce implication |
| Desa Loning | unchanged | Geography | UI/data/docs | Low | No | Do not blind replace |

## F. Architecture Findings

### F-01 — High — Tidak ada source of truth brand

- **Bukti:** brand hardcoded pada navbar, login, footer, FAQ, docs, metadata, dan backend log; lihat D1.
- **Dampak:** rebrand tidak atomik; variasi lama mudah tertinggal.
- **Root cause:** identitas tumbuh sebagai copy lokal per komponen.
- **Rekomendasi minimum:** satu `frontend/src/config/brand.ts` untuk nilai identitas berulang dan satu konstanta backend untuk service/log name. Copy naratif tetap dekat komponennya.
- **Dependensi:** final display name, tagline, description.
- **Verifikasi:** exact/variant scan menghasilkan nol hit actionable untuk `Loning Digital`.

### F-02 — High — Baseline working tree belum bersih

- **Bukti:** `git status --short` menunjukkan 30+ modified/deleted/untracked file sebelum laporan dibuat, termasuk schema, routes, tests, migration, scripts.
- **Dampak:** rebrand bisa bercampur dengan perubahan fitur sebelumnya; rollback dan review sulit.
- **Root cause:** audit dilakukan di atas pekerjaan aktif yang belum dibaseline-kan.
- **Rekomendasi:** commit/snapshot perubahan aktif terlebih dahulu; rebrand pada branch terpisah.
- **Verifikasi:** status bersih pada baseline atau daftar file pre-existing terdokumentasi.

### F-03 — Medium — Repository layer memuat terlalu banyak domain

- **Bukti:** [repository.ts:L23-L67](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/repository.ts#L23-L67) menggabungkan public catalog, sessions, auth counters, UMKM, products, users, audit, media lifecycle dalam 18 KB dan baris sangat padat.
- **Dampak:** coupling tinggi dan review perubahan berisiko.
- **Rekomendasi:** jangan buat abstraction baru saat rebrand. Setelah baseline, pecah berdasarkan domain hanya bila file disentuh: catalog, auth, management, media.
- **Verifikasi:** test repository/routes tetap lulus; API contract tidak berubah.

### F-04 — Medium — Management form terlalu besar

- **Bukti:** [ManagementForms.tsx](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/pages/ManagementForms.tsx) 783 baris / 26.8 KB dan menangani UMKM, product, user, media upload, validation, lifecycle UI.
- **Dampak:** regresi tinggi untuk perubahan auth/dashboard branding.
- **Rekomendasi:** rebrand hanya wordmark/copy dahulu. Ekstraksi form dilakukan terpisah berdasarkan resource bila perubahan fungsional diperlukan.

### F-05 — Medium — Public page membuat request daftar ganda

- **Bukti:** [App.tsx:L40-L47](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/App.tsx#L40-L47) mengambil filtered products/UMKM dan seluruh products/UMKM secara paralel.
- **Dampak:** empat request awal; payload ganda; limit 100 membuat lookup dialog tidak lengkap pada skala lebih besar.
- **Rekomendasi:** gunakan response/detail query yang sudah ada saat item dipilih, atau satu normalized query. Jangan refactor bersamaan dengan rename copy kecuali di fase internal.

### F-06 — Medium — List API dibatasi 100 tetapi tidak punya pagination contract

- **Bukti:** route default/max 100 [products.ts:L5-L10](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/routes/products.ts#L5-L10); repository hard-cap [repository.ts:L26-L28](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/repository.ts#L26-L28); management juga max 100.
- **Dampak:** data ke-101 hilang tanpa indikasi UI.
- **Rekomendasi:** tambahkan cursor/offset dan metadata page ketika dataset mendekati 100. Bukan blocker rebrand saat data lokal 72 products/15 UMKM.

### F-07 — Medium — Category contract diduplikasi

- **Bukti:** [schema.ts:L4](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/schema.ts#L4), [repository.ts:L6](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/repository.ts#L6), [ManagementForms.tsx:L39-L45](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/pages/ManagementForms.tsx#L39-L45), frontend types/data.
- **Dampak:** drift bila kategori berubah.
- **Rekomendasi:** backend tetap authority; shared generated contract hanya bila kategori memang sering berubah. Untuk sekarang satu constant frontend dan satu backend cukup.

### F-08 — Low — Dense one-line modules menghambat review

- **Bukti:** [ManagementLists.tsx:L14-L23](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/pages/ManagementLists.tsx#L14-L23), public route files, repository.
- **Dampak:** line-level review dan conflict resolution buruk.
- **Rekomendasi:** format file yang disentuh saja; jangan mass-format dalam commit rebrand.

### F-09 — Low — Root clean script tidak portable ke Windows

- **Bukti:** [package.json:L27](file:///C:/Users/Michael/Documents/LoningMarketplace/package.json#L27) memakai `rm -rf` pada repository Windows.
- **Rekomendasi:** Node stdlib cleanup script atau `rimraf` hanya jika dependency sudah ada; bukan blocker rebrand.

### F-10 — Low — Tiga lockfile berpotensi drift

- **Bukti:** root, frontend, dan backend masing-masing memiliki `package-lock.json`, sedangkan root sudah menggunakan workspaces.
- **Dampak:** package identity lama muncul pada lebih dari satu lockfile dan install resolution dapat berbeda.
- **Rekomendasi:** pilih root lockfile sebagai authority; hapus nested lockfile hanya setelah reproducibility diverifikasi.

### F-11 — Low — Lint hanya TypeScript typecheck

- **Bukti:** root `lint` mendelegasikan workspace; frontend `lint` adalah `tsc --noEmit`. Tidak ditemukan ESLint/formatter config.
- **Dampak:** accessibility/style/dead-code lint tidak otomatis.
- **Rekomendasi:** jangan menambah tool untuk rebrand. Tambah hanya bila tim membutuhkan enforcement.

## G. Frontend Findings

1. **Metadata/SEO salah (Medium):** [index.html:L2-L6](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/index.html#L2-L6) memakai `lang="en"` dan title template. Tidak ada description, canonical, Open Graph, Twitter Card, favicon, manifest, robots, sitemap, atau structured data.
2. **Identitas tersebar (High, F-01):** navbar, login, footer, about, FAQ, dan dashboard memiliki string brand/marketplace langsung.
3. **Arsitektur route sehat:** public, auth, password guard, dashboard, admin role guard, 404, lazy chunks, dan route error boundary terdefinisi pada [main.tsx:L41-L68](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/main.tsx#L41-L68).
4. **State/auth contract sehat:** CSRF hanya dalam TanStack Query memory [auth.ts:L16-L28](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/lib/auth.ts#L16-L28); unauthorized response membersihkan private query cache [main.tsx:L31-L36](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/main.tsx#L31-L36).
5. **Error/loading states ada:** public sections dan dashboard menggunakan pending/error/empty components; lazy chunk failure recoverable [main.tsx:L20-L25](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/main.tsx#L20-L25).
6. **Accessibility positif:** semantic main, dialog roles, labels, focus classes, keyboard test dasar. Gambar produk memakai alt berbasis nama. Media mendukung alt text.
7. **Accessibility belum terverifikasi penuh (Low):** tidak ada automated axe audit, 200% zoom test, contrast report, atau long-copy viewport test.
8. **Responsive coverage ada namun terbatas:** Playwright menjalankan desktop dan mobile; tidak ada tablet, 320 px, atau zoom 200%.
9. **Tidak ada PWA identity:** tidak ada manifest atau service worker. Jangan menambah PWA hanya demi rename.
10. **Copy domain perlu konsistensi:** [DashboardHome.tsx:L12](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/pages/DashboardHome.tsx#L12) memakai “marketplace”, sementara contract produk menyatakan direktori/katalog, bukan e-commerce.

## H. Backend and API Findings

1. **Public API brand-neutral:** `/api/products`, `/api/umkms`, auth, management, health, media. Tidak perlu path migration untuk rebrand.
2. **Error envelope konsisten:** `{ error: { message, code } }`; success mayoritas `{ data }` [api.ts:L39-L56](file:///C:/Users/Michael/Documents/LoningMarketplace/frontend/src/lib/api.ts#L39-L56).
3. **Auth/security kuat untuk scope saat ini:** cookie HTTP-only, SameSite Lax, production secure flag, exact Origin + CSRF untuk mutation, Argon2id, hashed session tokens, account lockout, IP rate limit.
4. **Authorization berlapis:** route guards dan repository scoping untuk owner/admin. Public visibility mensyaratkan product dan parent UMKM sama-sama published [repository.ts:L28-L29](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/repository.ts#L28-L29).
5. **Media validation baik:** MIME allowlist, decoded image validation, declared/actual MIME match, limits, deterministic WebP variants, safe key validation [media.ts:L18-L34](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/routes/media.ts#L18-L34), [storage.ts:L15-L28](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/media/storage.ts#L15-L28).
6. **Backend brand hit:** startup log [index.ts:L12](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/index.ts#L12). Aman diganti.
7. **Cookie compatibility (High risk bila diubah):** nama cookie dikonfigurasi dan dites. Rename langsung memaksa logout; strategi ada di M.
8. **No OpenAPI/API docs (Informational):** contract terdistribusi di Zod, types, tests. Rebrand tidak memerlukan OpenAPI.
9. **Transaction boundary tersedia:** mutations dan audit umumnya dikelompokkan; storage object cleanup menangani kegagalan DB pada upload.
10. **Unsafe cast terisolasi (Low):** transaction repository memakai `tx as unknown as PostgresJsDatabase` [repository.ts:L69-L70](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/repository.ts#L69-L70). Ini kompatibilitas typing Drizzle, bukan bukti runtime bug.

## I. Database Findings

1. **Schema domain:** `users`, `sessions`, `audit_logs`, `umkms`, `products`, `media_assets`; enum category, user role, publication status [schema.ts](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/schema.ts).
2. **Constraints/indexes memadai:** UUID PK/FK, nonnegative price/order/login counter, digit-only phone, unique email/token/storage key, common status/category/owner indexes.
3. **Public relation integrity:** product cascade on UMKM delete; media/user references set null; publish status enforced in query.
4. **Schema drift (Medium):** migration [0003_workable_captain_cross.sql:L42-L43](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/drizzle/0003_workable_captain_cross.sql#L42-L43) memiliki `products_image_source_check` dan `umkms_image_source_check`, tetapi [schema.ts:L32-L51](file:///C:/Users/Michael/Documents/LoningMarketplace/backend/src/db/schema.ts#L32-L51) tidak mendeklarasikannya. Runtime DB terlindungi, tetapi schema generation bisa kehilangan contract pada migration berikutnya.
5. **Database name bukan schema object:** `loning_digital` berada di Compose/env/scripts, bukan nama tabel/enum. Rename tidak memberi nilai domain.
6. **Migration historis:** jangan edit/rename migration yang sudah diterapkan. Buat migration baru hanya untuk perubahan schema nyata.
7. **Stored geographic copy:** seed memuat `Desa Loning` dan nama usaha; ini data domain, bukan global brand replacement.
8. **Audit lokal aktual:** 15 UMKM, 72 products, 61 published, 6 draft, 5 archived, 8 dev users, 1 media asset; 0 orphan product, duplicate names, invalid status, negative price, stale E2E data, invalid media lifecycle. Status PASS.
9. **Data produksi:** tidak diakses dan tidak diklaim. Hasil hanya database lokal dari environment aktif.

## J. Infrastructure and Deployment Findings

1. Compose hanya PostgreSQL lokal; tidak ada container frontend/backend, Dockerfile, network khusus, reverse proxy, TLS, CDN, atau production topology.
2. `marketplace-loning-local`, `loning_digital`, DB role, dan named volume saling terikat pada Compose, wait script, E2E orchestration, reset guard, docs, dan env example. Rename harus atomik.
3. Filesystem storage default lokal dan S3-compatible production driver tersedia. Bucket/endpoint production tidak ditetapkan di repository.
4. `.env*` di-ignore kecuali examples [`.gitignore:L7-L12`](file:///C:/Users/Michael/Documents/LoningMarketplace/.gitignore#L7-L12). Laporan tidak menyalin secret runtime.
5. `supabase/snippets` kosong; tidak ada bukti Supabase aktif.
6. Tidak ditemukan GitHub Actions atau CI provider config. Baseline checks belum otomatis pada pull request.
7. Tidak ditemukan domain, DNS, redirect, hosting, monitoring, logging sink, analytics, atau error tracking production.

## K. Test Coverage and Verification Results

### Inventaris

| Jenis | Coverage yang ditemukan |
|---|---|
| Frontend unit | API retry/error/envelope tests |
| Component/hook | management form media behavior; session/retry state |
| Backend unit/API | reset guard, rate limit, media serving/upload, routes, auth/permissions/lifecycle |
| Integration smoke | script lokal tersedia; menggunakan DB |
| Database verification | migration/seed/audit/determinism scripts tersedia |
| E2E/browser | public shell, auth, role access, product lifecycle, media, desktop/mobile, browser diagnostics |
| Visual regression | Tidak ditemukan snapshot screenshot baseline |
| Automated accessibility | Tidak ditemukan axe/pa11y; keyboard assertion dasar ada |
| Brand/SEO regression | Tidak ditemukan title/meta/wordmark assertion |

### Command aktual

| Command | Exit | Passed / failed / skipped | Durasi | Catatan |
|---|---:|---|---:|---|
| `npm run lint` | 0 | pass | 6.89s | Frontend TypeScript noEmit; bukan ESLint |
| `npm run typecheck` | 0 | pass | 11.24s | Frontend + backend |
| `npm test` | 0 | 91 pass, 0 fail, 0 skipped | 9.82s | Frontend 37; backend 54 |
| `npm run build` | 0 | frontend + backend pass | 12.23s | Vite main JS 492.66 kB / gzip 151.84 kB; tidak ada threshold warning |
| `npm run db:audit --workspace=backend` | 0 | PASS | 1.90s | Read-only audit lokal; semua integrity counters 0 |
| `npm run test:integration` | tidak dijalankan | skipped by audit | — | Script menggunakan/mengubah database lokal; tidak diperlukan setelah unit/API + read-only audit untuk tahap non-destructive |
| `npm run test:e2e` / local runner | tidak dijalankan | skipped by audit | — | Runner lokal mengorkestrasi/reset fixture database dan server; audit melarang write/reset. Existing dev server juga aktif saat audit. |
| install verification | tidak dijalankan | skipped | — | Dependencies sudah terpasang dan build/tests berhasil; install dapat memodifikasi lockfile/node_modules. |

Tidak ditemukan `.skip`, `.only`, `todo`, expected failure, atau `fixme` pada file test yang discan. Satu assertion mengandung “Loning” sebagai **nama fixture usaha** (`Warung Nasi Khas Loning`), bukan display brand [products.spec.ts:L247](file:///C:/Users/Michael/Documents/LoningMarketplace/e2e/products.spec.ts#L247).

## L. Documentation Findings

1. README, HANDOFF, dan DESIGN konsisten tentang domain utama: direktori/katalog UMKM dan WhatsApp langsung; bukan commerce engine.
2. Ketiganya masih memakai `Loning Digital` dan harus direbrand.
3. README/HANDOFF mendokumentasikan identifier persisten lama. Update docs harus menjelaskan mana yang sengaja dipertahankan.
4. `metadata.json` menyimpan nama lama tetapi tidak terhubung ke `<head>` frontend; metadata runtime tetap generik.
5. Root package script `clean` tidak portable ke shell Windows.
6. Tidak ditemukan contribution guide, changelog, ADR, release guide, deployment production guide, API spec, atau troubleshooting terpisah. Jangan membuat semuanya untuk rebrand; update tiga dokumen aktif saja.
7. Tidak ditemukan screenshot/logo lama di source assets runtime. Dua screenshot percakapan bukan bagian repository.

## M. Compatibility Risks

| Area | Risiko | Strategi minimum |
|---|---|---|
| Public domain lama | Unknown sampai domain dipilih | 301 redirect host/path lama ke baru; canonical baru; pertahankan minimal satu siklus indexing |
| API paths | Rendah; brand-neutral | Pertahankan `/api/*`; tidak perlu alias |
| Browser routes/bookmarks | Rendah; brand-neutral | Pertahankan `/`, `/login`, `/dashboard/*` |
| Cookie/session | Tinggi bila rename | Pilihan aman: pertahankan `loning_session`. Bila wajib rename, dual-read cookie lama+baru, issue baru saat request valid, clear lama setelah grace period; atau umumkan forced logout |
| Database name/user/volume | Tinggi | Keep internal identifiers. Bila wajib rename: backup, create target, restore, verify counts/hash, cutover env, retain rollback copy |
| Storage bucket/object keys | Tinggi | Jangan rename keys `media/{uuid}`. Domain/CDN baru dapat menunjuk bucket sama; redirect public base URL lama |
| Existing image URLs | Tinggi | Preserve old host or CDN redirect; jangan rewrite DB tanpa reachability check dan rollback mapping |
| Package names | Rendah, private workspaces | Rename manifests dan root lockfile dalam satu commit |
| Docker local project | Medium | Rename all scripts + reset guard + docs atomically; old volume tidak otomatis pindah |
| Env variables | Rendah; tidak branded | Keep names. Untuk renamed variable eksternal, read new then old selama deprecation period |
| SEO cache | Medium | New title/description/canonical/social; submit sitemap hanya bila domain final; monitor index |
| External integrations | Unknown | Tidak ada di repo; owner harus mengonfirmasi DNS, hosting, S3/CDN, analytics, monitoring sebelum cutover |

## N. Recommended Target Architecture

Target minimum, tanpa overengineering:

```text
frontend/src/
  config/brand.ts          # display identity yang benar-benar berulang
  components/              # struktur sekarang dipertahankan
  pages/                   # split ManagementForms hanya pada refactor terpisah
  lib/api.ts               # tetap satu API client

backend/src/
  config/env.ts            # tetap authority environment
  config/service.ts        # optional constant service/display log name
  db/schema.ts             # selaraskan constraint dengan migrations
  db/repository.ts         # tetap dulu; split by domain hanya saat ada kebutuhan
  routes/                  # path/contract tetap

docs/
  loning-maju-full-scan-report.md
```

Prinsip target:

- Display brand terpusat; copy naratif tidak dipaksa masuk generic CMS/config.
- API, table, enum, object key, route, dan env yang brand-neutral dipertahankan.
- Identifier persisten dipisahkan dari identitas marketing.
- Tidak menambah service layer, shared package, CMS, PWA, analytics, atau design system baru tanpa kebutuhan nyata.
- Rebrand commit dipisahkan dari format massal dan architecture refactor.

## O. Implementation Plan

### Phase 0 — Baseline and Safety

- **Tujuan:** buat rollback point yang dapat dipercaya.
- **File:** tidak ada source change; branch/commit dan laporan baseline.
- **Dependensi:** pemilik memilih cara menangani working tree aktif.
- **Risiko:** mencampur perubahan lama dengan rebrand.
- **Verifikasi:** `git status --short`; `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; DB audit.
- **Acceptance:** baseline commit/tag tercatat; hasil test sama atau lebih baik.
- **Rollback:** kembali ke baseline commit; jangan gunakan destructive DB reset.

### Phase 1 — Centralize Brand Configuration

- **Tujuan:** satu authority untuk display name/short description yang berulang.
- **Kemungkinan file:** new `frontend/src/config/brand.ts`; Navbar, Footer, LoginPage, dashboard shell; optional backend service-name constant.
- **Dependensi:** approval tagline/description/tone.
- **Risiko:** abstraction berlebihan.
- **Verifikasi:** typecheck/unit tests; variant brand scan.
- **Acceptance:** tidak ada hardcoded split wordmark lama; copy naratif tetap jelas.
- **Rollback:** revert phase commit; tidak ada data migration.

### Phase 2 — Public UI Rebranding

- **Tujuan:** ubah semua identitas publik menjadi Loning Maju dan benahi metadata minimum.
- **Kemungkinan file:** `frontend/index.html`, public/home/layout/shared components, auth/dashboard pages, `data.ts`, `metadata.json`, backend startup log.
- **Dependensi:** domain/canonical dan brand asset bila disediakan.
- **Risiko:** copy geografis terubah salah; SEO cache.
- **Verifikasi:** unit + build; Playwright desktop/mobile; manual 320 px/200% zoom; title/meta assertions; broad old-brand scan.
- **Acceptance:** UI/tab title/meta konsisten; `Desa Loning` geografis tetap benar; WhatsApp flow tidak berubah.
- **Rollback:** revert UI commit; restore old metadata; no DB rollback.

### Phase 3 — Internal Refactor

- **Tujuan:** perbaiki debt yang memberi manfaat langsung tanpa mengubah contract.
- **Kemungkinan file:** `schema.ts`, `repository.ts`, `ManagementForms.tsx`, `ManagementLists.tsx`, App query flow, package locks.
- **Dependensi:** Phase 2 stabil; scope dipilih terpisah.
- **Risiko:** lifecycle/auth/media regression.
- **Verifikasi:** 91+ tests, integration disposable DB, E2E local, migration diff review, DB audit.
- **Acceptance:** schema constraint sinkron; no API diff; request duplikasi/pagination ditangani bila masuk scope.
- **Rollback:** commit per sub-area; migration baru hanya additive/reversible.

### Phase 4 — Infrastructure and Compatibility

- **Tujuan:** cutover domain/hosting dan optional machine identifier.
- **Kemungkinan file:** Compose, root scripts, reset guard/tests, env examples, hosting config baru jika provider dipilih.
- **Dependensi:** domain, hosting, storage, cookie policy.
- **Risiko:** data volume hilang, forced logout, media URL putus.
- **Verifikasi:** backup restore rehearsal; old/new URL check; session transition test; E2E on staging.
- **Acceptance:** redirect/alias aktif; data counts/hash sama; image URLs valid; rollback endpoint tersedia.
- **Rollback:** switch env/DNS ke deployment lama; retain DB/bucket/volume old identifiers.

### Phase 5 — Documentation and Test Updates

- **Tujuan:** contract dan runbook sesuai implementasi.
- **Kemungkinan file:** README, HANDOFF, DESIGN, report under `docs/`, public/E2E metadata tests.
- **Dependensi:** keputusan identifier final.
- **Risiko:** docs mengklaim deployment yang belum ada.
- **Verifikasi:** jalankan semua command dokumentasi; link/path scan; old-brand scan.
- **Acceptance:** docs membedakan brand publik dan identifier legacy yang sengaja dipertahankan.
- **Rollback:** revert docs/test commit.

### Phase 6 — Final Verification

- **Tujuan:** bukti release lengkap.
- **Command:** `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; integration pada DB disposable; `npm run test:e2e:local`; `npm run db:audit --workspace=backend`; broad scan.
- **Manual:** desktop/mobile/320 px/200% zoom, keyboard, screen reader labels, WhatsApp URL/message, admin/owner permission, publish/archive/media lifecycle, old-domain redirects.
- **Acceptance:** zero actionable old display brand; all checks pass; no integrity regression; rollback rehearsed.
- **Rollback:** stop release/cutover; deploy baseline artifact; preserve data migration backups.

## P. Ordered File Change Plan

### Phase 0

1. Git branch/commit baseline only; no source file.

### Phase 1

1. `[NEW] frontend/src/config/brand.ts`
2. `frontend/src/components/layout/Navbar.tsx`
3. `frontend/src/components/layout/Footer.tsx`
4. `frontend/src/pages/LoginPage.tsx`
5. `frontend/src/components/dashboard/DashboardShell.tsx`
6. Optional backend service-name constant + `backend/src/index.ts`

### Phase 2

1. `frontend/index.html`
2. `frontend/src/data.ts`
3. `frontend/src/components/home/*.tsx`
4. `frontend/src/components/shared/WhatsAppInquiryDialog.tsx`
5. `frontend/src/pages/DashboardHome.tsx`
6. `metadata.json`
7. root/frontend/backend `package.json`
8. authoritative root `package-lock.json`

### Phase 3 — separate pull requests

1. `backend/src/db/schema.ts` constraint alignment
2. `backend/src/db/repository.ts` only if split approved
3. `frontend/src/pages/ManagementForms.tsx` only if split approved
4. `frontend/src/pages/ManagementLists.tsx` formatting/component split only if needed
5. `frontend/src/App.tsx` query behavior
6. package-lock cleanup only after install reproducibility check

### Phase 4

1. `compose.yaml`
2. `package.json` local DB scripts
3. `scripts/wait-for-postgres.mjs`
4. `scripts/run-e2e-local.mjs`
5. `scripts/verify-e2e.mjs`
6. `scripts/verify-seed-determinism.mjs`
7. `backend/src/scripts/db-reset-guard.ts` and tests
8. environment examples
9. hosting/redirect config after provider decision

### Phase 5

1. `README.md`
2. `HANDOFF.md`
3. `DESIGN.md`
4. `[NEW] docs/loning-maju-full-scan-report.md` after explicit implementation approval
5. `e2e/public.spec.ts` title/metadata/wordmark assertions
6. Relevant unit/component tests

## Q. Open Decisions

1. **Repository slug:** rename remote/folder ke `loning-maju` atau pertahankan path lama?
2. **Public domain:** hostname final, old domain, redirect ownership, dan canonical URL.
3. **Approved identity:** tagline, short description, tone, logo/icon/favicon/social preview assets.
4. **Geographic wording:** apakah “Desa Loning” tetap qualifier utama di seluruh public copy? Rekomendasi audit: ya, sebagai lokasi.
5. **Cookie policy:** keep `loning_session` atau rename dengan dual-read/forced logout?
6. **Machine identifiers:** apakah local Docker project/package names perlu direbrand? Rekomendasi: package names ya; DB/user/volume tidak.
7. **Production platform:** hosting frontend/API, PostgreSQL provider, S3/CDN bucket, TLS, backup, and rollback owner.
8. **Observability:** analytics/error tracking diperlukan atau sengaja tidak digunakan?
9. **PWA:** apakah installable PWA memang dibutuhkan? Rekomendasi: jangan ditambah hanya untuk rebrand.
10. **Refactor scope:** rebrand-only dahulu atau include schema alignment/query duplication/pagination sebagai pull request terpisah? Rekomendasi: terpisah.

## R. Final Verdict

# READY WITH BLOCKERS

Codebase aktif dapat dibangun, diuji, dan diaudit; database lokal konsisten; API paths dan domain model sudah brand-neutral. Rebranding public-facing dapat dimulai dengan risiko rendah setelah baseline working tree dan identity copy disetujui.

Blocker bukan kegagalan runtime. Blocker adalah keputusan/cutover yang tidak boleh diasumsikan: working-tree baseline, domain dan asset identity, cookie/session policy, serta keputusan untuk mempertahankan identifier database/storage. Jangan melakukan global search-and-replace terhadap semua token `Loning`.

### Acceptance criteria audit

- [x] Struktur repository dan hidden/generated area dipetakan.
- [x] Semua workspace/service aktif diperiksa.
- [x] Brand lama dicari dengan exact, case-insensitive, separator, split JSX, slug, database, cookie, metadata, SQL, docs, tests, dan config patterns.
- [x] Public-facing, geografis, internal, local temporary, dan persistent identifiers dibedakan.
- [x] Compatibility dan migration strategy didokumentasikan.
- [x] Frontend, backend/API, database, infrastructure, tests, dan docs diperiksa.
- [x] Safe validation commands dijalankan; unsafe/write-capable suites dilaporkan sebagai skipped.
- [x] Error/warning/failure/skipped state dilaporkan tanpa disembunyikan.
- [x] Rename matrix dibuat.
- [x] Implementation plan bertahap, verification, acceptance, dan rollback dibuat.
- [x] Audit tidak mengubah source code, dependency, schema, runtime config, atau data.
- [x] Klaim utama memiliki path/line evidence atau dinyatakan sebagai “tidak ditemukan”.
