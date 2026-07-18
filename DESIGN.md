# Loning Digital — Visual System Hand-off Documentation
**Design Theme:** Modern Indonesian Local Commerce (Sophisticated Light)

This document describes the design tokens, layout guidelines, accessibility patterns, and UX structures implemented within the digital directory and product showcase prototype of **Desa Loning, Pemalang**.

---

## 1. Core Color Palette (Warm & Organic)

We transitioned from the generic dark-mode gold theme to an organic, welcoming, and high-contrast light-mode visual design rooted in the Indonesian village landscape (paddy fields, terracotta tiles, and local weavings).

| Token Name | Tailwind Hex / Variable | CSS Variable | Purpose & Semantic Role |
| :--- | :--- | :--- | :--- |
| **Forest Primary** | `#1C3F24` | `--color-forest` | Main brand identity, high-importance accents, active tabs, buttons, and borders. |
| **Forest Hover** | `#142F1B` | `--color-forest-hover` | Interactive state for primary actions. |
| **Terracotta Accent** | `#C85C43` | `--color-terracotta` | Visual cues (tags, icons, subheadings) suggesting organic earthware. |
| **Charcoal Text** | `#1F2421` | `--color-charcoal` | Primary readable typography color, maximizing WCAG readability. |
| **Warm Gray** | `#606662` | `--color-warm-gray` | Secondary body text, captions, and muted descriptions. |
| **Cream Background** | `#FAF9F6` | `--color-cream-bg` | Page base canvas (safe for eyes, warmer than pure white). |
| **Cream Card** | `#FFFFFF` | `--color-cream-card` | Surface level of components, cards, and modal dialogs. |
| **Cream Tint** | `#F5F2EA` | `--color-cream-tint` | Hero backdrop overlays, skeletons, and badge backgrounds. |
| **Sage Border** | `#DFE4E1` | `--color-sage-border` | Subtle dividing lines, inputs, and container borders. |

---

## 2. Typography Pairings

We use two highly intentional typefaces to convey a blend of rural authenticity and modern technology:

*   **Display / Hero Headings:**
    *   *Styling:* `font-sans font-extrabold tracking-tight text-charcoal` with selective insertions of `font-normal italic text-forest editorial-serif`.
    *   *Impact:* Delivers a sophisticated editorial feel that references premium craft directories.
*   **Body & System Text:**
    *   *Typeface:* **Inter** (sans-serif)
    *   *Styling:* `font-sans text-xs md:text-sm text-warm-gray leading-relaxed`
    *   *Impact:* Ensures maximum reading legibility across a wide spectrum of mobile devices and screen densities.
*   **Status & Meta Data:**
    *   *Typeface:* **Fira Code / JetBrains Mono** (monospace)
    *   *Styling:* `font-mono text-[10px] tracking-wider uppercase`
    *   *Impact:* Accents metadata such as step indicators and product measurements.

---

## 3. UI Layout Boundaries & Structure

Following strict **Scope Discipline**, the showcase application utilizes a clean, single-screen structural layout avoiding unnecessary secondary tabs or heavy administrative sidebars.

1.  **Sticky Compact Navigation:** Features a clean local wordmark (`LoningDigital`) alongside semantic scroll triggers.
2.  **Hero Section:** Defines the platform's role instantly: "Temukan Produk Lokal dari Desa Loning." It includes a prominent notice explaining that transactions proceed directly through WhatsApp.
3.  **Category Discovery Filter:** Uses clear iconography for rapid filtering (Kuliner, Kerajinan, Pertanian, Sembako, Jasa). Includes a responsive horizontal scrolling container for mobile viewport widths.
4.  **Product Catalog:** Responsive grid layout showcasing local items. Displays pricing under the neutral "Harga" description, and replaces "Beli" buttons with conversational "Tanya Produk" action triggers.
5.  **UMKM Directory:** Elegant listing of community-led merchant profiles without fake rating metrics.
6.  **Village Narrative & FAQ:** A modern storytelling zone paired with smooth, keyboard-accessible accordion panels to answer common visitor inquiries.
7.  **Footer Notice:** Explicit legal disclaimer confirming the offline-first WhatsApp interaction model.

---

## 4. Accessibility & Interaction Specs

To ensure the system remains usable for non-technical community members and assistive technologies:

*   **Touch Targets:** All buttons, filters, and toggles have a minimum height of `44px` on mobile viewports.
*   **Focus Trapping & Focus Rings:** Modal dialogs (`UMKMDetailDialog`, `WhatsAppInquiryDialog`) trap active keyboard focus and support the `Esc` key to dismiss. Focused interactive elements exhibit a distinct forest green focus ring (`focus-ring`).
*   **Accessible Input Labels:** Every search input is accompanied by screen-reader specific labels (`sr-only`) to support vocalized navigation software.
*   **Clean Icons:** All iconography is derived strictly from `lucide-react` for a consistent stroke weight and style.
