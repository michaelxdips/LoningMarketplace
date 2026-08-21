# 17 — Domain Logic & Utilities

Kumpulan pure function dan utilitas penting yang sering terlewat. Semua sudah diuji dan jadi dasar validasi di banyak tempat.

## 📞 Normalisasi Telepon (`backend/src/domain/phone.ts`)

`normalizeIndonesianWhatsAppNumber(value)`:
- Terima karakter `[+\d\s().-]` (tolak huruf/simbol lain).
- `08…` → `628…`; `8…` → `628…`.
- Validasi `^628[0-9]{7,12}$` + panjang 10–15 digit.
- Return `undefined` bila tidak valid.

Dipakai di: validasi route (`validation.ts`), constraint DB (`schema.ts`), preflight migrasi.

## 🗺️ Koordinat (`backend/src/domain/location.ts` + `frontend/src/lib/location.ts`)

- `normalizeCoordinates(lat, lng)` — round 6 desimal, validasi lat ∈ [-90,90], lng ∈ [-180,180].
- `parsePgNumeric` — konversi numeric PostgreSQL → number (handling string/null).

**Frontend `lib/location.ts`** (lebih kaya):
- `parseLocationInput` — parse koordinat langsung, Google Maps URL (`@lat,lng`, `query`, `ll`), OSM (`#map=z/lat/lng`, `mlat/mlon`), tolak short-link (`maps.app.goo.gl`) dengan pesan bantu, tolak host tak didukung & non-HTTPS.
- `buildOsmEmbedUrl`, `buildGoogleMapsEmbedUrl`, `buildGoogleMapsSearchUrl`, `buildGoogleMapsDirectionsUrl`.

## 🔗 Slug (`backend/src/lib/slug.ts`)

- `slugify(value, fallback)` — NFKD normalize, strip diacritics, lowercase, non-alphanumeric → `-`, max 96 char.
- `buildSlugCandidate(base, attempt)` — `-2`, `-3`, … untuk collision.
- `allocateSlugWithRetry` — coba insert, deteksi unique violation (`23505` + constraint), retry hingga 10k attempt, throw `SlugConflictError`.

## 💰 Harga (`frontend/src/lib/price.ts`)

- `normalizePrice` — `number | null` (safe integer ≥ 0), string digit murni diizinkan.
- `formatPrice` — format IDR (`id-ID`), tanpa spasi, fallback "Harga tidak ditampilkan".

## 🕐 Jam Operasional (`frontend/src/lib/umkmStatus.ts`)

- `parseWorkingHours` — free-text `"08.00–17.00"` (toleransi `-`/`–`/`—`).
- `buildOpeningWindow` / `resolveOpeningWindow` — structured `openingTime`/`closingTime` diprioritaskan.
- `getBusinessOpenStatus` — status buka/tutup berdasarkan **Asia/Jakarta**, dukung jam lintas-midnight (overnight).
- `profileCompleteness` — hitung persentase kelengkapan profil (10 cek).

## 📤 Share (`frontend/src/lib/share.ts`)

- `sharePage(data)` — `navigator.share` bila tersedia; fallback clipboard; return `shared|copied|cancelled`.

## 🔁 Idempotency (2 sisi)

- **Backend** `lib/idempotency.ts` — cache in-memory TTL 1 jam, max 10k entri, mutex, periodic cleanup. Dipakai endpoint create UMKM/produk.
- **Frontend** `lib/idempotency.ts` — `generateIdempotencyKey(operation, resourceId)`.

## 📊 CSV (`backend/src/lib/csv.ts`)

- `escapeCsvCell` — quote + escape `"`, prefix `'` untuk formula injection (`=`, `+`, `-`, `@`).
- `csvDocument` — BOM UTF-8 (`\uFEFF`), CRLF.
- `csvFilename(resource, date)` — `loning-maju-{resource}-{YYYY-MM-DD}.csv`.

## 🌐 URL Site & SEO (`frontend/src/lib/siteUrl.ts`, `seo.ts`)

- `getSiteUrl` — validasi `VITE_PUBLIC_SITE_URL` (HTTPS untuk production, tanpa credentials/query/hash).
- `buildSiteUrl(pathname)` — URL absolut.
- `seo.ts` — `applyPageMetadata`, `usePageMetadata`, `defaultMetadata` (Organization JSON-LD), `buildLocalBusinessJsonLd` (LocalBusiness untuk UMKM).

## 🔍 Pencarian & Katalog

- `lib/catalog-url.ts` — `parseCatalogState`/`serializeCatalogState` (query `q` + `category` di URL, max 80 char).
- Backend `repository.ts` — `pattern(value)` escape wildcard `%`/`_` untuk `ILIKE`, search case-insensitive lintas nama/owner/deskripsi/alamat/kategori.

## 🔑 Authentication Utils

- `auth/security.ts` — `hashPassword` (Argon2id), `verifyPassword`, `token` (random 32 byte base64url), `hashToken` (SHA-256), `safeEqual` (timing-safe).
- `auth/policy.ts` — `USER_ROLES`, `ROLE_LABELS`, `CAPABILITIES`, `ROLE_CAPABILITIES`, helper scope (`canViewUMKM`, `canUpdateProduct`, …), `canCreateUserRole`, `manageableUserRoles`, `PASSWORD_MIN_LENGTH` (8).

## 🏷️ Kategori & Status (shared)

- `frontend/src/types.ts` — `CATEGORIES` (9) + `CATEGORY_SHORT_LABELS` + `getCategoryShortLabel`.
- `backend/src/db/repository.ts` — `categories` (9) + `publicationStatuses` (draft/published/archived) + `CONTACT_VERIFICATION_DAYS` (90).

## ➡️ Kembali

[Indeks dokumentasi](README.md).
