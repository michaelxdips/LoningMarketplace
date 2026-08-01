# Feature Matrix & Scope Audit

## 1. Complete Feature Inventory

| Feature Name | Expected Behavior | Backend Contract | DB Dependency | Test Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Public Catalog** | Browse products by category, name, or availability | `GET /api/products` | `products`, `umkms` | Verified (21 UI / 17 API) | `COMPLETE` |
| **UMKM Discovery** | Browse village businesses by category & location | `GET /api/umkms` | `umkms` | Verified | `COMPLETE` |
| **Interactive Map** | View village map with geocoded business pins | `GET /api/umkms/locations` | `umkms` | Verified | `COMPLETE` |
| **WhatsApp Inquiry** | Trigger formatted WhatsApp chat for orders | Client-side format | None | Verified | `COMPLETE` |
| **Extended FAQ** | Accordion FAQs with category search & dev chat | Static client data | None | Verified | `COMPLETE` |
| **Auth & Sessions** | Login with username/email & session cookies | `POST /api/auth/login` | `users`, `sessions` | Verified | `COMPLETE` |
| **Password Reset** | Mandatory change on first login & admin reset | `POST /api/auth/reset` | `users` | Verified | `COMPLETE` |
| **Business Mgmt** | Create, edit, and update business location coordinates | `PUT /api/umkms/:id` | `umkms` | Verified | `COMPLETE` |
| **Product CRUD** | Create, edit, archive, restore, and delete products | `/api/products/*` | `products` | Verified | `COMPLETE` |
| **Media Upload** | Upload product/UMKM photos with WebP conversion | `POST /api/manage/media/images` | `media_assets` | Local fresh upload E2E + isolated storage/integration PASS; production fresh write pending | `LOCAL COMPLETE; PROD OPEN`
| **Inquiry Analytics**| Track inquiry clicks and display dashboard stats | `GET /api/analytics` | `public_events` | Verified | `COMPLETE` |
