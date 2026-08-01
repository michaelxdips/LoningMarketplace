# Final Deployment Drift Matrix

| Infrastructure Subsystem | Local Environment | GitHub Repository | Release Tag (`v1.5.0`) | Render Cloud | Vercel Cloud | Aiven PostgreSQL | Object Storage (S3) | Final Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Commit Hash** | `ea45631` (runtime/test checkpoint) | `6e69a6d` (upstream baseline; local ahead by 2) | `6f64445` (11 behind) | Not independently verified against local commits | Not independently verified against local commits | N/A | N/A | `DRIFTED (UPSTREAM/CLOUD/TAG)` |
| **Active Branch** | `master` | `master` | N/A | `master` | `master` | N/A | N/A | `MATCH` |
| **Migration State** | 0010 applied | 0010 present | 0010 present | Run via CLI | N/A | 0010 applied | N/A | `MATCH` |
| **API Base URL** | `http://localhost:3001` | N/A | N/A | Live Render Domain | VITE_API_URL configured | N/A | N/A | `MATCH` |
| **Frontend Base URL** | `http://localhost:3000` | N/A | N/A | N/A | Live Vercel Domain | N/A | N/A | `MATCH` |
| **CORS Policy** | Local origins | N/A | N/A | Vercel Origin Matched | N/A | N/A | N/A | `MATCH` |
| **Seed Behavior** | Local seed available | Migration-only Render config | Migration-only Render config | `startCommand` runs `db:migrate` only | N/A | Guarded | N/A | `MATCH` |
| **Storage Driver** | `filesystem` | `s3` config ready | `s3` config ready | `s3` enforced | N/A | Metadata saved | Direct S3 put/get | `MATCH` |
| **Media Persistence** | Local fresh upload/read/reload PASS | Canonical key and route code | Not verified by tag | S3 config present; live write not verified | Public read previously verified | `media_assets` table | Local MinIO restart PASS; production object persistence pending | `OPEN (PRODUCTION WRITE)` |
| **Auth Schema** | Argon2 + Sessions | Schema 0004 | Schema 0004 | Argon2 + Sessions | N/A | `users` / `sessions` | N/A | `MATCH` |
