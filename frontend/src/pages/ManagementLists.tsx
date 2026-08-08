import { useDeferredValue, useId, useState } from 'react';
import { KeyRound, Plus, RotateCcw, ShieldX, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { useManagedList, useManagedMutation } from '../hooks/useManagement';
import { managementApi, pageItems, type AuditLog, type ManagedProduct, type ManagedUMKM, type ManagedUser } from '../lib/management';
import ResourceList from '../components/dashboard/ResourceList';
import { buttonClass, ConfirmDialog, EmptyPanel, ErrorNotice, Input, LoadingPanel, PageHeader, PendingButton, SearchBox, secondaryButtonClass, Select, Field, useDialogA11y } from '../components/dashboard/Ui';
import { useSession } from '../hooks/useAuth';
import { canManageUser, hasCapability } from '../lib/auth';
import { ProductImage } from '../components/product/ProductImage';
import { formatPrice } from '../lib/price';
import { formatPublicUpdatedAt, profileCompleteness } from '../lib/umkmStatus';

const statusLabel = { draft: 'Draf', published: 'Terbit', archived: 'Diarsipkan' };
const badge = (text: string, active = true) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-sage-light text-forest' : 'bg-cream-tint text-warm-gray'}`}>{text}</span>;
export function UMKMListPage() { const user=useSession().data!.user; return <ResourceList<ManagedUMKM> resource="umkms" title="Daftar UMKM" description="Kelola profil usaha dan status publikasinya." noun="UMKM" canCreate={hasCapability(user,'umkms:create')} canPublish={hasCapability(user,'umkms:publish')} canArchive={hasCapability(user,'umkms:archive')} canRestore={hasCapability(user,'umkms:restore')} canDelete={hasCapability(user,'umkms:archive')||hasCapability(user,'umkms:delete')} loader={managementApi.umkms.list} lifecycle={managementApi.umkms} itemName={(x)=>x.name} extraAction={hasCapability(user,'umkms:manage-location-all')||hasCapability(user,'umkms:manage-location-own') ? x=><Link to={`/dashboard/umkms/${x.id}/location`} className={secondaryButtonClass}>Atur Lokasi</Link> : undefined} columns={[{label:'UMKM',render:x=><div><p className="font-bold">{x.name}</p><p className="text-xs text-warm-gray">{x.owner}</p></div>},{label:'Kategori',render:x=>badge(x.category)},{label:'Publikasi',render:x=>badge(statusLabel[x.publicationStatus],x.publicationStatus==='published')},{label:'Kelengkapan',render:x=>{const c=profileCompleteness(x);return <div><p className="font-bold text-forest">{c.percent}%</p><p className="max-w-48 text-xs text-warm-gray">{c.missing.length ? `Belum: ${c.missing.slice(0,2).join(', ')}` : 'Profil lengkap'}</p></div>}},{label:'Produk',render:x=><div><p className="font-bold text-forest">{x.publishedProductCount ?? 0} / {x.assignedProductCount ?? 0}</p><p className="text-xs text-warm-gray">terbit / total</p></div>},{label:'Diperbarui',render:x=><span className="text-xs text-warm-gray">{formatPublicUpdatedAt(x.catalogUpdatedAt??x.updatedAt)??'Belum tersedia'}</span>},{label:'Kontak',render:x=><div><span>{x.phone}</span><div className="mt-1">{badge(x.isContactVerificationFresh?'Kontak terverifikasi':x.contactVerifiedAt?'Perlu diverifikasi ulang':'Belum diverifikasi',Boolean(x.isContactVerificationFresh))}</div></div>}]} />; }
export function ProductListPage() { const user=useSession().data!.user; return <ResourceList<ManagedProduct> resource="products" title="Daftar produk" description="Atur katalog, ketersediaan, dan status publikasi produk." noun="produk" canCreate={hasCapability(user,'products:create')} canPublish={hasCapability(user,'products:publish')} canArchive={hasCapability(user,'products:archive-all')||hasCapability(user,'products:archive-own')} canRestore={hasCapability(user,'products:restore-all')||hasCapability(user,'products:restore-own')} canDelete={hasCapability(user,'products:delete')||hasCapability(user,'products:archive-all')||hasCapability(user,'products:archive-own')} loader={managementApi.products.list} lifecycle={managementApi.products} itemName={(x)=>x.name} columns={[{label:'Produk',render:x=><div className="flex min-w-0 items-center gap-3"><ProductImage src={x.imageUrl} alt={`Gambar ${x.name}`} className="h-16 w-16 shrink-0 rounded-xl object-cover"/><div className="min-w-0"><p className="break-words font-bold">{x.name}</p><p className="break-words text-xs text-warm-gray">{x.umkmName??'UMKM'}</p><p className="mt-1 text-xs font-bold text-forest">{formatPrice(x.price)}</p></div></div>},{label:'Kategori',render:x=>badge(x.category)},{label:'Publikasi',render:x=>badge(statusLabel[x.publicationStatus],x.publicationStatus==='published')},{label:'Ketersediaan',render:x=>badge(x.isAvailable?'Tersedia':'Tidak tersedia',x.isAvailable)}]} />; }

function ResetPasswordDialog({ user, password, pending, onPassword, onCancel, onConfirm }: { user: ManagedUser | null; password: string; pending: boolean; onPassword: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useDialogA11y(Boolean(user), pending, onCancel); const titleId = useId(), descriptionId = useId();
  if (!user) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-charcoal/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !pending) onCancel(); }}><div ref={dialogRef} className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}><h2 id={titleId} className="text-lg font-extrabold">Reset kata sandi</h2><p id={descriptionId} className="mt-2 text-sm leading-6 text-warm-gray">Masukkan kata sandi sementara untuk {user.displayName}. Minimal 8 karakter.</p><div className="mt-5"><Field label="Kata sandi sementara"><Input type="password" autoComplete="new-password" value={password} onChange={event => onPassword(event.target.value)} minLength={8}/></Field></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className={secondaryButtonClass} onClick={onCancel} disabled={pending}>Batal</button><PendingButton pending={pending} className={buttonClass} disabled={password.length < 8} onClick={onConfirm}>Reset kata sandi</PendingButton></div></div></div>;
}

export function UserListPage() {
  const [search,setSearch]=useState(''); const deferred=useDeferredValue(search); const [role,setRole]=useState(''); const [active,setActive]=useState(''); const params={q:deferred||undefined,role:(role||undefined) as 'superadmin'|'admin'|'perangkat_desa'|'pelaku_umkm'|undefined,isActive:active===''?undefined:active==='true',limit:100};
  const actor=useSession().data!.user; const query=useManagedList('admin','users',params,signal=>managementApi.users.list(params,signal)); const revoke=useManagedMutation<string,void>('admin','users',(id,csrf)=>managementApi.users.revokeSessions(id,csrf)); const deleteUser=useManagedMutation<string,{id:string;deleted:boolean}>('admin','users',(id,csrf)=>managementApi.users.delete(id,csrf)); const reset=useManagedMutation<{id:string;temporaryPassword:string},void>('admin','users',({id,temporaryPassword},csrf)=>managementApi.users.resetPassword(id,temporaryPassword,csrf)); const [resetUser,setResetUser]=useState<ManagedUser|null>(null); const [revokeUser,setRevokeUser]=useState<ManagedUser|null>(null); const [temporaryPassword,setTemporaryPassword]=useState(''); const [deleteTarget,setDeleteTarget]=useState<ManagedUser|null>(null); const items=pageItems(query.data); const canCreate=actor.assignableUserRoles.length>0;
   return <><PageHeader title="Pengguna" description="Kelola akses akun dashboard." action={canCreate?<Link to="/dashboard/users/new" className={buttonClass}><Plus className="h-4 w-4"/>Tambah pengguna</Link>:undefined}/><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"><SearchBox value={search} onChange={setSearch} label="Cari pengguna"/><Select value={role} onChange={e=>setRole(e.target.value)} aria-label="Filter peran" className="sm:w-auto min-w-[10rem]"><option value="">Semua peran</option>{actor.manageableUserRoleOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</Select><Select value={active} onChange={e=>setActive(e.target.value)} aria-label="Filter status" className="sm:w-auto min-w-[10rem]"><option value="">Semua status</option><option value="true">Aktif</option><option value="false">Nonaktif</option></Select>{(Boolean(search)||Boolean(role)||Boolean(active))&&<button type="button" onClick={()=>{setSearch('');setRole('');setActive('');}} className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-sage-border bg-white px-4 text-xs font-bold text-warm-gray transition-colors hover:border-charcoal/30 hover:bg-cream-tint hover:text-charcoal shadow-xs"><RotateCcw className="h-3.5 w-3.5"/>Reset Filter</button>}</div>{(reset.isError||revoke.isError)&&<div className="mb-4"><ErrorNotice error={reset.error??revoke.error}/></div>}{query.isPending?<LoadingPanel/>:query.isError?<ErrorNotice error={query.error}/>:!items.length?<EmptyPanel>Tidak ada pengguna yang cocok.</EmptyPanel>:<div className="grid gap-3">{items.map(user=>{const manageable=canManageUser(actor,user); return <article key={user.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-sage-border bg-white p-5 xl:flex-row xl:items-center"><div><p className="font-bold">{user.displayName}</p><p className="mt-1 text-sm text-warm-gray">@{user.username}</p><div className="mt-2 flex gap-2">{badge(user.roleLabel)}{badge(user.isActive?'Aktif':'Nonaktif',user.isActive)}{user.mustChangePassword&&badge('Wajib ganti sandi',false)}</div></div>{manageable&&<div className="flex flex-wrap gap-2"><Link to={`/dashboard/users/${user.id}`} className={secondaryButtonClass}>Edit</Link>{hasCapability(actor,'users:reset-password')&&<button className={secondaryButtonClass} onClick={()=>{setResetUser(user);setTemporaryPassword('')}} disabled={reset.isPending}><KeyRound className="h-4 w-4"/>Reset kata sandi</button>}{hasCapability(actor,'users:revoke-sessions')&&<button className={secondaryButtonClass} onClick={()=>setRevokeUser(user)} disabled={revoke.isPending}><ShieldX className="h-4 w-4"/>Cabut sesi</button>}{hasCapability(actor,'users:delete')&&<button className={secondaryButtonClass} onClick={()=>setDeleteTarget(user)} disabled={deleteUser.isPending}><Trash2 className="h-4 w-4"/>Hapus</button>}</div>}</article>})}</div>}<ResetPasswordDialog user={resetUser} password={temporaryPassword} pending={reset.isPending} onPassword={setTemporaryPassword} onCancel={()=>{setResetUser(null);setTemporaryPassword('')}} onConfirm={()=>{if(resetUser)reset.mutate({id:resetUser.id,temporaryPassword},{onSuccess:()=>{setResetUser(null);setTemporaryPassword('')}})}}/><ConfirmDialog open={Boolean(revokeUser)} title="Cabut semua sesi" description={revokeUser?`${revokeUser.displayName} akan keluar dari semua perangkat dan harus masuk kembali.`:''} confirmLabel="Cabut sesi" pending={revoke.isPending} onCancel={()=>setRevokeUser(null)} onConfirm={()=>{if(revokeUser)revoke.mutate(revokeUser.id,{onSettled:()=>setRevokeUser(null)})}}/><ConfirmDialog open={Boolean(deleteTarget)} title="Hapus pengguna" description={deleteTarget?`Anda akan menghapus permanen ${deleteTarget.displayName} (@${deleteTarget.username}). Data terkait (UMKM, produk) akan tetap ada tanpa pemilik. Tindakan ini tidak dapat dibatalkan.`:''} confirmLabel="Hapus permanen" pending={deleteUser.isPending} onCancel={()=>setDeleteTarget(null)} onConfirm={()=>{if(deleteTarget)deleteUser.mutate(deleteTarget.id,{onSettled:()=>setDeleteTarget(null)})}}/></>;
}

import { formatAuditEvent, sanitizeMetadata } from '../lib/auditEvents';

export function AuditListPage() {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const params = { q: deferred || undefined, limit: 100 };
  const query = useManagedList('admin', 'audit-logs', params, signal => managementApi.audit.list(params, signal));
  const items = pageItems(query.data);

  return (
    <>
      <PageHeader title="Audit log" description="Riwayat aktivitas dan perubahan di ruang pengelolaan." />
      <div className="mb-5">
        <SearchBox value={search} onChange={setSearch} label="Cari aktivitas audit" />
      </div>
      {query.isPending ? (
        <LoadingPanel />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : !items.length ? (
        <EmptyPanel>Belum ada aktivitas yang dicatat.</EmptyPanel>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sage-border bg-white shadow-sm">
          <ul className="divide-y divide-sage-border">
            {items.map((x: AuditLog) => {
              const human = formatAuditEvent(x.action);
              const safeMeta = sanitizeMetadata(x.metadata);
              return (
                <li key={x.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {badge(human.categoryLabel)}
                      <p className="font-bold text-charcoal">{human.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-warm-gray">
                      {x.actor?.displayName ? (
                        <>Oleh <strong className="text-charcoal font-semibold">{x.actor.displayName}</strong></>
                      ) : (
                        'Oleh Sistem'
                      )}
                    </p>
                    {safeMeta && (
                      <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-sage-border bg-cream-bg/60 p-3 text-xs text-warm-gray">
                        {Object.entries(safeMeta).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-mono text-[11px] shadow-2xs">
                            <span className="font-bold text-forest">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <time className="whitespace-nowrap text-xs font-bold text-warm-gray" dateTime={x.createdAt}>
                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(x.createdAt))}
                  </time>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
