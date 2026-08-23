import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Field (input & textarea) V2.
 *
 * Aturan yang ditegakkan di sini, bukan diserahkan ke pemakai:
 *   - Label SELALU di atas dan terlihat. Placeholder-as-label dilarang.
 *   - Helper text di atas kontrol tetap ada di markup; error di BAWAH kontrol.
 *   - Wiring aria (`aria-invalid`, `aria-describedby`, `role="alert"`) otomatis,
 *     karena inilah bagian yang paling sering lupa dipasang manual.
 *   - Border memakai `control-border` (>=3:1, WCAG 1.4.11), bukan `line` yang
 *     memang lembut dan hanya untuk pemisah dekoratif.
 */

const CONTROL_BASE = cn(
  'focus-ring-v2 w-full rounded-control border bg-surface px-4 text-ink',
  'placeholder:text-ink-subtle',
  'transition-[border-color,background-color] duration-150',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60',
);

interface FieldShellProps {
  label: string;
  htmlFor: string;
  helperText?: ReactNode;
  errorText?: ReactNode;
  helperId: string;
  errorId: string;
  required?: boolean;
  children: ReactNode;
}

function FieldShell({
  label,
  htmlFor,
  helperText,
  errorText,
  helperId,
  errorId,
  required,
  children,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-accent-ink">
              {' '}
              *
            </span>
            <span className="sr-only"> (wajib diisi)</span>
          </>
        ) : null}
      </label>

      {helperText ? (
        <p id={helperId} className="text-sm text-ink-muted">
          {helperText}
        </p>
      ) : null}

      {children}

      {/* role="alert" supaya perubahan error diumumkan tanpa memindah fokus. */}
      {errorText ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger-ink">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

/** Gabungkan id deskriptor yang benar-benar dirender. */
export function describedBy(
  ids: Array<[id: string, present: boolean]>,
  extra?: string,
): string | undefined {
  const list = ids.filter(([, present]) => present).map(([id]) => id);
  if (extra) list.push(extra);
  return list.length > 0 ? list.join(' ') : undefined;
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  helperText?: ReactNode;
  errorText?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, helperText, errorText, className, required, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const base = useId();
  const inputId = `${base}-input`;
  const helperId = `${base}-helper`;
  const errorId = `${base}-error`;
  const hasError = Boolean(errorText);

  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      helperText={helperText}
      errorText={errorText}
      helperId={helperId}
      errorId={errorId}
      required={required}
    >
      <input
        {...rest}
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy(
          [
            [helperId, Boolean(helperText)],
            [errorId, hasError],
          ],
          ariaDescribedBy,
        )}
        className={cn(
          CONTROL_BASE,
          // min-h-11 = 44px target sentuh.
          'min-h-11 text-base',
          hasError ? 'border-danger' : 'border-control-border',
          className,
        )}
      />
    </FieldShell>
  );
});

export interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  helperText?: ReactNode;
  errorText?: ReactNode;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { label, helperText, errorText, className, required, 'aria-describedby': ariaDescribedBy, rows = 4, ...rest },
    ref,
  ) {
    const base = useId();
    const controlId = `${base}-textarea`;
    const helperId = `${base}-helper`;
    const errorId = `${base}-error`;
    const hasError = Boolean(errorText);

    return (
      <FieldShell
        label={label}
        htmlFor={controlId}
        helperText={helperText}
        errorText={errorText}
        helperId={helperId}
        errorId={errorId}
        required={required}
      >
        <textarea
          {...rest}
          ref={ref}
          id={controlId}
          rows={rows}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy(
            [
              [helperId, Boolean(helperText)],
              [errorId, hasError],
            ],
            ariaDescribedBy,
          )}
          className={cn(
            CONTROL_BASE,
            'py-3 text-base leading-relaxed',
            hasError ? 'border-danger' : 'border-control-border',
            className,
          )}
        />
      </FieldShell>
    );
  },
);
