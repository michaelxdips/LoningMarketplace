#!/usr/bin/env bash
# Phase 0 — ekstrak logika non-UI ke shared/ (@loning/shared).
# Strategi: git mv file sumber ke shared/src (struktur folder DIPERTAHANKAN agar
# impor relatif antar-file tetap valid tanpa satu pun edit di dalam file),
# lalu tinggalkan shim re-export di path lama supaya 53 file frontend + test
# existing tidak perlu disentuh sama sekali.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
SRC="frontend/src"
DST="shared/src"

FILES=(
  "types.ts"
  "config/brand.ts"
  "lib/analytics.ts"
  "lib/api.ts"
  "lib/auditEvents.ts"
  "lib/auth.ts"
  "lib/catalog-url.ts"
  "lib/idempotency.ts"
  "lib/location.ts"
  "lib/management.ts"
  "lib/navigation-focus.ts"
  "lib/price.ts"
  "lib/seo.ts"
  "lib/share.ts"
  "lib/siteUrl.ts"
  "lib/umkmStatus.ts"
  "hooks/useAuth.ts"
  "hooks/useDebouncedValue.ts"
  "hooks/useProducts.ts"
  "hooks/useUMKMs.ts"
  "hooks/discovery/useDiscoveryUrlState.ts"
)

mkdir -p "$DST/lib" "$DST/hooks/discovery" "$DST/config"

moved=0
for rel in "${FILES[@]}"; do
  from="$SRC/$rel"
  to="$DST/$rel"
  if [ ! -f "$from" ]; then
    echo "SKIP (tidak ada): $from"
    continue
  fi
  if [ -f "$to" ]; then
    echo "SKIP (sudah pindah): $to"
    continue
  fi
  mkdir -p "$(dirname "$to")"
  git mv "$from" "$to"
  moved=$((moved + 1))

  # Shim di path lama. 'export *' cukup karena tidak ada default export
  # di seluruh file kandidat (sudah diverifikasi via grep).
  noext="${rel%.ts}"
  printf '%s\n' \
    "// Shim kompatibilitas Phase 0: sumber asli kini di @loning/shared." \
    "// Dipertahankan agar impor lama di frontend/ dan target vi.mock() tetap valid." \
    "export * from '@loning/shared/$noext';" > "$from"
done

echo "moved=$moved"
