# Backend Edge Case Audit — Loning Maju

**Date:** 2026-08-09
**Scope:** Zod schemas, repository races, route error paths, auth edge cases, media pipeline
**Method:** Static code analysis of all `backend/src/**/*.ts` files

---

## 1. Zod Schema Audit

### 1.1 validation.ts

| Schema | Bounds | Edge Cases | Verdict |
|--------|--------|------------|---------|
| `uuid` | `z.string().uuid()` | Empty, malformed, non-UUID → reject ✓ | ✅ |
| `phone` | `.trim().max(40)` + custom transform | 40 spaces → trim → "" → normalize → undefined → reject ✓; `+` only chars (e.g., "++++++++++++++++++++++++++++++++++++++++") → digits="" → reject ✓ | ✅ |
| `optionalUrl` | Union of `url() \| '' \| null`, then `.optional()` | `null` inside optional union is redundant but harmless; URL validation via Zod's built-in ✓ | ✅ |
| `timeString` | `/^([01]\d\|2[0-3]):([0-5]\d)$/` | "25:00", "12:60", "" → preprocess to null → all reject ✓ | ✅ |
| `umkmInput.name` | `.min(1).max(200)` | Empty → reject ✓; Unicode emoji → accepted (no restriction, valid for Indonesian names) | ✅ |
| `umkmInput.description` | `.min(1).max(5000)` | DDoS via 5000-char description — acceptable limit | ✅ |
| `productInput.price` | `.int().nonnegative()` | **NO UPPER BOUND** — JS safe integer is 2^53, but PG `integer` is 32-bit (±2.1B). Value `9999999999` would overflow PG column → DB error → 500 | ⚠️ LOW |
| `productInput.unit` | `.trim().max(100)` | SQL injection chars accepted ("DROP TABLE") but goes through parameterized Drizzle — safe ✓ | ✅ |
| `strictObject` | All input schemas | Unknown fields (`mapsUrl`, `foo`) → reject ✓ | ✅ |

### 1.2 auth.ts & admin.ts

| Schema | Bounds | Edge Cases | Verdict |
|--------|--------|------------|---------|
| `credentials.identifier` | `.min(1).max(320)` | 320 = max email length per RFC 5321 ✓ | ✅ |
| `loginPasswordSchema` | `.min(1).max(128)` | Only min(1) — intentionally lenient so empty-password-checker sees it, real enforcement is `passwordSetterSchema` min(8) | ✅ |
| `passwordSetterSchema` | `.min(8).max(128)` | Proper min length enforcement ✓ | ✅ |
| `createSchema.email` | `.trim().toLowerCase().email()` | Unicode email → handled by Zod's email() ✓ | ✅ |
| `usernameSchema` | `/^[a-z0-9._-]{3,30}$/` | SQL injection chars (. _ -) all safe ✓; empty → reject ✓ | ✅ |
| `updateSchema` | `.refine(v => Object.keys(v).length > 0)` | Empty body PATCH → 400 ✓ | ✅ |

### 1.3 events.ts

| Schema | Bounds | Edge Cases | Verdict |
|--------|--------|------------|---------|
| `eventInput.anonymousSessionId` | `uuid` | Non-UUID → reject ✓; Prevents garbage analytics data ✓ | ✅ |
| `eventInput.source` | `.enum(sources)` | 7 valid values, unknown → reject ✓ | ✅ |

### 1.4 SQL Injection Summary

**ALL** user input goes through parameterized Drizzle ORM queries. The `pattern()` function in `repository.ts` correctly escapes LIKE wildcards (`\`, `%`, `_`). No raw string interpolation into SQL. **No injection vectors found.** ✅

---

## 2. Repository — Races & Transactions

### 2.1 Transaction Architecture

```
Route handler
  └─ repository.transaction(async (tx) => {
       // tx provides same API, backed by a PG transaction
       // Drizzle: db.transaction((tx) => ...)
     })
```

`createUMKM` / `createProduct` internally call `allocateSlugWithRetry` which spins its own nested `db.transaction()` per attempt. On non-slug errors, the inner tx rolls back, then the error propagates to the outer tx which also rolls back. **Correct.** ✅

### 2.2 Race Conditions

| Method | Pattern | Risk |
|--------|---------|------|
| `updateUMKM` | SELECT phone → UPDATE (no lock) | ⚠️ MEDIUM — Two concurrent PATCHes: both read old phone, both reset `contactVerifiedAt`, second write wins. Lost-update on `catalogUpdatedAt` too. |
| `addProductImage` | SELECT MAX(display_order) → INSERT | ⚠️ MEDIUM — Two concurrent image adds to same product get identical `displayOrder`. No unique constraint on (productId, displayOrder). |
| `deleteUMKM` | WHERE `id` AND `status='archived'` | ✅ Atomic — no TOCTOU |
| `deleteProduct` | WHERE `id` AND `status='archived'` | ✅ Atomic — no TOCTOU |
| `setProductPrimaryImage` | SELECT + UPDATE in `db.transaction()` | ✅ Self-contained tx |
| `reorderProductImages` | LOOP UPDATE in `db.transaction()` | ✅ Self-contained tx |
| `refreshMediaOrphans` | PARALLEL referenceCount + UPDATE | ✅ Called inside outer route transaction — serialized |
| `moveProduct` | SELECT current → UPDATE old → UPDATE new | ⚠️ LOW — Old UMKM catalog update could be lost in concurrent product move. |
| Login lockout | READ failedLoginCount → WRITE in tx | ⚠️ LOW — Concurrent failed logins undercount by 1 (still eventually locks out) |

### 2.3 Slug Collision Edge Cases

| Scenario | Behavior | Verdict |
|----------|----------|---------|
| Two UMKM with non-Latin names (e.g., "株式会社" and "有限会社") | Both slugify to "umkm" → retry loop gives "umkm-2", "umkm-3" | ✅ |
| 10,000+ items with identical slug base | `MAX_SLUG_ALLOCATION_ATTEMPTS = 10_000` → `SlugConflictError` → 409 | ✅ (theoretical only) |
| Empty name | `slugify` returns fallback ("produk"/"umkm") | ✅ |
| Name is only hyphens ("---") | slugify → "" → fallback | ✅ |
| Slug exactly 96 chars | `buildSlugCandidate` handles truncation correctly, strips trailing hyphens | ✅ |

### 2.4 Transaction Rollback Scenarios

| Failure Point | Rollback Behavior | Verdict |
|---------------|-------------------|---------|
| Slug collision in `createUMKM` inner tx | Inner tx rolls back, outer tx retries with new slug | ✅ |
| Non-slug error in `createUMKM` inner tx | Inner tx rolls back, error propagates, outer tx rolls back | ✅ |
| `addAudit` fails after `createUMKM` succeeds | Both roll back (same outer tx) | ✅ |
| Media orphan refresh fails | Route returns error, outer tx rolls back, no partial state | ✅ |
| Gallery image add: duplicate unique violation | Drizzle throws → outer tx rolls back → **500 Internal Server Error** (no explicit handler) | ⚠️ MEDIUM |

---

## 3. Route Error Path Audit

### 3.1 Consistency

All routes use the `error(message, code)` helper: `{ error: { message, code } }`. The global error handler in `app.ts` also uses identical shape `{ error: { message, code } }`. **Consistent.** ✅

### 3.2 Edge Cases Per Route

| Route | Edge Case | Response | Verdict |
|-------|-----------|----------|---------|
| `POST /manage/umkms` | Duplicate slug | `SlugConflictError` → 409 | ✅ |
| `POST /manage/umkms` | Idempotency key replay | 200 with cached result | ✅ |
| `POST /manage/umkms` | Invalid ownerUserId (not pelaku_umkm, inactive) | 400 VALIDATION_ERROR | ✅ |
| `PATCH /manage/umkms/:id` | Empty body `{}` | `Object.keys().length === 0` → 400 | ✅ |
| `PATCH /manage/umkms/:id` | Only unknown fields `{mapsUrl:"x"}` | strictObject rejects → 400 | ✅ |
| `PATCH /manage/umkms/:id` | Changing owner to deleted user | `findUserById` → null → 400 | ✅ |
| `DELETE /manage/umkms/:id` | Already deleted | `loadUMKM` → 404 | ✅ |
| `DELETE /manage/umkms/:id` | Not archived | 409 UMKM_NOT_ARCHIVED | ✅ |
| `DELETE /manage/umkms/:id` | Race: archived between load and delete | `deleteUMKM` WHERE archived → returns undefined → 409 CONFLICT | ✅ |
| `POST /manage/umkms/:id/publish` | Invalid WhatsApp number | 409 CONTACT_INVALID | ✅ |
| `POST /manage/umkms/:id/verify-contact` | Valid but not updated in 90 days | `isContactVerificationFresh` returns false, but verify still succeeds | ✅ |
| `PATCH /manage/products/:id` | Changing umkmId to one owned by different user | `canViewUMKM` check → 403 | ✅ |
| `POST /manage/products` | Standalone product without phone | 400 VALIDATION_ERROR | ✅ |
| `POST /manage/products` | Parent UMKM is archived | 409 PARENT_ARCHIVED | ✅ |
| `POST /manage/products/:id/publish` | Parent not published | 409 PARENT_NOT_PUBLISHED | ✅ |
| `DELETE /manage/products/:id/images/:imageId` | Image not in gallery | `gallery.find()` → 404 | ✅ |
| `PATCH /manage/products/:id/images/reorder` | Wrong count or wrong IDs | Explicit validation → 400 | ✅ |
| `POST /manage/products/:id/images` | Duplicate media asset | DB unique violation → **500** (no catch) | ⚠️ MEDIUM |
| `POST /manage/products/:id/images` | >5 images | `countProductImages` check → 409 | ✅ |
| `DELETE /admin/users/:id` | Delete self | 403 CANNOT_DELETE_SELF | ✅ |
| `DELETE /admin/users/:id` | Last active superadmin | 409 LAST_SUPERADMIN | ✅ |
| `PATCH /admin/users/:id` | Change own role | 403 FORBIDDEN | ✅ |
| `POST /admin/users/:id/reset-password` | Reset own password (admin resetting themselves) | Not blocked — allowed for admin self-reset? Actually, `canManageUserTarget` is called with `current.role` — if current user is admin and target is also admin, `canManageUserTarget('admin', 'admin')` returns false. Wait, actually `canManageUserTarget` for admin only allows 'perangkat_desa' and 'pelaku_umkm'. So admin CANNOT reset another admin's password (or their own). But superadmin CAN. This is intentional — admins can only manage lower roles. But what about self-reset? The guard `canManageUserTarget` doesn't check if target === actor — an admin trying to reset their own password via admin endpoint would get 403. They should use `/auth/change-password` instead. | ✅ (by design) |

### 3.3 Unhandled Rejection Summary

Global error handler (`app.setErrorHandler`) catches ALL errors. 500-level errors have message replaced with "Internal server error" (no info leak). `SlugConflictError` gets explicit 409 handling. **Comprehensive.** ✅

### 3.4 DELETE of Already-Deleted

Every DELETE endpoint goes through a load/find step that returns 404 if missing. **Double-protected.** ✅

---

## 4. Auth Edge Case Audit

### 4.1 Session Expiry

| Edge | Handling | Verdict |
|------|----------|---------|
| Expired session token | `findSession` checks `gt(expiresAt, now)` → 401 | ✅ |
| Revoked session token | `findSession` checks `revokedAt IS NULL` → 401 | ✅ |
| Inactive user with valid session | `authenticate` guard → revokes session, clears cookie → 403 | ✅ |
| Unsupported role with valid session | `authenticate` guard → revokes session, clears cookie → 403 | ✅ |
| `mustChangePassword` enforced | Blocks all non-`/api/auth/` routes → 403 | ✅ |
| Cookie expiry matches session TTL | `expires` set on cookie, `expiresAt` in DB | ✅ |
| Bearer token auth (header fallback) | `Authorization: Bearer <token>` accepted as alternative to cookie | ✅ |

### 4.2 CSRF

| Edge | Handling | Verdict |
|------|----------|---------|
| Missing CSRF token header | `csrf` guard → 403 | ✅ |
| Wrong CSRF token | `safeEqual` (timing-safe compare) → 403 | ✅ |
| CSRF rotation on `/auth/session` | Generates new token, replaces in DB | ✅ |
| Concurrent CSRF rotations | Last write wins — client using stale token gets 403, retries | ✅ (acceptable) |

### 4.3 Password Change

| Edge | Handling | Verdict |
|------|----------|---------|
| Wrong current password | argon2 verify → 400 INVALID_PASSWORD | ✅ |
| New = current | argon2 verify → 400 PASSWORD_REUSED | ✅ |
| New < 8 chars | `passwordSetterSchema` min(8) → 400 | ✅ |
| All sessions revoked | `revokeUserSessions` in same tx | ✅ |
| Concurrent password changes | Both verify old hash, both write new hash. Last write wins. Both revoke sessions. | ✅ (safe outcome) |
| Rate limit | 5 req/min | ✅ |

### 4.4 Login

| Edge | Handling | Verdict |
|------|----------|---------|
| Locked account | `lockedUntil > now` → 429 ACCOUNT_LOCKED | ✅ |
| Timing attack mitigation | Dummy hash verification for non-existent users (constant-time-ish via argon2) | ✅ |
| Case-sensitivity bypass | `email.trim().toLowerCase()`, `username.trim().toLowerCase()` | ✅ |
| Failed login counter race | Under-counted by 1 on concurrent failures → still locks out | ✅ (acceptable) |
| Rate limit | `LOGIN_RATE_LIMIT_MAX` (default 10) per `LOGIN_RATE_LIMIT_WINDOW` | ✅ |
| Login with unsupported role | `isSupportedUserRole` check → revokes sessions → 401 (same message as wrong password to avoid role enumeration) | ✅ |
| Login with inactive account | Falls through to "invalid credentials" (no differentiation to avoid user enumeration) | ✅ |

### 4.5 Origin Validation

| Edge | Handling | Verdict |
|------|----------|---------|
| No Origin header | Allowed (mobile apps, curl) → CSRF guard handles state-mutating protection | ✅ |
| Vercel preview deployments | `/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/i` regex | ✅ |
| Production domain | `/^https:\/\/(www\.)?loningmaju\.my\.id$/i` | ✅ |
| Wildcard CORS | `allowed.includes('*')` | ✅ (documented tradeoff) |

---

## 5. Media Pipeline Audit

### 5.1 Upload Flow

```
multipart parse (fastify/multipart)
  → MIME check (declared)
  → processImage (sharp):
      → size check (bytes)
      → SVG detection
      → format detection
      → animated check
      → dimension check
      → auto-orient + resize (card: 1280×1280, thumb: 400×400)
      → WebP encode
  → MIME mismatch check (declared vs actual)
  → altText length check
  → storage.putObject (card)
  → storage.putObject (thumbnail)
  → DB insert (transaction)
```

### 5.2 Error Recovery

| Failure Point | Cleanup | Verdict |
|---------------|---------|---------|
| Multipart too large | Fastify rejects → 413 | ✅ |
| Invalid multipart | 400 MEDIA_UPLOAD_INVALID | ✅ |
| Declared MIME invalid | 415 MEDIA_UNSUPPORTED | ✅ |
| Image processing error | `MediaProcessingError` caught → appropriate status code | ✅ |
| MIME mismatch | 415 MEDIA_UNSUPPORTED (after processing — CPU wasted, but correct) | ⚠️ LOW |
| Card storage succeeds, thumbnail fails | Both deleted in catch → 503 | ✅ |
| Both storage succeed, DB insert fails | Both deleted in catch, error re-thrown → 500 | ✅ |
| Storage delete fails during cleanup | `.catch(() => undefined)` → silent (orphaned bytes remain) | ⚠️ LOW |

### 5.3 Security

| Check | Implementation | Verdict |
|-------|---------------|---------|
| File size | `input.length > MEDIA_MAX_BYTES` + Fastify multipart limit | ✅ |
| SVG rejection | Scan first 512 bytes for `<svg` | ✅ |
| Pixel bomb | `limitInputPixels: MEDIA_MAX_PIXELS` (Sharp option) | ✅ |
| Animated image | `metadata.pages > 1` → reject | ✅ |
| Unsupported format | Sharp metadata check (only jpeg/png/webp) | ✅ |
| Dimension limits | Width, height, and pixel count all checked | ✅ |
| Storage key sanitization | Regex `^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$`, max 512 chars, no `..`, no `\0`, no absolute path | ✅ |
| Path traversal (filesystem) | `resolve()` checks target within root | ✅ |
| Serve-side key validation | Same regex in `mediaServeRoutes` | ✅ |
| Content-Type validation | `nosniff` header on serve | ✅ |
| Cache poisoning | Immutable 1-year cache on storage, `nosniff` on serve | ✅ |

### 5.4 Delete & Orphan Lifecycle

| State | Handling | Verdict |
|-------|----------|---------|
| Referenced media delete attempt | `mediaReferenceCount` > 0 → 409 | ✅ |
| Soft delete | Sets `deletedAt` + `orphanedAt` | ✅ |
| Orphan detection | `refreshMediaOrphans` checks umkms + products + productImages | ✅ |
| Orphan grace period | `MEDIA_ORPHAN_GRACE_HOURS` (default 24h) before purge | ✅ |
| Purge | `media-cleanup.ts` script, `listExpiredOrphanMedia` then `purgeMediaAsset` | ✅ |
| Gallery image delete | Removes junction row + refreshes orphans → media asset becomes orphan if no other references | ✅ |

### 5.5 Minor Issues

1. **altText checked after image processing** (media.ts:30): `altText.length > 500` check runs AFTER the CPU-intensive `processImage()` call. Should be moved before processing.
2. **MIME mismatch check after processing** (media.ts:29): Same ordering issue — CPU wasted processing an image only to reject it on MIME mismatch. However, this check requires Sharp's metadata output, so it can't be moved before processing entirely. Could do a 512-byte magic-number check first.

---

## 6. Findings Summary

### By Severity

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 3 | `updateUMKM` lost-update race, `addProductImage` display-order race, duplicate gallery image → 500 |
| LOW | 5 | No upper bound on product price, in-memory idempotency (by design), CSRF rotation non-idempotent (acceptable), altText validation ordering, MIME mismatch after processing |

### By Category

| Category | Assessment |
|----------|------------|
| Zod Schemas | ✅ Well-structured. One gap: `price` missing upper bound. `strictObject` everywhere. |
| Repository | ⚠️ Two MEDIUM races. Slug handling is robust. Transaction architecture is sound. |
| Routes | ✅ Error paths consistent. All DELETE/PATCH/POST edge cases handled. One 500 gap on gallery unique violation. |
| Auth | ✅ Session, CSRF, password change all have defense-in-depth. Login lockout and rate limiting present. |
| Media | ✅ Strong validation pipeline. Storage failure recovery with cleanup. Two LOW ordering issues. |

### What's Already Good

- **Consistent error envelope** across all routes and global handler
- **`strictObject`** on all mutation endpoints — unknown fields rejected
- **Parameterized queries** everywhere — no SQL injection surface
- **Defense-in-depth** on media: route → processor → storage key → filesystem
- **Rate limiting** on login, password reset, CSV exports, events, and global
- **Session security**: httpOnly cookies, secure flag in production, timing-safe CSRF comparison
- **Audit trail**: Every mutation writes an audit log entry
- **Idempotency** on UMKM and product creation
- **Atomic delete**: WHERE clause includes status check to prevent TOCTOU
- **Production guards**: `COOKIE_SECURE`, `MEDIA_STORAGE_DRIVER=s3`, `CORS_ORIGIN` all enforced

### Recommended Fixes

1. **[MEDIUM] Fix `updateUMKM` lost-update**: Use `SELECT ... FOR UPDATE` or optimistic locking (version column) for the phone comparison.
2. **[MEDIUM] Fix `addProductImage` display order race**: Use `INSERT ... SELECT COALESCE(MAX(display_order), -1) + 1` in a single query, or add SERIALIZABLE isolation to the transaction.
3. **[MEDIUM] Add explicit 409 for duplicate gallery image**: Catch unique constraint violation in `addProductImage` and return 409 instead of letting 500 propagate.
4. **[LOW] Add max bound on product price**: `z.number().int().nonnegative().max(2_147_483_647)` to match PostgreSQL integer limit.
5. **[LOW] Reorder altText validation**: Move `altText.length > 500` check before `processImage()` in the media upload route.
