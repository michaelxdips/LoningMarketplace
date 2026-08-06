import { useState, useRef, useEffect, useId } from 'react';
import { ChevronUp, CircleHelp, ClipboardList, Home, KeyRound, LogOut, Menu, Package, Store, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useLogout, useSession } from '../../hooks/useAuth';
import { brand } from '../../config/brand';
import { hasCapability, type Capability } from '../../lib/auth';

const navigation = [
  { to: '/dashboard', label: 'Ringkasan', icon: Home, capabilities: ['dashboard:view'] },
  { to: '/dashboard/umkms', label: 'UMKM', icon: Store, capabilities: ['umkms:view-all', 'umkms:view-own'] },
  { to: '/dashboard/products', label: 'Produk', icon: Package, capabilities: ['products:view-all', 'products:view-own'] },
  { to: '/dashboard/users', label: 'Pengguna', icon: Users, capabilities: ['users:view'] },
  { to: '/dashboard/analytics', label: 'Insight inquiry', icon: ClipboardList, capabilities: ['analytics:view-global'] },
  { to: '/dashboard/audit', label: 'Audit log', icon: ClipboardList, capabilities: ['audit:view-global'] },
  { to: '/dashboard/bantuan', label: 'Bantuan', icon: CircleHelp, capabilities: ['dashboard:view'] },
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

  // Close mobile drawer on Escape key
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

  // Outside click listener for profile menu
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
    <div className="min-h-dvh bg-cream-bg lg:grid lg:grid-cols-[260px_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-forest focus:px-4 focus:py-2.5 focus:text-xs focus:font-bold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Lewati ke konten utama
      </a>
      {/* Mobile Drawer Trigger Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-sage-border bg-white px-4 shadow-2xs lg:hidden">
        <NavLink to="/" aria-label={`${brand.name} — beranda`} className="flex items-center gap-2.5 text-lg font-black uppercase tracking-wider text-forest">
          <img src={brand.logoSvg} alt="" className="h-8 w-8 object-contain shrink-0" />
          <span>LONING<span className="text-[#D97706]">MAJU</span></span>
        </NavLink>
        <button
          ref={menuTriggerRef}
          className="focus-ring rounded-xl border border-sage-border bg-cream-bg p-2 text-charcoal shadow-2xs"
          onClick={() => setOpen(true)}
          aria-label="Buka navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {open && (
        <button
          className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-xs lg:hidden"
          aria-label="Tutup navigasi"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/10 bg-forest text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigasi Utama"
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <NavLink to="/" aria-label={`${brand.name} — beranda`} className="flex items-center gap-3 text-lg font-black uppercase tracking-wider">
            <img src={brand.logoSvg} alt="" className="h-9 w-9 object-contain shrink-0" />
            <span>LONING<span className="text-[#E9AD91]">MAJU</span></span>
          </NavLink>
          <button onClick={() => setOpen(false)} className="p-2 lg:hidden" aria-label="Tutup navigasi">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navigasi dashboard">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-white text-forest shadow-xs' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile Menu Footer */}
        <div className="relative border-t border-white/10 p-4">
          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              id={profileMenuId}
              role="menu"
              aria-label="Menu profil"
              className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-2xl border border-sage-border bg-white text-charcoal shadow-xl animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="border-b border-sage-border bg-cream-bg/60 p-4">
                <p className="font-bold text-charcoal truncate">{session.user.displayName}</p>
                <p className="text-xs text-warm-gray">@{session.user.username}</p>
                <span className="mt-2 inline-flex rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-bold text-forest">
                  {session.user.roleLabel}
                </span>
              </div>

              <div className="p-1">
                <NavLink
                  to="/change-password"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setOpen(false);
                  }}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-charcoal hover:bg-cream-bg"
                >
                  <KeyRound className="h-4 w-4 text-forest" />
                  Ubah kata sandi
                </NavLink>

                <button
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) });
                  }}
                  disabled={logout.isPending}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  Keluar
                </button>
              </div>
            </div>
          )}

          <button
            ref={profileTriggerRef}
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
            aria-controls={profileMenuOpen ? profileMenuId : undefined}
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="focus-ring flex min-h-12 w-full items-center justify-between rounded-xl px-2.5 text-left text-white/90 hover:bg-white/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-white/20 text-sm font-bold text-white shadow-xs">
                {initialLetter}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{session.user.displayName}</p>
                <p className="truncate text-xs text-white/70">{session.user.roleLabel}</p>
              </div>
            </div>
            <ChevronUp className={`h-4 w-4 flex-shrink-0 text-white/70 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main id="main-content" tabIndex={-1} className="min-w-0 px-4 pb-12 pt-20 sm:px-7 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
