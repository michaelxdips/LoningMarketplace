# 03 — Architecture Map & System Contracts

## 1. System Architecture Diagram

```text
               +-------------------------------------------+
               |        Browser (Desktop / Mobile)         |
               +---------------------+---------------------+
                                     |
                         HTTPS (Port 443 / 3000)
                                     |
               +---------------------v---------------------+
               |   Frontend SPA (Vercel / React 19)        |
               | - Vite 6 Build                            |
               | - Tailwind CSS v4                         |
               | - React Router v7                         |
               | - TanStack React Query v5                 |
               +---------------------+---------------------+
                                     |
                        REST API (JSON / Cookies)
                                     |
               +---------------------v---------------------+
               |   Backend Service (Render / Fastify 5)    |
               | - TypeScript strict                       |
               | - Zod Env & Schema Validation             |
               | - Fastify Cookie / Helmet / CORS          |
               | - Fastify Rate Limit                      |
               | - Drizzle ORM                             |
               +----------+----------------------+----------+
                          |                      |
            PostgreSQL 16 |                      | S3 Protocol
            (Aiven / Local Docker)               v
               +----------v----------+ +--------------------+
               | PostgreSQL Database | | Media Storage      |
               | - 11 Drizzle SQL    | | - S3 / R2 (Cloud)  |
               |   Migrations        | | - Local storage/   |
               +---------------------+ +--------------------+
```

---

## 2. Configured System Contracts

### Frontend Subsystem (`frontend/`)
* **Framework**: React `19.0.1`, Vite `6.2.3`, TypeScript `5.8.2`.
* **Styling**: Tailwind CSS `4.1.14` (via `@tailwindcss/vite` plugin).
* **State & Data Fetching**: `@tanstack/react-query` `5.101.2`.
* **Routing**: `react-router` `7.18.1`.
* **Icons & Animation**: `lucide-react`, `motion`.

### Backend Subsystem (`backend/`)
* **Server Framework**: Fastify `5.6.1`.
* **Database Driver & ORM**: Drizzle ORM `0.45.2`, `postgres` `3.4.7`.
* **Authentication & Password Hashing**: Argon2 `0.45.0`, HTTP-Only session cookies with `loning_session` name.
* **Image Processing**: `sharp` `0.35.3` (generating cards & thumbnails).
* **Validation**: Zod `4.1.12`.

---

## 3. Environment & Configuration Security

* `DATABASE_URL`: Must be a valid PostgreSQL connection string. Rejected in production if pointing to localhost.
* `CORS_ORIGIN`: Must be a single explicit URL (no wildcard `*`, no comma-separated list).
* `COOKIE_SECURE`: Enforced as `true` when `NODE_ENV=production`.
* `MEDIA_STORAGE_DRIVER`: Enforced as `s3` when `NODE_ENV=production`.
* `PUBLIC_SITE_URL`: Enforced as HTTPS origin in production.
