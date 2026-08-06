import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type RefObject, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle, LoaderCircle, Search, X, Upload, Trash2 } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { ProductImage } from '../product/ProductImage';

export const buttonClass = 'focus-ring touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButtonClass = 'focus-ring touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-sage-border bg-white px-4 py-2.5 text-sm font-bold text-charcoal transition-colors hover:bg-cream-tint disabled:cursor-not-allowed disabled:opacity-60';
export const dangerButtonClass = 'focus-ring touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60';
const controlClass = 'focus-ring min-h-11 w-full rounded-xl border border-sage-border bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-warm-gray/70 disabled:bg-cream-tint';

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-terracotta">Ruang pengelola</p><h1 className="text-3xl font-extrabold tracking-tight text-charcoal">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray">{description}</p></div>{action}</header>;
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return <div><label className="block"><span className="mb-1.5 block text-sm font-bold text-charcoal">{label}</span>{children}</label>{error ? <p className="mt-1.5 text-sm text-red-700" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-xs text-warm-gray">{hint}</p> : null}</div>;
}
export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`${controlClass} ${props.className ?? ''}`} />;
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`${controlClass} ${props.className ?? ''}`} />;
export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`${controlClass} min-h-28 resize-y ${props.className ?? ''}`} />;
export const mediaInputAccept = 'image/jpeg,image/png,image/webp';
export function MediaField({ currentUrl, file, progress, error, onFile, onClear }: { currentUrl?: string; file?: File; progress?: number; error?: string; onFile: (file?: File) => void; onClear: () => void }) {
  const inputId = useId(); const errorId = useId(); const [objectUrl, setObjectUrl] = useState<{ file: File; url: string }>();
  useEffect(() => { if (!file) { setObjectUrl(undefined); return; } const url = URL.createObjectURL(file); setObjectUrl({ file, url }); return () => URL.revokeObjectURL(url); }, [file]);
  const preview = objectUrl?.file === file && objectUrl ? objectUrl.url : currentUrl;
  return <fieldset aria-describedby={error ? errorId : undefined}><legend className="mb-1.5 text-sm font-bold text-charcoal">Gambar</legend><div className="flex flex-wrap items-center gap-4">{preview && <ProductImage src={preview} alt="Pratinjau sumber gambar" className="h-20 w-20 rounded-xl object-cover" />}{file && <span className="text-sm text-warm-gray">{file.name}</span>}<label htmlFor={inputId} className={secondaryButtonClass}><Upload className="h-4 w-4" aria-hidden="true" />Pilih gambar</label><input id={inputId} className="sr-only" type="file" accept={mediaInputAccept} aria-invalid={Boolean(error)} onChange={event => onFile(event.target.files?.[0])} />{preview && <button type="button" className={dangerButtonClass} onClick={onClear}><Trash2 className="h-4 w-4" aria-hidden="true" />Hapus sumber</button>}</div>{progress !== undefined && <div className="mt-2" aria-live="polite"><progress className="w-full" max="100" value={progress}>{progress}%</progress><span className="ml-2 text-sm text-warm-gray">Mengunggah {progress}%</span></div>}<p className="mt-1.5 text-xs text-warm-gray">JPEG, PNG, atau WebP, maksimal 5 MiB. Upload berjalan saat disimpan.</p>{error && <p id={errorId} className="mt-1.5 text-sm text-red-700" role="alert">{error}</p>}</fieldset>;
}
export function PendingButton({ pending, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) { return <button {...props} disabled={pending || props.disabled} className={props.className ?? buttonClass}>{pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{children}</button>; }
export function ErrorNotice({ error }: { error: unknown }) { return <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true"/><span>{error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'}</span></div>; }
export function LoadingPanel() { return <div className="flex min-h-48 items-center justify-center text-warm-gray" role="status"><LoaderCircle className="mr-2 h-5 w-5 animate-spin"/>Memuat data...</div>; }
export function EmptyPanel({ children = 'Belum ada data.' }: { children?: ReactNode }) { return <div className="rounded-2xl border border-dashed border-sage-border bg-white p-10 text-center text-sm text-warm-gray">{children}</div>; }
export function SearchBox({ value, onChange, label = 'Cari data' }: { value: string; onChange: (value: string) => void; label?: string }) { return <label className="relative block w-full sm:max-w-xs"><span className="sr-only">{label}</span><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-warm-gray"/><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} className="pl-10"/></label>; }
export function formErrors(error: unknown): Record<string, string> { return error instanceof ApiError ? ((error as ApiError & { fields?: Record<string, string> }).fields ?? {}) : {}; }
export function useDialogA11y(open: boolean, pending: boolean | undefined, onCancel: () => void, initialFocusRef?: RefObject<HTMLElement | null>) {
  const dialogRef = useRef<HTMLDivElement>(null); const cancelRef = useRef(onCancel); const pendingRef = useRef(pending);
  cancelRef.current = onCancel; pendingRef.current = pending;
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null; const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = (): HTMLElement[] => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    (initialFocusRef?.current ?? focusable()[0])?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingRef.current) { event.preventDefault(); cancelRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable(); if (!items.length) { event.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; previouslyFocused?.focus(); };
  }, [open, initialFocusRef]);
  return dialogRef;
}
export function ConfirmDialog({ open, title, description, confirmLabel = 'Konfirmasi', cancelLabel = 'Batal', pending, onConfirm, onCancel }: { open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; pending?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null); const dialogRef = useDialogA11y(open, pending, onCancel, cancelButtonRef); const titleId = useId(), descriptionId = useId();
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-charcoal/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}><div ref={dialogRef} className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}><div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-lg font-extrabold">{title}</h2><p id={descriptionId} className="mt-2 text-sm leading-6 text-warm-gray">{description}</p></div><button className="focus-ring rounded-lg p-2" onClick={onCancel} aria-label="Tutup konfirmasi" disabled={pending}><X className="h-5 w-5"/></button></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button ref={cancelButtonRef} className={secondaryButtonClass} onClick={onCancel} disabled={pending}>{cancelLabel}</button><PendingButton className={dangerButtonClass} onClick={onConfirm} pending={pending}>{confirmLabel}</PendingButton></div></div></div>;
}
