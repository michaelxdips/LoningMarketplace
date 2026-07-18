# Loning Digital — Technical Hand-off Documentation

This document serves as the developer hand-off guide for the **Loning Digital** community directory and product showcase prototype for **Desa Loning, Kecamatan Petarukan, Kabupaten Pemalang**.

---

## 1. Prototype Purpose

The primary objective of this application is to serve as a high-fidelity visual and interactive prototype representing the **Sprint 1** deliverables of the digital transition for Desa Loning.

It provides local citizens and outside visitors with an elegant, responsive, and highly readable directory to:
- Discover local micro-businesses (UMKM) in Desa Loning.
- Browse authentic product catalogs (crafts, agricultural yields, culinary items).
- Initiate zero-commission personal transactions with owners via direct WhatsApp message compilation (eliminating complex in-app checkout/payment gateways).

---

## 2. Sprint 1 Scope & Project Limitations

To maintain compliance with the project plan, this prototype represents **Sprint 1 (Visual Showcase & Directory Layout)** only:

- **Offline-First Direct Commerce:** No actual purchase transaction, cart checkout, payment gateway integration, or administrative database writing exists in this stage. All interactions direct the user to the merchant's personal WhatsApp.
- **Visual-Only Filtering & Search:** The search input and category filtering operate purely client-side on local state as visual references for Sprint 2 behaviors. No server-side indexation, relational SQL queries, or ElasticSearch systems are used.
- **Static Assets:** Product and merchant photography are sourced via high-quality, stable public Unsplash placeholders mapped directly in the local data model.
- **Single-Screen Architecture:** Following strict scope discipline, the entirety of the application runs in a lightweight, unified layout without custom client-side router overhead or administrative panels.

---

## 3. Reusable Visual Components

We have structured the codebase with modular, standalone React components styled with Tailwind CSS. They include:

- **`Navbar`** (`/src/components/layout/Navbar.tsx`): Sticky responsive navigation bar with backdrop blur, smart scroll triggers, and mobile drawer adaptation.
- **`Footer`** (`/src/components/layout/Footer.tsx`): Structured footer with site map navigation, brand information, and an explicit transactional disclaimer.
- **`HeroSection`** (`/src/components/home/HeroSection.tsx`): Sophisticated visual header presenting the purpose of the platform, visual grid gallery, and quick-action access.
- **`CategorySection`** (`/src/components/home/CategorySection.tsx`): Horizontally scrollable category selector with modern, interactive icons mapped from `lucide-react`.
- **`ProductCard`** (`/src/components/product/ProductCard.tsx`): High-contrast layout showing product thumbnails, categorizations, denormalized UMKM owners, pricing, and active WhatsApp CTAs.
- **`BusinessCard`** (`/src/components/business/BusinessCard.tsx`): Profile cards for local vendors presenting owner metadata, brief descriptions, and physical Dusun locations.
- **`UMKMDetailDialog`** (`/src/components/shared/UMKMDetailDialog.tsx`): Accessible overlay modal utilizing `motion` (from `motion/react`) for entrance animations. Features focus trapping, body scroll locks, a simulated location visualizer, and tabbed navigation between vendor details and filtered product catalogs.
- **`WhatsAppInquiryDialog`** (`/src/components/shared/WhatsAppInquiryDialog.tsx`): Accessible contact assistant that lets users input their name and custom questions, compiles the text into an encoded WhatsApp link, and previews the conversation starter with optional clipboard-copy capabilities.

---

## 4. Routes and Screens Represented

This prototype operates as an elegant **Single Page Application (SPA)** with the following thematic layout sections:
1.  `#home`: Welcoming hero stage and operational context.
2.  `#categories`: Contextual filtering hub.
3.  `#featured-products`: Grid list for browsing products.
4.  `#umkm`: Grid list for identifying local providers.
5.  `#about`: Historical storytelling section for Desa Loning and community benefits.
6.  `#faq`: Accessible keyboard-friendly accordion panel list addressing transactional safety.

---

## 5. Dummy-Data & Mock State Storage Locations

- **Data Models:** All static dataset variables are located at `/src/data.ts`.
  - `INITIAL_UMKMS`: Explicit collection of local business records containing fields for names, owners, contact numbers, categories, public images, and working hours.
  - `INITIAL_PRODUCTS`: Static catalog of items with denormalized business associations, specific units, and optional prices.
  - `FAQS`: Descriptive QA strings matching local Indonesian commercial behavior.
  - `BENEFIT_CARDS`: Editorial highlights for the narrative zone.

- **Local Storage Usage:**
  - `getSavedUMKMs()` and `getSavedProducts()` store the initial array into the browser's `localStorage` (`loning_umkms` and `loning_products` keys) to simulate a local client-side persistence loop.
  - This allows the user's browser to read from mock caches safely across refreshes.

---

## 6. Production Integration Warnings

If integrating this codebase with **Sprint 2** backend resources or databases:
- **No Verification Endorsements:** The production schema does **not** support verified merchant flags or checkmark statuses (`is_verified` was completely removed). Ensure no verification badges are introduced to the UI.
- **No Secret Key Leakage:** Do **not** inject Supabase/Firebase credentials or private Gemini API keys on the client-side (`import.meta.env`). Any future AI categorization or database writing must be handled behind server-side API routes (`/api/*`).
- **Hydration Safe:** The local storage fallbacks check for `typeof window !== 'undefined'` before accessing global storage, keeping it safe for Node.js-based static site generator (SSG) or server-side rendering (SSR) environments.

---

## 7. Execution and Development Commands

Make sure all dependencies are installed before executing these scripts:

### Dependency Installation
```bash
npm install
```

### Run Local Development Server (port 3000)
```bash
npm run dev
```

### Run TypeScript & Validation Lints
```bash
npm run lint
```

### Compile Production Build
```bash
npm run build
```
