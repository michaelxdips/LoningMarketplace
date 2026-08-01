# Auth & Security Audit

## 1. Password Hashing & Authentication Model

* **Algorithm**: Argon2id (`argon2` npm package) with secure memory and iteration defaults.
* **Sessions**: Database-backed sessions stored in `sessions` table.
* **Cookies**:
  * Name: `loning_session`
  * Flags: `HttpOnly=true`, `SameSite=lax` (or `strict`), `Secure=true` in production.
  * TTL: 7 days default (`SESSION_TTL_HOURS=168`).

---

## 2. Brute Force Protection & Lockout Logic

* **Rate Limiting**: `@fastify/rate-limit` enforces max 10 login attempts per minute per IP on `/api/auth/login`.
* **Account Lockout**: 5 failed consecutive attempts (`LOGIN_MAX_ATTEMPTS`) lock the account for 15 minutes (`LOGIN_LOCKOUT_MINUTES`).
* **Lockout Reset**: Commit `64de975` fixes lockout reset logic by clearing `failedLoginCount` to 0 and setting `lockedUntil` to `null` upon successful authentication or admin password reset.

---

## 3. Authorization & Role Matrix

| Role | Public Catalog | Manage Own UMKM | Manage Own Products | Manage All UMKMs / Users | Access Analytics |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Anonymous** | Read | No | No | No | No |
| **Pelaku UMKM** | Read | Edit (Owned) | Edit (Owned) | No | No |
| **Perangkat Desa** | Read | View | View | No | Read |
| **Admin / Super Admin** | Read | Full | Full | Full | Full |

* **Ownership Enforcement**: Backend routes enforce ownership guards (`req.user.role === 'admin' || umkm.userId === req.user.id`). Attempting to edit another owner's business or product returns HTTP 403 Forbidden.
