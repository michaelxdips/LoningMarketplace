# Architecture Reconstruction & Technical Topology

## 1. Physical Architecture Topology

```text
+------------------------+        HTTPS API Requests         +------------------------+
|    Vercel Frontend     | --------------------------------> |     Render Backend     |
| (React 19 + Vite SPA)  |                                   |  (Fastify 5 Node App)  |
+------------------------+                                   +------------------------+
            |                                                            |
            | Static Assets                                              | PostgreSQL Pool
            v                                                            v
+------------------------+                                   +------------------------+
|   Vercel CDN Edge      |                                   |    Aiven PostgreSQL    |
+------------------------+                                   +------------------------+
                                                                         |
                                                                         | Direct S3 SDK
                                                                         v
                                                             +------------------------+
                                                             |  S3 Object Storage     |
                                                             +------------------------+
```

---

## 2. Component Breakdown

### Frontend Component Structure
* **Framework**: React 19 + Vite + TypeScript + Tailwind CSS v4.
* **Routing**: React Router v7. SPA routes fallback via `vercel.json`.
* **State & Query Cache**: `@tanstack/react-query` v5 with automated refetch and cache invalidation.
* **Form & Validation**: Controlled React inputs with local state and Zod schema validations.
* **Maps**: Leaflet / OpenStreetMap integration via interactive `PetaUMKMPage` and business location management.

### Backend Architecture
* **Framework**: Fastify v5 with TypeScript (`tsx` for dev, `tsc` for production build).
* **ORM & Database Client**: Drizzle ORM v0.45 + Postgres.js client.
* **Security & Auth**: Argon2 password hashing, `@fastify/cookie` HTTP-only sessions, `@fastify/helmet` security headers, `@fastify/cors` with strict origin matching, `@fastify/rate-limit` brute force protection.
* **Media Handling**: Sharp image processing (WebP card 1000x700, thumbnail 240x168) with dual storage drivers: `filesystem` (local dev) and `@aws-sdk/client-s3` (production).

---

## 3. Database Schema Overview

```text
- users (id, email, username, display_name, password_hash, role, is_active, must_change_password, failed_login_count, locked_until, created_at, updated_at)
- sessions (id, user_id, expires_at, created_at)
- umkms (id, user_id, name, slug, description, address, latitude, longitude, phone_whatsapp, image_url, image_asset_id, category, is_active, created_at, updated_at)
- products (id, umkm_id, name, slug, price, description, category, image_url, image_asset_id, is_available, unit, display_order, publication_status, published_at, created_at, updated_at)
- media_assets (id, created_by_user_id, original_filename, original_mime_type, output_mime_type, checksum_sha256, card_storage_key, thumbnail_storage_key, card_width, card_height, card_byte_size, thumbnail_width, thumbnail_height, thumbnail_byte_size, alt_text, orphaned_at, deleted_at, created_at, updated_at)
- public_events (id, event_type, product_id, umkm_id, payload, created_at)
```
