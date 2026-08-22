import {
  useDeferredValue,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Archive, EyeOff, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useManagedList, useManagedMutation } from "../../hooks/useManagement";
import {
  pageItems,
  type ListParams,
  type PublicationStatus,
} from "../../lib/management";
import { CATEGORIES, type Category } from '../../types';
import {
  buttonClass,
  dangerButtonClass,
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  PageHeader,
  SearchBox,
  secondaryButtonClass,
  Select,
  ConfirmDialog,
} from "./Ui";
interface Column<T> {
  label: string;
  render: (item: T) => ReactNode;
}
interface Lifecycle<T> {
  archive: (id: string, csrf?: string) => Promise<T | void>;
  restore: (id: string, csrf?: string) => Promise<T>;
  publish: (id: string, csrf?: string) => Promise<T>;
  unpublish: (id: string, csrf?: string) => Promise<T>;
  delete: (id: string, csrf?: string) => Promise<{ id: string } | void>;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function ResourceList<
  T extends { id: string; publicationStatus: PublicationStatus },
>({
  resource,
  title,
  description,
  noun,
  loader,
  lifecycle,
  columns,
  itemName,
  canCreate = true,
  canPublish = true,
  canArchive = false,
  canRestore = false,
  canDelete = false,
  extraAction,
}: {
  resource: "umkms" | "products";
  title: string;
  description: string;
  noun: string;
  loader: (
    params: ListParams,
    signal?: AbortSignal,
  ) => Promise<
    T[] | { items: T[]; total: number; page: number; pageSize: number }
  >;
  lifecycle: Lifecycle<T>;
  columns: Column<T>[];
  itemName: (item: T) => string;
  canCreate?: boolean;
  canPublish?: boolean;
  canArchive?: boolean;
  canRestore?: boolean;
  canDelete?: boolean;
  extraAction?: (item: T) => ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = (searchParams.get("status") as PublicationStatus) || "";
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);
  const [category, setCategory] = useState<Category | "">("");
  const [publicationStatus, setStatus] = useState<PublicationStatus | "">(statusFromUrl);
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    const statusParam = (searchParams.get("status") as PublicationStatus) || "";
    if (statusParam !== publicationStatus) {
      setStatus(statusParam);
    }
  }, [searchParams]);

  const handleStatusChange = (newStatus: PublicationStatus | "") => {
    setStatus(newStatus);
    const nextParams = new URLSearchParams(searchParams);
    if (newStatus) {
      nextParams.set("status", newStatus);
    } else {
      nextParams.delete("status");
    }
    setSearchParams(nextParams, { replace: true });
  };
  const [confirm, setConfirm] = useState<{
    item: T;
    kind: keyof Lifecycle<T>;
  } | null>(null);
  const params = {
    q: deferred || undefined,
    category: category || undefined,
    publicationStatus: publicationStatus || undefined,
    isAvailable: availability === "" ? undefined : availability === "true",
    limit: 100,
  };
  const query = useManagedList("manage", resource, params, (signal) =>
    loader(params, signal),
  );
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const action = useManagedMutation<
    { id: string; kind: keyof Lifecycle<T> },
    T | { id: string } | void
  >(
    "manage",
    resource,
    ({ id, kind }, csrf) => lifecycle[kind](id, csrf),
    resource,
  );
  const items = pageItems(query.data);
  const request = (item: T, kind: keyof Lifecycle<T>) =>
    setConfirm({ item, kind });
  const label: Record<keyof Lifecycle<T>, string> = {
    archive: "Arsipkan",
    restore: "Pulihkan",
    publish: "Terbitkan",
    unpublish: "Batalkan publikasi",
    delete: "Hapus permanen",
  };
  const actions = (item: T) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Link
        to={`/dashboard/${resource}/${item.id}`}
        className={secondaryButtonClass}
      >
        Kelola
      </Link>
      {extraAction?.(item)}
      {canPublish && item.publicationStatus === "draft" && (
        <button
          className={buttonClass}
          onClick={() => request(item, "publish")}
          disabled={action.isPending}
        >
          <Send className="h-4 w-4" />
          Terbitkan
        </button>
      )}
      {canPublish && item.publicationStatus === "published" && (
        <button
          className={secondaryButtonClass}
          onClick={() => request(item, "unpublish")}
          disabled={action.isPending}
        >
          <EyeOff className="h-4 w-4" />
          Batalkan publikasi
        </button>
      )}
      {canArchive && item.publicationStatus !== "archived" && (
        <button
          className={dangerButtonClass}
          onClick={() => request(item, "archive")}
          disabled={action.isPending}
        >
          <Archive className="h-4 w-4" />
          Arsipkan
        </button>
      )}
      {canRestore && item.publicationStatus === "archived" && (
        <button
          className={secondaryButtonClass}
          onClick={() => request(item, "restore")}
          disabled={action.isPending}
        >
          <RotateCcw className="h-4 w-4" />
          Pulihkan
        </button>
      )}
      {canDelete && item.publicationStatus === "archived" && (
        <button
          className={dangerButtonClass}
          onClick={() => request(item, "delete")}
          disabled={action.isPending}
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </button>
      )}
    </div>
  );
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          canCreate ? (
            <Link to={`/dashboard/${resource}/new`} className={buttonClass}>
              <Plus className="h-4 w-4" />
              Tambah {noun}
            </Link>
          ) : undefined
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBox value={search} onChange={setSearch} label={`Cari ${noun}`} />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
          aria-label="Filter kategori"
          className="sm:w-auto min-w-[11rem]"
        >
          <option value="">Semua kategori</option>
          {CATEGORIES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Select
          value={publicationStatus}
          onChange={(e) => handleStatusChange(e.target.value as PublicationStatus | "")}
          aria-label="Filter publikasi"
          className="sm:w-auto min-w-[10rem]"
        >
          <option value="">Semua status</option>
          <option value="draft">Draf</option>
          <option value="published">Terbit</option>
          <option value="archived">Diarsipkan</option>
        </Select>
        {resource === "products" && (
          <Select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            aria-label="Filter ketersediaan"
            className="sm:w-auto min-w-[11rem]"
          >
            <option value="">Semua ketersediaan</option>
            <option value="true">Tersedia</option>
            <option value="false">Tidak tersedia</option>
          </Select>
        )}
        {(Boolean(search) || Boolean(category) || Boolean(publicationStatus) || Boolean(availability)) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("");
              handleStatusChange("");
              setAvailability("");
            }}
            className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-sage-border bg-white px-4 text-xs font-bold text-warm-gray transition-colors hover:border-charcoal/30 hover:bg-cream-tint hover:text-charcoal shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filter
          </button>
        )}
      </div>
      {action.isError && (
        <div className="mb-4">
          <ErrorNotice error={action.error} />
        </div>
      )}
      {query.isPending ? (
        <LoadingPanel />
      ) : query.isError ? (
        <ErrorNotice error={query.error} />
      ) : !items.length ? (
        <EmptyPanel>Tidak ada {noun} yang cocok.</EmptyPanel>
      ) : (
        isDesktop ? (
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-charcoal/25 text-xs uppercase tracking-wider text-warm-gray">
                <tr>
                  {columns.map((c) => (
                    <th key={c.label} className="px-5 py-3 font-bold">
                      {c.label}
                    </th>
                  ))}
                  <th className="w-[25%] px-5 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/10">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-cream-tint/40">
                    {columns.map((c) => (
                      <td key={c.label} className="px-5 py-4 align-middle">
                        {c.render(item)}
                      </td>
                    ))}
                    <td className="px-5 py-4">{actions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-0 lg:hidden">
            {items.map((item) => (
              <article
                key={item.id}
                className="min-w-0 border-b border-charcoal/10 py-4"
              >
                <div className="space-y-3">
                  {columns.map((c) => (
                    <div
                      key={c.label}
                      className="grid min-w-0 grid-cols-[90px_minmax(0,1fr)] gap-3"
                    >
                      <span className="text-xs font-bold uppercase text-warm-gray">
                        {c.label}
                      </span>
                      <div>{c.render(item)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-charcoal/10 pt-4">
                  {actions(item)}
                </div>
              </article>
            ))}
          </div>
        )
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm ? label[confirm.kind] : ""}
        description={
          confirm
            ? confirm.kind === "delete"
              ? `${itemName(confirm.item)} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
              : `${itemName(confirm.item)} akan diperbarui.`
            : ""
        }
        confirmLabel={confirm?.kind === "delete" ? "Hapus permanen" : undefined}
        pending={action.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm)
            action.mutate(
              { id: confirm.item.id, kind: confirm.kind },
              { onSettled: () => setConfirm(null) },
            );
        }}
      />
    </>
  );
}
