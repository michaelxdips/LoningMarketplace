# Seed & Bootstrap System Audit

## 1. Deep Dive: Seed Execution Chain

Render Deployment Start Command:
  npm run db:migrate --workspace=backend && npm start --workspace=backend
                         |
                         v
  backend/src/db/migrate.ts:
    Applies recorded migrations and integrity assertions.

  backend/src/db/seed.ts:
    Explicit local/test command only; production execution is guarded and not part of startup.

---

## 2. Risk Assessment Matrix

### Risk 1: Accidental Seed Execution in Production
* **Severity**: `S1 — High`
* **Previous Trigger**: Render startup invoked `db:seed`.
* **Current Status**: `CLOSED IN CONFIG`; active `render.yaml` runs migration only. The code guard remains defense in depth.

### Risk 2: Local Filesystem Dependency in `seedMedia`
* **Severity**: `S1 — High`
* **Current Status**: `CONTAINED`; seed is explicit local/test setup and is not part of Render startup.
* **Impact if invoked in production**: `seedMedia` reads `../assets/seed-source/*.jpg`; missing source assets can throw `ENOENT: no such file or directory`.
* **Remaining Evidence**: Fresh production upload/read verification is still pending.

---

## 3. Seed Data Breakdown

* **User Seed (`backend/src/db/seeds/development/users.ts`)**: Provisions 2 admins (`admin1@local.test`, `admin2@local.test`), 2 active UMKM owners (`owner1@local.test`, `owner2@local.test`), and 1 inactive owner. Default password: `admin1234`.
* **UMKM Seed (`backend/src/db/seeds/development/umkms.ts`)**: Provisions 15 UMKM business entries spanning Kuliner, Kerajinan, Jasa, Sembako, and Pertanian categories.
* **Product Seed (`backend/src/db/seeds/development/products.ts`)**: Provisions 52 catalog items with pricing, descriptions, and deterministic IDs (`e3000000-%`).
* **Media Seed (`backend/src/db/seeds/development/media.ts`)**: Converts raw JPEG assets into WebP card & thumbnail images and uploads to the active storage driver.

---

## 4. Admin Provisioning Strategy (Recommended Architecture)

Production deployment should never rely on demo seeding. Instead, use the dedicated, idempotent admin provisioning script:

```bash
# Provision initial admin account in production safely
npm run admin:create --workspace=backend
```

This script reads `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and `BOOTSTRAP_ADMIN_DISPLAY_NAME` environment variables and creates the initial super admin account without wiping existing production data or inserting fake catalog items.
