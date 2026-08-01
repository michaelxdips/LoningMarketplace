# Vercel Deployment Audit

## 1. Project Configuration Summary

```text
Project Name       : loningmarketplace
Framework          : Vite + React
Build Command      : npm run build:frontend
Output Directory   : frontend/dist
SPA Fallback Rule  : vercel.json -> rewrites (.* -> /index.html)
```

---

## 2. Environment Variables & Site URL Fallback

Frontend environment variables in Vite:

* `VITE_API_URL`: Points to Render backend URL (e.g. `https://loning-preview.onrender.com/api`).
* `VITE_PUBLIC_SITE_URL`: Validated in `frontend/vite.config.ts`. Automatically falls back to `VERCEL_PROJECT_PRODUCTION_URL` or `https://loningmarketplace.vercel.app` if omitted.

---

## 3. SPA Routing & Asset Caching Audit

* **Direct Route Refresh**: Verified via `vercel.json` rewrite rule `[ { "source": "/(.*)", "destination": "/index.html" } ]`. Refreshing deep routes (e.g. `/katalog`, `/umkm/kuliner-loning`, `/dashboard`) serves `index.html` cleanly without 404 errors.
* **Asset Hashing**: Vite generates fingerprinted asset filenames in `dist/assets/index-[hash].js` and `index-[hash].css`, preventing stale browser caching on redeployments.
