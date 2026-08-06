import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { authApi, rememberSession } from '../lib/auth';
import { useCsrfToken } from '../hooks/useAuth';
import { ErrorNotice, Field, Input, PageHeader, PendingButton, secondaryButtonClass } from '../components/dashboard/Ui';

import { useToast } from '../components/shared/Toast';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const client = useQueryClient();
  const csrf = useCsrfToken();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [localError, setLocalError] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword }, csrf),
    onSuccess: () => {
      showToast('Kata sandi berhasil diperbarui. Silakan masuk kembali.', 'success');
      rememberSession(client, null);
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      showToast(msg, 'error');
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      return setLocalError('Kata sandi baru minimal 8 karakter.');
    }
    if (newPassword === currentPassword) {
      return setLocalError('Kata sandi baru harus berbeda dengan kata sandi saat ini.');
    }
    if (newPassword !== confirm) {
      return setLocalError('Konfirmasi kata sandi baru tidak cocok.');
    }
    setLocalError('');
    mutation.mutate();
  };

  return (
    <main className="min-h-dvh bg-cream-bg px-4 py-12">
      <div className="mx-auto max-w-xl rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-9">
        <button
          onClick={() => navigate('/dashboard')}
          className="focus-ring mb-4 inline-flex items-center gap-2 rounded-xl text-xs font-bold text-warm-gray hover:text-forest"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </button>

        <PageHeader
          title="Ubah kata sandi"
          description="Perbarui kata sandi akun Anda demi keamanan."
        />

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <p>
            Setelah kata sandi berhasil diperbarui, seluruh sesi aktif Anda akan dicabut dan Anda perlu masuk kembali menggunakan kata sandi baru.
          </p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          {mutation.isError && <ErrorNotice error={mutation.error} />}

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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-gray hover:text-charcoal"
                aria-label={showCurrent ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-gray hover:text-charcoal"
                aria-label={showNew ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-gray hover:text-charcoal"
                aria-label={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={secondaryButtonClass}
              disabled={mutation.isPending}
            >
              Batal
            </button>

            <PendingButton type="submit" pending={mutation.isPending}>
              <KeyRound className="mr-2 h-4 w-4" />
              {mutation.isPending ? 'Menyimpan...' : 'Simpan kata sandi'}
            </PendingButton>
          </div>
        </form>
      </div>
    </main>
  );
}
