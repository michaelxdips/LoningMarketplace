# 05 — Bug & Risk Register

## Overview

Identified issues, severity ratings, evidence, and remediation plans.

---

## 1. High-Priority Defects & Risks

### Finding ID: `AUDIT-001`
* **Severity**: S1 (High-risk deployment divergence)
* **Status**: `PROVEN`
* **Area**: Git Version Control / Deployment
* **Claim**: Unpushed commits exist on local feature branches `phase1-public-discovery` and `release/uiux-map-bundle-closure-20260731`.
* **Evidence**: `git branch -vv` shows `phase1-public-discovery` ahead 4 of `origin/phase1-public-discovery`. `release/uiux-map-bundle-closure-20260731` ahead 3.
* **Impact**: Deploying from `master` or triggering GitHub CI directly from remote will miss interactive map location components and DB integrity migration repair `0010`.
* **Recommended Action**: Reconcile feature branches into `master` via pull request or structured commit plan after user approval.

---

### Finding ID: `AUDIT-002`
* **Severity**: S2 (Frontend bundle size warning)
* **Status**: `PROVEN`
* **Area**: Frontend Performance / Vite Build
* **Claim**: Minified JavaScript vendor chunk `index-HENIN0W9.js` exceeds 500 kB (521.50 kB minified / 159.77 kB gzip).
* **Evidence**: Vite build log output during `npm run build`.
* **Impact**: Slower initial page load on 3G/4G mobile networks in rural areas (Desa Loning).
* **Recommended Action**: Implement manual chunk splitting (`manualChunks`) in `frontend/vite.config.ts` for major dependencies (`react-router`, `@tanstack/react-query`, `lucide-react`, `motion`).

---

### Finding ID: `AUDIT-003`
* **Severity**: S3 (S3 Integration Test Skip Warning)
* **Status**: `PROVEN`
* **Area**: Backend Integration Testing
* **Claim**: MinIO / S3 integration tests are safely skipped when MinIO container is not running locally.
* **Evidence**: Vitest output log: `Skipping S3 integration test: MinIO endpoint not reachable in this test runner context`.
* **Impact**: S3 live bucket upload testing is skipped in fast unit mode (runs only in full container mode via `npm run test:integration:isolated`).
* **Recommended Action**: Retain behavior (by design); isolated runner handles full S3 MinIO testing automatically.

---

## 2. Low Severity & Maintenance Debt (S3 / S4)

| Finding ID | Severity | Area | Summary | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `AUDIT-004` | S3 | DB Scripts | Legacy seed files in `backend/src/db/seeds/` retained for historical reference | Maintain in repository |
| `AUDIT-005` | S4 | Documentation | Historical audit documents in `docs/` cover earlier preview tags | Keep as historical record |
