# Prioritized Remediation & Action Plan

## 1. Action Items by Priority Level

### P0 — Production Configuration Safety (Pre-Flight Cleanup)

* **Task P0-1: Clean Render Start Command (`render.yaml`)**:
  * **File**: `render.yaml`
  * **Current**: `startCommand: npm run db:migrate --workspace=backend && npm start --workspace=backend`
  * **Status**: `CLOSED IN SOURCE`; no development seed runs during Render startup.
  * **Reason**: Prevents redundant seed attempts during Render container boots.

---

### P1 — Release Tag Synchronization

* **Task P1-1: Update Release Tag**:
  * **Current Tag**: `v1.5.0` at `6f64445`
  * **Target Action**: Tag the final audited HEAD as `v1.5.0-closure` or release `v1.5.1` after guarded production verification and documentation review.
  * **Reason**: Ensures the release identifier reflects the audited source state.

---

### P2 — Documentation & Maintenance Cleanup

* **Task P2-1: Commit Final Closure Audit Documentation**:
  * **Action**: Track and commit `docs/audit/final-production-closure/` directory after report review.
  * **Status**: `CLOSING IN THIS CHECKPOINT COMMIT`.

* **Task P2-2: Guarded Production Media Verification**:
  * **Action**: Execute one approved fresh product or UMKM upload against `https://www.loningmaju.my.id`, then verify response, object persistence, public reload, decoded dimensions, and cleanup.
  * **Status**: `PENDING HUMAN APPROVAL`.

* **Task P2-3: Side Branch Pruning**:
  * **Branches**: `phase0-reliability-closure`, `deployment/hobby-preview`, `docs/readme-overhaul-20260731`.
  * **Action**: Safely delete fully-merged branches after human confirmation.
