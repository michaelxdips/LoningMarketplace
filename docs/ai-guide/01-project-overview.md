# 01 — Project Overview

## 🌾 Tentang Proyek

**Loning Maju** adalah **direktori digital + etalase produk** untuk UMKM di **Desa Loning, Petarukan, Pemalang, Jawa Tengah**.

Tujuan: UMKM desa yang sulit ditemukan secara digital kini punya halaman katalog yang bisa ditemukan lewat pencarian, dan calon pembeli bisa langsung menghubungi penjual via **WhatsApp**.

> [!IMPORTANT]
> Ini **bukan** e-commerce. Tidak ada keranjang, checkout, payment gateway, pesanan, invoice, pengiriman, rating, atau ulasan. Transaksi 100% offline via WhatsApp, tanpa komisi.

## 🎯 Masalah → Solusi

| Masalah | Solusi |
|---|---|
| UMKM desa sulit ditemukan digital | Direktori publik dengan pencarian + filter 9 kategori |
| Penjual tidak punya toko online | Etalase produk dengan foto, harga, unit |
| Transaksi online rumit bagi pedagang kecil | Kontak langsung via WhatsApp, tanpa registrasi pembeli |
| Tidak ada peta lokasi | Peta interaktif seluruh UMKM (`/peta-umkm`) |

## ✨ Fitur Publik (tanpa login)

- 🔍 Pencarian & filter 9 kategori: Kuliner, Sembako & Kebutuhan Harian, Fashion & Konveksi, Bahan Bangunan & Material, Jasa & Otomotif, Pertanian/Peternakan/Perikanan, Ritel & Perabot, Kerajinan & Olahan Kreatif, Lainnya.
- 📱 **WhatsApp Inquiry** — dialog kontak ke penjual dengan pesan terstruktur (nama produk + usaha).
- 🗺️ **Peta UMKM** — `/peta-umkm`, embed Google Maps / OpenStreetMap.
- 📄 **Detail produk & UMKM** — slug canonical `/produk/:slug` dan `/umkm/:slug`.
- 🏷️ **Produk terkait** — rekomendasi dari kategori/UMKM yang sama.
- 📜 **Riwayat versi** — `/version-history` (live dari GitHub API).
- ❓ **FAQ** (`/faq`), 🏘️ **Tentang Desa** (`/tentang-desa`), **Tentang Kami** (`/tentang-kami`).
- 📊 **Inquiry analytics** — pelacakan non-blocking: `umkm_view`, `product_view`, `inquiry_started`, `message_copied`, `whatsapp_opened`.

## 🔐 Fitur Dashboard (login)

- 👥 **Manajemen user** — CRUD 4 role.
- 🏪 **Manajemen UMKM** — create/edit/foto/lokasi/status.
- 📦 **Manajemen produk** — create/edit/foto/harga/ketersediaan/unit + gallery (maks 5 gambar).
- 📍 **Editor lokasi** — pin lokasi di peta.
- 📋 **Audit log** — append-only riwayat aktivitas privileged.
- 📈 **Analitik inquiry** — statistik kontak WhatsApp.
- 🔄 **Workflow publikasi** — draft → published → archived → restore.

## 🧱 Fitur Teknis

- 🖼️ Media pipeline (WebP, card+thumbnail, auto-orient, strip metadata).
- 🔒 Session-based auth (cookie HTTP-only + CSRF).
- 🚦 Rate limiting (login 10/mnt, API 100/mnt, dst).
- ♿ Aksesibilitas (focus trapping, keyboard, screen reader).
- 🛡️ Proteksi form unsaved changes.
- 🧯 Error boundary per route + retry.
- 🕐 Jam operasional terstruktur (HH:MM) + teks bebas.
- ✅ Kelengkapan profil UMKM.
- 📥 Ekspor CSV (UTF-8, anti formula injection).
- 📖 Panduan admin (`/dashboard/bantuan`).
- 📱 Responsive + native zoom 200%.
- 🔗 SEO: route metadata, canonical, JSON-LD (SPA-side).

## 🚫 Batasan (yang TIDAK termasuk)

| Area | Status |
|---|---|
| Cart / checkout / payment / pesanan / shipping / stok | ❌ Tidak termasuk |
| Registrasi publik / OAuth / MFA / password recovery | ❌ Tidak termasuk |
| Rating & review | ❌ Tidak termasuk |
| SSR / prerendering | ❌ SPA only (SEO via client-side metadata) |
| Real-time (WebSocket) / push notification | ❌ Tidak termasuk |
| Multi-image gallery | ✅ Hingga 5 gambar/produk |

## 🏷️ Brand & Identifier

- **Brand publik:** "Loning Maju" (logo di `frontend/public/branding/`).
- **Identifier kompatibilitas** (JANGAN diubah): `marketplace-loning-local`, `loning_digital`, `loning`, `loning_postgres_data`, `loning_session`, `media/{uuid}`.

## 📜 Lisensi

Apache-2.0 (`SPDX-License-Identifier: Apache-2.0`).

## ➡️ Lanjut

Berikutnya: [02 — Architecture](02-architecture.md).
