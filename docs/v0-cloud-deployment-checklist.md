# V0 Cloud Deployment Checklist — Loning Maju

Provider-neutral operational checklist. Application code siap menerima konfigurasi provider-specific. Production deployment has not been performed by this audit.

## Runtime and application configuration
- [ ] Set `HOST` and `PORT` in the runtime environment.
- [ ] Set `NODE_ENV=production` and `VITE_API_URL` before frontend build.
- [ ] Set `DATABASE_URL`; never commit `.env` or credentials.
- [ ] Use Node.js `>=20 <27`; install with `npm ci` and build before release.
- [ ] Serve `frontend/dist` through the selected static host/CDN.
- [ ] Configure SPA fallback for deep links and return controlled 404s for missing assets.

## PostgreSQL 16 and migrations
- [ ] Use PostgreSQL 16-compatible managed or self-hosted PostgreSQL.
- [ ] Require TLS/SSL for database connections.
- [ ] Set pooling and connection limits below the provider limit.
- [ ] Run `npm run db:migrate --workspace=backend` before traffic.
- [ ] Never run seed/reset scripts in production.
- [ ] Configure automated backup, retention, and a documented restore drill.
- [ ] Define rollback procedure for application and migration compatibility.

## CORS, cookies, and proxy security
- [ ] Set `CORS_ORIGIN` to one exact HTTPS origin; reject wildcard and unsafe lists.
- [ ] Enable secure cookies in production and preserve `COOKIE_NAME` if sessions continue.
- [ ] Define the reverse-proxy trust model before enabling proxy-derived client IPs.
- [ ] Validate real client IP behavior and rate-limit implications through the proxy.
- [ ] Keep rate limits, upload limits, timeouts, and headers appropriate for production.

## Health, process, and logging
- [ ] Verify `GET /health` and `GET /ready` after startup and after migration.
- [ ] Wire SIGTERM and SIGINT graceful shutdown into the process supervisor.
- [ ] Send structured stdout/stderr logs to the platform collector with secret redaction.
- [ ] Alert on 5xx responses, readiness failure, database unavailable, and storage failure.
- [ ] Monitor capacity, connection usage, latency, and error rates.

## S3 media storage
- [ ] Set `MEDIA_STORAGE_DRIVER=s3` for production; do not use ephemeral filesystem storage.
- [ ] Set `MEDIA_PUBLIC_BASE_URL`, `S3_BUCKET`, `S3_REGION`, and required S3 credentials.
- [ ] Verify bucket policy, object ownership, CORS, lifecycle, backup, and retention.
- [ ] Test upload, card/thumbnail generation, alt-text update, delivery, and deletion.
- [ ] Confirm media references survive application restart and multi-instance routing.

## Release smoke test
- [ ] Test public catalog, search/filter, UMKM detail, product detail, images, and WhatsApp links.
- [ ] Test admin/owner login, forced password change, logout, CSRF, expiry, and lockout.
- [ ] Confirm owners cannot access admin routes or another owner's data.
- [ ] Test CRUD, publish/archive/restore, user management, audit, and media lifecycle.
- [ ] Test deep links, SPA fallback, 404 behavior, no mixed content, and no unexpected console errors.
- [ ] Run the post-deploy smoke suite and record exit codes.

## Security and rollback
- [ ] Run `npm audit --omit=dev`; production audit must report zero vulnerabilities.
- [ ] Keep development-only audit findings documented and out of runtime bundles.
- [ ] Keep a prior release artifact and pre-migration backup available.
- [ ] Verify the V1.2 slug migration against the existing database without running development seeds.
- [ ] Verify clean seeds only in a separate disposable PostgreSQL database.
- [ ] Confirm rollback does not require destructive migration rollback.

> [!WARNING]
> After slug URLs become public, removing `umkms.slug`, `products.slug`, or their unique indexes is unsafe. Shared links, bookmarks, and indexed search results depend on them. Roll back application code while retaining the additive slug schema and UUID-or-slug resolution.

- [ ] Document DNS/CDN rollback and cache purge steps.

> [!IMPORTANT]
> Provider, domain, TLS, CI/CD, monitoring, bucket, credential, and backup resources remain operator responsibilities. The repository does not claim production deployment.
