# 14 — Command Evidence Log

## Audit Execution Trail

| Command Executed | Environment | Exit Code | Pass Count | Fail / Error Count | Key Findings / Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `git status --branch --short` | Local Repository | `0` | - | - | Active branch `master`, working tree clean |
| `git branch -vv` | Local Repository | `0` | - | - | Discovered `phase1-public-discovery` ahead 4, `release/uiux...` ahead 3 |
| `git fetch --all --prune` | Remote Check | `0` | - | - | Remote refs up to date with local origin refs |
| `npm run lint` | Workspaces | `0` | 2 | 0 | 0 lint errors across frontend and backend |
| `npm run typecheck` | Workspaces | `0` | 2 | 0 | 0 TypeScript errors across frontend and backend |
| `npm test` | Vitest Workspaces | `0` | 307 | 0 | 126 frontend + 181 backend tests passed |
| `npm run precloud:check` | Local Runner | `0` | Pass | 0 | Static health & storage pre-cloud check clean |
| `npm run test:harness-safety`| Node Harness | `0` | 22 | 0 | 3 valid disposable targets allowed, 19 refused |
| `npm run build` | Vite + tsc | `0` | 2 | 0 | Built `frontend/dist` and `backend/dist` cleanly |
