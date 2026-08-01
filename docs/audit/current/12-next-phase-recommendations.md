# 12 — Feature-Gap & Next-Phase Recommendations

## Overview

Proposed feature additions and technical enhancements strictly aligned with the platform purpose of **Loning Maju** (Public Digital Catalog & Discovery for UMKM Desa Loning).

Explicitly Out-of-Scope (Excluded): Cart, Checkout, Payments, Shipping, Inventory transactions, Public registration, CRM, WhatsApp Business API.

---

## 1. Feature Recommendations Scoring

| Proposed Feature | User Value (1-5) | Operational Value (1-5) | Implementation Cost (1-5) | Risk (1-5) | Dependency Readiness (1-5) | Category |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Interactive Map (Peta UMKM)** | 5 | 4 | 2 | 1 | 5 | **Must Fix / Merge First** |
| **Vendor Chunk Splitting** | 4 | 5 | 1 | 1 | 5 | **High-Value Next Release** |
| **Dynamic Sitemap Generator** | 4 | 4 | 2 | 1 | 5 | **High-Value Next Release** |
| **Admin Activity Audit Trail UI** | 3 | 5 | 2 | 1 | 5 | **Valuable Optional** |
| **Analytics Conversion Summary**| 4 | 5 | 2 | 1 | 5 | **Valuable Optional** |
| **CSV Export for UMKM Catalog** | 3 | 4 | 1 | 1 | 5 | **Valuable Optional** |

---

## 2. Priority Roadmap

### Phase 1.5 — Stabilization & Map Integration (Current Focus)
1. Reconcile and merge `phase1-public-discovery` into `master`.
2. Push tag `v1.5.0-preview.2` to remote GitHub repository.
3. Configure manual chunk splitting in `frontend/vite.config.ts`.

### Phase 1.6 — SEO & Analytics Enhancements
1. Dynamic XML sitemap generator route (`/sitemap.xml`) populated from live DB slugs.
2. Privacy-preserving inquiry conversion dashboard for village administrators (`PERANGKAT_DESA` / `ADMIN`).
3. Automated backup verification documentation for Aiven PostgreSQL.
