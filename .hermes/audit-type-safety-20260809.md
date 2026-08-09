# Type Safety & Code Quality Audit — Loning Maju
**Date:** 2026-08-09 | **Files Audited:** 210 (.ts/.tsx)

---

## Summary of Findings

| Category | Count | Severity |
|---|---|---|
| Swallowed Errors (silent catch) | 5 | 🔴 HIGH |
| `as any` type assertions | 18 | 🟡 MEDIUM |
| Non-null assertions (`!`) | 111 | 🟡 MEDIUM |
| Missing return types on exported fns | 80 | 🟡 MEDIUM |
| `Promise.all` without `.catch()` | 17 | 🟡 MEDIUM |
| `new Date()` without explicit TZ | 77 | 🟢 LOW/MEDIUM |
| Implicit `any` params | 61 | 🟢 LOW (mostly false-positives) |
| Array `[0]` without null guard | 30 | 🟢 LOW/MEDIUM |
| Switch without default | 0 | ✅ CLEAN |

---

## 🔴 CRITICAL: Swallowed Errors

### 1. `frontend/src/lib/share.ts:5` — Non-AbortError exceptions silently swallowed
```ts
catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'; }
```
Non-AbortError exceptions fall through with no handling and `undefined` return. Should re-throw or return an explicit error result.

### 2. `frontend/src/hooks/useAuth.ts:11` — Conditional re-throw leaves gap
```ts
catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
```
**CORRECT** — error IS re-thrown for non-401s. Confirmed safe. ✅

### 3. `frontend/src/lib/api.ts:104` — JSON parse failure during upload swallows error
```ts
try { body = JSON.parse(request.responseText); } catch (e) { /* leave body empty */ }
```
Silently continues with empty body. If the response is non-JSON but success, it'll reject with a confusing "Upload gambar gagal." error instead of surfacing the actual parse failure.

### 4. `frontend/src/lib/api.ts:31` + `frontend/src/lib/api.ts:95` — localStorage access swallowed
```ts
try { return localStorage.getItem('loning_session_token'); } catch { return null; }
```
While `getItem` rarely throws outside sandboxed iframes, silently swallowing it is still a smell.

### 5. `backend/tests/seed-safety.test.ts:31` — Empty catch in test
```ts
try { assertSafeSeedTarget(profile, env); throw new Error('expected refusal'); }
catch (error) { expect(String(error)).toContain('REFUSED'); ... }
```
**CORRECT** — this is a test pattern verifying that `assertSafeSeedTarget` throws. The catch IS the assertion. ✅

---

## 🟡 MEDIUM: Non-Null Assertions (`!`) — 111 instances

**Hotspots:**
- `backend/src/routes/manage.ts`: 42 uses (lines 45,51,55,61,68,69,74,91,100,114,130,137,141,147,150,154,162,165,170,178,187,193,202,207,228,235,249,256 + more)
- `backend/src/routes/admin.ts`: 17 uses
- `backend/src/routes/auth.ts`: ~10 uses

**Analysis:** Most are `request.auth!.user` in route handlers guarded by `guards.authenticate`. The `!` is technically safe because the `authenticate` preHandler guarantees `request.auth` is populated before the handler runs. However, this couples the handler to the guard implementation and would silently fail if a route accidentally omits the guard. 

**Recommendation:** Create a typed wrapper like `AuthenticatedRequest` that extends FastifyRequest with `auth: NonNullable<AuthContext>`, or a helper `req.auth` that throws if missing. This eliminates 90% of `!` usages.

---

## 🟡 MEDIUM: `as any` Type Assertions — 18 instances

**Production code:**
| File | Line | Context |
|---|---|---|
| `backend/src/db/repository.ts` | 141 | `(res as any)?.rows` — Drizzle raw SQL result type |

**Test/scratch files:** 17 instances in test files and scratch scripts. These are intentional test mocks and disposable scripts.

**Analysis:** The production `as any` is handling Drizzle's `db.execute()` raw SQL return type which doesn't have proper TypeScript types. Acceptable but could be replaced with a proper typed wrapper.

---

## 🟡 MEDIUM: Missing Return Types on Exported Functions — 80 instances

**Key production functions without return type:**
- `buildApp()` — `backend/src/app.ts:51`
- `createGuards()` — `backend/src/auth/guards.ts:22`
- All route registration functions (adminRoutes, authRoutes, manageRoutes, etc.)
- All seed functions (seedUsers, seedUmkms, seedProducts)
- Multiple React components (PageHeader, Field, MediaField, ConfirmDialog, ProductGallery, etc.)

**Risk:** Without explicit return types, TypeScript infers the type. If the implementation changes, the return type can silently change, breaking consumers. This is most dangerous for library/API functions.

---

## 🟡 MEDIUM: `Promise.all` Without Error Handling — 17 instances

**Production code:**
- `backend/src/db/repository.ts:148,152` — `mediaReferenceCount` and `refreshMediaOrphans` — rely on Drizzle throwing
- `backend/src/db/backfill-slugs.ts:24,29` — preflight checks — errors propagate to caller
- `backend/src/routes/analytics.ts:23` — inquiry analytics — errors propagate to route handler
- `frontend/src/hooks/useAuth.ts:47` — `cancelQueries` — non-critical; errors are acceptable
- `frontend/src/pages/VersionHistoryPage.tsx:261` — GitHub API fetches — should handle rate limits

**Test/e2e files:** Remaining instances are in test files where errors bubble to the test runner naturally.

**Analysis:** Most are defensible — `Promise.all` rejects fast, and the error propagates up. The real concern is `VersionHistoryPage.tsx:261` which calls GitHub's public API without error handling for rate limits.

---

## 🟢 LOW: Date Timezone Issues — 77 instances

**Analysis:** The `csvFilename` function uses `new Date()` which creates a local-time ISO string for the filename. This is intentional — the filename reflects the server's local date. Analytics route `parseUtcDate` properly uses `T00:00:00.000Z` suffix. Most other `new Date()` calls are in seeds, tests, or use `.toISOString()` immediately. **No actual timezone bugs found.**

---

## 🟢 LOW: Switch Default Analysis

`frontend/src/components/business/UMKMImage.tsx:21,50` — Both switch statements HAVE `default` cases. ✅ **Confirmed clean.**

---

## 🟢 LOW: Implicit `any` Parameters — 61 flagged

**Analysis:** The vast majority are false positives from destructured props in React components. Example: `function PageHeader({ title, description, action })` — these params are typed by the destructured type annotation `{ title: string; description: string; action?: ReactNode }` which follows on the same line. The regex-based scanner doesn't see the full annotation. **Nearly all are false positives.**

**Real implicit any found:**
- `frontend/src/hooks/useUnsavedChanges.tsx:13` — `initialDirty = false` (default param without explicit type)
- `frontend/src/hooks/discovery/useDiscoveryUrlState.ts:13-14` — same pattern

---

## 🔎 Detailed File-by-File Recommendations

### `backend/src/db/repository.ts` (Line 141)
```ts
// Current:
const rows: Record<string,unknown>[] = Array.isArray(res) ? res : ((res as any)?.rows ?? []);
// Fix: Create typed interface for raw SQL result
interface DrizzleRawResult<T = Record<string, unknown>> { rows: T[] }
```

### `frontend/src/lib/share.ts` (Line 5)
```ts
// Current:
catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'; }
// Fix: re-throw unexpected errors
catch (error) { 
  if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'; 
  throw error;
}
```

### `frontend/src/lib/api.ts` (Line 104)
```ts
// Current:
try { body = JSON.parse(request.responseText); } catch (e) { /* leave body empty */ }
// Fix: return parse error instead of generic message
try { body = JSON.parse(request.responseText); } 
catch { reject(new ApiError(request.status, 'Respon server tidak valid.', 'PARSE_ERROR')); return; }
```

### `frontend/src/pages/VersionHistoryPage.tsx` (Line 261)
```ts
// Current: Promise.all without error handling for GitHub API
const [page1Res, page2Res, tagsRes] = await Promise.all([...]);
// Fix: wrap in try/catch with fallback UI
```

### Non-null assertion cleanup (priority: `manage.ts`, `admin.ts`)
Create a helper:
```ts
function assertAuth(req: FastifyRequest): AuthContext {
  if (!req.auth) throw new Error('Auth guard missing');
  return req.auth;
}
// Then: const auth = assertAuth(request); auth.user.role // no !
```

---

## ✅ Areas of Strength

1. **CSV formula injection prevention** — `escapeCsvCell` properly sanitizes formula prefixes (`=`, `+`, `-`, `@`)
2. **Timing-safe comparison** — `safeEqual` uses `timingSafeEqual` for CSRF token comparison
3. **Input validation** — Consistent use of Zod schemas with `safeParse` pattern
4. **Idempotency** — Proper idempotency key handling for UMKM/product creation
5. **SQL injection prevention** — Uses Drizzle ORM parameterized queries throughout
6. **Error boundary** — React `PageErrorBoundary` properly catches render errors and avoids logging PII
7. **CSV export** — Handles null/undefined, BOM for Excel compatibility, proper quoting
8. **Password hashing** — Uses argon2id with appropriate parameters
9. **Switch exhaustiveness** — All switch statements have default cases
10. **Audit metadata sanitization** — `sanitizeMetadata` filters sensitive keys before logging

---

## Action Items (Priority-Ordered)

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Fix `share.ts` swallowed error (re-throw) | Prevents silent failures | 1 line |
| 2 | Fix `api.ts:104` swallowed parse error | Better error UX | ~5 lines |
| 3 | Add error handling to `VersionHistoryPage` GitHub fetch | Graceful rate-limit handling | ~10 lines |
| 4 | Create `assertAuth()` helper to eliminate ~90 `!` | Type safety + refactor | ~20 lines |
| 5 | Add return types to route registration functions | API contract safety | ~30 lines |
| 6 | Add return types to React components | Prevent silent prop drift | ~40 lines |
| 7 | Replace `as any` in `repository.ts:141` with typed interface | Type safety | ~5 lines |
