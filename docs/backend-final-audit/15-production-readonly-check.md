# 15 — Production Read-Only Check

## Inspection Timestamp

- **Date**: 2026-08-04 20:36:36 to 20:36:38 Asia/Jakarta (UTC+7)
- **Base URL**: `https://loningmarketplace.onrender.com`
- **Method**: GET only. No login, no cookie, no CSRF token, no POST/PUT/PATCH/DELETE.

## Endpoint Results

| Timestamp | Endpoint | Status | Duration | Content-Type | CORS | Security | Result |
|---|---|---:|---|---|---|---|---|
| 20:36:36 | /api/health | 200 | ~1s | application/json; charset=utf-8 | — | HSTS, nosniff | `{"status":"ok"}` |
| 20:36:36 | /api/ready | 200 | ~1s | application/json; charset=utf-8 | — | HSTS, nosniff | `{"status":"ok"}` |
| 20:36:37 | /api/products?limit=5 | 200 | ~1s | application/json; charset=utf-8 | — | HSTS, nosniff | 5 products, all published |
| 20:36:37 | /api/umkms?limit=5 | 200 | ~1s | application/json; charset=utf-8 | — | HSTS, nosniff | 5 UMKMs, all published |
| 20:36:37 | /api/products?category=Kuliner&limit=3 | 200 | ~1s | application/json; charset=utf-8 | — | HSTS, nosniff | 3 Kuliner products |
| 20:36:37 | /sitemap.xml | 200 | ~1s | application/xml; charset=utf-8 | — | HSTS, nosniff | 54 URLs, all https://www.loningmaju.my.id/ |
| 20:36:38 | /robots.txt | 200 | ~1s | text/plain; charset=utf-8 | — | HSTS, nosniff | Standard robots with sitemap reference |
| 20:36:38 | /api/products/nonexistent-slug-audit-12345 | 404 | ~1s | application/json; charset=utf-8 | — | HSTS, nosniff | `{"error":{"message":"Product not found","code":"NOT_FOUND"}}` |

## Valid Detail Inspection

### Product: `nasi-megono-komplit`

- **Status**: 200
- **Response**: Contains `id`, `slug`, `umkmId`, `name`, `price`, `description`, `category`, `imageUrl`, `imageAsset`, `isAvailable`, `unit`, `umkm` (with `id`, `slug`, `name`, `phone`)
- **Sensitive data leak**: None. No password hash, no session, no internal user ID, no email.
- **Media URL**: `https://loningmarketplace.onrender.com/media/seed-product-01.webp`
- **WhatsApp**: `umkm.phone` = `6281234567890` (E.164 Indonesia)

### UMKM: `warung-nasi-khas-loning`

- **Status**: 200
- **Response**: Contains `id`, `slug`, `name`, `owner`, `description`, `phone`, `category`, `imageUrl`, `imageAsset`, `address`, `latitude`, `longitude`, `contactVerifiedAt`, `catalogUpdatedAt`, `isContactValid`, `isContactVerified`, `isContactVerificationFresh`, `contactVerificationExpiresAt`
- **Sensitive data leak**: `isContactValid`, `isContactVerified`, `isContactVerificationFresh`, `contactVerificationExpiresAt` exposed publicly. Minor (P3) — internal verification state visible.
- **Media URL**: `https://loningmarketplace.onrender.com/media/seed-umkm-01.webp`

## Security Headers

| Header | Present | Value |
|---|---|---|
| Strict-Transport-Security | ✅ | max-age=31536000; includeSubDomains |
| X-Content-Type-Options | ✅ | nosniff |
| Content-Security-Policy | ❌ | Not set on API JSON responses (expected — CSP applies to HTML) |
| Cache-Control (API) | ❌ | Not set on API endpoints |
| Cache-Control (sitemap) | ✅ | public, max-age=3600, stale-while-revalidate=86400 |
| Cache-Control (robots) | ✅ | public, max-age=86400 |
| Server | cloudflare | Cloudflare fronting Render |

## Public Data Safety

| Check | Result |
|---|---|
| Password hash leaked? | ❌ No |
| Session token leaked? | ❌ No |
| Internal user ID exposed? | ❌ No (only resource IDs like e2000000-...) |
| Admin email exposed? | ❌ No |
| Internal audit notes? | ❌ No |
| Storage credentials? | ❌ No |
| Raw database metadata? | ❌ No |
| Account lock status? | ❌ No |
| Deleted records? | ❌ No |
| Draft records? | ❌ No |
| Archived records? | ❌ No |

## Deployment Drift Evidence

1. **Production returns dev seed IDs**: `e2000000-...001` to `e4000000-...201` — these are deterministic seed IDs from `backend/src/db/seeds/shared/ids.ts`.
2. **Sitemap contains `ronaldo` product**: Line 174 of sitemap.xml — `<loc>https://www.loningmaju.my.id/produk/ronaldo</loc>`. This appears to be a manually-created test product that leaked into production.
3. **catalogUpdatedAt timestamps differ**: UMKM 1 = `2026-08-01T11:43:22.036Z`, UMKM 2-5 = `2026-08-01T04:22:26.673Z`. This confirms non-deterministic seed (BE-069) was applied to production.
4. **No build identifier**: No `/api/version` or build SHA endpoint. Cannot verify if production runs current HEAD commit.

## Evidence

- [evidence/40-production-get-summary.txt](file:///C:/Users/Michael/Documents/Marketplace-Loning/docs/backend-final-audit/evidence/40-production-get-summary.txt)
