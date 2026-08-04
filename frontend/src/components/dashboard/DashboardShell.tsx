import { useState } from 'react';
import { ClipboardList, Home, LogOut, Menu, Package, Store, Users, X } from 'lucide-react';
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
] as const satisfies ReadonlyArray<{ to: string; label: string; icon: typeof Home; capabilities: readonly Capability[] }>;

export default function DashboardShell() {
  const [open, setOpen] = useState(false); const session = useSession().data!; const logout = useLogout(); const navigate = useNavigate();
  const links = navigation.filter((link) => link.capabilities.some((capability) => hasCapability(session.user, capability)));
  return <div className="min-h-screen bg-cream-bg lg:grid lg:grid-cols-[260px_1fr]">
    <button className="focus-ring fixed left-4 top-4 z-40 rounded-xl border border-sage-border bg-white p-2.5 shadow-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Buka navigasi"><Menu/></button>
    {open && <button className="fixed inset-0 z-40 bg-charcoal/40 lg:hidden" aria-label="Tutup navigasi" onClick={() => setOpen(false)}/>} 
     <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sage-border bg-forest text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><NavLink to="/" aria-label={`${brand.name} — beranda`} className="text-lg font-extrabold tracking-tight">Loning<span className="text-[#E9AD91]">Maju</span></NavLink><button onClick={() => setOpen(false)} className="p-2 lg:hidden" aria-label="Tutup navigasi"><X/></button></div>
      <nav className="flex-1 space-y-1 p-4" aria-label="Navigasi dashboard">{links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === '/dashboard'} onClick={() => setOpen(false)} className={({isActive}) => `focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${isActive ? 'bg-white text-forest' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5"/>{label}</NavLink>)}</nav>
       <div className="border-t border-white/10 p-4"><div className="mb-3 flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-sm font-bold">{session.user.displayName.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{session.user.displayName}</p><p className="text-xs text-white/60">{session.user.roleLabel}</p></div></div><button onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })} disabled={logout.isPending} className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/75 hover:bg-white/10"><LogOut className="h-5 w-5"/>Keluar</button></div>
    </aside>
    <main className="min-w-0 px-4 pb-12 pt-20 sm:px-7 lg:px-10 lg:pt-10"><div className="mx-auto max-w-7xl"><Outlet /></div></main>
  </div>;
}
