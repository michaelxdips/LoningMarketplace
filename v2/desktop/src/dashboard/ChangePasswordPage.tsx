import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { authApi, rememberSession } from '@loning/shared/lib/auth';
import { useCsrfToken } from '@loning/shared/hooks/useAuth';
import { useToast } from '@v2-shared/components/Toast';
import { ErrorNotice, Field, Input, PendingButton } from './Ui';

/**
 * Ubah kata sandi V2 — pasangan fitur dari ChangePasswordPage UI lama.
 *
 * Validasi & alur (cabut sesi, masuk ulang) dipertahankan. Pakai useToast V2.
 */
export default function ChangePasswordPage() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');

  const client = useQueryClient();
  const csrf = useCsrfToken();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword }, csrf),
    onSuccess: () => {
      showToast('Kata sandi berhasil diperbarui. Silakan masuk kembali.', 'success');
      rememberSession(client, null);
      navigate('/v2/login', { replace: true });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      showToast(msg, 'error');
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return setLocalError('Kata sandi baru minimal 8 karakter.');
    if (newPassword === currentPassword) return setLocalError('Kata sandi baru harus berbeda dengan kata sandi saat ini.');
    if (newPassword !== confirm) return setLocalError('Konfirmasi kata sandi baru tidak cocok.');
    setLocalError('');
    mutation.mutate();
  };

  return (
    <main className="min-h-dvh bg-canvas px-4 py-12">
      <div className="mx-auto max-w-xl border border-line bg-surface p-6 sm:p-9">
        <button
          onClick={() => navigate('/v2/dashboard')}
          className="focus-ring-v2 mb-4 inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
          Kembali ke Dashboard
        </button>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">Keamanan akun</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Ubah kata sandi</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">Perbarui kata sandi akun Anda demi keamanan.</p>

        <div className="mb-6 mt-5 flex items-start gap-3 border border-success-ink/40 bg-sunken p-4 text-sm text-success-ink">
          <ShieldCheck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Setelah kata sandi berhasil diperbarui, seluruh sesi aktif Anda akan dicabut dan Anda perlu
            masuk kembali menggunakan kata sandi baru.
          </p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

          <Field label="Kata sandi saat ini">
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="focus-ring-v2 touch-44 absolute right-1 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-ink-muted hover:text-ink"
                aria-label={showCurrent ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showCurrent ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <Field label="Kata sandi baru" hint="Gunakan minimal 8 karakter yang kuat.">
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNext(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="focus-ring-v2 touch-44 absolute right-1 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-ink-muted hover:text-ink"
                aria-label={showNew ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showNew ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <Field label="Ulangi kata sandi baru" error={localError}>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={Boolean(localError)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="focus-ring-v2 touch-44 absolute right-1 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-ink-muted hover:text-ink"
                aria-label={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showConfirm ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/v2/dashboard')}
              className="focus-ring-v2 min-h-11 rounded-control border border-control-border px-4 text-sm font-medium text-ink hover:bg-sunken disabled:opacity-60"
              disabled={mutation.isPending}
            >
              Batal
            </button>

            <PendingButton type="submit" pending={mutation.isPending}>
              <KeyRound size={15} strokeWidth={1.5} aria-hidden="true" />
              {mutation.isPending ? 'Menyimpan...' : 'Simpan kata sandi'}
            </PendingButton>
          </div>
        </form>
      </div>
    </main>
  );
}
