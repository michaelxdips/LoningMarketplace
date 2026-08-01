# 06 — Database, Schema & Migration Audit

## 1. Schema Reconstruction & Tables

The Drizzle ORM schema (`backend/src/db/schema.ts`) defines 7 core database tables:

1. `users` — Authentication, user credentials, roles, lockout state.
2. `media_assets` — Managed image metadata, original checksums, thumbnail keys, orphan markers.
3. `umkms` — Village enterprise listings, categories, WhatsApp contacts, geolocation coordinates (`latitude`, `longitude`), publication status.
4. `products` — Product catalog items, prices, availability flags, media references, display order.
5. `public_events` — Privacy-preserving analytics events (views, inquiries, phone copies) with deduplication indexes.
6. `sessions` — Active user sessions, hashed session tokens, CSRF tokens, expiration timestamps.
7. `audit_logs` — Administrative action logging for security auditing.

---

## 2. Migration Audit Inventory

Verified 11 SQL migrations in `backend/drizzle/`:

| Migration File | Primary Focus | Key DDL Changes | Status |
| :--- | :--- | :--- | :--- |
| `0000_great_frog_thor.sql` | Initial Schema | `users`, `umkms`, `products`, `sessions` base tables | `PROVEN` |
| `0001_white_paper_doll.sql` | Media Storage | `media_assets` table and FK references | `PROVEN` |
| `0002_keen_edwin_jarvis.sql` | Enum updates | Publication status & category enums | `PROVEN` |
| `0003_workable_captain_cross.sql` | Analytics | `public_events` table & deduplication constraints | `PROVEN` |
| `0004_auth_identifier_roles.sql` | Security & RBAC | Added `perangkat_desa` & `pelaku_umkm` roles, username checks | `PROVEN` |
| `0005_trusted_inquiry.sql` | Inquiry & Contact | Contact verification timestamps & WhatsApp checks | `PROVEN` |
| `0006_direct_route_event_sources.sql` | Event Sources | Added source tracking for product & catalog views | `PROVEN` |
| `0007_public_slugs.sql` | URL Slugs | Added unique slug indices to `umkms` and `products` | `PROVEN` |
| `0008_finalize_public_integrity.sql` | Data Integrity | FK cascade constraints, non-null checks | `PROVEN` |
| `0009_repair_public_integrity.sql` | Migration Repair | Backfill repair for partial migration states | `PROVEN` |
| `0010_umkm_business_location.sql` | Maps & Geolocation | Added `latitude` & `longitude` numeric(9,6) with range checks | `PROVEN` |

---

## 3. Database Safeguard Testing

Verified database target safety via `scripts/test-disposable-db-safety.mjs`:
* **Valid Targets Accepted**: 3 (Local docker containers `marketplace-loning-local`, test isolated containers `marketplace-loning-test-phase0`).
* **Unsafe Targets Refused**: 19 (Including Aiven hosts, Render hostnames, remote SSL connection strings, production DB names).
