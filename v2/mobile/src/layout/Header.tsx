import { Link } from 'react-router';
import { brand } from '@loning/shared/config/brand';
import { ThemeToggle } from './BottomNav';

/**
 * Header V2 mobile — ringkas, solid (tanpa glass, sesuai aturan anti-slop:
 * mobile nol backdrop-blur untuk performa HP low-end).
 */
export default function Header({
  preference,
  onCycleTheme,
}: {
  preference: 'system' | 'light' | 'dark';
  onCycleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link
          to="/m"
          aria-label={`${brand.name} — beranda`}
          className="focus-ring-v2 flex min-w-0 items-center gap-2 rounded text-ink transition-opacity hover:opacity-90"
        >
          <img src={brand.logoSvg} alt="" className="h-7 w-7 shrink-0 object-contain" />
          <span className="font-display text-xl font-semibold tracking-tight">
            Loning<span className="font-light italic text-accent-ink">Maju</span>
          </span>
        </Link>
        <ThemeToggle preference={preference} onCycle={onCycleTheme} />
      </div>
    </header>
  );
}
