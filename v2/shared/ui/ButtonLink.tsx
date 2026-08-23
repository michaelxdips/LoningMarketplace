import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles';

/**
 * Tautan bergaya tombol.
 *
 * Merender <Link> (bukan <button>) supaya perilaku navigasi tetap utuh:
 * klik-tengah, buka di tab baru, salin tautan, dan diumumkan sebagai "link".
 */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  leadingIcon,
  trailingIcon,
  children,
  ...rest
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'to' | 'className' | 'children'>) {
  return (
    <Link {...rest} to={to} className={buttonClass(variant, size, className)}>
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
    </Link>
  );
}
