# Render Deployment Audit

## 1. Web Service Configuration Summary

```text
Service Name    : loning-preview
Runtime         : Node.js (Node >= 20 < 27)
Instance Plan   : Free Tier
Build Command   : npm ci && npm run build:backend
Start Command   : npm run db:migrate --workspace=backend && npm start --workspace=backend
Health Check    : /api/health
Auto Deploy     : Off (Manual / Triggered)
```

---

## 2. Environment Variables Verification

| Key | Expected Production Value | Status / Risk |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | `PRESENT` |
| `PORT` | `10000` (Assigned by Render) | `PRESENT` |
| `HOST` | `0.0.0.0` | `PRESENT` |
| `DATABASE_URL` | Aiven PostgreSQL connection string | `PRESENT` (Masked) |
| `CORS_ORIGIN` | Vercel production frontend URL | `PRESENT` |
| `TRUST_PROXY` | `true` | `PRESENT` |
| `COOKIE_SECURE` | `true` | `PRESENT` |
| `MEDIA_STORAGE_DRIVER` | `s3` | `PRESENT` |
| `S3_BUCKET` | S3 bucket name | `PRESENT` |
| `S3_REGION` | S3 region string | `PRESENT` |

* **Current deployment config**: `MEDIA_STORAGE_DRIVER=s3`; storage endpoint, bucket, and credentials remain Render-managed secrets.
* **Current startup config**: migration-only, no development seed.
* **Cloud freshness boundary**: repository config does not prove a fresh production upload; live write/read evidence remains pending.

---

## 3. Findings & Verification for Render

1. **Startup Safety**: `render.yaml` now runs `db:migrate` followed by application startup. It does not run `db:seed`.
2. **Health & Readiness Check**: The `/api/health` route responds with `{ status: "ok", timestamp: "..." }` and returns HTTP 200 in local isolated integration verification.
3. **Cloud Evidence Boundary**: This report verifies repository configuration. It does not claim a fresh production upload until the guarded live test is executed.
