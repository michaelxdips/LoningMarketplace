# 09 — Security & Secrets Audit

## 1. Secrets Scan & Credentials Safety

* **Tracked Credentials Scan**: Clean. Zero hardcoded passwords, secret keys, or production connection strings present in tracked code files.
* **Environment Files**: Local `.env` files contain default development placeholders only (`postgresql://loning_test:loning_disposable_only@127.0.0.1:5432/loning_dev`).
* **Git History**: Checked recent history and tags (`v1.4.0-preview.1`, `v1.5.0-preview.1`, `v1.5.0-preview.2`); no secrets committed.

---

## 2. Authentication & Session Security

* **Password Hashing**: Uses Argon2 (`argon2` package) with standard secure memory and iterations parameters.
* **Session Strategy**: Hashed session token stored in PostgreSQL `sessions` table.
* **Cookie Protection**:
  * Name: `loning_session` (configurable).
  * Directives: `HttpOnly`, `Path=/`, `SameSite=Lax`.
  * `Secure`: Automatically required when `NODE_ENV=production`.
* **Brute-Force & Lockout Protection**:
  * Configured via `env.ts`: `LOGIN_MAX_ATTEMPTS=5`, `LOGIN_LOCKOUT_MINUTES=15`.
  * Dedicated rate-limiting on login route (`/api/v1/auth/login`) via `@fastify/rate-limit`.

---

## 3. Web & API Protection Security

* **CORS Policy**: Configured via `@fastify/cors`. Enforces single explicit origin matching `CORS_ORIGIN`. Rejects wildcard `*` or multi-origin lists in production.
* **Security Headers**: Managed via `@fastify/helmet`. Configured with Content Security Policy (`CSP`), anti-clickjacking frame guards, and HTTPS enforcement.
* **CSRF Mitigation**: Hashed `csrfTokenHash` validated on mutating state actions.
* **SQL Injection**: Prevented by parameterized query compilation in Drizzle ORM.
