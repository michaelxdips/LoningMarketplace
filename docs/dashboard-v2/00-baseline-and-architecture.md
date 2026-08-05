# Phase A — Baseline & Architecture Report

## Baseline Metadata
- **Parent Commit**: `e52f094` (`docs(audit): finalize V1.6 verification report`)
- **Baseline Tag**: `v1.6.0`
- **Target Branch**: `feature/v1.6.1-dashboard-v2`
- **Node Environment**: `>=20 <27` (npm workspace root + frontend & backend)
- **Safety Gate**: Clean working tree, all unit tests & builds PASSing on baseline (`v1.6.0`).

---

## Route & Endpoint Map

### Frontend Routes (`frontend/src/main.tsx`)
- `/` — Homepage (Public Discovery)
- `/faq`, `/tentang-desa`, `/tentang-kami`, `/peta-umkm`, `/produk/:identifier`, `/umkm/:identifier` (Public)
- `/login` — Login (PublicOnlyGuard)
- `/change-password` — Self-Service Change Password (ProtectedGuard + PasswordGuard)
- `/dashboard` — Dashboard Shell & Pages (ProtectedGuard + PasswordGuard + CapabilityGuard `dashboard:view`):
  - `/dashboard` — Operational Overview (`DashboardHome`)
  - `/dashboard/umkms` — UMKM List (`UMKMListPage`)
  - `/dashboard/umkms/new` & `/dashboard/umkms/:id` — UMKM Form (`UMKMFormPage`)
  - `/dashboard/umkms/:id/location` — Location Map (`BusinessLocationPage`)
  - `/dashboard/products` — Product List (`ProductListPage`)
  - `/dashboard/products/new` & `/dashboard/products/:id` — Product Form (`ProductFormPage`)
  - `/dashboard/users` — User List (`UserListPage`)
  - `/dashboard/users/new` & `/dashboard/users/:id` — User Form (`UserFormPage`)
  - `/dashboard/analytics` — Insight Inquiry (`InquiryAnalyticsPage`)
  - `/dashboard/audit` — Audit Log (`AuditListPage`)

### Backend Route Groups (`backend/src/routes/`)
- `/api/v1/auth` (`auth.ts`): `/login`, `/logout`, `/session`, `/change-password`
- `/api/v1/manage` (`manage.ts`): `/overview`, `/umkms`, `/products`, `/media`
- `/api/v1/admin` (`admin.ts`): `/users`, `/audit-logs`, `/reset-password`, `/revoke-sessions`
- `/api/v1/admin/inquiry-analytics` (`analytics.ts`): Inquiry analytics endpoints

---

## Role & Capability Matrix

| Role | Label Bahasa | Capability Overview | Scope |
| --- | --- | --- | --- |
| `superadmin` | Administrator Utama | Global admin, access users, audit, analytics, all UMKM/products | Global |
| `admin` | Administrator | Operational admin, access users/audit/analytics based on policy | Global |
| `perangkat_desa` | Perangkat Desa | Operational access to UMKM and product catalog management | Global read/manage |
| `pelaku_umkm` | Pelaku UMKM | View & manage own UMKM and products only | Owner-scoped |

---

## Technical Audit & Identified Issues

1. **Insight Inquiry 500 Error**:
   - `inquiryAnalyticsByTarget` in `backend/src/db/repository.ts` uses `db.execute(sql...)` which returns a `QueryResult` object (`{ rows: [...] }`) when backed by `pg`.
   - In `backend/src/routes/analytics.ts`, `Array.from(breakdown)` is called directly on `breakdown`. Calling `Array.from` on an uniterable object throws a `TypeError: breakdown is not iterable`, resulting in HTTP 500 `Internal server error`.
   - In addition, range validation rejects single-day queries (`from == to`) because `to <= from` check is strictly applied without inclusive end-of-day handling.

2. **Audit Log Presentation**:
   - Audit logs currently render raw action strings (`auth.login_succeeded`) and unformatted JSON metadata (`<pre>{...}</pre>`), exposing raw technical keys instead of human-readable Indo translations.

3. **Profile Menu & Change Password**:
   - `DashboardShell` currently has a basic bottom sidebar drawer item for user info and exit, but lacks an accessible Profile Menu component with keyboard navigation, role badge, and link to password change.

4. **Operational Overview (`DashboardHome`)**:
   - Uses static numbers / basic fallback card placeholders. Needs full capability & role-aware metrics, active/draft alerts, recent activity feed, and brief insight breakdown.

5. **Management Views (UMKM, Products, Users)**:
   - Need responsive data lists, improved card layouts on mobile, clear status badges, confirmation modals, and robust error/empty/loading states.
