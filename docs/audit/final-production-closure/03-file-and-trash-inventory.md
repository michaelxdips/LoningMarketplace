# File & Trash Inventory

## 1. Directory Structure Inventory

```text
/
├── .antigravity/            # Agent metadata (Ignored)
├── assets/                  # Public brand assets & seed source photos
├── backend/                 # Fastify backend application
│   ├── dist/                # Build output (Ignored)
│   ├── drizzle/             # SQL migrations & snapshots
│   ├── src/                 # TypeScript source code
│   └── storage/             # Local media storage fallback (Ignored in git)
├── docs/                    # Architectural & audit documentation
├── e2e/                     # Playwright E2E test suites
├── frontend/                # Vite React frontend application
│   ├── dist/                # Frontend build output (Ignored)
│   └── src/                 # React UI code
├── render.yaml              # Render deployment configuration
└── vercel.json              # Vercel deployment configuration
```

---

## 2. Tracked File Health

* **Tracked Source Files**: 100% compliant with TypeScript standards.
* **Build Artifacts**: Appropriately added to `.gitignore` (`frontend/dist`, `backend/dist`, `node_modules`).
* **Secrets**: No secrets checked into tracked files (`.env` files ignored; `.env.example` contains only localhost placeholders).

---

## 3. Untracked & Ignored Artifact Inventory

| Path | Status | Risk / Action |
| :--- | :--- | :--- |
| `docs/audit/` | Untracked | `PROCEED WITH COMMIT` - Audit output directory to record current findings. |
| `.phase0-runtime/` | Ignored | `SAFE` - Local runtime temporary directory. |
| `test-results/` | Ignored | `SAFE` - Playwright test execution output. |
| `backend/storage/` | Ignored | `SAFE` - Local development media uploads. |
