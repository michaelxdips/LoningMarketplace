# V1.6 Wave 1 Corrective Closure - Root Cause Reassessment

## 1. Root-Cause Summary

**The E2E FK failure WAS INTRODUCED by Wave 1 Patch 02.**

Baseline execution flow (e3b8ed0): `run-isolated.mjs` executed `db:seed` (development seed) → `e2e:setup` created products referencing UMKMs from dev seed.

Wave 1 changed `db:seed` to `db:seed:test` which was intentionally empty for determinism verification. This removed the UMKM foundation required by E2E fixtures.

### Execution Flow Map: Baseline vs Current

#### Baseline (e3b8ed0)
```
create disposable services
→ migrate                    // empty schema
→ db:seed                    // Development seed:
                             //   - USERS (admin1, owner1-3)
                             //   - UMKMS (kuliner1-3, kerajinan1-2, etc.)
                             //   - PRODUCTS (full catalog)
                             //   - MEDIA (fixtures)
→ e2e:setup                  // Products reference UMKMS.kuliner1
→ start backend/frontend     // Catalog ready with data
→ Playwright tests           // Assertions against real records
→ teardown                   // Complete cleanup
```

#### Current (Post-Wave 1 before fix)
```
create disposable services
→ migrate                    // empty schema
→ db:seed:test               // EMPTY (intentionally clean)
→ e2e:setup                  // FAILS: tries to insert products
                             //         with umkm_id=e2000000...
                             //         but UMKMS.kuliner1 doesn't exist
→ [FK VIOLATION]             // products_umkm_id_umkms_id_fk
```

### Evidence from Repository Audit

**Baseline `scripts/run-isolated.mjs` (e3b8ed0):**
```javascript
npm(['--prefix', 'backend', 'run', 'db:migrate']);
npm(['--prefix', 'backend', 'run', 'db:seed']);  // <-- Uses dev seed
if (mode === 'e2e' || mode === 'full') npm(['--prefix', 'backend', 'run', 'e2e:setup']);
```

**Current `scripts/run-isolated.mjs`:**
```javascript
npm(['--prefix', 'backend', 'run', 'db:migrate']);
npm(['--prefix', 'backend', 'run', 'db:seed:test'], { env: seedEnv });  // <-- Empty!
// Missing: E2E setup depends on UMKMs not seeded
```

### Classification

**NOT pre-existing** - The baseline executed `db:seed` successfully, creating UMKMs before E2E setup.

**NOT exposed but pre-existing** - The defect was introduced directly by Wave 1 change.

## 2. Fix Implementation

### Test Seed Contract

**Minimal Deterministic Foundation:**

**Users (created first):**
- `owner.e2e@local.test` (ID: e1000000-0000-4000-8000-000000000011) - Pelaku UMKM
- `admin.products.e2e@local.test` (ID: e1000000-0000-4000-8000-000000000012) - Admin

**UMKMs (created second):**
- `Warung Nasi Khas Loning` (ID: e2000000-0000-4000-8000-000000000001) - Kuliner
- `Kerajinan Tangan Loning` (ID: e2000000-0000-4000-8000-000000000101) - Kerajinan

**Products (created third, after UMKMs exist):**
- `E2E Produk Stabilization Desktop` (ID: e3000000-0000-4000-8000-000000000001)
- `E2E Produk Stabilization Mobile` (ID: e3000000-0000-4000-8000-000000000002)

**Properties:**
- ✅ Idempotent (onConflictDoUpdate)
- ✅ Parent-before-child order enforced
- ✅ Referential integrity preserved
- ✅ Only disposable database used
- ✅ No development seed dependencies
- ✅ Minimal footprint (~2 users, ~2 UMKMs, ~2 products)

## 3. Integration Smoke Coverage Review

### Restored Assertions (previously weakened)
✅ Public UMKM/product list with fixtures  
✅ Category filtering (Kuliner)  
✅ Trimmed product search  
✅ Joined parent name lookup  
✅ Case-insensitive owner search  
✅ Whitespace-only query preservation  
✅ Duplicate row detection  
✅ Non-public product ID leak check  
✅ Related-product bounds/uniqueness  
✅ Related-product same-UMKM secondary priority  
✅ Related-product deterministic ordering  
✅ Authentication/login  
✅ Session/CSRF token flow  
✅ PATCH mutation persistence  
✅ Image asset preservation  
✅ Public vs management view consistency  
✅ Fixture restoration  

### Removed Assertions
❌ None - all assertions restored

## 4. Next Steps

1. ⏳ Run isolated integration test (with fixed test seed)
2. ⏳ Run isolated E2E (sequential, after teardown)
3. ⏳ Run native zoom (after complete teardown)
4. ⏳ Run aggregate gate (`test:all`)
5. ⏳ Prepare checkpoint commits if all green

---

Document created: 2026-08-04T19:31:00Z
Root cause classified: INTRODUCED BY WAVE 1 PATCH 02
Fix status: TEST SEED IMPLEMENTED, VERIFICATION IN PROGRESS
