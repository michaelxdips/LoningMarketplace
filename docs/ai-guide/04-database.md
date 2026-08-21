# 04 — Database

## Sumber Kebenaran

- **Definisi tabel:** `backend/src/db/schema.ts` (Drizzle ORM, PostgreSQL).
- **Semua query:** `backend/src/db/repository.ts`.
- **Migrasi:** `backend/drizzle/` (SQL, 0000–0016), runner `backend/src/db/migrate.ts`.

## 🗺️ ER Diagram

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users ||--o{ audit_logs : "creates"
    users ||--o{ media_assets : "uploads"
    users ||--o{ umkms : "owns (owner_user_id)"
    umkms ||--o{ products : "has"
    umkms ||--o{ public_events : "tracked"
    products ||--o{ public_events : "tracked"
    media_assets ||--o| umkms : "primary image"
    media_assets ||--o| products : "primary image"
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
        timestamp last_login_at
    }

    umkms {
        uuid id PK
        varchar slug UK
        text name
        text owner
        text description
        text phone
        category category
        uuid image_asset_id FK
        text address
        numeric latitude
        numeric longitude
        text working_hours
        text opening_time
        text closing_time
        uuid owner_user_id FK
        int display_order
        publication_status publication_status
    }

    products {
        uuid id PK
        uuid umkm_id FK
        varchar slug UK
        text name
        int price
        text description
        category category
        uuid image_asset_id FK
        boolean is_available
        text unit
        text phone
        text seller_name
        publication_status publication_status
    }

    product_images {
        uuid id PK
        uuid product_id FK
        uuid media_asset_id FK
        int display_order
        text alt_text
        boolean is_primary
    }

    media_assets {
        uuid id PK
        uuid created_by_user_id FK
        text card_storage_key UK
        text thumbnail_storage_key UK
        text checksum_sha256
        int card_width
        int card_height
        int card_byte_size
        int thumbnail_width
        int thumbnail_height
        int thumbnail_byte_size
        text alt_text
        timestamp orphaned_at
        timestamp deleted_at
    }

    sessions {
        uuid id PK
        uuid user_id FK
        text token_hash UK
        text csrf_token_hash
        timestamp expires_at
        timestamp revoked_at
        text ip_address
        text user_agent
    }

    audit_logs {
        uuid id PK
        uuid actor_user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb metadata
    }

    public_events {
        uuid id PK
        public_event_type event_type
        uuid umkm_id FK
        uuid product_id FK
        text source
        uuid anonymous_session_id
        int event_version
        timestamp dedupe_bucket
    }
```

## 📋 Tabel & Tanggung Jawab

| Tabel | Fungsi | Catatan penting |
|---|---|---|
| `users` | Akun admin/owner | `username` lowercased + regex `^[a-z0-9._-]{3,30}$`; `failed_login_count >= 0` |
| `sessions` | Session login | hanya hash SHA-256 token yang disimpan; `revoked_at` untuk revoke soft |
| `audit_logs` | Append-only activity log | `metadata` JSONB |
| `media_assets` | Record media (WebP card+thumb) | `checksum_sha256` wajib 64-hex; orphan & delete soft |
| `umkms` | Profil usaha | phone wajib `^628[0-9]{7,12}$`; lokasi pair (lat/lng) harus bersamaan |
| `products` | Produk | `price` boleh `NULL`; wajib punya `imageUrl` ATAU `imageAssetId`; bisa standalone (tanpa `umkm_id` jika punya `phone`) |
| `product_images` | Gallery produk (maks 5) | unique media per produk; maks 1 primary per produk |
| `public_events` | Event analitik publik | dedupe 5 menit per (session, type, target, source) |

## 🎨 Enums

| Enum | Nilai |
|---|---|
| `category` (9) | `Kuliner`, `Sembako & Kebutuhan Harian`, `Fashion & Konveksi`, `Bahan Bangunan & Material`, `Jasa & Otomotif`, `Pertanian, Peternakan & Perikanan`, `Ritel & Perabot`, `Kerajinan & Olahan Kreatif`, `Lainnya` |
| `user_role` (4) | `superadmin`, `admin`, `perangkat_desa`, `pelaku_umkm` |
| `publication_status` (3) | `draft`, `published`, `archived` |
| `public_event_type` (5) | `umkm_view`, `product_view`, `inquiry_started`, `message_copied`, `whatsapp_opened` |

## 🔗 Relasi & Foreign Key

| Dari | Ke | On Delete |
|---|---|---|
| `sessions.user_id` | `users.id` | cascade |
| `audit_logs.actor_user_id` | `users.id` | set null |
| `media_assets.created_by_user_id` | `users.id` | set null |
| `umkms.image_asset_id` | `media_assets.id` | set null |
| `umkms.owner_user_id` | `users.id` | set null |
| `products.umkm_id` | `umkms.id` | cascade |
| `products.image_asset_id` | `media_assets.id` | set null |
| `product_images.product_id` | `products.id` | cascade |
| `product_images.media_asset_id` | `media_assets.id` | restrict |
| `public_events.umkm_id` | `umkms.id` | set null |
| `public_events.product_id` | `products.id` | set null |

## 📐 Constraint Penting (logika bisnis di DB)

- **users**: `username` harus lowercase + valid; `failed_login_count >= 0`.
- **umkms**: `phone ~ '^628[0-9]{7,12}$'`; published WAJIB phone valid; lat/lng harus pair; lat ∈ [-90,90], lng ∈ [-180,180]; `imageUrl` XOR `imageAssetId`.
- **products**: `price >= 0` atau null; wajib punya gambar; `phone` valid bila ada; standalone owner (`umkm_id` ATAU `phone`).
- **product_images**: maks 1 primary (partial unique index `WHERE is_primary = true`); media unik per produk.
- **public_events**: target check (umkm XOR product); `source` whitelist; `event_version = 1`; dedupe index partial.

## 🔄 State Machine Publikasi

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> published : publish (admin/perangkat_desa)
    draft --> archived : archive
    published --> draft : unpublish
    published --> archived : archive
    archived --> draft : restore
    archived --> [*] : delete permanen
    note right of published
        Produk baru bisa published
        hanya jika parent UMKM published.
        UMKM wajib phone valid (628…).
    end note
```

## 🧱 Migrasi

- **17 file** di `backend/drizzle/` (`0000` sampai `0016`), dikelola **Drizzle Kit**.
- **Semua idempotent** — aman dijalankan ulang (penting untuk Render deploy).
- Runner (`migrate.ts`) menerapkan migrasi **transaksional** dan mencatatnya di ledger `drizzle.__drizzle_migrations`, plus langkah integritas:
  `preparePublicIntegrity → 0008 → 0009 → 0010…0014 → assertPublicIntegrity → assertBusinessLocationIntegrity`.

Perintah:

```bash
npm --prefix backend run db:generate   # generate migrasi baru dari schema.ts
npm run db:migrate                     # terapkan migrasi (tanpa seed/bootstrap)
```

> [!IMPORTANT]
> Ubah `schema.ts` terlebih dahulu, lalu `db:generate`, **jangan** edit `drizzle/*.sql` secara manual.

## 🌱 Seed

- **Development:** 52 produk + 15 UMKM fiktif, 9 kategori, ID namespace `e3000000-…` (gambar AI-generated, bukan bisnis nyata).
- **Test:** data foundation untuk fixture E2E (namespace `e2000000-…`).
- **Preview:** disabled, sengaja gagal.
- Guard target: `target-safety.ts` menolak target production-like; `ALLOW_SEED=1` + `SEED_DEVELOPMENT_PASSWORD` wajib untuk dev.

## ➡️ Lanjut

Berikutnya: [05 — API Reference](05-api-reference.md).
