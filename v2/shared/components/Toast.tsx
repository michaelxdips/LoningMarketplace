import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@v2-shared/ui/cn';

/**
 * Toast V2 — pasangan fitur dari Toast UI lama.
 *
 * Provider terpisah dari Toast UI lama karena styling-nya memakai token V2.
 * Dipasang di dalam DashboardShell V2 (bukan root), supaya publik V2 tidak
 * membawa beban provider notifikasi yang tidak dipakainya.
 */

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

const dummyToastCtx: ToastContextValue = {
  showToast: () => {},
  removeToast: () => {},
};

export function useToast() {
  return useContext(ToastContext) ?? dummyToastCtx;
}

const STYLES: Record<ToastType, string> = {
  success: 'border-success-ink/40 bg-surface text-ink',
  error: 'border-danger/40 bg-surface text-ink',
  info: 'border-control-border bg-surface text-ink',
};

const ICON: Record<ToastType, { Icon: typeof CheckCircle2; className: string }> = {
  success: { Icon: CheckCircle2, className: 'text-success-ink' },
  error: { Icon: AlertCircle, className: 'text-danger-ink' },
  info: { Icon: Info, className: 'text-accent-ink' },
};

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {toasts.map((toast) => {
        const { Icon, className: iconClass } = ICON[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 border p-4 text-sm shadow-[0_8px_24px_rgba(16,22,18,0.12)]',
              STYLES[toast.type],
            )}
          >
            <Icon size={18} strokeWidth={1.5} className={cn('mt-0.5 shrink-0', iconClass)} aria-hidden="true" />
            <div className="flex-1 font-medium leading-relaxed">{toast.message}</div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="focus-ring-v2 -mr-1 -mt-1 shrink-0 rounded-control p-1 text-ink-muted hover:bg-sunken hover:text-ink"
            >
              <X size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
