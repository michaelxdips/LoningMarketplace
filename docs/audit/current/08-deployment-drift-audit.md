# 08 — Deployment & Cloud Drift Audit

## 1. Provider Topology Overview

```text
  +-----------------------------------------------------------------+
  |                       Vercel (Frontend SPA)                     |
  |  - Serves static assets built by Vite                           |
  |  - vercel.json SPA rewrite route: /(.*) -> /index.html           |
  |  - VITE_API_URL points to Render backend API                     |
  +--------------------------------+--------------------------------+
                                   |
                       API Requests (HTTPS)
                                   |
  +--------------------------------v--------------------------------+
  |                       Render (Fastify API)                      |
  |  - Fastify web service (render.yaml / npm start)                |
  |  - Configured with explicit CORS_ORIGIN & COOKIE_SECURE=true    |
  |  - Health checks: GET /api/health (200), GET /api/ready         |
  +--------------------------------+--------------------------------+
                                   |
                       Database Connections (TLS)
                                   |
  +--------------------------------v--------------------------------+
  |                   Aiven (Managed PostgreSQL 16)                 |
  |  - Managed PostgreSQL 16 cluster                                |
  |  - Enforces SSL connection requirement                          |
  +-----------------------------------------------------------------+
```

---

## 2. Deployment Configuration Inspection

### Vercel (`vercel.json`)
* **Rewrites**: `[ { "source": "/(.*)", "destination": "/index.html" } ]`
* **Purpose**: Prevents 404 errors when users refresh deep links (e.g. `/umkm/dapur-loning`, `/faq`, `/tentang-desa`).

### Render (`render.yaml`)
* **Type**: Web Service (`loning-preview`).
* **Build Command**: `npm ci && npm run build`
* **Start Command**: `npm start --workspace=backend`
* **Health Check Path**: `/api/health`

### Backend Web Adapter (`backend/src/app.ts`)
* **Production Static Adapter**: Supports same-origin serving of `frontend/dist` when hosted as a unified service, while insulating `/api/*` and `/media/*` endpoints.

---

## 3. Drift Analysis

* **Local Code vs `origin/master`**: Synchronized at commit `94bbe08`.
* **Database Migrations on `master`**: All 11 Drizzle SQL migrations (`0000` to `0010_umkm_business_location.sql`) are tracked on `master`.
* **Map & UI Features on `master`**: `PetaUMKMPage.tsx`, `BusinessLocationPage.tsx`, and expanded FAQ components are tracked on `master`.
* **Side Branches**: Confirmed outdated. `master` is the sole authoritative branch for deployments.
