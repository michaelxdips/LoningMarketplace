import { NavLink } from 'react-router';
import { Home, MapPin, Package, Store, Heart, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@v2-shared/ui/cn';
import type { ThemePreference } from '@v2-shared/lib/theme';

/**
 * BottomNav V2 mobile — navigasi utama ≤ 5 item.
 *
 * - 5 item: Beranda, Produk, UMKM, Peta (5 termasuk tidak perlu: kita pakai 4
 *   + tetap di bawah batas). Item aktif diberi garis atas + label semibold.
 * - Safe-area bottom sudah diakomodasi shell (env safe-area-inset-bottom).
 * - Touch target 44px, solid (tanpa glass) sesuai aturan anti-slop mobile.
 */
const NAV_ITEMS = [
  { to: '/m', label: 'Beranda', icon: Home, end: true },
  { to: '/m/produk', label: 'Produk', icon: Package, end: false },
  { to: '/m/umkm', label: 'UMKM', icon: Store, end: false },
  { to: '/m/peta-umkm', label: 'Peta', icon: MapPin, end: false },
  { to: '/m/tersimpan', label: 'Simpan', icon: Heart, end: false },
] as const;

export default function BottomNav() {
  return (
    <nav
      id="m-bottom-nav"
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'focus-ring-v2 flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive ? 'text-brand' : 'text-ink-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
                <span className={cn('leading-none', isActive && 'font-medium')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const THEME_ICON: Record<ThemePreference, typeof Sun> = { system: Monitor, light: Sun, dark: Moon };
const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Tema: mengikuti sistem',
  light: 'Tema: terang',
  dark: 'Tema: gelap',
};

export function ThemeToggle({
  preference,
  onCycle,
}: {
  preference: ThemePreference;
  onCycle: () => void;
}) {
  const Icon = THEME_ICON[preference];
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${THEME_LABEL[preference]}. Klik untuk mengganti.`}
      title={THEME_LABEL[preference]}
      className="focus-ring-v2 touch-44 inline-flex items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
    >
      <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
