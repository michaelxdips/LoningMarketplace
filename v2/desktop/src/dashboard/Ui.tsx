import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type RefObject,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, LoaderCircle, Search, Trash2, Upload, X } from 'lucide-react';
import { ApiError } from '@loning/shared/lib/api';
import { MediaImage } from '@v2-shared/ui/MediaImage';
import { cn } from '@v2-shared/ui/cn';

/**
 * Primitif dashboard V2 — pasangan fitur dari frontend/src/components/dashboard/Ui.tsx.
 *
 * Styling memakai token V2 (sudut tajam, hairline, tanpa kartu ber-shadow).
 * Kontrak aksesibilitas dipertahankan: label nyata, role=alert, focus trap
 * pada dialog, dan target sentuh 44px.
 */

const controlClass =
  'focus-ring-v2 min-h-11 w-full rounded-control border bg-surface px-4 py-2.5 text-base text-ink placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60';
const borderClass = (invalid: boolean) => (invalid ? 'border-danger' : 'border-control-border');

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">Ruang pengelola</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
        {children}
      </label>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-danger-ink" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} {...props} className={cn(controlClass, borderClass(Boolean(props['aria-invalid'])), props.className)} />
));
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
  <select ref={ref} {...props} className={cn(controlClass, borderClass(Boolean(props['aria-invalid'])), props.className)} />
));
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => (
  <textarea ref={ref} {...props} className={cn(controlClass, 'min-h-28 resize-y', borderClass(Boolean(props['aria-invalid'])), props.className)} />
));
Textarea.displayName = 'Textarea';

export const mediaInputAccept = 'image/jpeg,image/png,image/webp';

export function MediaField({
  currentUrl,
  file,
  progress,
  error,
  onFile,
  onClear,
}: {
  currentUrl?: string;
  file?: File;
  progress?: number;
  error?: string;
  onFile: (file?: File) => void;
  onClear: () => void;
}) {
  const inputId = useId();
  const errorId = useId();
  const [objectUrl, setObjectUrl] = useState<{ file: File; url: string }>();
  useEffect(() => {
    if (!file) {
      setObjectUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const preview = objectUrl?.file === file && objectUrl ? objectUrl.url : currentUrl;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-ink">Gambar</legend>
      <div className="flex flex-wrap items-center gap-4">
        {preview ? (
          <MediaImage src={preview} alt="Pratinjau sumber gambar" ratio="aspect-square" className="h-20 w-20" />
        ) : null}
        {file ? <span className="text-sm text-ink-muted">{file.name}</span> : null}
        <label
          htmlFor={inputId}
          className="focus-ring-v2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken"
        >
          <Upload size={15} strokeWidth={1.5} aria-hidden="true" />
          Pilih gambar
        </label>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept={mediaInputAccept}
          aria-invalid={Boolean(error)}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {preview ? (
          <button
            type="button"
            className="focus-ring-v2 inline-flex min-h-11 items-center gap-2 rounded-control border border-danger/40 px-4 text-sm font-medium text-danger-ink transition-colors hover:bg-sunken"
            onClick={onClear}
          >
            <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
            Hapus sumber
          </button>
        ) : null}
      </div>
      {progress !== undefined ? (
        <div className="mt-2" aria-live="polite">
          <progress className="w-full" max="100" value={progress}>
            {progress}%
          </progress>
          <span className="ml-2 text-sm text-ink-muted">Mengunggah {progress}%</span>
        </div>
      ) : null}
      <p className="mt-1.5 text-xs text-ink-muted">JPEG, PNG, atau WebP, maksimal 5 MiB. Upload berjalan saat disimpan.</p>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-danger-ink" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function PendingButton({ pending, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={cn(
        'focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60',
        props.className,
      )}
    >
      {pending ? <LoaderCircle size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function ErrorNotice({ error }: { error: unknown }) {
  return (
    <div className="flex gap-3 border border-danger/40 bg-sunken p-4 text-sm text-danger-ink" role="alert">
      <AlertCircle size={18} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
      <span>{error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'}</span>
    </div>
  );
}

export function LoadingPanel() {
  return (
    <div className="flex min-h-48 items-center justify-center text-ink-muted" role="status">
      <LoaderCircle size={18} strokeWidth={1.5} className="mr-2 animate-spin" aria-hidden="true" />
      Memuat data...
    </div>
  );
}

export function EmptyPanel({ children = 'Belum ada data.' }: { children?: ReactNode }) {
  return <div className="border border-dashed border-control-border bg-surface p-10 text-center text-sm text-ink-muted">{children}</div>;
}

export function SearchBox({ value, onChange, label = 'Cari data' }: { value: string; onChange: (value: string) => void; label?: string }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-3.5 text-ink-subtle" aria-hidden="true" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} className="pl-10" />
    </label>
  );
}

export function formErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError ? ((error as ApiError & { fields?: Record<string, string> }).fields ?? {}) : {};
}

export function useDialogA11y(open: boolean, pending: boolean | undefined, onCancel: () => void, initialFocusRef?: RefObject<HTMLElement | null>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);
  cancelRef.current = onCancel;
  pendingRef.current = pending;
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = (): HTMLElement[] =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    (initialFocusRef?.current ?? focusable()[0])?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRef.current) {
        event.preventDefault();
        cancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, initialFocusRef]);
  return dialogRef;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialogA11y(open, pending, onCancel, cancelButtonRef);
  const titleId = useId();
  const descriptionId = useId();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto border border-line bg-surface p-6 shadow-[0_24px_64px_rgba(16,22,18,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-ink">
              {title}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-ink-muted">
              {description}
            </p>
          </div>
          <button
            className="focus-ring-v2 touch-44 -mr-2 -mt-2 inline-flex items-center justify-center rounded-control p-1.5 text-ink-muted hover:bg-sunken hover:text-ink"
            onClick={onCancel}
            aria-label="Tutup konfirmasi"
            disabled={pending}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            className="focus-ring-v2 min-h-11 rounded-control border border-control-border px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken disabled:opacity-60"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <PendingButton
            pending={pending}
            className="border border-danger/40 bg-surface text-danger-ink hover:bg-sunken"
            onClick={onConfirm}
          >
            {confirmLabel}
          </PendingButton>
        </div>
      </div>
    </div>
  );
}
