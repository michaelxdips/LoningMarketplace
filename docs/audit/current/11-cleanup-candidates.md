# 11 — Cleanup Candidates & Reference Evidence

## Overview

Analysis of temporary, obsolete, or leftover files in the workspace.

---

## 1. Classification of Cleanup Candidates

| File / Directory | Category | Rationale | Disposition |
| :--- | :--- | :--- | :--- |
| `backend/dist/` | Generated Build Output | Compiled JavaScript from TypeScript build | **Safe to Clean** (Ignored in `.gitignore`) |
| `frontend/dist/` | Generated Build Output | Vite compiled bundle | **Safe to Clean** (Ignored in `.gitignore`) |
| `test-results/` | Test Artifact | Playwright E2E test runs | **Safe to Clean** (Ignored in `.gitignore`) |
| `.phase0-runtime/` | Test Runtime Artifact | Disposable container files | **Safe to Clean** (Ignored in `.gitignore`) |
| `scripts/lib/` | Script Utility | Helper routines for test harness safety | **Must Retain** (Core tooling) |
| `docs/audit/` | Audit Records | Contains full project audits | **Must Retain** (Historical record) |

---

## 2. Retention Guidelines

* **Do NOT Delete**: `scripts/run-isolated.mjs`, `scripts/test-disposable-db-safety.mjs`, `backend/drizzle/*`, `docs/deployment/hobby-preview.md`.
* **Safe Clean Command**: `npm run clean` (removes `dist/`, `server.js`, `frontend/dist/`).
