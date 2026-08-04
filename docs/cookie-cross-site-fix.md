# Cookie Cross-Site Issue — Permanent Fix Options

## Current State (post-fix)

Bearer token fallback restored → login cloud berfungsi kembali sebagai **workaround**. Tapi cookie `SameSite=none; Secure` **masih tidak berfungsi** di cloud karena Vercel rewrite.

## Why Cookie Fails

Vercel rewrite (`/api/:path*` → `https://loningmarketplace.onrender.com/api/:path*`) membuat request terlihat same-origin di URL, tapi:
- Response `Set-Cookie` datang dari origin Render (via rewrite) → browser cross-site cookie policy berlaku.
- `SameSite=none` butuh `Secure` (HTTPS penuh end-to-end). Vercel rewrite bisa lewat HTTP internal.
- Browser drop cookie → request berikutnya tidak authenticated → 401 → redirect loop.

## Permanent Fix Options

### Option A: Subdomain Same-Domain (Recommended)

Struktur:
- Frontend: `https://loningmaju.my.id` (Vercel)
- Backend: `https://api.loningmaju.my.id` → Render (CNAME atau Render custom domain)

Perubahan:
1. Setup DNS: `api.loningmaju.my.id` CNAME → `loningmarketplace.onrender.com`.
2. Render dashboard → Settings → Custom Domain → add `api.loningmaju.my.id`.
3. Set env `CORS_ORIGIN=https://loningmaju.my.id,https://www.loningmaju.my.id`.
4. Set `COOKIE_SAMESITE=lax` (bukan `none`) — same-site now works.
5. Update `frontend/.env.production`: `VITE_API_URL=https://api.loningmaju.my.id/api`.
6. Hapus Vercel rewrite untuk `/api/:path*` di `vercel.json` (frontend call langsung).

Benefit:
- Cookie `SameSite=lax; Secure` berfungsi normal.
- Bearer fallback bisa dihapus (lebih secure — tidak ada token di localStorage).
- Tidak ada cross-site cookie issue.

### Option B: Direct Cross-Origin Call (tanpa rewrite)

Tanpa subdomain, frontend call langsung `https://loningmarketplace.onrender.com/api/*`:
1. Update `frontend/.env.production`: `VITE_API_URL=https://loningmarketplace.onrender.com/api`.
2. Set `CORS_ORIGIN=https://loningmaju.my.id,https://www.loningmaju.my.id`.
3. Pertahankan `COOKIE_SAMESITE=none; COOKIE_SECURE=true`.
4. Hapus Vercel rewrite untuk `/api` di `vercel.json`.

Benefit: tidak perlu DNS setup.
Risk: tetap butuh `SameSite=none` (kurang secure), Bearer fallback wajib ada.

## Recommendation

**Option A** ketika siap setup DNS. Sementara, Bearer fallback (current state) cukup.

## Cleanup Setelah Option A

- Hapus Bearer token fallback di `frontend/src/lib/api.ts`.
- Hapus `localStorage.setItem/removeItem` di `frontend/src/lib/auth.ts`.
- Hapus `sessionToken` dari response body login (`backend/src/routes/auth.ts`).
- Set `COOKIE_SAMESITE=lax` di `render.yaml` dan Render dashboard.
