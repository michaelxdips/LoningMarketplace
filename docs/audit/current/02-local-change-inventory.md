# 02 — Local Change & Commit Inventory

## Overview

Inspection of all commits and branch differences across the repository.

---

## 1. Commit Classification Table

| Commit Hash | Branch | Category | User-Visible Impact | Backend / DB Impact | Risk | Recommended Disposition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `94bbe08` | `master` | Feature | Expands FAQ repository to 16 detailed items across buyer, seller, map & tech | None | Low | Retain on `master` |
| `031a162` | `master` | UI Refactor | Card-based accordions with category headers on FAQ page | None | Low | Retain on `master` |
| `9e1c9f6` | `master` | Feature | Search filter, category tabs, and developer support CTA on FAQ page | None | Low | Retain on `master` |
| `75b2824` | `master` | Feature | Interactive Developer Contact form chat dialog | None | Low | Retain on `master` |
| `43d09c0` | `master` | Feature | Footer Hubungi Developer WhatsApp contact link | None | Low | Retain on `master` |
| `1e09306` | `phase1-public-discovery` | Feature | Business Location Leaflet / OpenStreetMap component & coordinate inputs | Adds `latitude` & `longitude` to `umkms` schema (`0010`) | Low | Merge into `master` |
| `169db5c` | `phase1-public-discovery` | Migration Fix | Database migration contract repair (`0008` / `0009`) | DB integrity migration fix | Low | Merge into `master` |
| `8934cab` | `release/uiux-map...` | Git Reconcile | Reconcile master with local source of truth | None | Low | Merge into `master` |

---

## 2. Feature Completion & Drift Status

* **Fully Complete & Tested**: FAQ search/filter system, Developer Contact modal, Header/Footer navigation enhancements, Product detail redirects, WhatsApp inquiry dialog.
* **Unpushed on Feature Branch**: Leaflet / OpenStreetMap interactive location map (`PetaUMKMPage`, `BusinessLocationPage`, DB migration `0010_umkm_business_location.sql`).
* **Partial / Experimental Code**: None discovered. All code on `master` and feature branches has corresponding passing unit tests.
* **Obsolete / Duplicate Code**: None.
