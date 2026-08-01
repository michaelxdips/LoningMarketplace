# Media Storage & Upload Audit

## 1. Dual-Driver Storage Architecture

```text
               +----------------------------------+
               |     Fastify Multipart Route      |
               |        (/api/media/upload)       |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |     Sharp Image Processing       |
               | (Card: 1000x700, Thumb: 240x168) |
               +----------------------------------+
                                |
             +------------------+------------------+
             |                                     |
    if driver == 'filesystem'              if driver == 's3'
             |                                     |
             v                                     v
+------------------------+             +------------------------+
| Local Disk (./storage) |             | S3-Compatible Storage   |
| (Development Mode)     |             | (AWS / R2 / MinIO)     |
+------------------------+             +------------------------+
```

---

## 2. Production Security & Validation Guards

1. **MIME Type Whitelist**: Accepts only `image/jpeg`, `image/png`, `image/webp`.
2. **Dimension & Size Caps**:
   * Max Byte Size: 5 MB (`MEDIA_MAX_BYTES`).
   * Max Dimensions: 8000x8000 pixels (`MEDIA_MAX_WIDTH` x `MEDIA_MAX_HEIGHT`).
   * Max Pixel Count: 40 Megapixels (`MEDIA_MAX_PIXELS`).
3. **Format Normalization**: Converts all uploads to high-efficiency WebP format (`quality: 88` for main card, `quality: 82` for thumbnail).
4. **Metadata Stripping**: Sharp automatically strips EXIF data, GPS coordinates, and camera metadata during re-encoding.
5. **Orphan Cleanup**: Unattached media assets older than 24 hours (`MEDIA_ORPHAN_GRACE_HOURS`) are flagged for background garbage collection via `npm run media:cleanup`.

---

## 3. Upload Persistence & Verification

* **Database Metadata**: `media_assets` table records checksum (`checksum_sha256`), card storage key, thumbnail storage key, pixel dimensions, and creator user ID.

## 4. Current Evidence Boundary

* **Local fresh upload**: PASS for product and UMKM browser flows on desktop and mobile; upload response, canonical URL, WebP decode, database association, public reload, logout, and cleanup were verified.
* **Isolated storage**: PASS for MinIO restart persistence with exact checksum, bytes, `HeadObject`, `GetObject`, and cleanup.
* **Production fresh upload**: NOT YET VERIFIED. Existing production seed/read evidence proves delivery only, not a new write.
