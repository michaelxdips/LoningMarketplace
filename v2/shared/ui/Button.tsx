import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles';
import { cn } from './cn';

/**
 * Button V2 — untuk AKSI (submit, toggle, buka dialog).
 * Untuk navigasi ke halaman lain pakai `ButtonLink`, bukan komponen ini.
 *
 * Kelas visual berasal dari `buttonStyles.ts` agar tidak pernah menyimpang
 * dari ButtonLink.
 */

export type { ButtonSize, ButtonVariant };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Teks yang dibacakan pembaca layar saat isLoading. */
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingLabel = 'Memuat',
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    // Default `button`: tanpa ini, tombol di dalam <form> ikut men-submit form.
    // Sumber bug klasik, jadi dijadikan default eksplisit.
    type = 'button',
    ...rest
  },
  ref,
) {
  const isInoperable = disabled === true || isLoading;

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={isInoperable}
      // aria-disabled ditulis eksplisit: sebagian pembaca layar mengabaikan
      // atribut `disabled` pada elemen kustom di dalam komposisi.
      aria-disabled={isInoperable || undefined}
      aria-busy={isLoading || undefined}
      className={buttonClass(
        variant,
        size,
        cn(
          'disabled:pointer-events-none disabled:opacity-50',
          isLoading && 'cursor-wait opacity-70',
          className,
        ),
      )}
    >
      {leadingIcon ? (
        <span aria-hidden="true" className="shrink-0">
          {leadingIcon}
        </span>
      ) : null}
      {children}
      {trailingIcon ? (
        <span aria-hidden="true" className="shrink-0">
          {trailingIcon}
        </span>
      ) : null}
      {isLoading ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
});
