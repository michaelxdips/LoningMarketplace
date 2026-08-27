import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { CATEGORIES, type Category } from '@loning/shared';
import {
  managementApi,
  pageItems,
  type ManagedProduct,
  type ManagedUMKM,
  type ManagedUser,
  type ProductCreateInput,
  type ProductUpdateInput,
  type UMKMInput,
  type UserCreateInput,
  type UserUpdateInput,
} from '@loning/shared/lib/management';
import { hasCapability } from '@loning/shared/lib/auth';
import { useCsrfToken, useSession, getFreshCsrfToken } from '@loning/shared/hooks/useAuth';
import { deleteMedia, updateMediaAltText, uploadMedia } from '@loning/shared/lib/api';
import { useManagedItem, useManagedList, useManagedMutation } from '@v2-shared/hooks/useManagement';
import GalleryManager, { type GalleryEntry } from './GalleryManager';
import { useUnsavedChanges } from './useUnsavedChanges';
import {
  ConfirmDialog,
  ErrorNotice,
  Field,
  formErrors,
  Input,
  LoadingPanel,
  MediaField,
  PageHeader,
  PendingButton,
  Select,
  Textarea,
} from './Ui';

/**
 * Form kelola V2 — pasangan fitur dari ManagementForms.tsx UI lama.
 * UMKMFormPage + ProductFormPage + UserFormPage.
 * Logika submit, upload media, galeri, auto-create UMKM, verifikasi kontak,
 * dan konfirmasi hapus dipertahankan penuh; styling V2.
 */

const CONTACT_VERIFICATION_DAYS = 90;
const contactStatus = (item?: ManagedUMKM) => {
  if (!item?.contactVerifiedAt) return 'Belum diverifikasi';
  const fresh = item.isContactVerificationFresh ?? Date.now() - new Date(item.contactVerifiedAt).getTime() < CONTACT_VERIFICATION_DAYS * 86_400_000;
  return fresh ? 'Kontak terverifikasi' : 'Perlu diverifikasi ulang';
};
const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const required = (data: FormData, keys: string[]) =>
  Object.fromEntries(keys.filter((key) => !text(data, key)).map((key) => [key, 'Kolom ini wajib diisi.']));
const mediaTypes = ['image/jpeg', 'image/png', 'image/webp'];
export function validateMediaFile(file: File) {
  if (!mediaTypes.includes(file.type)) return 'Gunakan file JPEG, PNG, atau WebP.';
  if (file.size > 5 * 1024 * 1024) return 'Ukuran gambar maksimal 5 MiB.';
}

function usePendingMedia(currentExternalUrl?: string | null) {
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const [externalUrl, setExternalUrl] = useState('');
  const [cleared, setCleared] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && currentExternalUrl !== undefined) {
      setExternalUrl(currentExternalUrl ?? '');
      initialized.current = true;
    }
  }, [currentExternalUrl]);
  const select = (next?: File) => {
    const nextError = next ? validateMediaFile(next) : undefined;
    setError(nextError);
    setFile(nextError ? undefined : next);
    if (next && !nextError) {
      setExternalUrl('');
      setCleared(false);
    }
    setProgress(undefined);
  };
  const useExternal = (value: string) => {
    setExternalUrl(value);
    setFile(undefined);
    setError(undefined);
    setProgress(undefined);
    setCleared(false);
  };
  const clear = () => {
    setFile(undefined);
    setExternalUrl('');
    setError(undefined);
    setProgress(undefined);
    setCleared(true);
  };
  return { file, error, progress, externalUrl, cleared, setProgress, setError, select, useExternal, clear };
}

const secondaryClass =
  'focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken disabled:opacity-60';
const dangerClass =
  'focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger/40 px-4 text-sm font-medium text-danger-ink transition-colors hover:bg-sunken disabled:opacity-60';

function FormActions({
  pending,
  editing,
  cancelTo,
  onDelete,
}: {
  pending: boolean;
  editing: boolean;
  cancelTo: string;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {editing && onDelete && (
          <button type="button" onClick={onDelete} disabled={pending} className={dangerClass}>
            <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
            Hapus
          </button>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link to={cancelTo} className={secondaryClass}>
          Batal
        </Link>
        <PendingButton type="submit" pending={pending}>
          {pending ? 'Menyimpan...' : editing ? 'Simpan perubahan' : 'Buat data'}
        </PendingButton>
      </div>
    </div>
  );
}

export function UMKMFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const unsaved = useUnsavedChanges();
  const client = useQueryClient();
  const sessionUser = useSession().data!.user;
  const canAssignOwner = hasCapability(sessionUser, 'umkms:assign-owner');
  const item = useManagedItem('umkms', id, managementApi.umkms.get);
  const media = usePendingMedia(item.data && !item.data.imageAssetId ? item.data.imageUrl : undefined);
  const ownerParams = { role: 'pelaku_umkm' as const, isActive: true, limit: 100 };
  const owners = useManagedList<Awaited<ReturnType<typeof managementApi.users.list>>>(
    'admin',
    'users',
    ownerParams,
    (signal) => managementApi.users.list(ownerParams, signal),
    canAssignOwner,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useManagedMutation<UMKMInput, ManagedUMKM>(
    'manage',
    'umkms',
    (input, csrf) => (id ? managementApi.umkms.update(id, input, csrf) : managementApi.umkms.create(input, csrf)),
    'umkms',
  );
  const verify = useManagedMutation<string, ManagedUMKM>('manage', 'umkms', (umkmId, csrf) => managementApi.umkms.verifyContact(umkmId, csrf), 'umkms');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const local = required(data, ['name', 'owner', 'description', 'phone', 'category', 'address']);
    if (!/^\d+$/.test(text(data, 'phone'))) local.phone = 'Gunakan angka saja, termasuk kode negara.';
    if (Object.keys(local).length) return setErrors(local);
    setErrors({});
    media.setError(undefined);
    let uploaded: Awaited<ReturnType<typeof uploadMedia>> | undefined;
    try {
      const uploadCsrf = await getFreshCsrfToken(client);
      if (media.file && uploadCsrf) {
        uploaded = await uploadMedia(media.file, text(data, 'altText'), uploadCsrf, media.setProgress);
      }
      const saveCsrf = await getFreshCsrfToken(client);
      const imageAssetId = media.cleared
        ? null
        : uploaded?.id ?? ((media.externalUrl ?? '').trim() ? null : (item.data?.imageAssetId ?? null)) ?? null;
      const imageUrl = media.cleared
        ? null
        : imageAssetId
          ? null
          : ((media.externalUrl ?? '').trim() || (media.file ? null : (item.data?.imageUrl ?? null))) || null;
      const input: UMKMInput = {
        name: text(data, 'name'),
        owner: text(data, 'owner'),
        description: text(data, 'description'),
        phone: text(data, 'phone'),
        category: text(data, 'category') as Category,
        imageUrl,
        imageAssetId,
        address: text(data, 'address'),
        workingHours: text(data, 'workingHours') || undefined,
        openingTime: text(data, 'openingTime') || undefined,
        closingTime: text(data, 'closingTime') || undefined,
        ...(canAssignOwner ? { ownerUserId: text(data, 'ownerUserId') || null } : {}),
      };
      await save.mutateAsync(input);
      if (!uploaded && imageAssetId && text(data, 'altText') !== (item.data?.altText ?? '')) {
        await updateMediaAltText(imageAssetId, text(data, 'altText') || null, saveCsrf);
      }
      await client.invalidateQueries({ queryKey: ['umkms'] });
      await client.invalidateQueries({ queryKey: ['manage', 'umkms', 'list'] });
      unsaved.markClean();
      navigate('/v2/dashboard/umkms');
    } catch (error) {
      media.setProgress(undefined);
      media.setError(error instanceof Error ? error.message : 'Gagal menyimpan gambar.');
      if (uploaded) void deleteMedia(uploaded.id, await getFreshCsrfToken(client)).catch(() => undefined);
    }
  };

  const canDelete = hasCapability(sessionUser, 'umkms:archive') || hasCapability(sessionUser, 'umkms:delete');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteUmkm = useManagedMutation<string, void>(
    'manage',
    'umkms',
    async (umkmId, csrf) => {
      if (item.data?.publicationStatus !== 'archived') await managementApi.umkms.archive(umkmId, csrf);
      await managementApi.umkms.delete(umkmId, csrf);
    },
    'umkms',
  );

  if ((editing && item.isPending) || (canAssignOwner && owners.isPending)) return <LoadingPanel />;
  const value = item.data;

  return (
    <>
      <PageHeader
        title={editing ? 'Kelola UMKM' : 'Tambah UMKM'}
        description="Perubahan data disimpan sebagai data kelola; gunakan aksi publikasi secara terpisah."
      />
      {editing && value && (
        <section className="mb-5 flex flex-col gap-3 border-l-2 border-accent pl-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{contactStatus(value)}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {value.contactVerifiedAt
                ? `Terakhir diverifikasi pada ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value.contactVerifiedAt))}.`
                : 'Verifikasi memastikan nomor WhatsApp usaha masih dapat digunakan.'}
            </p>
          </div>
          <PendingButton
            id="verify-umkm-contact"
            type="button"
            pending={verify.isPending}
            disabled={!value.isContactValid || Boolean(value.isContactVerificationFresh)}
            onClick={() => id && verify.mutate(id)}
          >
            {verify.isPending
              ? 'Memverifikasi...'
              : value.isContactVerificationFresh
                ? 'Terverifikasi'
                : value.contactVerifiedAt
                  ? 'Verifikasi ulang'
                  : 'Verifikasi kontak sekarang'}
          </PendingButton>
        </section>
      )}
      {verify.isError && (
        <div className="mb-5">
          <ErrorNotice error={verify.error} />
        </div>
      )}
      <form className="space-y-6" onChange={unsaved.markDirty} onInput={unsaved.markDirty} onSubmit={submit}>
        {(save.isError || item.isError || owners.isError || deleteUmkm.isError) && (
          <ErrorNotice error={save.error ?? item.error ?? owners.error ?? deleteUmkm.error} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama UMKM" error={errors.name ?? formErrors(save.error).name}>
            <Input name="name" required defaultValue={value?.name} autoCapitalize="words" />
          </Field>
          <Field label="Nama pemilik usaha" error={errors.owner ?? formErrors(save.error).owner}>
            <Input name="owner" required defaultValue={value?.owner} autoCapitalize="words" />
          </Field>
          {canAssignOwner && (
            <Field label="Akun pemilik" hint="Pilih akun dashboard yang bertanggung jawab." error={formErrors(save.error).ownerUserId}>
              <Select name="ownerUserId" defaultValue={value?.ownerUserId ?? ''}>
                <option value="">Belum ditetapkan</option>
                {pageItems<ManagedUser>(owners.data).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} (@{user.username})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Kategori" error={errors.category ?? formErrors(save.error).category}>
            <Select name="category" required defaultValue={value?.category}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nomor WhatsApp" error={errors.phone ?? formErrors(save.error).phone}>
            <Input name="phone" inputMode="numeric" required defaultValue={value?.phone} />
          </Field>
          <Field label="Jam buka">
            <Input name="openingTime" type="time" defaultValue={value?.openingTime} />
          </Field>
          <Field label="Jam tutup">
            <Input name="closingTime" type="time" defaultValue={value?.closingTime} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Jam operasional lengkap">
              <Input name="workingHours" defaultValue={value?.workingHours} placeholder="Contoh: Senin-Minggu 08.00 - 17.00 WIB" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Alamat" error={errors.address}>
              <Input name="address" required defaultValue={value?.address} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <MediaField
              currentUrl={media.cleared ? undefined : media.externalUrl || value?.imageUrl}
              file={media.file}
              progress={media.progress}
              error={media.error ?? errors.imageUrl}
              onFile={media.select}
              onClear={media.clear}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="URL gambar eksternal" hint="Memilih URL eksternal menggantikan upload atau sumber saat ini.">
              <Input name="imageUrl" type="url" value={media.externalUrl} onChange={(event) => media.useExternal(event.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Teks alternatif gambar" hint="Jelaskan isi gambar secara singkat untuk pembaca layar. Maksimal 500 karakter.">
              <Input name="altText" defaultValue={value?.altText ?? ''} maxLength={500} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Deskripsi" error={errors.description}>
              <Textarea name="description" required defaultValue={value?.description} />
            </Field>
          </div>
        </div>
        <FormActions
          pending={save.isPending || media.progress !== undefined || deleteUmkm.isPending}
          editing={editing}
          cancelTo="/v2/dashboard/umkms"
          onDelete={canDelete ? () => setConfirmDelete(true) : undefined}
        />
      </form>
      {unsaved.dialog}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus UMKM"
        description={
          value?.publicationStatus === 'archived'
            ? `${value.name} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
            : `${value?.name ?? 'UMKM ini'} akan diarsipkan dan dihapus secara permanen. Lanjutkan?`
        }
        confirmLabel="Hapus permanen"
        pending={deleteUmkm.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (id) {
            deleteUmkm.mutate(id, {
              onSuccess: () => navigate('/v2/dashboard/umkms'),
              onSettled: () => setConfirmDelete(false),
            });
          }
        }}
      />
    </>
  );
}

export function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const unsaved = useUnsavedChanges();
  const client = useQueryClient();
  const csrf = useCsrfToken();
  const sessionUser = useSession().data!.user;
  const item = useManagedItem('products', id, managementApi.products.get);
  const media = usePendingMedia(item.data && !item.data.imageAssetId ? item.data.imageUrl : undefined);
  const params = { limit: 100 };
  const umkms = useManagedList('manage', 'umkms', params, (signal) => managementApi.umkms.list(params, signal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [umkmSearch, setUmkmSearch] = useState('');
  const [umkmMode, setUmkmMode] = useState<'select' | 'standalone' | 'create'>('select');
  const [umkmSelectValue, setUmkmSelectValue] = useState<string>('');
  const [creatingUmkm, setCreatingUmkm] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryEntry[]>([]);
  const canDelete = hasCapability(sessionUser, 'products:delete') || hasCapability(sessionUser, 'products:archive-all') || hasCapability(sessionUser, 'products:archive-own');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteProduct = useManagedMutation<string, void>(
    'manage',
    'products',
    async (productId, csrf) => {
      if (item.data?.publicationStatus !== 'archived') await managementApi.products.archive(productId, csrf);
      await managementApi.products.delete(productId, csrf);
    },
    'products',
  );

  useEffect(() => {
    if (editing && item.data) {
      if (!item.data.umkmId) {
        setUmkmMode('standalone');
        setUmkmSelectValue('__standalone__');
      } else {
        setUmkmMode('select');
        setUmkmSelectValue(item.data.umkmId);
      }
    }
  }, [editing, item.data]);

  useEffect(() => {
    if (editing && id) {
      managementApi.products.images.list(id).then(setGalleryImages).catch(() => undefined);
    }
  }, [editing, id]);

  const save = useManagedMutation<ProductCreateInput | ProductUpdateInput, ManagedProduct>(
    'manage',
    'products',
    (input, csrf) => (id ? managementApi.products.update(id, input as ProductUpdateInput, csrf) : managementApi.products.create(input as ProductCreateInput, csrf)),
    'products',
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const local = required(data, ['name', 'description', 'category']);
    let umkmId: string | null = text(data, 'umkmId') || null;
    const newUmkmName = umkmMode === 'create' ? umkmSearch.trim() : '';
    const standalonePhone = umkmMode === 'standalone' ? text(data, 'phone') : '';
    const standaloneSellerName = umkmMode === 'standalone' ? text(data, 'sellerName') : '';
    if (umkmMode === 'select' && (!umkmId || umkmId === '__standalone__')) {
      local.umkmId = 'Pilih UMKM atau ketik nama baru.';
    } else if (umkmMode === 'create' && !newUmkmName) {
      local.umkmId = 'Nama UMKM baru tidak boleh kosong.';
    } else if (umkmMode === 'standalone') {
      umkmId = null;
      if (!standalonePhone) local.phone = 'Nomor WhatsApp wajib diisi untuk produk mandiri.';
    }
    const price = text(data, 'price');
    if (price && !/^\d+$/.test(price)) local.price = 'Gunakan angka rupiah bulat yang valid.';
    if (Object.keys(local).some((key) => local[key])) return setErrors(local);
    setErrors({});
    media.setError(undefined);
    let uploaded: Awaited<ReturnType<typeof uploadMedia>> | undefined;
    const uploadCsrf = await getFreshCsrfToken(client);
    try {
      if (media.file && uploadCsrf) {
        uploaded = await uploadMedia(media.file, text(data, 'altText'), uploadCsrf, media.setProgress);
      }
      const saveCsrf = await getFreshCsrfToken(client);
      const imageAssetId = media.cleared
        ? null
        : uploaded?.id ?? ((media.externalUrl ?? '').trim() ? null : (item.data?.imageAssetId ?? null)) ?? null;
      const imageUrl = media.cleared
        ? null
        : imageAssetId
          ? null
          : ((media.externalUrl ?? '').trim() || (media.file ? null : (item.data?.imageUrl ?? null))) || null;

      if (umkmMode === 'create' && newUmkmName) {
        setCreatingUmkm(true);
        const placeholderImage = 'https://placehold.co/600x400/e8eee8/4a6b4a?text=' + encodeURIComponent(newUmkmName);
        const newUmkm = await managementApi.umkms.create(
          {
            name: newUmkmName,
            owner: newUmkmName,
            description: `UMKM ${newUmkmName} — dibuat otomatis dari form produk. Lengkapi data UMKM ini.`,
            phone: '628000000000',
            category: text(data, 'category') as Category,
            imageUrl: placeholderImage,
            imageAssetId: null,
            address: 'Belum diisi',
          },
          saveCsrf,
        );
        umkmId = newUmkm.id;
        setCreatingUmkm(false);
      }
      const initialExternal = item.data && !item.data.imageAssetId ? (item.data.imageUrl ?? '') : '';
      const imageChanged = Boolean(media.file) || media.cleared || media.externalUrl.trim() !== initialExternal;
      const imageFields = editing && !imageChanged ? {} : { imageUrl, imageAssetId };
      const common: ProductUpdateInput = {
        umkmId,
        phone: umkmMode === 'standalone' ? standalonePhone || null : null,
        sellerName: umkmMode === 'standalone' ? standaloneSellerName || null : null,
        name: text(data, 'name'),
        price: price === '' ? null : Number(price),
        description: text(data, 'description'),
        category: text(data, 'category') as Category,
        isAvailable: data.get('isAvailable') === 'on',
        unit: text(data, 'unit') || undefined,
        ...imageFields,
      };
      await save.mutateAsync(editing ? common : (common as ProductCreateInput));
      const altAssetId = uploaded?.id ?? item.data?.imageAssetId;
      if (altAssetId && text(data, 'altText') !== (item.data?.altText ?? '')) {
        await updateMediaAltText(altAssetId, text(data, 'altText') || null, saveCsrf);
      }
      unsaved.markClean();
      navigate('/v2/dashboard/products');
    } catch (error) {
      media.setProgress(undefined);
      media.setError(error instanceof Error ? error.message : 'Gagal menyimpan gambar.');
      if (uploaded) void deleteMedia(uploaded.id, await getFreshCsrfToken(client)).catch(() => undefined);
      setCreatingUmkm(false);
    }
  };

  if ((editing && item.isPending) || umkms.isPending) return <LoadingPanel />;
  const value = item.data;

  return (
    <>
      <PageHeader
        title={editing ? 'Kelola produk' : 'Tambah produk'}
        description="Informasi produk dan ketersediaan dapat diperbarui sebelum dipublikasikan."
      />
      <form className="space-y-6" onChange={unsaved.markDirty} onInput={unsaved.markDirty} onSubmit={submit}>
        {(save.isError || item.isError || umkms.isError || deleteProduct.isError) && (
          <ErrorNotice error={save.error ?? item.error ?? umkms.error ?? deleteProduct.error} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama produk" error={errors.name}>
            <Input name="name" required defaultValue={value?.name} autoCapitalize="words" />
          </Field>
          <Field
            label="UMKM / Pengelola"
            error={errors.umkmId}
            hint={umkmMode === 'create' ? 'UMKM baru akan dibuat sebagai draft otomatis.' : umkmMode === 'standalone' ? 'Produk mandiri tidak terikat UMKM. Masukkan nomor kontak WA penjual langsung di bawah.' : undefined}
          >
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              {umkmMode !== 'create' ? (
                <Select
                  name="umkmId"
                  required
                  value={umkmMode === 'standalone' ? '__standalone__' : umkmSelectValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUmkmSelectValue(val);
                    if (val === '__standalone__') setUmkmMode('standalone');
                    else setUmkmMode('select');
                    setErrors((c) => ({ ...c, umkmId: '' }));
                  }}
                  disabled={editing && !hasCapability(sessionUser, 'products:transfer-owner')}
                  className="flex-1"
                >
                  <option value="">Pilih UMKM</option>
                  <option value="__standalone__">Tanpa Profil UMKM (Produk Mandiri)</option>
                  {pageItems(umkms.data)
                    .filter((x) => x.publicationStatus !== 'archived' || x.id === value?.umkmId)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </Select>
              ) : (
                <input
                  type="text"
                  required
                  value={umkmSearch}
                  onChange={(e) => setUmkmSearch(e.target.value)}
                  placeholder="Ketik nama UMKM baru"
                  className="focus-ring-v2 min-h-11 flex-1 rounded-control border border-control-border bg-surface px-4 text-base text-ink placeholder:text-ink-subtle"
                />
              )}
              {umkmMode !== 'create' ? (
                <button
                  type="button"
                  onClick={() => {
                    setUmkmMode('create');
                    setUmkmSearch('');
                    setErrors((c) => ({ ...c, umkmId: '' }));
                  }}
                  className="focus-ring-v2 inline-flex min-h-11 shrink-0 items-center justify-center rounded-control border border-control-border px-3.5 text-sm font-medium text-ink hover:bg-sunken"
                >
                  + UMKM baru
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUmkmMode('select');
                    setUmkmSearch('');
                    setErrors((c) => ({ ...c, umkmId: '' }));
                  }}
                  className="focus-ring-v2 inline-flex min-h-11 shrink-0 items-center justify-center rounded-control border border-control-border px-3.5 text-sm font-medium text-ink hover:bg-sunken"
                >
                  Batal
                </button>
              )}
            </div>
          </Field>
          {umkmMode === 'standalone' && (
            <>
              <Field label="Nomor WhatsApp Penjual" error={errors.phone ?? formErrors(save.error).phone} hint="Contoh: 08123456789 atau 628123456789. Digunakan langsung untuk tombol WhatsApp inquiry.">
                <Input name="phone" type="tel" required defaultValue={value?.phone ?? ''} placeholder="08xxxxxxxxxx" />
              </Field>
              <Field label="Nama Penjual / Pemilik (Opsional)" error={errors.sellerName ?? formErrors(save.error).sellerName} hint="Akan ditampilkan sebagai penyedia produk di katalog.">
                <Input name="sellerName" defaultValue={value?.sellerName ?? ''} placeholder="misal: Pak Ahmad" />
              </Field>
            </>
          )}
          <Field label="Kategori" error={errors.category ?? formErrors(save.error).category}>
            <Select name="category" required defaultValue={value?.category}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Harga (rupiah)" error={errors.price ?? formErrors(save.error).price}>
            <Input name="price" type="number" inputMode="numeric" min="0" step="1" defaultValue={value?.price ?? ''} />
          </Field>
          <Field label="Satuan">
            <Input name="unit" defaultValue={value?.unit} />
          </Field>
          <div className="sm:col-span-2">
            <MediaField
              currentUrl={value?.imageUrl}
              file={media.file}
              progress={media.progress}
              error={media.error ?? errors.imageUrl}
              onFile={media.select}
              onClear={media.clear}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="Teks alternatif gambar" hint="Maksimal 500 karakter untuk deskripsi gambar.">
              <Input name="altText" defaultValue={value?.altText ?? ''} maxLength={500} />
            </Field>
          </div>
          {editing && (
            <div className="sm:col-span-2">
              <Field label="Galeri Produk" hint="Tambah/atur hingga 5 gambar. Gambar pertama jadi cover.">
                <GalleryManager
                  images={galleryImages}
                  onAdd={async (file) => {
                    const uploaded = await uploadMedia(file, null, csrf);
                    if (!uploaded) return null;
                    await managementApi.products.images.add(id!, uploaded.id, csrf);
                    const fresh = await managementApi.products.images.list(id!);
                    setGalleryImages(fresh);
                    return fresh.find((img) => img.id === uploaded.id) ?? null;
                  }}
                  onRemove={async (imageId) => {
                    await managementApi.products.images.remove(id!, imageId, csrf);
                    setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
                  }}
                  onSetPrimary={async (imageId) => {
                    await managementApi.products.images.setPrimary(id!, imageId, csrf);
                    setGalleryImages((prev) => {
                      const target = prev.find((img) => img.id === imageId);
                      if (!target) return prev;
                      return [target, ...prev.filter((img) => img.id !== imageId)];
                    });
                  }}
                />
              </Field>
            </div>
          )}
          <div className="sm:col-span-2">
            <Field label="Deskripsi" error={errors.description}>
              <Textarea name="description" required defaultValue={value?.description} />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
            <input name="isAvailable" type="checkbox" defaultChecked={value?.isAvailable ?? true} className="h-5 w-5 accent-brand" />
            Produk tersedia
          </label>
        </div>
        <FormActions
          pending={save.isPending || media.progress !== undefined || creatingUmkm || deleteProduct.isPending}
          editing={editing}
          cancelTo="/v2/dashboard/products"
          onDelete={canDelete ? () => setConfirmDelete(true) : undefined}
        />
      </form>
      {unsaved.dialog}
      <ConfirmDialog
        open={confirmDelete}
        title="Hapus Produk"
        description={
          item.data?.publicationStatus === 'archived'
            ? `${item.data.name} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
            : `${item.data?.name ?? 'Produk ini'} akan diarsipkan dan dihapus secara permanen. Lanjutkan?`
        }
        confirmLabel="Hapus permanen"
        pending={deleteProduct.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (id) {
            deleteProduct.mutate(id, {
              onSuccess: () => navigate('/v2/dashboard/products'),
              onSettled: () => setConfirmDelete(false),
            });
          }
        }}
      />
    </>
  );
}

export function UserFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const unsaved = useUnsavedChanges();
  const sessionUser = useSession().data!.user;
  const params = { limit: 100 };
  const users = useManagedList('admin', 'users', params, (signal) => managementApi.users.list(params, signal));
  const value = pageItems(users.data).find((user) => user.id === id);
  const editingSelf = Boolean(editing && value?.id === sessionUser.id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingInput, setPendingInput] = useState<UserCreateInput | UserUpdateInput | null>(null);
  const save = useManagedMutation<UserCreateInput | UserUpdateInput, unknown>(
    'admin',
    'users',
    (input, csrf) => (editing ? managementApi.users.update(input as UserUpdateInput, csrf) : managementApi.users.create(input as UserCreateInput, csrf)),
  );
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const local = required(data, ['displayName', 'role', ...(editing ? [] : ['email', 'temporaryPassword'])]);
    if (!editing) {
      const email = text(data, 'email');
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) local.email = 'Format email tidak valid.';
    }
    if (!editing && text(data, 'temporaryPassword').length < 8) local.temporaryPassword = 'Kata sandi sementara minimal 8 karakter.';
    if (Object.keys(local).length) return setErrors(local);
    const fields = {
      username: text(data, 'username'),
      displayName: text(data, 'displayName'),
      role: text(data, 'role') as 'superadmin' | 'admin' | 'perangkat_desa' | 'pelaku_umkm',
    };
    const input = editing
      ? { id: id!, input: { ...fields, isActive: data.get('isActive') === 'on' } }
      : { ...fields, email: text(data, 'email'), temporaryPassword: text(data, 'temporaryPassword') };
    setErrors({});
    if (editing && value && (fields.role !== value.role || (data.get('isActive') !== 'on' && value.isActive))) {
      setPendingInput(input);
      return;
    }
    save.mutate(input, {
      onSuccess: () => {
        unsaved.markClean();
        navigate('/v2/dashboard/users');
      },
    });
  };
  if (users.isPending) return <LoadingPanel />;
  if (editing && !value) return <ErrorNotice error={new Error('Pengguna tidak ditemukan.')} />;
  return (
    <>
      <PageHeader title={editing ? 'Edit pengguna' : 'Tambah pengguna'} description="Atur identitas dan hak akses akun dashboard." />
      <form className="space-y-6" onChange={unsaved.markDirty} onInput={unsaved.markDirty} onSubmit={submit}>
        {(save.isError || users.isError) && <ErrorNotice error={save.error ?? users.error} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama lengkap" error={errors.displayName}>
            <Input name="displayName" required defaultValue={value?.displayName} />
          </Field>
          <Field label="Username" error={errors.username}>
            <Input name="username" required defaultValue={value?.username} pattern="[a-z0-9._-]{3,30}" />
          </Field>
          {editing ? (
            <Field label="Alamat email">
              <Input value={value?.email ?? 'Tidak ditampilkan'} disabled />
            </Field>
          ) : (
            <Field label="Alamat email" error={errors.email}>
              <Input name="email" type="email" required />
            </Field>
          )}
          <Field label="Peran" error={errors.role}>
            <Select name="role" required defaultValue={value?.role} disabled={editingSelf}>
              <option value="">Pilih peran</option>
              {sessionUser.assignableUserRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {editingSelf && <input type="hidden" name="role" value={value?.role} />}
          </Field>
          {editing && (
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink">
              <input name="isActive" type="checkbox" defaultChecked={value?.isActive} className="h-5 w-5 accent-brand" />
              Akun aktif
            </label>
          )}
          <Field label="Kata sandi sementara" error={errors.temporaryPassword} hint="Minimal 8 karakter; pengguna wajib menggantinya.">
            <Input name="temporaryPassword" type="password" autoComplete="new-password" required={!editing} minLength={8} />
          </Field>
        </div>
        <FormActions pending={save.isPending} editing={editing} cancelTo="/v2/dashboard/users" />
      </form>
      {unsaved.dialog}
      <ConfirmDialog
        open={Boolean(pendingInput)}
        title="Konfirmasi perubahan akses"
        description="Perubahan peran atau penonaktifan akun dapat mencabut akses dan sesi pengguna. Lanjutkan?"
        confirmLabel="Simpan perubahan"
        pending={save.isPending}
        onCancel={() => setPendingInput(null)}
        onConfirm={() => {
          if (pendingInput)
            save.mutate(pendingInput, {
              onSuccess: () => {
                unsaved.markClean();
                navigate('/v2/dashboard/users');
              },
              onSettled: () => setPendingInput(null),
            });
        }}
      />
    </>
  );
}
