import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { brand } from '@loning/shared/config/brand';
import { useLogin } from '@loning/shared/hooks/useAuth';
import { Eyebrow } from '@v2-shared/ui/Eyebrow';
import { Button } from '@v2-shared/ui/Button';
import { ToastProvider } from '@v2-shared/components/Toast';

/**
 * Login V2 mobile — satu kolom, tanpa chrome. Redirect ke /m/dashboard? Tidak:
 * dashboard mobile memakai /v2/dashboard (responsive), jadi login mobile
 * mengarah ke /v2/dashboard setelah sukses. Catatan: karena dashboard belum
 * punya padanan /m/*, login mobile menarget /v2/dashboard.
 */
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate(
      { identifier, password },
      {
        onSuccess: (session) =>
          navigate(
            session.user.mustChangePassword
              ? '/v2/dashboard/change-password'
              : ((location.state as { from?: string } | null)?.from ?? '/v2/dashboard'),
            { replace: true },
          ),
      },
    );
  };

  return (
    <ToastProvider>
      <main className="min-h-dvh bg-canvas px-4 py-10">
        <div className="mx-auto max-w-sm">
          <Link to="/m" aria-label={`${brand.name} — beranda`} className="focus-ring-v2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            Kembali ke beranda
          </Link>

          <div className="mt-8">
            <Eyebrow>Ruang pengelola</Eyebrow>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink">Masuk ke dashboard</h1>
            <p className="mt-3 text-sm leading-7 text-ink-muted">Gunakan email atau username akun dashboard Anda untuk mengelola etalase Desa Loning.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            {login.isError ? <LoginError error={login.error} /> : null}

            <div>
              <label htmlFor="m-login-identifier" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Email atau username</label>
              <input
                id="m-login-identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@contoh.id atau username"
                className="focus-ring-v2 min-h-12 w-full rounded-control border border-control-border bg-surface px-4 text-base text-ink placeholder:text-ink-subtle"
              />
            </div>

            <div>
              <label htmlFor="m-login-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">Kata sandi</label>
              <div className="relative">
                <input
                  id="m-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring-v2 min-h-12 w-full rounded-control border border-control-border bg-surface px-4 pr-12 text-base text-ink placeholder:text-ink-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="focus-ring-v2 touch-44 absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-control p-2 text-ink-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button type="submit" isLoading={login.isPending} loadingLabel="Memeriksa akun" className="w-full">
              Masuk
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-6">
            <p className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
              <ShieldCheck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
              Akun diberikan oleh Pemerintah Desa Loning. Jika Anda pelaku UMKM dan belum memiliki akun, ajukan melalui Balai Desa.
            </p>
          </div>
        </div>
      </main>
    </ToastProvider>
  );
}

function LoginError({ error }: { error: unknown }) {
  return (
    <div className="border border-danger/40 bg-sunken p-4 text-sm text-danger-ink" role="alert">
      {error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'}
    </div>
  );
}
