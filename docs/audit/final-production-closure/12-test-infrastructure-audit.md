# Test Infrastructure & Verification Audit

## 1. Test Suite Coverage & Execution Summary

* **Frontend Unit & Component Tests (Vitest + React Testing Library)**:
  * **Pass Rate**: 100% (21 test files, 127 tests passed).
  * **Coverage Areas**: Canonical route navigation, SEO tags, URL parsers, location helpers, React Query hooks, WhatsApp inquiry dialogs, management forms, business location pages, and accessibility headers.

* **Backend Unit & Integration Tests (Vitest + Fastify Inject)**:
  * **Pass Rate**: 100% executed (16 test files passed; 4 S3 tests skipped without isolated storage harness; 181 tests passed, 4 skipped).
  * **Coverage Areas**: Auth authentication, rate limiting, role security, password reset, media management, Drizzle migrations, database reset guards, location integrity assertions, and sitemap generation.

---

## 2. Test Execution Evidence

```text
npm run lint                         PASS
npm run test                         PASS
  Frontend: 21 files, 127 tests
  Backend: 16 files passed, 181 tests passed, 4 S3 tests skipped
npm run build:all                    PASS
npm run test:integration:isolated    PASS
  API smoke: 11 UMKMs, 40 products, authenticated PATCH persisted/restored
  MinIO restart persistence: exact checksum/bytes/HeadObject/GetObject PASS
  DB audit: orphan/stale/unreferenced media checks PASS
npm run test:e2e:isolated -- e2e/products.spec.ts PASS
  6 tests: product and UMKM fresh upload flows on desktop/mobile
```

Production fresh upload/write/read verification is not included in these local gates.

---

## 3. Test Isolation & Safety Architecture

* **Local Database Guard (`scripts/test-disposable-db-safety.mjs`)**: Prevents tests from running against non-local hostnames or databases lacking explicit test markers.
* **Isolated Runner (`scripts/run-isolated.mjs`)**: Boots dedicated temporary Docker Postgres containers or isolated schemas for integration & migration tests.
