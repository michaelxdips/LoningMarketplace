# Prioritized Remediation & Action Plan

## 1. Action Items by Priority Level

### P0 — Production Configuration Safety (Pre-Flight Cleanup)

* **Task P0-1: Clean Render Start Command (`render.yaml`)**:
  * **File**: `render.yaml`
  * **Current**: `startCommand: npm run db:seed --workspace=backend && npm start --workspace=backend`
  * **Target**: `startCommand: npm start --workspace=backend`
  * **Reason**: Prevents redundant seed attempts during Render container boots.

---

### P1 — Release Tag Synchronization

* **Task P1-1: Update Release Tag**:
  * **Current Tag**: `v1.5.0` at `6f64445`
  * **Target Action**: Tag latest HEAD commit `64de975` as `v1.5.0-closure` or release `v1.5.1`.
  * **Reason**: Ensures release tag reflects all backend login lockout bug fixes.

---

### P2 — Documentation & Maintenance Cleanup

* **Task P2-1: Commit Final Closure Audit Documentation**:
  * **Action**: Track and commit `docs/audit/final-production-closure/` directory.

* **Task P2-2: Side Branch Pruning**:
  * **Branches**: `phase0-reliability-closure`, `deployment/hobby-preview`, `docs/readme-overhaul-20260731`.
  * **Action**: Safely delete fully-merged branches after human confirmation.
