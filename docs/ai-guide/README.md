# 📚 Dokumentasi AI — Loning Maju

Selamat datang di **dokumentasi teknis Loning Maju**, disusun khusus agar **AI agent dan developer manusia** dapat memahami seluruh proyek dengan cepat dan akurat.

> **Cara pakai:** Baca berurutan (01 → 12). Untuk jawaban cepat atas satu topik, langsung buka dokumen terkait dari daftar isi.

---

## 🗺️ Peta Dokumen

| # | Dokumen | Isi | Prioritas |
|---|---|---|---|
| 01 | [Project Overview](01-project-overview.md) | Konteks bisnis, fitur, batasan | ⭐⭐⭐ |
| 02 | [Architecture](02-architecture.md) | Arsitektur monorepo, alur request, diagram | ⭐⭐⭐ |
| 03 | [Project Structure](03-project-structure.md) | Peta lengkap direktori & file | ⭐⭐⭐ |
| 04 | [Database](04-database.md) | Skema tabel, relasi, migrasi, ER diagram | ⭐⭐⭐ |
| 05 | [API Reference](05-api-reference.md) | Semua endpoint + response format | ⭐⭐⭐ |
| 06 | [Auth & Security](06-auth-and-security.md) | Login, session, CSRF, RBAC, rate-limit | ⭐⭐⭐ |
| 07 | [Frontend Guide](07-frontend-guide.md) | Route, komponen, hooks, state, SEO | ⭐⭐ |
| 08 | [Backend Guide](08-backend-guide.md) | App factory, routes, repository, policy | ⭐⭐⭐ |
| 09 | [Media Pipeline](09-media-pipeline.md) | Upload, proses WebP, S3/FS, serving | ⭐⭐ |
| 10 | [Deployment](10-deployment.md) | Render, Vercel, env vars, checklist | ⭐⭐ |
| 11 | [Testing](11-testing.md) | Vitest, Playwright, harness isolated | ⭐⭐ |
| 12 | [Commands Cheatsheet](12-commands-cheatsheet.md) | Semua perintah npm | ⭐⭐⭐ |
| 13 | [Safety & Data Protection](13-safety-and-data-protection.md) | Guard seed/reset/bootstrap/disposable, repository safety | ⭐⭐⭐ |
| 14 | [Migrations & Seed](14-migrations-and-seed.md) | Pipeline migrasi, preflight, determinism, ID namespace | ⭐⭐⭐ |
| 15 | [Audit, Events & Analytics](15-audit-events-and-analytics.md) | Audit log, public events, inquiry analytics | ⭐⭐ |
| 16 | [Testing Infrastructure](16-testing-infrastructure.md) | Harness isolated, safety self-test, pre-cloud | ⭐⭐ |
| 17 | [Domain Logic & Utilities](17-domain-logic-and-utilities.md) | Phone, slug, koordinat, jam operasional, CSV | ⭐⭐ |

## 📐 Diagram Mermaid Mandiri

File `.mmd` yang bisa dirender di editor/Viewer Mermaid (GitHub, VS Code plugin, mermaid.live):

| File | Isi |
|---|---|
| [diagrams/architecture.mmd](diagrams/architecture.mmd) | Arsitektur sistem + deployment |
| [diagrams/er.mmd](diagrams/er.mmd) | Entity-Relationship database |
| [diagrams/login-sequence.mmd](diagrams/login-sequence.mmd) | Alur login & session |
| [diagrams/mutation-sequence.mmd](diagrams/mutation-sequence.mmd) | Alur mutasi aman (CSRF) |
| [diagrams/media-pipeline.mmd](diagrams/media-pipeline.mmd) | Pipeline media upload |
| [diagrams/publication-state.mmd](diagrams/publication-state.mmd) | State machine publikasi |
| [diagrams/rbac.mmd](diagrams/rbac.mmd) | Role & capability matrix |
| [diagrams/routes.mmd](diagrams/routes.mmd) | Route tree frontend |
| [diagrams/safety-guards.mmd](diagrams/safety-guards.mmd) | Guard seed/reset/bootstrap/disposable |
| [diagrams/migration-pipeline.mmd](diagrams/migration-pipeline.mmd) | Pipeline migrasi + integritas |
| [diagrams/analytics-flow.mmd](diagrams/analytics-flow.mmd) | Alur public events & analitik |

## 🔑 Fakta Cepat (ringkasan 30 detik)

- **Arsitektur:** npm workspaces monorepo — `frontend/` (React SPA) + `backend/` (Fastify API).
- **Database:** PostgreSQL 16, dikelola Drizzle ORM, 17 migrasi (`backend/drizzle/0000–0016`), semua idempotent.
- **Tabel:** `users`, `sessions`, `audit_logs`, `media_assets`, `umkms`, `products`, `product_images`, `public_events` (8 tabel).
- **Auth:** Argon2id + token session acak (hash SHA-256 di DB, token mentah di cookie HTTP-only `loning_session`), CSRF token di header `X-CSRF-Token`.
- **4 role:** `superadmin` > `admin` > `perangkat_desa` > `pelaku_umkm`; capability matrix di `backend/src/auth/policy.ts`.
- **State publikasi:** `draft` → `published` → `archived` (restore kembali ke draft).
- **Media:** upload → Sharp (auto-orient, resize, WebP card 1280px + thumb 400px) → S3 (R2) / filesystem → serve via `/media/*`.
- **Public API:** hanya menampilkan record `published`; produk memerlukan parent UMKM `published` (atau produk mandiri/standalone).
- **Produksi:** frontend di Vercel, backend di Render, DB di Aiven, media di Cloudflare R2.

## ⚠️ Aturan Emas (wajib diingat agent)

1. Baca `backend/src/db/schema.ts` + `backend/src/db/repository.ts` sebelum menyentuh data.
2. Endpoint terproteksi WAJIB pakai `guards.secured` + cek capability.
3. Respons JSON selalu `{ data }` / `{ error: { message, code } }`.
4. Public hanya `published`; harga produk boleh `null`.
5. Nomor telepon normalisasi ke `628…`.
6. Jangan jalankan seed ke DB production.
7. Jangan commit `.env`/secret.
