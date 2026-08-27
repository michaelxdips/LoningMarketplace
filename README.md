<div align="center">

# 🌿 Loning Maju

**Direktori Digital UMKM Desa Loning**

Temukan produk lokal dan terhubung langsung dengan pelaku usaha
melalui WhatsApp — tanpa keranjang, checkout, atau pembayaran online.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20%20%3C27-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue)](#license)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Arsitektur](#-arsitektur)
- [Design System](#-design-system)
- [Tech Stack](#-tech-stack)
- [Fitur](#-fitur)
- [Prasyarat](#-prasyarat)
- [Quick Start](#-quick-start)
- [Instalasi Lengkap](#-instalasi-lengkap)
- [Penggunaan](#-penggunaan)
- [Struktur Proyek](#-struktur-proyek)
- [Database](#-database)
- [API Routes](#-api-routes)
- [Autentikasi & Keamanan](#-autentikasi--keamanan)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Batasan](#-batasan)
- [License](#license)

---

## 🌾 Tentang Proyek

**Loning Maju** adalah direktori publik dan etalase produk untuk UMKM di **Desa Loning, Petarukan, Pemalang**. Pengunjung dapat menelusuri usaha lokal dan menghubungi penjual langsung melalui WhatsApp.

> [!IMPORTANT]
> Ini **bukan** sistem e-commerce. Tidak ada keranjang belanja, checkout, payment gateway, pesanan, invoice, pengiriman, rating, atau ulasan. Seluruh transaksi terjadi secara offline melalui WhatsApp.

### Mengapa Loning Maju?

| Masalah | Solusi |
|---|---|
| UMKM desa sulit ditemukan secara digital | Direktori publik dengan pencarian dan filter kategori |
| Penjual tidak punya toko online | Etalase produk dengan foto dan harga |
| Transaksi online rumit untuk pedagang kecil | Kontak langsung via WhatsApp — tanpa registrasi |
| Tidak ada peta lokasi usaha | Peta interaktif seluruh UMKM |

---

## 🏗 Arsitektur

Proyek ini menggunakan arsitektur **npm workspaces monorepo** dengan empat workspace: `frontend/`, `backend/`, `shared/` (`@loning/shared`), dan `v2/` (`@loning/v2`).

```mermaid
graph TB
    subgraph Client["🌐 Browser"]
        SPA["React 19 SPA (V1, V2 Desktop, V2 Mobile)"]
    end

    subgraph Frontend["📦 frontend/"]
        Vite["Vite Dev Server :3000"]
        TQ["TanStack Query"]
        RR["React Router"]
        TW["Tailwind CSS v4"]
    end

    subgraph V2Workspace["📦 v2/ & shared/"]
        SharedPkg["@loning/shared (API, Auth, SEO, Hooks)"]
        V2Desktop["@loning/v2 (Desktop & Mobile Codebase)"]
    end

    subgraph Backend["📦 backend/"]
        Fastify["Fastify :3001"]
        Drizzle["Drizzle ORM"]
        Auth["Argon2id + Sessions"]
        Media["Media Pipeline"]
    end

    subgraph Storage["💾 Storage"]
        PG["PostgreSQL 16"]
        S3["S3 / Local FS"]
    end

    SPA --> Vite
    Vite --> TQ
    TQ --> SharedPkg
    V2Desktop --> SharedPkg
    SharedPkg -->|"REST /api/*"| Fastify
    Fastify --> Drizzle
    Drizzle --> PG
    Fastify --> Auth
    Media --> S3
    Fastify --> Media
```

### Compatibility Identifiers

Brand publik adalah **Loning Maju**. Identifier internal seperti `marketplace-loning-local`, `loning_digital`, `loning`, `loning_postgres_data`, `loning_session`, dan `media/{uuid}` sengaja dipertahankan untuk kompatibilitas Docker, database, autentikasi, dan media. Identifier tersebut bukan nama brand publik.

---

## 🎨 Design System

Panduan visual lengkap (token warna, tipografi, pola aksesibilitas, dan struktur UX) ada di [`DESIGN.md`](DESIGN.md). Inti sistemnya:

- **Palet organik**: Forest `#123E25` (identitas utama), Terracotta `#C85C32` (aksen), Cream `#FCFAF7` (canvas), Charcoal `#1C2421` (teks), Warm Gray `#5F6E65` (teks sekunder).
- **Tipografi**: Fraunces (serif display untuk heading & angka) + Inter (sans untuk body). Dimuat via Google Fonts.
- **Arah visual**: editorial "heritage" — heading serif, hairline eyebrow terracotta, angka serif light untuk statistik, tanpa kartu berbayang generik di permukaan dashboard. Token didefinisikan di `frontend/src/index.css` (`@theme`).
- **Konvensi UI**: konten bahasa Indonesia, kode/identifier bahasa Inggris.

> [!TIP]
> Saat mengubah tampilan, jaga konsistensi token (bukan hardcode hex). Lihat `frontend/src/config/brand.ts` untuk nama brand, logo, dan metadata.

---

## 🛠 Tech Stack

<details>
<summary><strong>Frontend</strong></summary>

| Library | Versi | Fungsi |
|---|---|---|
| React | 19 | UI library |
| Vite | 6 | Build tool & dev server |
| TypeScript | 5.8 (strict) | Type safety |
| Tailwind CSS | 4 | Utility-first styling |
| TanStack Query | 5 | Server state management |
| React Router | 7 | Client-side routing |
| Motion | 12 | Animasi & transisi |
| Lucide React | 1.25 | Ikon SVG |

</details>

<details>
<summary><strong>Backend</strong></summary>

| Library | Versi | Fungsi |
|---|---|---|
| Fastify | 5 | HTTP server |
| Drizzle ORM | 0.45 | Database ORM & migrations |
| PostgreSQL driver (`postgres`) | 3.4 | Database connection |
| Argon2 | 0.45 | Password hashing |
| Sharp | 0.35 | Image processing (WebP) |
| Zod | 4 | Request validation |
| @aws-sdk/client-s3 | 3 | S3-compatible media storage |

**Plugins Fastify:** `@fastify/cors`, `@fastify/cookie`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/multipart`, `@fastify/static`, `@fastify/compress`

</details>

<details>
<summary><strong>Testing</strong></summary>

| Tool | Fungsi |
|---|---|
| Vitest | Unit & component tests |
| Testing Library (React) | Component rendering |
| Playwright | E2E browser tests (Desktop + Mobile) |
| jsdom | DOM environment untuk unit tests |

</details>

<details>
<summary><strong>Infrastructure</strong></summary>

| Tool | Fungsi |
|---|---|
| Docker Compose | Local PostgreSQL |
| npm workspaces | Monorepo management |
| Drizzle Kit | Migration generation |
| Concurrently | Parallel dev servers |
| TSX | TypeScript execution (scripts & dev) |

</details>

---

## ✨ Fitur

### Publik

- 🔍 **Pencarian & Filter** — Cari produk/UMKM dengan filter 9 kategori: Kuliner, Sembako & Kebutuhan Harian, Fashion & Konveksi, Bahan Bangunan & Material, Jasa & Otomotif, Pertanian, Peternakan & Perikanan, Ritel & Perabot, Kerajinan & Olahan Kreatif, Lainnya
- 📱 **WhatsApp Inquiry** — Dialog kontak langsung ke penjual via WhatsApp dengan template topik pertanyaan instan (Ketersediaan, Stok/Preorder, Harga/Ongkir, Pesanan Khusus)
- 🛍️ **Draft Catatan Pesanan WhatsApp (V2)** — Simpan beberapa produk dari toko yang sama dan kirim format daftar pesanan terstruktur via WhatsApp
- 🕒 **Status Buka/Tutup Real-Time (V2)** — Indikator live status operasional toko (`Buka Sekarang` / `Tutup`) dan filter toko buka pada direktori
- 📍 **Geolokasi & Jarak Terdekat (V2)** — Formula Haversine otomatis mengurutkan UMKM terdekat berdasarkan posisi GPS pengunjung
- 🖨️ **QR Code Generator Etalase (V2)** — Generator kode QR SVG profil UMKM siap cetak untuk ditempel di warung fisik
- 🎨 **Generator Story WhatsApp (V2)** — Buat dan unduh kartu promosi format 9:16 PNG beresolusi tinggi untuk Status WA
- 💖 **Koleksi Tersimpan / Favorit (V2)** — Simpan produk & UMKM lokal tanpa login (`localStorage` + `useSyncExternalStore`) di `/v2/tersimpan` dan `/m/tersimpan`
- 🖼️ **Lightbox Galeri Produk (V2)** — Penampil foto resolusi penuh dengan navigasi keyboard (`Escape`, panah)
- 📶 **PWA & Offline Resilience (V2)** — Service Worker offline cache, banner indikator status offline otomatis, dan instalasi *Add to Home Screen*
- 🗺️ **Peta Interaktif UMKM** — Visualisasi lokasi seluruh UMKM di `/peta-umkm` dengan Google Maps / OpenStreetMap embed
- 📄 **Detail Produk & UMKM** — Halaman detail dengan slug canonical (`/produk/:slug`, `/umkm/:slug`)
- 🏷️ **Produk Terkait** — Rekomendasi produk dari UMKM yang sama
- 📜 **Riwayat Versi** — Halaman riwayat pembaruan repository live dari GitHub API di `/version-history`
- ❓ **FAQ** — Informasi umum di `/faq`
- 🏘️ **Tentang Desa** — Profil Desa Loning di `/tentang-desa`
- 📊 **Inquiry Analytics** — Pelacakan non-blocking untuk view, inquiry, dan WhatsApp open

### Dashboard Admin

- 👥 **Manajemen User** — CRUD user dengan 4 role: `superadmin`, `admin`, `perangkat_desa`, `pelaku_umkm`
- 🏪 **Manajemen UMKM** — Create, edit, foto, lokasi, status publikasi
- 📦 **Manajemen Produk** — Create, edit, foto, harga, ketersediaan, unit
- 📍 **Editor Lokasi** — Pin lokasi UMKM di peta
- 📋 **Audit Log** — Riwayat aktivitas admin
- 📈 **Analitik Inquiry** — Statistik kontak WhatsApp
- 🔄 **Workflow Publikasi** — Draft → Published → Archived

### Teknis

- 🖼️ **Media Pipeline** — Upload, resize, WebP conversion, serta Smart Hybrid Image Framing (potret & lanskap)
- 🔒 **Session-based Auth** — HTTP-only cookie + CSRF token
- 🚦 **Rate Limiting** — Login dan API rate limits
- ♿ **Aksesibilitas** — Focus trapping, keyboard navigation, screen reader labels
- 🛡️ **Perlindungan Form** — Konfirmasi perubahan belum disimpan pada form produk, UMKM, pengguna, dan lokasi
- 🧯 **Pemulihan Halaman** — Error boundary per rute dengan aksi coba lagi
- 🕐 **Jam Operasional** — Jam buka & tutup terstruktur (format HH:MM) serta teks jam operasional lengkap
- ✅ **Kelengkapan Profil** — Persentase dan daftar bagian UMKM yang belum lengkap
- 📥 **Ekspor CSV** — Ekspor UMKM/produk untuk role dengan akses global; UTF-8 dan aman dari formula injection
- 📖 **Panduan Admin** — Bantuan singkat di `/dashboard/bantuan`
- 📱 **Responsive** — Desktop, tablet, mobile, native zoom 200%
- 🔗 **SEO** — Route metadata, canonical links, JSON-LD (SPA-side)
- ⚡ **Lazy Loading** — Route-level code splitting

---

## 📌 Prasyarat

| Requirement | Keterangan |
|---|---|
| **Node.js** | `>=20 <27` (diverifikasi dengan `v26.7.0`) |
| **npm** | Bundled dengan Node.js |
| **Docker Desktop** | Untuk PostgreSQL lokal via Docker Compose |

> [!NOTE]
> Native dependencies `argon2` dan `sharp` membutuhkan build tools yang sesuai OS. Pada Windows, pastikan VS Build Tools terinstal.

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/michaelxdips/LoningMarketplace.git
cd LoningMarketplace

# 2. Install dependencies
npm install

# 3. Salin environment config
cp backend/.env.example backend/.env

# 4. Start database + migrate + seed + dev servers
npm run dev:local
```

Setelah berhasil:

| URL | Keterangan |
|---|---|
| http://localhost:3000 | Frontend (homepage publik) |
| http://localhost:3001/api/health | Backend liveness check |
| http://localhost:3001/api/ready | Backend readiness check |
| http://localhost:3000/login | Halaman login dashboard |

> [!TIP]
> `npm run dev:local` otomatis: start PostgreSQL via Docker → tunggu ready → migrasi → seed → jalankan frontend + backend.

---

## 📥 Instalasi Lengkap

<details>
<summary><strong>Windows (PowerShell)</strong></summary>

```powershell
# Clone
git clone https://github.com/michaelxdips/LoningMarketplace.git
cd LoningMarketplace

# Install semua dependencies
npm install

# Setup environment
Copy-Item backend\.env.example backend\.env

# Start database + full setup
npm run db:local:setup

# Jalankan dev servers
npm run dev:all
```

</details>

<details>
<summary><strong>macOS / Linux</strong></summary>

```bash
# Clone
git clone https://github.com/michaelxdips/LoningMarketplace.git
cd LoningMarketplace

# Install semua dependencies
npm install

# Setup environment
cp backend/.env.example backend/.env

# Start database + full setup
npm run db:local:setup

# Jalankan dev servers
npm run dev:all
```

</details>

### Environment Variables

<details>
<summary><strong><code>frontend/.env</code> (Frontend)</strong></summary>

```dotenv
VITE_API_URL=http://localhost:3001/api
VITE_PUBLIC_SITE_URL=https://your-app.vercel.app
```

> [!NOTE]
> `VITE_API_URL` boleh diisi `/api` saat frontend dan backend dilayani dari origin yang sama (mis. Vercel + rewrite proxy). File env frontend ada di `frontend/.env` (bukan root), sesuai working directory workspace Vite.

</details>

<details>
<summary><strong><code>backend/.env</code></strong></summary>

```dotenv
DATABASE_URL=postgresql://loning:loning_local_dev@localhost:5432/loning_digital
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
COOKIE_SECURE=false
```

Lihat `backend/.env.example` untuk pengaturan lengkap: session TTL, rate limit, lockout, proxy trust, media storage, S3 config, dan bootstrap admin.

</details>

### Membuat Super Admin Pertama

Bootstrap ini membuat tepat satu akun `superadmin`. Tidak ada password default dan command tidak pernah dijalankan otomatis oleh migration, seed, atau startup.

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
$env:BOOTSTRAP_ADMIN_USERNAME="superadmin"
$env:BOOTSTRAP_ADMIN_PASSWORD="ganti-dengan-password-12-karakter"
$env:BOOTSTRAP_ADMIN_DISPLAY_NAME="Administrator"
$env:ALLOW_ADMIN_BOOTSTRAP="1"
$env:BOOTSTRAP_CONFIRM="CREATE_SUPERADMIN"
npm run db:bootstrap-admin
# Hapus seluruh variable BOOTSTRAP_* dan ALLOW_ADMIN_BOOTSTRAP setelah selesai.
```

`admin:create` adalah compatibility alias lama yang sengaja gagal. Bootstrap menolak target production-like, menolak bila sudah ada user, dan tidak mencetak password atau URL database penuh.

> [!CAUTION]
> Jangan commit file `.env` atau credential ke repository. File `.env` sudah masuk `.gitignore`.

---

## 💻 Penggunaan

### Development Commands

| Command | Keterangan |
|---|---|
| `npm run dev:all` | Jalankan frontend + backend bersamaan |
| `npm run dev:frontend` | Frontend saja (port 3000) |
| `npm run dev:backend` | Backend saja (port 3001) |
| `npm run dev:local` | Full setup: DB + migrate + seed + dev servers |

### Database Commands

| Command | Keterangan |
|---|---|
| `npm run db:local:setup` | Start PostgreSQL development + migrate + `db:seed:dev` |
| `npm run db:migrate` | Jalankan migrasi tanpa seed/bootstrap |
| `npm run db:seed:dev` | Seed explicit; hanya target development loopback yang marker-nya cocok |
| `npm run db:seed:test` | Seed explicit; hanya dipanggil harness pada DB disposable test |
| `npm run db:seed:preview` | Dinonaktifkan dan sengaja gagal |
| `npm run verify:seed-determinism` | Verifikasi clean repeatability + same-target idempotency di DB disposable |
| `npm run db:local:up` | Start PostgreSQL container |
| `npm run db:local:down` | Stop PostgreSQL container |
| `npm run db:local:wait` | Tunggu PostgreSQL ready |
| `npm run db:local:reset` | ⚠️ Hapus volume database development (destructive) |
| `npm run db:local:reset-safe` | Reset data development tanpa hapus volume |
| `npm run db:local:logs` | Lihat PostgreSQL logs |

### Build Commands

> [!IMPORTANT]
> **Production Build Requirement**: `VITE_PUBLIC_SITE_URL` wajib diisi saat menjalankan `npm run build` untuk menghasilkan canonical URLs dan metadata SEO yang valid.

#### Windows (PowerShell)
```powershell
$env:VITE_PUBLIC_SITE_URL='https://www.loningmaju.my.id'
npm run build
```

#### Linux / macOS / Cloud Shell
```bash
VITE_PUBLIC_SITE_URL='https://www.loningmaju.my.id' npm run build
```

| Command | Keterangan |
|---|---|
| `npm run build` | Build semua workspaces (butuh `VITE_PUBLIC_SITE_URL`) |
| `npm run build:frontend` | Build frontend saja |
| `npm run build:backend` | Build backend saja |
| `npm run lint` | TypeScript lint (semua workspaces) |
| `npm run typecheck` | Type checking (semua workspaces) |
| `npm run clean` | Hapus build artifacts |

### Maintenance Commands

| Command | Keterangan |
|---|---|
| `npm --prefix backend run sessions:cleanup` | Bersihkan session expired |
| `npm --prefix backend run media:cleanup` | Bersihkan media orphan |
| `npm --prefix backend run analytics:retention:apply` | Terapkan retensi data analytics |
| `npm --prefix backend run db:generate` | Generate migrasi baru |
| `npm --prefix backend run db:migrate` | Jalankan migrasi tanpa seed/bootstrap |
| `npm run db:seed:dev` | Jalankan development seed dengan profile explicit |
| `npm run db:bootstrap-admin` | Bootstrap satu Super Admin dengan konfirmasi explicit |

> [!IMPORTANT]
> Production startup/deploy hanya menjalankan migration lalu server. Production tidak menjalankan seed atau bootstrap. Legacy `db:seed` dan `admin:create` tetap ada hanya sebagai hard-fail compatibility stubs.

---

## 📁 Struktur Proyek

```
LoningMarketplace/
├── frontend/                      # React SPA workspace (V1)
│   ├── src/
│   │   ├── components/
│   │   │   ├── business/          # BusinessCard, UMKMImage
│   │   │   ├── dashboard/         # DashboardShell, Guards, ResourceList, UI
│   │   │   ├── discovery/         # DiscoverySearchForm
│   │   │   ├── home/              # Hero, Category, Featured, Mission, EditorialTeasers
│   │   │   ├── layout/            # Navbar, Footer, PublicPageShell
│   │   │   ├── product/           # ProductCard, ProductImage, ProductGallery
│   │   │   └── shared/            # Dialogs, RelatedProducts, EmptyState, Toast
│   │   ├── config/                # Brand configuration
│   │   ├── hooks/                 # useAuth, useProducts, useUMKMs, useManagement, discovery
│   │   ├── lib/                   # API client, analytics, SEO, location, price, auth
│   │   ├── pages/                 # Route page components (16 pages)
│   │   ├── App.tsx                # Homepage root
│   │   ├── main.tsx               # Router & providers (lazy loader V2 desktop/mobile)
│   │   ├── types.ts               # Shared TypeScript interfaces
│   │   └── index.css              # Design tokens & global styles
│   └── package.json
├── v2/                            # UI V2 workspace (@loning/v2)
│   ├── desktop/                   # Desktop codebase V2 (/v2/*)
│   │   └── src/
│   │       ├── components/        # ProductCard, BusinessCard, CatalogFilter
│   │       ├── dashboard/         # ManagementForms, Lists, Analytics, Location, Help
│   │       ├── layout/            # Navbar, Footer (super-compact bar)
│   │       ├── pages/             # Home, Katalog, Direktori, Detail, Peta, Saved, dll.
│   │       └── App.tsx            # Desktop shell & routes
│   ├── mobile/                    # Mobile Web codebase V2 (/m/*)
│   │   └── src/
│   │       ├── components/        # Mobile cards, filters
│   │       ├── layout/            # Header solid, BottomNav 5-item, Footer
│   │       ├── pages/             # Mobile pages (Catalog, Directory, Detail, Peta, dll.)
│   │       └── App.tsx            # Mobile shell & routes
│   ├── shared/                    # Shared V2 components, hooks, UI primitives, tokens
│   │   ├── components/            # Lightbox, QRCodeModal, StoryCardModal, OrderDraftDrawer, dll.
│   │   ├── hooks/                 # useFavorites, useOrderDraft
│   │   ├── lib/                   # favorites, orderDraft, qrcode, distance, businessHours
│   │   ├── styles/                # tokens.css (Design tokens editorial & dark mode)
│   │   └── ui/                    # Button, Badge, Field, MediaImage, Skeleton, cn
│   └── package.json
├── shared/                        # Package bersama lintas V1/V2/Backend (@loning/shared)
│   ├── src/
│   │   ├── config/                # Brand constants
│   │   ├── content/               # versionHistory, faq
│   │   ├── hooks/                 # useAuth, useProducts, useUMKMs, useDebouncedValue
│   │   └── lib/                   # api, auth, management, price, seo, location, share
│   └── package.json
├── backend/                       # Fastify API workspace
│   ├── src/
│   │   ├── auth/                  # Security, guards, session management
│   │   ├── config/                # Environment configuration
│   │   ├── db/                    # Schema, repository, migrations, seeds
│   │   ├── domain/                # Business logic (phone, location)
│   │   ├── errors/                # Domain error types
│   │   ├── lib/                   # Shared utilities
│   │   ├── media/                 # Media storage & processing
│   │   ├── routes/                # API route handlers (11 route files + types/validation)
│   │   ├── scripts/               # Admin, cleanup, audit scripts
│   │   ├── app.ts                 # Fastify app factory
│   │   └── index.ts               # Server entry point
│   ├── drizzle/                   # SQL migration files (18 migrations, 0000–0017, idempotent)
│   └── package.json
├── e2e/                           # Playwright E2E tests (10 spec files inc. v2-dual-ui)
├── scripts/                       # Build, test, and dev scripts
├── assets/                        # Seed source images
├── docs/                          # Technical documentation
├── compose.yaml                   # Docker Compose (PostgreSQL)
├── playwright.config.ts           # E2E config (Desktop + Mobile)
├── render.yaml                    # Render deployment config
├── vercel.json                    # Vercel deployment config (SPA rewrite + API proxy)
└── package.json                   # Root workspace config (4 workspaces)
```

---

## 🗄 Database

### Schema Overview

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users ||--o{ audit_logs : "creates"
    users ||--o{ media_assets : "uploads"
    users ||--o{ umkms : "owns"
    umkms ||--o{ products : "has"
    umkms ||--o{ public_events : "tracked"
    products ||--o{ public_events : "tracked"
    media_assets ||--o| umkms : "image"
    media_assets ||--o| products : "image"
    media_assets ||--o{ product_images : "gallery"
    products ||--o{ product_images : "has"

    users {
        uuid id PK
        text email UK
        text username UK
        text password_hash
        user_role role
        boolean is_active
        boolean must_change_password
        int failed_login_count
        timestamp locked_until
    }

    umkms {
        uuid id PK
        varchar slug UK
        text name
        text owner
        text phone
        category category
        text address
        numeric latitude
        numeric longitude
        publication_status status
        int display_order
    }

    products {
        uuid id PK
        varchar slug UK
        uuid umkm_id FK
        text name
        int price
        category category
        boolean is_available
        text unit
        publication_status status
    }

    sessions {
        uuid id PK
        uuid user_id FK
        text token_hash
        text csrf_token_hash
        timestamp expires_at
    }

    audit_logs {
        uuid id PK
        uuid actor_user_id FK
        text action
        text entity_type
        jsonb metadata
    }

    media_assets {
        uuid id PK
        text card_storage_key UK
        text thumbnail_storage_key UK
        text checksum_sha256
        int card_width
        int card_height
    }

    public_events {
        uuid id PK
        public_event_type event_type
        uuid umkm_id FK
        uuid product_id FK
        text source
    }
```

### Enums

| Enum | Values |
|---|---|
| `category` | `Kuliner`, `Sembako & Kebutuhan Harian`, `Fashion & Konveksi`, `Bahan Bangunan & Material`, `Jasa & Otomotif`, `Pertanian, Peternakan & Perikanan`, `Ritel & Perabot`, `Kerajinan & Olahan Kreatif`, `Lainnya` |
| `user_role` | `superadmin`, `admin`, `perangkat_desa`, `pelaku_umkm` |
| `publication_status` | `draft`, `published`, `archived` |
| `public_event_type` | `umkm_view`, `product_view`, `inquiry_started`, `message_copied`, `whatsapp_opened` |

### Migrations

18 migration files di `backend/drizzle/`, dikelola oleh Drizzle Kit. Semua migration idempotent — aman dijalankan berkali-kali, termasuk di Render deploy. Jalankan migrasi:

```bash
npm --prefix backend run db:migrate
```

### Seed Data

Development seed menyediakan **52 produk** di **15 profil UMKM** fiktif dengan 9 kategori. Foto produk dan profil adalah ilustrasi AI-generated, bukan foto bisnis nyata. Seed bersifat idempotent dan hanya mengganti data di namespace ID `e3000000-...`.

```powershell
$env:NODE_ENV="development"
$env:APP_ENV="development"
$env:DATABASE_ENVIRONMENT="development"
$env:ALLOW_SEED="1"
npm run db:seed:dev
Remove-Item Env:ALLOW_SEED
```

`db:seed:test` hanya dijalankan harness isolated terhadap database disposable dengan marker test yang cocok. `ALLOW_SEED=1` hanya diberikan kepada child seed; migration, server, Vitest, Playwright, integration runner, dan E2E fixture setup tidak mewarisinya. `db:seed:preview` dinonaktifkan. Compatibility alias `db:seed` sengaja hard-fail.

---

## 🔌 API Routes

<details>
<summary><strong>Public Routes</strong></summary>

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/ready` | Database readiness check |
| `GET` | `/api/umkms` | List published UMKMs |
| `GET` | `/api/umkms/:id` | Detail UMKM (published only) |
| `GET` | `/api/products` | List published products |
| `GET` | `/api/products/:id` | Detail product (published + published parent) |
| `POST` | `/api/events` | Public analytics event |
| `GET` | `/api/media/*` | Serve public media (streaming) |
| `GET` | `/sitemap.xml` | Dynamic XML Sitemap |
| `GET` | `/robots.txt` | Directives crawling mesin pencari |

</details>

<details>
<summary><strong>Auth Routes</strong></summary>

| Method | Path | Keterangan |
|---|---|---|
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/session` | Current session |
| `POST` | `/api/auth/logout` | Logout |
| `POST` | `/api/auth/change-password` | Ganti password |

</details>

<details>
<summary><strong>Management Routes (Authenticated)</strong></summary>

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/api/manage/umkms` | List UMKMs (role-scoped, 9 kategori) |
| `GET` | `/api/manage/umkms/:id` | Detail UMKM |
| `POST` | `/api/manage/umkms` | Create UMKM (idempotency-key supported) |
| `DELETE` | `/api/manage/umkms/:id` | Delete UMKM (archived only) |
| `POST` | `/api/manage/umkms/:id/verify-contact` | Verify WhatsApp contact |
| `PATCH` | `/api/manage/umkms/:id/location` | Set/clear location |
| `GET` | `/api/manage/umkms/export.csv` | Export CSV (admin only) |
| `GET` | `/api/manage/products` | List products (role-scoped) |
| `POST` | `/api/manage/products` | Create product |
| `PATCH` | `/api/manage/products/:id` | Update product |
| `DELETE` | `/api/manage/products/:id` | Archive product |
| `GET` | `/api/manage/products/:id/images` | List product gallery images |
| `POST` | `/api/manage/products/:id/images` | Add product gallery image |
| `DELETE` | `/api/manage/products/:id/images/:imageId` | Remove product gallery image |
| `POST` | `/api/manage/products/:id/images/:imageId/primary` | Set gallery cover image |
| `POST` | `/api/manage/products/:id/images/reorder` | Reorder gallery images |
| `GET` | `/api/manage/stats` | Dashboard summary statistics |

</details>

<details>
<summary><strong>Admin Routes (Admin Only)</strong></summary>

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/api/admin/users` | List users |
| `POST` | `/api/admin/users` | Create user |
| `PATCH` | `/api/admin/users/:id` | Update user |
| `POST` | `/api/admin/users/:id/reset-password` | Reset password sementara |
| `POST` | `/api/admin/users/:id/revoke-sessions` | Cabut semua sesi user |
| `DELETE` | `/api/admin/users/:id` | Hapus user |
| `GET` | `/api/admin/audit-logs` | List audit logs |
| `GET` | `/api/admin/inquiry-analytics` | Inquiry analytics (`from` & `to` date query) |

</details>

### Response Format

```json
// Success
{ "data": { ... } }

// Error
{ "error": { "message": "...", "code": "..." } }
```

---

## 🔐 Autentikasi & Keamanan

> Dokumentasi kebijakan rate-limit, reverse proxy, fitur V1.8, dan keputusan bundle tersedia di [`docs/v1.7.3-v1.8-implementation.md`](docs/v1.7.3-v1.8-implementation.md).

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant A as Fastify API
    participant DB as PostgreSQL

    B->>F: GET /login
    F->>B: Login form
    B->>A: POST /api/auth/login
    A->>DB: Verify Argon2id hash
    A->>DB: Create session (token hash)
    A->>B: Set-Cookie: loning_session (HTTP-only)
    A->>B: Response: { csrfToken }
    B->>F: Store CSRF in memory (TanStack Query)
    F->>A: PATCH /api/manage/umkms/:id
    Note over F,A: Headers: Cookie + X-CSRF-Token + Origin
    A->>DB: Verify session + CSRF + role
    A->>B: { data: ... }
```

### Security Features

| Feature | Detail |
|---|---|
| Password hashing | Argon2id |
| Session storage | SHA-256 hash in DB; raw token in HTTP-only cookie |
| CSRF protection | In-memory token + `X-CSRF-Token` header + `Origin` check |
| Cookie settings | `HttpOnly`, `SameSite=Lax`, `Secure` in production |
| Rate limiting | Login: 10 req/min, API: 100 req/min, Change Password: 5 req/min, Admin Reset: 5 req/min |
| Account lockout | 5 failed attempts → 15 minute lock |
| CORS | Explicit single-origin allowlist (credentialed) |

### Roles

| Role | Capabilities |
|---|---|
| `superadmin` | Full access: semua kemampuan, termasuk kelola user, semua UMKM/produk, publikasi, audit, dan analitik |
| `admin` | Kelola user (perangkat_desa & pelaku_umkm), semua UMKM/produk, publikasi, audit, dan analitik |
| `perangkat_desa` | Lihat & kelola semua UMKM/produk, publikasi, lihat analitik (tanpa akses user management) |
| `pelaku_umkm` | Kelola UMKM milik sendiri dan produk di dalamnya (tanpa publikasi, tanpa akses admin) |

---

## 🧪 Testing

### Test Suite Overview

| Layer | Tool | Files | Command |
|---|---|---|---|
| Unit / Component | Vitest + Testing Library | 31 test files | `npm run test:frontend` |
| Backend Unit | Vitest | 21 test files | `npm run test:backend` |
| E2E Desktop + Mobile | Playwright | 9 spec files | `npm run test:e2e` |
| Integration Smoke | Custom harness | 1 script | `npm run test:integration` |

### Quick Test Commands

```bash
# Unit tests (frontend)
npm run test:frontend

# Semua unit tests
npm run test:unit

# Lint + Typecheck
npm run lint
npm run typecheck
```

### Docker Isolated Dependency Simulation (Membutuhkan Docker)

Set up isolated dependency containers (PostgreSQL 16 & MinIO) — tidak perlu database atau S3 server yang sudah berjalan.

```bash
# Safety check harness
npm run test:harness-safety

# Migration test (disposable DB)
npm run test:migration:existing:isolated

# Integration smoke test
npm run test:integration:isolated

# E2E browser tests
npm run test:e2e:isolated

# E2E native zoom 200%
npm run test:e2e:zoom-native:isolated

# Full verification (semua di atas)
npm run verify:full:isolated
```

### Run All Tests

```bash
npm run test:all
```

> [!NOTE]
> Install Playwright browser jika diperlukan: `npx playwright install chromium`

---

## 🚢 Deployment

### Architecture Overview

```mermaid
graph LR
    subgraph Hosting
        FE["Frontend (Static SPA)"]
        BE["Backend (Fastify)"]
    end
    subgraph Services
        PG["PostgreSQL (Aiven)"]
        S3["S3-Compatible Storage"]
    end

    FE -->|"/api/*"| BE
    BE --> PG
    BE --> S3
```

### Deployment Configs

| Platform | Config File | Keterangan |
|---|---|---|
| Render | `render.yaml` | Backend web service |
| Vercel | `vercel.json` + `frontend/vercel.json` | Frontend SPA + backend routing (SPA fallback + API/media proxy) |

### Checklist Deployment

<details>
<summary><strong>Frontend</strong></summary>

1. Build: `npm run build:frontend`
2. Deploy `frontend/dist/` sebagai static SPA
3. Konfigurasi fallback `index.html` untuk semua routes
4. Set `VITE_API_URL` ke URL API production (berakhiran `/api`)
5. Set `VITE_PUBLIC_SITE_URL` ke origin publik yang valid

</details>

<details>
<summary><strong>Backend</strong></summary>

1. Build: `npm run build:backend`
2. Start: `npm start --workspace=backend`
3. Health check: `/api/health`
4. Required environment variables:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | PostgreSQL URL dengan `sslmode=require` |
| `CORS_ORIGIN` | Satu exact frontend origin |
| `COOKIE_SECURE` | `true` |
| `TRUST_PROXY` | `true` (di belakang proxy) |
| `MEDIA_STORAGE_DRIVER` | `s3` (filesystem ditolak di production) |
| `S3_BUCKET` | Nama bucket |
| `S3_REGION` | Region S3 |
| `S3_ENDPOINT` | S3 endpoint URL |
| `S3_ACCESS_KEY_ID` | Access key |
| `S3_SECRET_ACCESS_KEY` | Secret key |

5. Schedule maintenance jobs:
   - `sessions:cleanup`
   - `media:cleanup`
   - `analytics:retention:apply`

</details>

### SEO Status

- ✅ Runtime route metadata, canonical links, social metadata, dan JSON-LD (SPA-side)
- ✅ `robots.txt` mengizinkan crawling
- ✅ Dynamic `sitemap.xml` otomatis untuk seluruh UMKM dan produk terpublikasi
- ⚠️ Initial HTML metadata belum server-rendered (SPA limitation)
- ❌ SSR / prerendering belum tersedia

---

## 🔧 Troubleshooting

<details>
<summary><strong>CORS atau login cookie error</strong></summary>

Periksa bahwa `CORS_ORIGIN`, `VITE_API_URL`, `COOKIE_SECURE`, protocol (http/https), dan browser origin sudah konsisten.

</details>

<details>
<summary><strong>Login stuck di "Memuat data..."</strong></summary>

1. Restart frontend setelah mengubah `.env`
2. Buka Browser Network → periksa `GET /api/auth/session`
3. Response `401` normal = signed-out state
4. Connection failure harus menampilkan tombol "Coba Lagi"

</details>

<details>
<summary><strong>Error "DATABASE_URL is required"</strong></summary>

Buat `backend/.env` dari `backend/.env.example`. Backend sengaja berhenti tanpa database URL — tidak ada fake data.

</details>

<details>
<summary><strong>Database tidak ready</strong></summary>

```bash
npm run db:local:logs    # Lihat PostgreSQL logs
npm run db:local:wait    # Tunggu PostgreSQL ready
```

`/api/ready` mengembalikan `503` sampai PostgreSQL menerima koneksi.

</details>

<details>
<summary><strong>Aiven SSL error</strong></summary>

Gunakan URL Aiven lengkap dengan `sslmode=require`. Jangan tambahkan bypass sertifikat global.

</details>

<details>
<summary><strong>Forced password change</strong></summary>

Akun baru atau yang direset harus menggunakan `/change-password` sebelum bisa mengakses dashboard.

</details>

<details>
<summary><strong>Playwright browser tidak terinstall</strong></summary>

```bash
npx playwright install chromium
```

</details>

---

## ⚠️ Batasan

| Area | Status |
|---|---|
| Transaksi (cart, checkout, payment) | ❌ Tidak termasuk |
| Registrasi publik | ❌ Tidak tersedia |
| Multi-image gallery | ✅ Hingga 5 gambar per produk (v2.0) |
| Rating & review | ❌ Tidak termasuk |
| OAuth / MFA / password recovery | ❌ Belum tersedia |
| SSR / prerendering | ❌ SPA only |
| Sitemap & robots.txt | ✅ Tersedia (/sitemap.xml, /robots.txt) |
| Real-time (WebSocket) | ❌ Tidak termasuk |
| Notifikasi push | ❌ Tidak termasuk |
| Stock management | ❌ Tidak termasuk |

Media upload mendukung multi-image gallery (hingga 5 gambar per produk) via `product_images`. Development menggunakan `backend/storage/` (di-ignore Git); production membutuhkan S3-compatible storage.

---

## License

```
SPDX-License-Identifier: Apache-2.0
```

---

<div align="center">

**Loning Maju** — Dibuat untuk Desa Loning, Petarukan, Pemalang 🌿

</div>
