# 05 — API Reference

Semua endpoint berada di bawah prefix `/api`. Respons standar:

```json
// Sukses
{ "data": { ... } }

// Error
{ "error": { "message": "...", "code": "..." } }
```

**Simbol keamanan:**
- 🔓 = publik (tanpa auth)
- 🔐 = terautentikasi (session cookie/Bearer)
- 🛡️ = terautentikasi + CSRF + Origin (mutasi aman)

---

## 1. Health & Meta

| Method | Path | Keamanan | Deskripsi |
|---|---|---|---|
| GET | `/api/health` | 🔓 | Liveness (selalu `{status:"ok"}`) |
| GET | `/api/ready` | 🔓 | Readiness DB (503 jika DB down) |
| GET | `/sitemap.xml` | 🔓 | Sitemap dinamis (di root, bukan /api) |
| GET | `/robots.txt` | 🔓 | Directives crawler |

## 2. Public Catalog 🔓

| Method | Path | Query | Deskripsi |
|---|---|---|---|
| GET | `/api/umkms` | `category?`, `q?`, `limit?` (max 100) | List UMKM published |
| GET | `/api/umkms/:id` | — | Detail UMKM (id = UUID atau slug) |
| GET | `/api/products` | `category?`, `q?`, `umkmId?`, `limit?` | List produk published (+parent published) |
| GET | `/api/products/:id` | — | Detail produk (id/slug) |
| GET | `/api/products/:id/related` | `limit?` (max 4) | Produk terkait |
| POST | `/api/events` | — | 🔓 Catat event analitik (rate 30/mnt) |

**Catatan public:** hanya record `published`; produk harus punya parent UMKM `published` (kecuali produk standalone/`umkm_id` null dengan `phone`).

## 3. Auth 🔓/🔐

| Method | Path | Keamanan | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/login` | 🔓 (+origin) | Login, return `{ user, csrfToken, expiresAt }` |
| GET | `/api/auth/session` | 🔐 | Sesi aktif (rotate CSRF, return csrfToken baru) |
| POST | `/api/auth/logout` | 🛡️ | Logout + revoke session |
| POST | `/api/auth/change-password` | 🛡️ (rate 5/mnt) | Ganti password + revoke semua session |

## 4. Management (UMKM & Produk) 🔐

### UMKM

| Method | Path | Keamanan | Deskripsi |
|---|---|---|---|
| GET | `/api/manage/stats` | 🔐 `dashboard:view` | Statistik dashboard (role-scoped) |
| GET | `/api/manage/umkms` | 🔐 `umkms:view-all/own` | List role-scoped |
| GET | `/api/manage/umkms/:id` | 🔐 | Detail |
| POST | `/api/manage/umkms` | 🛡️ `umkms:create` | Create (idempotency-key) |
| PATCH | `/api/manage/umkms/:id` | 🛡️ | Update |
| POST | `/api/manage/umkms/:id/verify-contact` | 🛡️ | Verifikasi kontak WhatsApp |
| PATCH/DELETE | `/api/manage/umkms/:id/location` | 🛡️ | Set/clear lokasi |
| POST | `/api/manage/umkms/:id/publish` | 🛡️ `umkms:publish` | Publish (wajib phone valid) |
| POST | `/api/manage/umkms/:id/unpublish` | 🛡️ | → draft |
| POST | `/api/manage/umkms/:id/archive` | 🛡️ `umkms:archive` | → archived |
| POST | `/api/manage/umkms/:id/restore` | 🛡️ `umkms:restore` | → draft |
| DELETE | `/api/manage/umkms/:id` | 🛡️ | Hapus permanen (hanya archived) |
| GET | `/api/manage/umkms/export.csv` | 🔐 `umkms:view-all` | Ekspor CSV (rate 10/mnt) |

### Produk

| Method | Path | Keamanan | Deskripsi |
|---|---|---|---|
| GET | `/api/manage/products` | 🔐 | List role-scoped |
| GET | `/api/manage/products/:id` | 🔐 | Detail |
| POST | `/api/manage/products` | 🛡️ `products:create` | Create (idempotency-key) |
| PATCH | `/api/manage/products/:id` | 🛡️ | Update (+transfer antar UMKM) |
| POST | `/api/manage/products/:id/publish` | 🛡️ `products:publish` | Publish (parent wajib published) |
| POST | `/api/manage/products/:id/unpublish` | 🛡️ | → draft |
| POST | `/api/manage/products/:id/archive` | 🛡️ | → archived |
| POST | `/api/manage/products/:id/restore` | 🛡️ | → draft |
| DELETE | `/api/manage/products/:id` | 🛡️ | Hapus permanen (hanya archived) |
| GET | `/api/manage/products/export.csv` | 🔐 `products:view-all` | Ekspor CSV |

### Gallery Produk (maks 5 gambar)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/manage/products/:id/images` | List gallery |
| POST | `/api/manage/products/:id/images` | Tambah gambar (`imageAssetId`) |
| DELETE | `/api/manage/products/:id/images/:imageId` | Hapus gambar |
| PATCH | `/api/manage/products/:id/images/:imageId/primary` | Jadikan primary |
| PATCH | `/api/manage/products/:id/images/reorder` | Urutkan (`orderedIds`) |

## 5. Media 🔐

| Method | Path | Keamanan | Deskripsi |
|---|---|---|---|
| POST | `/api/manage/media/images` | 🛡️ | Upload gambar (multipart) → WebP |
| GET | `/api/manage/media/images/:id` | 🔐 | Detail media asset |
| PATCH | `/api/manage/media/images/:id` | 🛡️ | Update altText |
| DELETE | `/api/manage/media/images/:id` | 🛡️ | Hapus (hanya jika tak direferensikan) |

Serving publik: `GET /media/*` (streaming, cache immutable untuk WebP).

## 6. Admin (User & Audit) 🛡️

| Method | Path | Keamanan | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/users` | 🔐 `users:view` | List user |
| POST | `/api/admin/users` | 🛡️ | Create user (role sesuai capability) |
| PATCH | `/api/admin/users/:id` | 🛡️ `users:update` | Update (role/disable) |
| POST | `/api/admin/users/:id/reset-password` | 🛡️ (rate 5/mnt) | Reset password |
| POST | `/api/admin/users/:id/revoke-sessions` | 🛡️ | Revoke semua session |
| DELETE | `/api/admin/users/:id` | 🛡️ `users:delete` | Hapus user (bukan diri sendiri) |
| GET | `/api/admin/audit-logs` | 🔐 `audit:view-global` | List audit log |
| GET | `/api/admin/inquiry-analytics` | 🔐 `analytics:view-global` | Analitik inquiry (rentang tanggal) |

## 📦 Format Error Code Umum

| Code | HTTP | Arti |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Payload tidak valid |
| `UNAUTHENTICATED` | 401 | Belum login / session invalid |
| `FORBIDDEN` | 403 | Role tidak punya capability |
| `CSRF_INVALID` | 403 | CSRF token salah |
| `ORIGIN_INVALID` | 403 | Origin tidak diizinkan |
| `PASSWORD_CHANGE_REQUIRED` | 403 | Wajib ganti password dulu |
| `NOT_FOUND` | 404 | Resource tidak ada |
| `CONFLICT` / `DUPLICATE_ENTRY` | 409 | Konflik unik |
| `RATE_LIMITED` | 429 | Terlalu banyak request |
| `INTERNAL_ERROR` | 500 | Error tak terduga |

## 🔁 Idempotency (create UMKM/Produk)

Endpoint `POST /api/manage/umkms` dan `POST /api/manage/products` mendukung header:

```
Idempotency-Key: <string unik>
```

- Request identik dengan key sama → return hasil yang sudah di-cache (bukan duplikat).
- Request dalam proses dengan key sama → `409 CONCURRENT_REQUEST`.

## ➡️ Lanjut

Berikutnya: [06 — Auth & Security](06-auth-and-security.md).
