# 04 — Feature & Contract Inventory Matrix

## 1. Public Features Matrix

| Feature | Contract / Spec | Source Implementation | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | Hero, Featured UMKM, Category quick nav, Mission, Developer CTA | `frontend/src/pages/HomePage.tsx` | Vitest React Testing Library | `PROVEN` |
| **Product Catalog** | Filter by category, keyword search, price display, status badge | `frontend/src/pages/CatalogPage.tsx` | Unit & integration tests | `PROVEN` |
| **Product Detail** | Slug resolution, legacy ID redirect, image card, owner WhatsApp link | `frontend/src/pages/ProductDetailPage.tsx` | `routes.test.ts`, React tests | `PROVEN` |
| **UMKM Profile** | Slug resolution, category, contact info, product list, map preview | `frontend/src/pages/UMKMDetailPage.tsx` | `location-routes.test.ts` | `PROVEN` |
| **FAQ Page** | Search bar, 4 category filter tabs, 16 accordion questions, Developer CTA | `frontend/src/pages/FaqPage.tsx` | Vitest React tests | `PROVEN` |
| **About Village** | Desa Loning profile, vision/mission, potential highlights | `frontend/src/pages/AboutVillagePage.tsx` | React tests | `PROVEN` |
| **Peta UMKM (Map)** | Interactive Leaflet / OpenStreetMap view with business markers | `frontend/src/pages/PetaUMKMPage.tsx` | `PetaUMKMPage.test.tsx` | `PROVEN` (Branch `phase1...`) |
| **WhatsApp Inquiry** | Modal dialog, prepopulated product text, copy number fallback | `frontend/src/components/shared/WhatsAppInquiryDialog.tsx` | `WhatsAppInquiryDialog.test.tsx` | `PROVEN` |

---

## 2. Authentication & Roles Matrix

| Role Name | Database Value | Scope & Permissions | UI Guard | Backend API Guard | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin` | System-wide admin, manage all users, reset passwords, publish/archive | Protected route | `requireRole(['superadmin'])` | `PROVEN` |
| **ADMIN** | `admin` | Manage catalog, manage UMKM, manage products, view analytics | Protected route | `requireRole(['superadmin', 'admin'])` | `PROVEN` |
| **PERANGKAT_DESA** | `perangkat_desa` | Village official view access & catalog curation | Protected route | Role-checked endpoints | `PROVEN` |
| **PELAKU_UMKM** | `pelaku_umkm` | Manage own UMKM profile and own products | Protected route | Ownership guard (`umkm.ownerUserId === user.id`) | `PROVEN` |

---

## 3. Analytics & Telemetry Matrix

| Event Type | Event Code | Deduplication Rule | Backend Storage | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UMKM View** | `umkm_view` | Anonymous session ID + UMKM ID + 1h bucket | `public_events` table | `PROVEN` |
| **Product View** | `product_view` | Anonymous session ID + Product ID + 1h bucket | `public_events` table | `PROVEN` |
| **Inquiry Started** | `inquiry_started` | Session ID + Product ID + bucket | `public_events` table | `PROVEN` |
| **Message Copied** | `message_copied` | Session ID + Product ID + bucket | `public_events` table | `PROVEN` |
| **WhatsApp Opened** | `whatsapp_opened` | Session ID + Product ID + bucket | `public_events` table | `PROVEN` |
