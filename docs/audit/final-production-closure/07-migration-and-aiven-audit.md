# Migration & Aiven Database Audit

## 1. Migration History & Journal Verification

All 11 SQL migrations in `backend/drizzle/` have been verified for syntax correctness, transactional safety, and journal synchronization in `backend/drizzle/meta/_journal.json`.

```text
0000_great_frog_thor.sql          : Core tables (users, sessions, umkms, products, media_assets, public_events)
0001_white_paper_doll.sql         : Media storage keys and size metadata columns
0002_keen_edwin_jarvis.sql        : Session expiry indexes and audit fields
0003_workable_captain_cross.sql   : Category enum update and display order indexes
0004_auth_identifier_roles.sql    : MustChangePassword flag and role permissions
0005_trusted_inquiry.sql          : Public events metadata & inquiry tracking
0006_direct_route_event_sources.sql: Analytics source routing columns
0007_public_slugs.sql             : Product & UMKM human-readable slugs
0008_finalize_public_integrity.sql: Backfill product & UMKM unique slug constraints
0009_repair_public_integrity.sql  : Cleanup orphan references & fix constraint triggers
0010_umkm_business_location.sql   : Add latitude, longitude, and address to umkms table
```

---

## 2. Migration Execution Runner (`backend/src/db/migrate.ts`)

The migration runner handles custom data integrity backfills programmatically:

1. Runs migrations up to `0008_finalize_public_integrity`.
2. Invokes `preparePublicIntegrity()` to backfill missing slugs deterministically.
3. Applies remaining migrations (`0008`, `0009`, `0010`).
4. Runs assertion contracts (`assertPublicIntegrity()`, `assertBusinessLocationIntegrity()`).

---

## 3. Database Integrity & Safety Rules

* **Foreign Key Constraints**: All child records (`products.umkm_id`, `sessions.user_id`, `media_assets.created_by_user_id`) enforce `ON DELETE CASCADE` or `ON DELETE SET NULL`.
* **SSL Requirement**: Aiven PostgreSQL requires SSL (`ssl: { rejectUnauthorized: false }` or valid CA certs). The database client in `backend/src/db/client.ts` automatically configures SSL when connecting to remote hosts.
* **Schema Drift**: Zero unapplied migrations or schema drift detected between Drizzle ORM TypeScript definitions (`backend/src/db/schema.ts`) and SQL files.
