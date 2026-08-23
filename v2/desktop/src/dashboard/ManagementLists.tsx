import { useDeferredValue, useId, useState } from 'react';
import { KeyRound, Plus, RotateCcw, ShieldX, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import {
  managementApi,
  pageItems,
  type AuditLog,
  type ManagedProduct,
  type ManagedUMKM,
  type ManagedUser,
} from '@loning/shared/lib/management';
import { canManageUser, hasCapability } from '@loning/shared/lib/auth';
import { useSession } from '@loning/shared/hooks/useAuth';
import { formatPrice } from '@loning/shared/lib/price';
import { formatPublicUpdatedAt, profileCompleteness } from '@loning/shared/lib/umkmStatus';
import { formatAuditEvent, sanitizeMetadata } from '@loning/shared/lib/auditEvents';
import { useManagedList, useManagedMutation } from '@v2-shared/hooks/useManagement';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import ResourceList, { listBadge, publicationStatusLabel } from './ResourceList';
import {
  ConfirmDialog,
  EmptyPanel,
  ErrorNotice,
  Field,
  Input,
  LoadingPanel,
  PageHeader,
  PendingButton,
  SearchBox,
  Select,
} from './Ui';

/**
 * Daftar kelola V2 — pasangan fitur dari ManagementLists.tsx UI lama.
 * UMKMListPage & ProductListPage memakai ResourceList; UserListPage & AuditListPage
 * daftar khusus. Logika capability & kolom dipertahankan penuh.
 */

const secondaryClass =
  'focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken disabled:opacity-60';

export function UMKMListPage() {
  const user = useSession().data!.user;
  const extraAction =
    hasCapability(user, 'umkms:manage-location-all') || hasCapability(user, 'umkms:manage-location-own')
      ? (x: ManagedUMKM) => (
          <Link to={`/v2/dashboard/umkms/${x.id}/location`} className={secondaryClass}>
            Atur Lokasi
          </Link>
        )
      : undefined;
  return (
    <ResourceList<ManagedUMKM>
      resource="umkms"
      title="Daftar UMKM"
      description="Kelola profil usaha dan status publikasinya."
      noun="UMKM"
      canCreate={hasCapability(user, 'umkms:create')}
      canPublish={hasCapability(user, 'umkms:publish')}
      canArchive={hasCapability(user, 'umkms:archive')}
      canRestore={hasCapability(user, 'umkms:restore')}
      canDelete={hasCapability(user, 'umkms:archive') || hasCapability(user, 'umkms:delete')}
      loader={managementApi.umkms.list}
      lifecycle={managementApi.umkms}
      itemName={(x) => x.name}
      extraAction={extraAction}
      columns={[
        { label: 'UMKM', render: (x) => (
          <div>
            <p className="font-medium text-ink">{x.name}</p>
            <p className="text-xs text-ink-muted">{x.owner}</p>
          </div>
        ) },
        { label: 'Kategori', render: (x) => listBadge(x.category) },
        { label: 'Publikasi', render: (x) => listBadge(publicationStatusLabel[x.publicationStatus], x.publicationStatus === 'published') },
        { label: 'Kelengkapan', render: (x) => {
          const c = profileCompleteness(x);
          return (
            <div>
              <p className="numeric font-medium text-brand">{c.percent}%</p>
              <p className="max-w-48 text-xs text-ink-muted">
                {c.missing.length ? `Belum: ${c.missing.slice(0, 2).join(', ')}` : 'Profil lengkap'}
              </p>
            </div>
          );
        } },
        { label: 'Produk', render: (x) => (
          <div>
            <p className="numeric font-medium text-brand">{x.publishedProductCount ?? 0} / {x.assignedProductCount ?? 0}</p>
            <p className="text-xs text-ink-muted">terbit / total</p>
          </div>
        ) },
        { label: 'Diperbarui', render: (x) => (
          <span className="text-xs text-ink-muted">{formatPublicUpdatedAt(x.catalogUpdatedAt ?? x.updatedAt) ?? 'Belum tersedia'}</span>
        ) },
        { label: 'Kontak', render: (x) => (
          <div>
            <span className="text-sm text-ink">{x.phone}</span>
            <div className="mt-1">
              {listBadge(
                x.isContactVerificationFresh ? 'Kontak terverifikasi' : x.contactVerifiedAt ? 'Perlu diverifikasi ulang' : 'Belum diverifikasi',
                Boolean(x.isContactVerificationFresh),
              )}
            </div>
          </div>
        ) },
      ]}
    />
  );
}

export function ProductListPage() {
  const user = useSession().data!.user;
  return (
    <ResourceList<ManagedProduct>
      resource="products"
      title="Daftar produk"
      description="Atur katalog, ketersediaan, dan status publikasi produk."
      noun="produk"
      canCreate={hasCapability(user, 'products:create')}
      canPublish={hasCapability(user, 'products:publish')}
      canArchive={hasCapability(user, 'products:archive-all') || hasCapability(user, 'products:archive-own')}
      canRestore={hasCapability(user, 'products:restore-all') || hasCapability(user, 'products:restore-own')}
      canDelete={hasCapability(user, 'products:delete') || hasCapability(user, 'products:archive-all') || hasCapability(user, 'products:archive-own')}
      loader={managementApi.products.list}
      lifecycle={managementApi.products}
      itemName={(x) => x.name}
      columns={[
        { label: 'Produk', render: (x) => (
          <div className="flex min-w-0 items-center gap-3">
            <MediaImage src={x.imageUrl} alt={`Gambar ${x.name}`} ratio="aspect-square" className="h-16 w-16 shrink-0" />
            <div className="min-w-0">
              <p className="break-words font-medium text-ink">{x.name}</p>
              <p className="break-words text-xs text-ink-muted">{x.umkmName ?? 'UMKM'}</p>
              <p className="numeric mt-1 text-xs font-medium text-brand">{formatPrice(x.price)}</p>
            </div>
          </div>
        ) },
        { label: 'Kategori', render: (x) => listBadge(x.category) },
        { label: 'Publikasi', render: (x) => listBadge(publicationStatusLabel[x.publicationStatus], x.publicationStatus === 'published') },
        { label: 'Ketersediaan', render: (x) => listBadge(x.isAvailable ? 'Tersedia' : 'Tidak tersedia', x.isAvailable) },
      ]}
    />
  );
}

function ResetPasswordDialog({
  user,
  password,
  pending,
  onPassword,
  onCancel,
  onConfirm,
}: {
  user: ManagedUser | null;
  password: string;
  pending: boolean;
  onPassword: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  if (!user) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto border border-line bg-surface p-6 shadow-[0_24px_64px_rgba(16,22,18,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-ink">
          Reset kata sandi
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-ink-muted">
          Masukkan kata sandi sementara untuk {user.displayName}. Minimal 8 karakter.
        </p>
        <div className="mt-5">
          <Field label="Kata sandi sementara">
            <Input type="password" autoComplete="new-password" value={password} onChange={(event) => onPassword(event.target.value)} minLength={8} />
          </Field>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className={secondaryClass} onClick={onCancel} disabled={pending}>
            Batal
          </button>
          <PendingButton pending={pending} disabled={password.length < 8} onClick={onConfirm}>
            Reset kata sandi
          </PendingButton>
        </div>
      </div>
    </div>
  );
}

export function UserListPage() {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const params = {
    q: deferred || undefined,
    role: (role || undefined) as 'superadmin' | 'admin' | 'perangkat_desa' | 'pelaku_umkm' | undefined,
    isActive: active === '' ? undefined : active === 'true',
    limit: 100,
  };
  const actor = useSession().data!.user;
  const query = useManagedList('admin', 'users', params, (signal) => managementApi.users.list(params, signal));
  const revoke = useManagedMutation<string, void>('admin', 'users', (id, csrf) => managementApi.users.revokeSessions(id, csrf));
  const deleteUser = useManagedMutation<string, { id: string; deleted: boolean }>('admin', 'users', (id, csrf) => managementApi.users.delete(id, csrf));
  const reset = useManagedMutation<{ id: string; temporaryPassword: string }, void>('admin', 'users', ({ id, temporaryPassword }, csrf) => managementApi.users.resetPassword(id, temporaryPassword, csrf));
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [revokeUser, setRevokeUser] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const items = pageItems(query.data);
  const canCreate = actor.assignableUserRoles.length > 0;
  const hasFilters = Boolean(search) || Boolean(role) || Boolean(active);

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola akses akun dashboard."
        action={
          canCreate ? (
            <Link to="/v2/dashboard/users/new" className="focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover">
              <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
              Tambah pengguna
            </Link>
          ) : undefined
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBox value={search} onChange={setSearch} label="Cari pengguna" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter peran" className="sm:w-auto sm:min-w-[10rem]">
          <option value="">Semua peran</option>
          {actor.manageableUserRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={active} onChange={(e) => setActive(e.target.value)} aria-label="Filter status" className="sm:w-auto sm:min-w-[10rem]">
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setRole('');
              setActive('');
            }}
            className="focus-ring-v2 inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-control border border-control-border px-4 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />
            Reset Filter
          </button>
        )}
      </div>

      {(reset.isError || revoke.isError) && (
        <div className="mb-4">
          <ErrorNotice error={reset.error ?? revoke.error} />
        </div>
      )}

      {query.isPending ? (
        <LoadingPanel />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : !items.length ? (
        <EmptyPanel>Tidak ada pengguna yang cocok.</EmptyPanel>
      ) : (
        <div className="grid">
          {items.map((user) => {
            const manageable = canManageUser(actor, user);
            return (
              <article key={user.id} className="flex flex-col justify-between gap-4 border-b border-line py-5 xl:flex-row xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{user.displayName}</p>
                    {listBadge(user.roleLabel, true)}
                    {!user.isActive && listBadge('Nonaktif', false)}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">@{user.username}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">{user.email ?? 'Email tidak ditampilkan'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {manageable && (
                    <Link to={`/v2/dashboard/users/${user.id}`} className={secondaryClass}>
                      Edit
                    </Link>
                  )}
                  {hasCapability(actor, 'users:reset-password') && (
                    <button className={secondaryClass} onClick={() => { setResetUser(user); setTemporaryPassword(''); }} disabled={reset.isPending}>
                      <KeyRound size={15} strokeWidth={1.5} aria-hidden="true" />
                      Reset kata sandi
                    </button>
                  )}
                  {hasCapability(actor, 'users:revoke-sessions') && (
                    <button className={secondaryClass} onClick={() => setRevokeUser(user)} disabled={revoke.isPending}>
                      <ShieldX size={15} strokeWidth={1.5} aria-hidden="true" />
                      Cabut sesi
                    </button>
                  )}
                  {hasCapability(actor, 'users:delete') && (
                    <button
                      className="focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger/40 px-4 text-sm font-medium text-danger-ink transition-colors hover:bg-sunken disabled:opacity-60"
                      onClick={() => setDeleteTarget(user)}
                      disabled={deleteUser.isPending}
                    >
                      <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
                      Hapus
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ResetPasswordDialog
        user={resetUser}
        password={temporaryPassword}
        pending={reset.isPending}
        onPassword={setTemporaryPassword}
        onCancel={() => setResetUser(null)}
        onConfirm={() => {
          if (resetUser) {
            reset.mutate(
              { id: resetUser.id, temporaryPassword },
              { onSuccess: () => setResetUser(null), onSettled: () => setTemporaryPassword('') },
            );
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(revokeUser)}
        title="Cabut semua sesi"
        description={revokeUser ? `${revokeUser.displayName} (@${revokeUser.username}) akan dikeluarkan dari semua sesi aktif dan harus masuk kembali.` : ''}
        confirmLabel="Cabut sesi"
        pending={revoke.isPending}
        onCancel={() => setRevokeUser(null)}
        onConfirm={() => {
          if (revokeUser) revoke.mutate(revokeUser.id, { onSettled: () => setRevokeUser(null) });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus pengguna"
        description={deleteTarget ? `Anda akan menghapus permanen ${deleteTarget.displayName} (@${deleteTarget.username}). Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmLabel="Hapus permanen"
        pending={deleteUser.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteUser.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      />
    </>
  );
}

export function AuditListPage() {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const params = { q: deferred || undefined, limit: 100 };
  const query = useManagedList('admin', 'audit-logs', params, (signal) => managementApi.audit.list(params, signal));
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
        <div className="overflow-hidden border-t border-line">
          <ul className="divide-y divide-line">
            {items.map((x: AuditLog) => {
              const human = formatAuditEvent(x.action);
              const safeMeta = sanitizeMetadata(x.metadata);
              return (
                <li key={x.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {listBadge(human.categoryLabel, true)}
                      <p className="font-medium text-ink">{human.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {x.actor?.displayName ? (
                        <>
                          Oleh <strong className="font-medium text-ink">{x.actor.displayName}</strong>
                        </>
                      ) : (
                        'Oleh Sistem'
                      )}
                    </p>
                    {safeMeta && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                        {Object.entries(safeMeta).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <span className="font-medium text-brand">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <time className="whitespace-nowrap text-xs font-medium text-ink-subtle" dateTime={x.createdAt}>
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
