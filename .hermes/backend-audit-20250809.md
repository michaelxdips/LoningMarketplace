# Backend Route Security & Quality Audit — Loning Maju
**Date:** 2025-08-09  
**Scope:** Every handler in `manage.ts`, `auth.ts`, `admin.ts`, `analytics.ts`, `events.ts`, `media-serve.ts`; plus supporting files (`media.ts`, `products.ts`, `umkms.ts`, `health.ts`, `guards.ts`, `policy.ts`, `security.ts`, `validation.ts`, `csv.ts`, `idempotency.ts`, `location.ts`, `phone.ts`, `slug.ts`)

---

## CRITICAL (Fix Now)

### 🔴 1. Idempotency Race Condition — No Atomicity
**Files:** `src/routes/manage.ts` lines 79–86, 211–219; `src/lib/idempotency.ts`
**Finding:** The `POST /manage/umkms` and `POST /manage/products` handlers check/fetch idempotency cache, then set a placeholder, then create inside a transaction, then update cache — **all outside the DB transaction**. The `IdempotencyCache.lock()` method exists but is **never called**. Two concurrent requests with the same idempotency key will both pass the `get()` check and both create duplicate resources.
```typescript
// Race window: two concurrent requests both read null here
const existing = idempotencyCache.get<{ data: any }>(`umkm:create:${idempotencyKey}`);
if (existing) return reply.code(200).send(existing);
// Then both proceed to create...
```
**Severity:** High — duplicate entity creation on concurrent requests.
**Fix:** Move idempotency key check-and-set into the DB transaction, or wrap in the `lock()` method.

### 🔴 2. Idempotency Placeholder Poisoning
**Files:** `src/routes/manage.ts` lines 85, 218
**Finding:** A 30-second placeholder `{ data: { pending: true } }` is written before the transaction. If the server crashes or the transaction fails, subsequent requests with the same key will return `{ data: { pending: true } }` for 30 seconds with a 200 status code. The frontend would interpret this as a successful (but weird) response.
**Severity:** Medium — can cause client confusion or data inconsistency.
**Fix:** Don't cache on failure; or use a DB-level idempotency key check.

### 🔴 3. In-Memory Idempotency — Not Production-Safe
**File:** `src/lib/idempotency.ts`
**Finding:** The idempotency cache is a singleton `Map` in process memory. In multi-instance deployments (e.g., multiple containers behind a load balancer), idempotency is effectively broken — each instance has its own cache. The comment on line 3 acknowledges this: "Production: Consider using Redis."
**Severity:** High for any deployment with >1 instance.
**Fix:** Use Redis or DB-level idempotency keys.

---

## HIGH (Should Fix)

### 🟠 4. Reply Inside Transaction Callback — Unclear Rollback Behavior
**Files:** `src/routes/manage.ts` lines 168, 294
**Finding:** In `DELETE /manage/umkms/:id` and `DELETE /manage/products/:id`, when the deletion returns falsy (entity status changed between the initial load and the delete), the handler calls `reply.code(409).send(...)` **inside** the transaction callback. Fastify will send the response, but the transaction's fate is ambiguous — does it commit (with no data change) or roll back? This pattern mixes response-sending with transactional logic.
```typescript
return repository.transaction(async (transaction) => {
  const deleted = await transaction.deleteUMKM(request.params.id, now());
  if (!deleted) return reply.code(409).send(error('...', 'CONFLICT')); // INSIDE transaction
  // ...
});
```
**Severity:** Medium — works in practice but is fragile; could leave open transactions.
**Fix:** Return a sentinel value from the transaction and send the response after it completes.

### 🟠 5. `ownerUserId` Null Handling Gap in PATCH UMKM
**File:** `src/routes/manage.ts` lines 120–124
**Finding:** The schema allows `ownerUserId: uuid.nullable().optional()`. Line 121: `if (ownerUserId)` — this treats `null` as falsy, so `null` silently skips owner assignment instead of clearing the owner. If the intent is to allow unassigning an owner, this silently fails.
**Severity:** Medium — silent data inconsistency.
**Fix:** Explicitly check `ownerUserId !== undefined` to handle the `null` case, same as line 128.

### 🟠 6. No Rate Limits on Create Endpoints
**Files:** `src/routes/manage.ts` lines 77, 210
**Finding:** `POST /manage/umkms` and `POST /manage/products` rely only on the global rate limit (100 req/min). A malicious authenticated user could create up to 100 entities per minute. Other sensitive endpoints like login (configurable), password change (5/min), and CSV export (10/min) have their own limits.
**Severity:** Medium — DOS/resource exhaustion vector.
**Fix:** Add `config: { rateLimit: { max: 20, timeWindow: '1 minute' } }` or similar.

### 🟠 7. No Rate Limit on Analytics Queries
**File:** `src/routes/analytics.ts` line 15
**Finding:** `GET /admin/inquiry-analytics` has no specific rate limit despite potentially running expensive aggregate queries over the events table (up to 366 days of data).
**Severity:** Medium — could degrade database performance under abuse.
**Fix:** Add a dedicated rate limit (e.g., 10/min) similar to CSV exports.

### 🟠 8. No Rate Limit on Admin User Operations
**File:** `src/routes/admin.ts` lines 28, 47, 53, 59
**Finding:** `PATCH /admin/users/:id`, `DELETE /admin/users/:id`, `POST /admin/users/:id/reset-password`, and `POST /admin/users/:id/revoke-sessions` have no specific rate limits (only global 100/min). Password reset is rate-limited at 5/min, but the other operations aren't.
**Severity:** Medium — potential for abuse in compromised admin sessions.
**Fix:** Add rate limits to these endpoints.

---

## MEDIUM (Should Address)

### 🟡 9. Error Handler Crashes in Test Mode
**File:** `src/app.ts` line 90
**Finding:** `app.setErrorHandler((error, _request, reply) => { app.log.error(error); ... })` — In test mode (`NODE_ENV !== 'test'` → logger disabled), `app.log` may be a no-op logger or have different behavior. If `app.log` is not available, this throws a TypeError inside the error handler, causing the server to crash or return no response.
**Severity:** Medium — test reliability issue.
**Fix:** Guard with `app.log?.error?.(error)` or use a conditional.

### 🟡 10. Audit Log Query Unbounded Date Range
**File:** `src/routes/admin.ts` lines 77–79
**Finding:** `GET /admin/audit-logs` accepts `from` and `to` as optional date parameters but has no maximum range check. An unbounded query could return massive result sets (capped at 200 rows, so the DB impact is limited). However, if the audit log table has millions of rows, a full table scan on dates could be expensive.
**Severity:** Low-Medium — limited by row cap but still potentially expensive.
**Fix:** Add a maximum date range (e.g., 90 days) or require at least one filter parameter.

### 🟡 11. Media-Serve Uses Inconsistent Error Construction
**File:** `src/routes/media-serve.ts` lines 17, 32
**Finding:** The 404 responses construct `{ error: { message: 'Media not found', code: 'NOT_FOUND' } }` directly instead of using the `error()` helper from `validation.ts`. Structurally identical but bypasses the canonical helper.
**Severity:** Low — cosmetic consistency issue.
**Fix:** Import and use the `error()` helper.

### 🟡 12. `PATCH /manage/products/:id` Uses Wrong Auth Check for UMKM Move
**File:** `src/routes/manage.ts` line 258
**Finding:** When moving a product to a different UMKM, the handler checks `canViewUMKM` for the target UMKM. The capability check for the move itself (`products:transfer-owner`) is correct, but the view check on the target UMKM uses view authorization semantics rather than a more appropriate "can assign product to" check. If a user has `products:transfer-owner` but not `umkms:view-all` and is not the owner of the target UMKM, the move will fail with "Cannot move product to that UMKM" even though they're authorized to transfer.
**Severity:** Low — edge case; likely rare in practice.

### 🟡 13. Standalone Product Creation Missing `sellerName` Validation
**File:** `src/routes/manage.ts` lines 210–244; `src/routes/validation.ts` line 23–27
**Finding:** For standalone products (no `umkmId`), the handler requires `phone` (line 231) but does not require `sellerName`. The `productInput` schema marks `sellerName` as `nullable().optional()`. This means standalone products could be created without a seller name, which may be a UX gap.
**Severity:** Low — UX/data quality issue.

### 🟡 14. `price` Accepts 0 — May Need Explicit Free Flag
**File:** `src/routes/validation.ts` line 24
**Finding:** `price: z.number().int().nonnegative()` — zero is a valid price. If 0 means "free" vs "not set", there's ambiguity with `null` (which means "no price shown").
**Severity:** Low — design choice, but worth documenting.

---

## LOW (Nice to Have)

### 🟢 15. `loadUMKM`/`loadProduct` Duplicate Pattern
**Files:** `src/routes/manage.ts` lines 26–37
**Finding:** `loadUMKM` and `loadProduct` are nearly identical except for the repository method and error messages. A generic `loadEntity` helper could reduce duplication.
**Severity:** Low — code maintenance.

### 🟢 16. Comments Mention "Patch 05" — Dead Future Reference
**File:** `src/auth/policy.ts` lines 50–53
**Finding:** Comment references "Patch 05" for direct product ownership — a future feature. If this never ships, the comment is misleading.
**Severity:** Trivial.

### 🟢 17. `info()` Helper Defined in Multiple Files
**Files:** `src/routes/manage.ts:16`, `src/routes/auth.ts:12`, `src/routes/admin.ts:11`, `src/routes/media.ts:11`
**Finding:** The same `info()` helper is copy-pasted across four route files. Could be extracted to a shared utility.
**Severity:** Trivial — DRY violation.

---

## WHAT'S DONE WELL ✓

| Area | Assessment |
|------|-----------|
| **CSRF protection** | All mutating routes use `guards.secured` (authenticate + origin + csrf) or explicit equivalents. No gaps. |
| **Authentication** | All protected routes require `guards.authenticate`. Public routes (`/events`, `/products`, `/umkms`, `/media/*`) are correctly unauthenticated. |
| **Authorization** | Every route checks capabilities. Scoped capabilities (own vs all) are correctly used for UMKM and product operations. Role hierarchy (superadmin > admin > perangkat_desa/pelaku_umkm) is enforced. |
| **Error response format** | Consistent `{ error: { message, code } }` across all routes and the global error handler. |
| **SQL injection** | All DB access goes through the `Repository` abstraction (Drizzle). No raw SQL or string interpolation in routes. |
| **Timing attack mitigations** | Dummy hash on failed login; `safeEqual` for CSRF comparison; token hashing before DB lookup. |
| **CSV injection protection** | `escapeCsvCell()` escapes formula prefixes (`=`, `+`, `-`, `@`). |
| **Path traversal prevention** | `media-serve.ts` blocks `..`, encoded slashes/backslashes/null bytes, enforces key format regex. |
| **Content-Type / nosniff** | Media serve sets `X-Content-Type-Options: nosniff` and `Content-Type` from metadata. |
| **Account lockout** | Incremental lockout with configurable attempts/threshold. |
| **Self-action prevention** | Cannot delete yourself, change your own role, or demote the last active superadmin/admin. |
| **Session security** | 32-byte random tokens, SHA-256 hashed in DB, httpOnly cookies, configurable sameSite/secure. |
| **Input validation** | All inputs validated with Zod schemas. UUIDs validated. Enums constrained. Numeric ranges checked. |
| **Coordinates normalization** | Lat/lon validated against world bounds, rounded to 6 decimal places. |
| **Production safety** | `buildApp()` enforces `COOKIE_SECURE`, `CORS_ORIGIN`, S3 storage, and HTTPS-only PUBLIC_SITE_URL in production. |
| **Helmet** | CSP, CORP, and other security headers configured. |
| **Rate limiting** | Global rate limit applied. Login, password change, CSV export, and public events have specific limits. |
| **Error masking** | 5xx errors show "Internal server error" to clients; real error only logged server-side. |
| **Media orphan cleanup** | `refreshMediaOrphans()` called on UMKM/product updates/deletes to prevent dangling storage. |

---

## SUMMARY TABLE

| # | Severity | Category | File | Lines | Description |
|---|----------|----------|------|-------|-------------|
| 1 | 🔴 CRITICAL | Race Condition | manage.ts | 79-86, 211-219 | Idempotency check-set is non-atomic; duplicate creation possible |
| 2 | 🔴 HIGH | Data Integrity | manage.ts | 85, 218 | Placeholder `{pending:true}` returned on crash for 30s |
| 3 | 🔴 HIGH | Scalability | idempotency.ts | 80 | In-memory cache breaks in multi-instance deployments |
| 4 | 🟠 HIGH | Correctness | manage.ts | 168, 294 | `reply.send()` inside transaction callback |
| 5 | 🟠 HIGH | Validation | manage.ts | 120-124 | `null` ownerUserId silently ignored |
| 6 | 🟠 MEDIUM | DOS | manage.ts | 77, 210 | No rate limits on create endpoints |
| 7 | 🟠 MEDIUM | DOS | analytics.ts | 15 | No rate limit on analytics queries |
| 8 | 🟠 MEDIUM | DOS | admin.ts | 28,47,53,59 | No rate limits on admin user mutations |
| 9 | 🟡 MEDIUM | Stability | app.ts | 90 | `app.log.error` may be undefined in test mode |
| 10 | 🟡 MEDIUM | Performance | admin.ts | 77-79 | Unbounded audit log date range |
| 11 | 🟡 LOW | Consistency | media-serve.ts | 17,32 | Raw error construction instead of helper |
| 12 | 🟡 LOW | Authorization | manage.ts | 258 | `canViewUMKM` used for move authorization |
| 13 | 🟡 LOW | Validation | manage.ts | 210-244 | No `sellerName` requirement for standalone products |
| 14 | 🟡 LOW | Design | validation.ts | 24 | `price: 0` ambiguity (free vs unset) |
| 15 | 🟢 TRIVIAL | DRY | manage.ts | 26-37 | Duplicate load helpers |
| 16 | 🟢 TRIVIAL | Docs | policy.ts | 50-53 | Stale "Patch 05" comment |
| 17 | 🟢 TRIVIAL | DRY | 4 files | - | Duplicate `info()` helper |

**Overall Assessment:** The codebase has strong security fundamentals. CSRF, auth, input validation, SQL injection prevention, and error masking are all well-implemented. The primary concerns are the **idempotency implementation** (non-atomic, in-memory only) and **missing rate limits** on several mutating endpoints. No SQL injection vectors were found. No routes are missing auth guards that should have them. No information leakage in error messages.
