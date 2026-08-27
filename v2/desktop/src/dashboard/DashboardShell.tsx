import { useEffect, useId, useRef, useState } from 'react';
import { ChevronUp, CircleHelp, ClipboardList, Home, KeyRound, LogOut, Menu, Package, ScrollText, Store, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { brand } from '@loning/shared/config/brand';
import { hasCapability, type Capability } from '@loning/shared/lib/auth';
import { useLogout, useSession } from '@loning/shared/hooks/useAuth';
import { ToastProvider } from '@v2-shared/components/Toast';
import { cn } from '@v2-shared/ui/cn';

/**
 * DashboardShell V2 — pasangan fitur dari DashboardShell UI lama.
 *
 * Sidebar + drawer mobile + menu profil + logout dipertahankan; styling editorial
 * (sidebar forest solid, tanpa shadow, hairline). Seluruh route dashboard V2
 * di-render lewat <Outlet /> di dalam shell ini.
 */
const navigation = [
  { to: '/v2/dashboard', label: 'Ringkasan', icon: Home, capabilities: ['dashboard:view'] },
  { to: '/v2/dashboard/umkms', label: 'UMKM', icon: Store, capabilities: ['umkms:view-all', 'umkms:view-own'] },
  { to: '/v2/dashboard/products', label: 'Produk', icon: Package, capabilities: ['products:view-all', 'products:view-own'] },
  { to: '/v2/dashboard/users', label: 'Pengguna', icon: Users, capabilities: ['users:view'] },
  { to: '/v2/dashboard/analytics', label: 'Insight inquiry', icon: ClipboardList, capabilities: ['analytics:view-global'] },
  { to: '/v2/dashboard/audit', label: 'Audit log', icon: ScrollText, capabilities: ['audit:view-global'] },
  { to: '/v2/dashboard/bantuan', label: 'Bantuan', icon: CircleHelp, capabilities: ['dashboard:view'] },
] as const satisfies ReadonlyArray<{ to: string; label: string; icon: typeof Home; capabilities: readonly Capability[] }>;

export default function DashboardShell() {
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const session = useSession().data!;
  const logout = useLogout();
  const navigate = useNavigate();

  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuId = useId();

  const links = navigation.filter((link) => link.capabilities.some((capability) => hasCapability(session.user, capability)));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (profileMenuOpen) {
          setProfileMenuOpen(false);
          profileTriggerRef.current?.focus();
        } else if (open) {
          setOpen(false);
          menuTriggerRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, profileMenuOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node) &&
        profileTriggerRef.current &&
        !profileTriggerRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const initialLetter = (session.user.displayName || 'U').charAt(0).toUpperCase();

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[260px_1fr]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-on-brand"
        >
          Lewati ke konten utama
        </a>

        {/* Mobile drawer trigger */}
        <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <NavLink to="/v2" aria-label={`${brand.name} — beranda`} className="font-display text-lg font-semibold tracking-tight text-ink">
            Loning<span className="font-light italic text-accent-ink">Maju</span>
          </NavLink>
          <button
            ref={menuTriggerRef}
            className="focus-ring-v2 touch-44 rounded-control border border-control-border p-2.5 text-ink"
            onClick={() => setOpen(true)}
            aria-label="Buka navigasi"
          >
            <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {open ? (
          <button
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            aria-label="Tutup navigasi"
            onClick={() => setOpen(false)}
          />
        ) : null}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-on-brand/10 bg-brand text-on-brand transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-label="Navigasi Utama"
        >
          <div className="flex h-20 items-center justify-between border-b border-on-brand/10 px-6">
            <NavLink to="/v2" aria-label={`${brand.name} — beranda`} className="font-display text-xl font-semibold tracking-tight text-on-brand">
              Loning<span className="font-light italic text-accent-ink">Maju</span>
            </NavLink>
            <button onClick={() => setOpen(false)} className="touch-44 p-2.5 lg:hidden" aria-label="Tutup navigasi">
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navigasi dashboard">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/v2/dashboard'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'focus-ring-v2 flex min-h-11 items-center gap-3 rounded-control px-3.5 text-sm transition-colors',
                    isActive
                      ? 'border-l-2 border-accent bg-on-brand/5 font-medium text-on-brand'
                      : 'font-normal text-on-brand/70 hover:bg-on-brand/10 hover:text-on-brand',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={1.5} className={isActive ? 'text-accent-ink' : ''} aria-hidden="true" />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Profile menu */}
          <div className="relative border-t border-on-brand/10 p-4">
            {profileMenuOpen ? (
              <div
                ref={profileMenuRef}
                id={profileMenuId}
                role="menu"
                aria-label="Menu profil"
                className="absolute bottom-full left-4 right-4 mb-2 border border-line bg-surface text-ink shadow-[0_16px_40px_rgba(16,22,18,0.2)]"
              >
                <div className="border-b border-line bg-sunken p-4">
                  <p className="truncate font-medium text-ink">{session.user.displayName}</p>
                  <p className="text-sm text-ink-muted">@{session.user.username}</p>
                  <span className="mt-2 inline-flex rounded-sm bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                    {session.user.roleLabel}
                  </span>
                </div>

                <div className="p-1">
                  <NavLink
                    to="/v2/dashboard/change-password"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setOpen(false);
                    }}
                    className="focus-ring-v2 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-sm text-ink hover:bg-sunken"
                  >
                    <KeyRound size={15} strokeWidth={1.5} className="text-brand" aria-hidden="true" />
                    Ubah kata sandi
                  </NavLink>

                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout.mutate(undefined, { onSuccess: () => navigate('/v2/login', { replace: true }) });
                    }}
                    disabled={logout.isPending}
                    className="focus-ring-v2 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-sm text-danger-ink hover:bg-sunken disabled:opacity-50"
                  >
                    <LogOut size={15} strokeWidth={1.5} className="text-danger-ink" aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : null}

            <button
              ref={profileTriggerRef}
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
              aria-controls={profileMenuOpen ? profileMenuId : undefined}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="focus-ring-v2 flex min-h-12 w-full items-center justify-between rounded-control px-2.5 text-left text-on-brand/90 hover:bg-on-brand/10"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-on-brand/20 text-sm font-semibold text-on-brand">
                  {initialLetter}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-on-brand">{session.user.displayName}</p>
                  <p className="truncate text-xs text-on-brand/70">{session.user.roleLabel}</p>
                </div>
              </div>
              <ChevronUp
                size={15}
                strokeWidth={1.5}
                className={cn('shrink-0 text-on-brand/70 transition-transform', profileMenuOpen && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main id="main-content" tabIndex={-1} className="min-w-0 px-4 pb-12 pt-20 sm:px-7 lg:px-10 lg:pt-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
