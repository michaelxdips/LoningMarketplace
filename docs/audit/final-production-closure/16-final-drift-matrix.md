# Final Deployment Drift Matrix

| Infrastructure Subsystem | Local Environment | GitHub Repository | Release Tag (`v1.5.0`) | Render Cloud | Vercel Cloud | Aiven PostgreSQL | Object Storage (S3) | Final Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Commit Hash** | `64de975` | `64de975` | `6f64445` (1 behind) | `64de975` | `64de975` | N/A | N/A | `DRIFTED (TAG)` |
| **Active Branch** | `master` | `master` | N/A | `master` | `master` | N/A | N/A | `MATCH` |
| **Migration State** | 0010 applied | 0010 present | 0010 present | Run via CLI | N/A | 0010 applied | N/A | `MATCH` |
| **API Base URL** | `http://localhost:3001` | N/A | N/A | Live Render Domain | VITE_API_URL configured | N/A | N/A | `MATCH` |
| **Frontend Base URL** | `http://localhost:3000` | N/A | N/A | N/A | Live Vercel Domain | N/A | N/A | `MATCH` |
| **CORS Policy** | Local origins | N/A | N/A | Vercel Origin Matched | N/A | N/A | N/A | `MATCH` |
| **Seed Behavior** | Local seed available | In `render.yaml` | In `render.yaml` | `startCommand` runs `db:seed` (Guarded in code) | N/A | Guarded | N/A | `DRIFTED (CONFIG)` |
| **Storage Driver** | `filesystem` | `s3` config ready | `s3` config ready | `s3` enforced | N/A | Metadata saved | Direct S3 put/get | `MATCH` |
| **Media Persistence** | `./storage/` | N/A | N/A | N/A | N/A | `media_assets` table | WebP Object Keys | `MATCH` |
| **Auth Schema** | Argon2 + Sessions | Schema 0004 | Schema 0004 | Argon2 + Sessions | N/A | `users` / `sessions` | N/A | `MATCH` |
