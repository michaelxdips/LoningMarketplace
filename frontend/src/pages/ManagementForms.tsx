import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import {
  useManagedItem,
  useManagedList,
  useManagedMutation,
} from "../hooks/useManagement";
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
} from "../lib/management";
import { CATEGORIES, type Category } from "../types";
import { useSession } from "../hooks/useAuth";
import { useCsrfToken } from "../hooks/useAuth";
import { hasCapability } from "../lib/auth";
import { deleteMedia, updateMediaAltText, uploadMedia } from "../lib/api";
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
  secondaryButtonClass,
  Select,
  Textarea,
} from "../components/dashboard/Ui";


const CONTACT_VERIFICATION_DAYS = 90;
const contactStatus = (item?: ManagedUMKM) => {
  if (!item?.contactVerifiedAt) return 'Belum diverifikasi';
  const fresh = item.isContactVerificationFresh ?? Date.now() - new Date(item.contactVerifiedAt).getTime() < CONTACT_VERIFICATION_DAYS * 86_400_000;
  return fresh ? 'Kontak terverifikasi' : 'Perlu diverifikasi ulang';
};
const text = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();
const required = (data: FormData, keys: string[]) =>
  Object.fromEntries(
    keys
      .filter((key) => !text(data, key))
      .map((key) => [key, "Kolom ini wajib diisi."]),
  );
const mediaTypes = ["image/jpeg", "image/png", "image/webp"];
export function validateMediaFile(file: File) {
  if (!mediaTypes.includes(file.type))
    return "Gunakan file JPEG, PNG, atau WebP.";
  if (file.size > 5 * 1024 * 1024) return "Ukuran gambar maksimal 5 MiB.";
}
export type ProductImageMode = "keep-current" | "managed-upload" | "external-url";
export function productImageInput(mode: ProductImageMode, uploadedAssetId?: string, externalUrl = ""): Pick<ProductUpdateInput, "imageUrl" | "imageAssetId"> | Record<string, never> {
  if (mode === "keep-current") return {};
  return mode === "managed-upload" ? { imageUrl: null, imageAssetId: uploadedAssetId! } : { imageUrl: externalUrl, imageAssetId: null };
}
function usePendingMedia(currentExternalUrl?: string) {
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const [externalUrl, setExternalUrl] = useState("");
  const [cleared, setCleared] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && currentExternalUrl !== undefined) {
      setExternalUrl(currentExternalUrl);
      initialized.current = true;
    }
  }, [currentExternalUrl]);
  const select = (next?: File) => {
    const nextError = next ? validateMediaFile(next) : undefined;
    setError(nextError);
    setFile(nextError ? undefined : next);
    if (next && !nextError) {
      setExternalUrl("");
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
    setExternalUrl("");
    setError(undefined);
    setProgress(undefined);
    setCleared(true);
  };
  return {
    file,
    error,
    progress,
    externalUrl,
    cleared,
    setProgress,
    setError,
    select,
    useExternal,
    clear,
  };
}
function FormActions({
  pending,
  editing,
  cancelTo,
}: {
  pending: boolean;
  editing: boolean;
  cancelTo: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-sage-border pt-6 sm:flex-row sm:justify-end">
      <Link to={cancelTo} className={secondaryButtonClass}>
        Batal
      </Link>
      <PendingButton type="submit" pending={pending}>
        {pending ? "Menyimpan..." : editing ? "Simpan perubahan" : "Buat data"}
      </PendingButton>
    </div>
  );
}

export function UMKMFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const client = useQueryClient();
  const csrf = useCsrfToken();
  const sessionUser = useSession().data!.user;
  const canAssignOwner = hasCapability(sessionUser, "umkms:assign-owner");
  const item = useManagedItem("umkms", id, managementApi.umkms.get);
  const media = usePendingMedia(
    item.data && !item.data.imageAssetId ? item.data.imageUrl : undefined,
  );
  const ownerParams = { role: "pelaku_umkm" as const, isActive: true, limit: 100 };
  const owners = useManagedList<
    Awaited<ReturnType<typeof managementApi.users.list>>
  >(
    "admin",
    "users",
    ownerParams,
    (signal) => managementApi.users.list(ownerParams, signal),
    canAssignOwner,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useManagedMutation<UMKMInput, ManagedUMKM>(
    "manage",
    "umkms",
    (input, csrf) =>
      id
        ? managementApi.umkms.update(id, input, csrf)
        : managementApi.umkms.create(input, csrf),
    "umkms",
  );
  const verify = useManagedMutation<string, ManagedUMKM>(
    "manage",
    "umkms",
    (umkmId, csrf) => managementApi.umkms.verifyContact(umkmId, csrf),
    "umkms",
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const local = required(data, [
      "name",
      "owner",
      "description",
      "phone",
      "category",
      "address",
    ]);
    const retainsCurrent =
      !media.cleared &&
      !media.file &&
      !media.externalUrl &&
      (item.data?.imageAssetId || item.data?.imageUrl);
    if (!media.file && !media.externalUrl && !retainsCurrent)
      local.imageUrl = "Masukkan URL gambar atau pilih file.";
    if (!/^\d+$/.test(text(data, "phone")))
      local.phone = "Gunakan angka saja, termasuk kode negara.";
    if (Object.keys(local).length) return setErrors(local);
    setErrors({});
    media.setError(undefined);
    let uploaded: Awaited<ReturnType<typeof uploadMedia>> | undefined;
    let entitySaved = false;
    try {
      if (media.file)
        uploaded = await uploadMedia(
          media.file,
          text(data, "altText"),
          csrf,
          media.setProgress,
        );
      const imageAssetId =
        uploaded?.id ??
        (media.externalUrl ? null : (item.data?.imageAssetId ?? null));
      const imageUrl = imageAssetId
        ? null
        : media.externalUrl || item.data?.imageUrl || null;
      const input: UMKMInput = {
        name: text(data, "name"),
        owner: text(data, "owner"),
        description: text(data, "description"),
        phone: text(data, "phone"),
        category: text(data, "category") as Category,
        imageUrl,
        imageAssetId,
        address: text(data, "address"),
        workingHours: text(data, "workingHours") || undefined,
        ...(canAssignOwner ? { ownerUserId: text(data, "ownerUserId") || null } : {}),
      };
      await save.mutateAsync(input);
      entitySaved = true;
      if (
        !uploaded &&
        imageAssetId &&
        text(data, "altText") !== (item.data?.altText ?? "")
      )
        await updateMediaAltText(
          imageAssetId,
          text(data, "altText") || null,
          csrf,
        );
      await client.invalidateQueries({ queryKey: ["umkms"] });
      navigate("/dashboard/umkms");
    } catch (error) {
      media.setProgress(undefined);
      media.setError(
        error instanceof Error ? error.message : "Gagal menyimpan gambar.",
      );
      if (uploaded && !entitySaved)
        void deleteMedia(uploaded.id, csrf).catch(() => undefined);
    }
  };
  if ((editing && item.isPending) || (canAssignOwner && owners.isPending))
    return <LoadingPanel />;
  const value = item.data;
  return (
    <>
      <PageHeader
        title={editing ? "Kelola UMKM" : "Tambah UMKM"}
        description="Perubahan data disimpan sebagai data kelola; gunakan aksi publikasi secara terpisah."
      />
      {editing && value && <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-sage-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-charcoal">{contactStatus(value)}</p><p className="mt-1 text-xs text-warm-gray">Verifikasi memastikan nomor WhatsApp usaha masih dapat digunakan.</p></div><PendingButton id="verify-umkm-contact" type="button" pending={verify.isPending} disabled={!value.isContactValid} onClick={() => id && verify.mutate(id)}>{verify.isPending ? 'Memverifikasi...' : 'Verifikasi kontak sekarang'}</PendingButton></section>}
      {verify.isError && <div className="mb-5"><ErrorNotice error={verify.error} /></div>}
      <form
        className="space-y-6 rounded-2xl border border-sage-border bg-white p-5 sm:p-7"
        onSubmit={submit}
      >
        {(save.isError || item.isError || owners.isError) && (
          <ErrorNotice error={save.error ?? item.error ?? owners.error} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Nama UMKM"
            error={errors.name ?? formErrors(save.error).name}
          >
            <Input name="name" required defaultValue={value?.name} />
          </Field>
          <Field label="Nama pemilik usaha" error={errors.owner}>
            <Input name="owner" required defaultValue={value?.owner} />
          </Field>
          {canAssignOwner && (
            <Field
              label="Akun pemilik"
              hint="Pilih akun dashboard yang bertanggung jawab."
            >
              <Select
                name="ownerUserId"
                defaultValue={value?.ownerUserId ?? ""}
              >
                <option value="">Belum ditetapkan</option>
                {pageItems<ManagedUser>(owners.data).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} (@{user.username})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Kategori" error={errors.category}>
            <Select name="category" required defaultValue={value?.category}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nomor WhatsApp" error={errors.phone}>
            <Input
              name="phone"
              inputMode="numeric"
              required
              defaultValue={value?.phone}
            />
          </Field>
          <Field label="Jam operasional">
            <Input name="workingHours" defaultValue={value?.workingHours} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Alamat" error={errors.address}>
              <Input name="address" required defaultValue={value?.address} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <MediaField
              currentUrl={
                media.cleared ? undefined : media.externalUrl || value?.imageUrl
              }
              file={media.file}
              progress={media.progress}
              error={media.error ?? errors.imageUrl}
              onFile={media.select}
              onClear={media.clear}
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="URL gambar eksternal"
              hint="Memilih URL eksternal menggantikan upload atau sumber saat ini."
            >
              <Input
                name="imageUrl"
                type="url"
                value={media.externalUrl}
                onChange={(event) => media.useExternal(event.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Teks alternatif gambar"
              hint="Jelaskan isi gambar secara singkat untuk pembaca layar."
            >
              <Input name="altText" defaultValue={value?.altText ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Deskripsi" error={errors.description}>
              <Textarea
                name="description"
                required
                defaultValue={value?.description}
              />
            </Field>
          </div>
        </div>
        <FormActions
          pending={save.isPending || media.progress !== undefined}
          editing={editing}
          cancelTo="/dashboard/umkms"
        />
      </form>
    </>
  );
}

export function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const csrf = useCsrfToken();
  const sessionUser = useSession().data!.user;
  const item = useManagedItem("products", id, managementApi.products.get);
  const media = usePendingMedia();
  const params = { limit: 100 };
  const umkms = useManagedList("manage", "umkms", params, (signal) =>
    managementApi.umkms.list(params, signal),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageMode, setImageMode] = useState<ProductImageMode>(editing ? "keep-current" : "managed-upload");
  const [uploadedAsset, setUploadedAsset] = useState<
    Awaited<ReturnType<typeof uploadMedia>> | undefined
  >();
  const [uploading, setUploading] = useState(false);
  // UMKM combobox state: allows typing to filter or entering a new UMKM name
  const [umkmSearch, setUmkmSearch] = useState("");
  const [umkmMode, setUmkmMode] = useState<"select" | "create">("select");
  const [creatingUmkm, setCreatingUmkm] = useState(false);
  const save = useManagedMutation<
    ProductCreateInput | ProductUpdateInput,
    ManagedProduct
  >(
    "manage",
    "products",
    (input, csrf) =>
      id
        ? managementApi.products.update(id, input as ProductUpdateInput, csrf)
        : managementApi.products.create(input as ProductCreateInput, csrf),
    "products",
  );
  const selectMode = (mode: typeof imageMode) => {
    if (uploadedAsset)
      void deleteMedia(uploadedAsset.id, csrf).catch(() => undefined);
    setUploadedAsset(undefined);
    setImageMode(mode);
    media.clear();
    setErrors((current) => ({ ...current, imageUrl: "" }));
  };
  const selectManagedFile = async (file?: File) => {
    if (uploadedAsset)
      void deleteMedia(uploadedAsset.id, csrf).catch(() => undefined);
    setUploadedAsset(undefined);
    media.select(file);
    if (!file || validateMediaFile(file)) return;
    setUploading(true);
    try {
      const asset = await uploadMedia(file, "", csrf, media.setProgress);
      setUploadedAsset(asset);
      media.setProgress(undefined);
    } catch (error) {
      media.select(undefined);
      media.setError(
        error instanceof Error ? error.message : "Upload gambar gagal.",
      );
    } finally {
      setUploading(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const local = required(data, ["name", "description", "category"]);
    // UMKM validation: either select existing or type new name
    let umkmId = text(data, "umkmId");
    const newUmkmName = umkmMode === "create" ? umkmSearch.trim() : "";
    if (umkmMode === "select" && !umkmId) {
      local.umkmId = "Pilih UMKM atau ketik nama baru.";
    } else if (umkmMode === "create" && !newUmkmName) {
      local.umkmId = "Nama UMKM baru tidak boleh kosong.";
    }
    const price = text(data, "price");
    if (price && !/^\d+$/.test(price))
      local.price = "Gunakan angka rupiah bulat yang valid.";
    if (imageMode === "managed-upload" && !uploadedAsset)
      local.imageUrl = "Selesaikan unggahan gambar terkelola terlebih dahulu.";
    if (imageMode === "external-url" && !media.externalUrl)
      local.imageUrl = "Masukkan URL gambar eksternal.";
    if (
      imageMode === "keep-current" &&
      (!editing || (!item.data?.imageAssetId && !item.data?.imageUrl))
    )
      local.imageUrl = "Gambar saat ini tidak tersedia.";
    if (Object.keys(local).some((key) => local[key])) return setErrors(local);
    setErrors({});
    media.setError(undefined);
    let entitySaved = false;
    try {
      // Auto-create UMKM draft if user typed a new name
      if (umkmMode === "create" && newUmkmName) {
        setCreatingUmkm(true);
        const placeholderImage = "https://placehold.co/600x400/e8eee8/4a6b4a?text=" + encodeURIComponent(newUmkmName);
        const newUmkm = await managementApi.umkms.create({
          name: newUmkmName,
          owner: newUmkmName,
          description: `UMKM ${newUmkmName} — dibuat otomatis dari form produk. Lengkapi data UMKM ini.`,
          phone: "62000000000",
          category: text(data, "category") as Category,
          imageUrl: placeholderImage,
          imageAssetId: null,
          address: "Belum diisi",
        }, csrf);
        umkmId = newUmkm.id;
        setCreatingUmkm(false);
      }
      const image = productImageInput(imageMode, uploadedAsset?.id, media.externalUrl);
      const common: ProductUpdateInput = {
        umkmId,
        name: text(data, "name"),
        price: price === "" ? null : Number(price),
        description: text(data, "description"),
        category: text(data, "category") as Category,
        ...image,
        isAvailable: data.get("isAvailable") === "on",
        unit: text(data, "unit") || undefined,
      };
      await save.mutateAsync(editing ? common : (common as ProductCreateInput));
      entitySaved = true;
      const altAssetId =
        imageMode === "managed-upload"
          ? uploadedAsset?.id
          : imageMode === "keep-current"
            ? item.data?.imageAssetId
            : undefined;
      if (altAssetId && text(data, "altText") !== (item.data?.altText ?? ""))
        await updateMediaAltText(
          altAssetId,
          text(data, "altText") || null,
          csrf,
        );
      navigate("/dashboard/products");
    } catch (error) {
      media.setProgress(undefined);
      media.setError(
        error instanceof Error ? error.message : "Gagal menyimpan gambar.",
      );
      if (uploadedAsset && !entitySaved) {
        void deleteMedia(uploadedAsset.id, csrf).catch(() => undefined);
        setUploadedAsset(undefined);
      }
      setCreatingUmkm(false);
    }
  };
  if ((editing && item.isPending) || umkms.isPending) return <LoadingPanel />;
  const value = item.data;
  return (
    <>
      <PageHeader
        title={editing ? "Kelola produk" : "Tambah produk"}
        description="Informasi produk dan ketersediaan dapat diperbarui sebelum dipublikasikan."
      />
      <form
        className="space-y-6 rounded-2xl border border-sage-border bg-white p-5 sm:p-7"
        onSubmit={submit}
      >
        {(save.isError || item.isError || umkms.isError) && (
          <ErrorNotice error={save.error ?? item.error ?? umkms.error} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama produk" error={errors.name}>
            <Input name="name" required defaultValue={value?.name} />
          </Field>
          <Field label="UMKM" error={errors.umkmId} hint={umkmMode === "create" ? "UMKM baru akan dibuat sebagai draft otomatis." : undefined}>
            <div className="flex gap-2">
              {umkmMode === "select" ? (
                <Select name="umkmId" required defaultValue={value?.umkmId} disabled={editing && !hasCapability(sessionUser, 'products:transfer-owner')} className="flex-1">
                  <option value="">Pilih UMKM</option>
                  {pageItems(umkms.data)
                    .filter(
                      (x) =>
                        x.publicationStatus !== "archived" ||
                        x.id === value?.umkmId,
                    )
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
                  className="focus-ring min-h-[46px] flex-1 rounded-xl border border-sage-border bg-white px-4 text-sm text-charcoal shadow-2xs transition-all focus:border-forest focus:ring-2 focus:ring-forest/15"
                />
              )}
              <button
                type="button"
                onClick={() => { setUmkmMode(umkmMode === "select" ? "create" : "select"); setUmkmSearch(""); setErrors((c) => ({ ...c, umkmId: "" })); }}
                className="focus-ring shrink-0 rounded-xl border border-sage-border bg-white px-3 text-xs font-bold text-forest shadow-2xs transition-all hover:bg-cream-tint"
              >
                {umkmMode === "select" ? "+ UMKM baru" : "Batal"}
              </button>
              {umkmMode === "select" && (
                <Link
                  to={`/dashboard/umkms/new`}
                  className="focus-ring shrink-0 rounded-xl border border-forest/30 bg-forest/5 px-3 text-xs font-bold text-forest shadow-2xs transition-all hover:bg-forest/10"
                >
                  Form UMKM
                </Link>
              )}
            </div>
          </Field>
          <Field label="Kategori" error={errors.category}>
            <Select name="category" required defaultValue={value?.category}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Harga (rupiah)" error={errors.price}>
            <Input
              name="price"
              type="number"
              min="0"
              step="1"
              defaultValue={value?.price ?? ""}
            />
          </Field>
          <Field label="Satuan">
            <Input name="unit" defaultValue={value?.unit} />
          </Field>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-bold">Sumber gambar</legend>
            {editing && (
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="radio"
                  name="imageMode"
                  checked={imageMode === "keep-current"}
                  onChange={() => selectMode("keep-current")}
                />
                Pertahankan gambar saat ini
              </label>
            )}
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="radio"
                name="imageMode"
                checked={imageMode === "managed-upload"}
                onChange={() => selectMode("managed-upload")}
              />
              Pakai unggahan terkelola
            </label>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="radio"
                name="imageMode"
                checked={imageMode === "external-url"}
                onChange={() => selectMode("external-url")}
              />
              Pakai URL gambar eksternal
            </label>
          </fieldset>
          <div className="sm:col-span-2">
            <MediaField
              currentUrl={
                imageMode === "keep-current"
                  ? value?.imageUrl
                  : imageMode === "external-url"
                    ? media.externalUrl
                    : undefined
              }
              file={imageMode === "managed-upload" ? media.file : undefined}
              progress={media.progress}
              error={media.error ?? errors.imageUrl}
              onFile={selectManagedFile}
              onClear={() => selectMode("managed-upload")}
            />
            {imageMode === "managed-upload" && (
              <p className="mt-2 text-sm text-warm-gray" aria-live="polite">
                {uploading
                  ? "Mengunggah gambar..."
                  : uploadedAsset
                    ? "Unggahan selesai."
                  : "Belum ada file yang dipilih"}
              </p>
            )}
          </div>
          {imageMode === "external-url" && (
            <div className="sm:col-span-2">
              <Field label="URL gambar eksternal" error={errors.imageUrl}>
              <Input
                name="imageUrl"
                type="url"
                value={media.externalUrl}
                onChange={(event) => media.useExternal(event.target.value)}
              />
              </Field>
            </div>
          )}
          <div className="sm:col-span-2">
            <Field
              label="Teks alternatif gambar"
              hint="Jelaskan isi gambar secara singkat untuk pembaca layar."
            >
              <Input name="altText" defaultValue={value?.altText ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Deskripsi" error={errors.description}>
              <Textarea
                name="description"
                required
                defaultValue={value?.description}
              />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
            <input
              name="isAvailable"
              type="checkbox"
              defaultChecked={value?.isAvailable ?? true}
              className="h-5 w-5 accent-forest"
            />
            Produk tersedia
          </label>
        </div>
        <FormActions
          pending={save.isPending || uploading || creatingUmkm}
          editing={editing}
          cancelTo="/dashboard/products"
        />
      </form>
    </>
  );
}

export function UserFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const sessionUser = useSession().data!.user;
  const params = { limit: 100 };
  const users = useManagedList("admin", "users", params, (signal) =>
    managementApi.users.list(params, signal),
  );
  const value = pageItems(users.data).find((user) => user.id === id);
  const editingSelf = Boolean(editing && value?.id === sessionUser.id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingInput, setPendingInput] = useState<
    UserCreateInput | UserUpdateInput | null
  >(null);
  const save = useManagedMutation<UserCreateInput | UserUpdateInput, unknown>(
    "admin",
    "users",
    (input, csrf) =>
      editing
        ? managementApi.users.update(input as UserUpdateInput, csrf)
        : managementApi.users.create(input as UserCreateInput, csrf),
  );
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const local = required(data, [
      "displayName",
      "role",
      ...(editing ? [] : ["email", "temporaryPassword"]),
    ]);
    if (!editing && text(data, "temporaryPassword").length < 8)
      local.temporaryPassword = "Kata sandi sementara minimal 8 karakter.";
    if (Object.keys(local).length) return setErrors(local);
    const fields = {
      username: text(data, "username"),
      displayName: text(data, "displayName"),
      role: text(data, "role") as "superadmin" | "admin" | "perangkat_desa" | "pelaku_umkm",
    };
    const input = editing
      ? {
          id: id!,
          input: { ...fields, isActive: data.get("isActive") === "on" },
        }
      : {
          ...fields,
          email: text(data, "email"),
          temporaryPassword: text(data, "temporaryPassword"),
        };
    setErrors({});
    if (
      editing &&
      value &&
      (fields.role !== value.role ||
        (data.get("isActive") !== "on" && value.isActive))
    ) {
      setPendingInput(input);
      return;
    }
    save.mutate(input, { onSuccess: () => navigate("/dashboard/users") });
  };
  if (users.isPending) return <LoadingPanel />;
  if (editing && !value)
    return <ErrorNotice error={new Error("Pengguna tidak ditemukan.")} />;
  return (
    <>
      <PageHeader
        title={editing ? "Edit pengguna" : "Tambah pengguna"}
        description="Atur identitas dan hak akses akun dashboard."
      />
      <form
        className="space-y-6 rounded-2xl border border-sage-border bg-white p-5 sm:p-7"
        onSubmit={submit}
      >
        {(save.isError || users.isError) && (
          <ErrorNotice error={save.error ?? users.error} />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama lengkap" error={errors.displayName}>
            <Input
              name="displayName"
              required
              defaultValue={value?.displayName}
            />
          </Field>
          <Field label="Username" error={errors.username}>
            <Input name="username" required defaultValue={value?.username} pattern="[a-z0-9._-]{3,30}" />
          </Field>
          {editing ? (
            <Field label="Alamat email">
              <Input value={value?.email ?? "Tidak ditampilkan"} disabled />
            </Field>
          ) : (
            <Field label="Alamat email" error={errors.email}>
              <Input name="email" type="email" required />
            </Field>
          )}
          <Field label="Peran" error={errors.role}>
            <Select name="role" required defaultValue={value?.role} disabled={editingSelf}>
              <option value="">Pilih peran</option>
              {sessionUser.assignableUserRoleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            {editingSelf && <input type="hidden" name="role" value={value?.role} />}
          </Field>
          {editing && (
            <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={value?.isActive}
                className="h-5 w-5 accent-forest"
              />
              Akun aktif
            </label>
          )}
          <Field
            label="Kata sandi sementara"
            error={errors.temporaryPassword}
            hint="Minimal 8 karakter; pengguna wajib menggantinya."
          >
            <Input
              name="temporaryPassword"
              type="password"
              autoComplete="new-password"
              required={!editing}
              minLength={8}
            />
          </Field>
        </div>
        <FormActions
          pending={save.isPending}
          editing={editing}
          cancelTo="/dashboard/users"
        />
      </form>
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
              onSuccess: () => navigate("/dashboard/users"),
              onSettled: () => setPendingInput(null),
            });
        }}
      />
    </>
  );
}
