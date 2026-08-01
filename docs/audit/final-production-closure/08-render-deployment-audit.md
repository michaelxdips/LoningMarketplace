# Render Deployment Audit

## 1. Web Service Configuration Summary

```text
Service Name    : loning-preview
Runtime         : Node.js (Node >= 20 < 27)
Instance Plan   : Free Tier
Build Command   : npm ci && npm run build:backend
Start Command   : npm run db:seed --workspace=backend && npm start --workspace=backend  <-- AUDIT ITEM
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

---

## 3. Findings & Recommendations for Render

1. **Remove Seed Command from `startCommand`**:
   Change `startCommand` in `render.yaml` from:
   `npm run db:seed --workspace=backend && npm start --workspace=backend`
   to:
   `npm start --workspace=backend`

2. **Health & Readiness Check**:
   The `/api/health` route responds with `{ status: "ok", timestamp: "..." }` and returns HTTP 200, satisfying Render's zero-downtime health check requirements.
