import { Link, useLocation } from 'react-router';
import { Monitor, Moon, Sun } from 'lucide-react';
import { brand } from '@loning/shared/config/brand';
import type { ThemePreference } from '@v2-shared/lib/theme';
import { cn } from '@v2-shared/ui/cn';

/**
 * Navbar V2 (desktop).
 *
 * Aturan yang ditegakkan:
 *   - SATU baris di desktop, tinggi 72px (batas 80px).
 *   - Glass HANYA di chrome seperti ini, bukan di kartu konten.
 *   - Label nav dipendekkan supaya tidak pernah wrap ke baris kedua.
 */

const NAV_ITEMS = [
  { to: '/v2/produk', label: 'Produk' },
  { to: '/v2/umkm', label: 'Profil UMKM' },
  { to: '/v2/peta-umkm', label: 'Peta' },
  { to: '/v2/tersimpan', label: 'Tersimpan' },
  { to: '/v2/tentang-desa', label: 'Tentang Desa' },
  { to: '/v2/faq', label: 'FAQ' },
] as const;

const THEME_ICON: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Tema: mengikuti sistem',
  light: 'Tema: terang',
  dark: 'Tema: gelap',
};

export default function Navbar({
  preference,
  onCycleTheme,
}: {
  preference: ThemePreference;
  onCycleTheme: () => void;
}) {
  const { pathname } = useLocation();
  const ThemeIcon = THEME_ICON[preference];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-8 px-6 lg:px-10">
        <Link
          to="/v2"
          className="focus-ring-v2 flex min-w-0 shrink-0 items-center gap-2.5 rounded text-ink transition-opacity hover:opacity-90"
          aria-label={`${brand.name} — beranda`}
        >
          <img src={brand.logoSvg} alt="" className="h-8 w-8 shrink-0 object-contain" />
          <span className="font-display text-2xl font-semibold tracking-tight">
            Loning<span className="font-light italic text-accent-ink">Maju</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden flex-1 items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'focus-ring-v2 whitespace-nowrap text-sm transition-colors',
                  isActive ? 'font-medium text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCycleTheme}
            // Nama aksesibel menyebut keadaan saat ini, bukan cuma "ganti tema".
            aria-label={`${THEME_LABEL[preference]}. Klik untuk mengganti.`}
            title={THEME_LABEL[preference]}
            className="focus-ring-v2 touch-44 inline-flex items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <ThemeIcon size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <Link
            to="/v2/login"
            className="focus-ring-v2 hidden min-h-11 items-center rounded-control border border-control-border px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken sm:inline-flex"
          >
            Masuk Pengelola
          </Link>
        </div>
      </div>
    </header>
  );
}
