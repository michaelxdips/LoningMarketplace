import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { brand } from '@loning/shared/config/brand';
import { useLogin } from '@loning/shared/hooks/useAuth';
import { ErrorNotice, PendingButton } from '../dashboard/Ui';

/**
 * Login V2 — pasangan fitur dari /login UI lama.
 *
 * Alur login + redirect (mustChangePassword / state.from) dipertahankan penuh;
 * styling editorial (asimetris, tanpa kartu). Dipasang di bawah /v2/login.
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
    <main className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between border-b border-line py-6">
          <Link
            to="/v2"
            aria-label={`${brand.name} — beranda`}
            className="focus-ring-v2 flex items-baseline rounded font-display text-2xl font-semibold tracking-tight text-ink transition-colors hover:text-brand"
          >
            Loning<span className="font-light italic text-accent-ink">Maju</span>
          </Link>
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle sm:block">
            Desa Loning · Pemalang
          </span>
        </header>

        <div className="grid gap-14 py-14 lg:grid-cols-12 lg:gap-20 lg:py-24">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">Ruang pengelola</p>
            <h1 className="mt-5 max-w-md font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Masuk ke dashboard
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-ink-muted">
              Gunakan email atau username akun dashboard Anda untuk mengelola etalase Desa Loning.
            </p>

            <form className="mt-12 max-w-md space-y-6" onSubmit={submit}>
              {login.isError ? <ErrorNotice error={login.error} /> : null}

              <div>
                <label htmlFor="v2-login-identifier" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                  Email atau username
                </label>
                <input
                  id="v2-login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@contoh.id atau username"
                  className="focus-ring-v2 w-full border-0 border-b border-control-border bg-transparent py-2.5 text-base text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="v2-login-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                  Kata sandi
                </label>
                <div className="relative">
                  <input
                    id="v2-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="focus-ring-v2 w-full border-0 border-b border-control-border bg-transparent py-2.5 pr-10 text-base text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="focus-ring-v2 touch-44 absolute right-0 top-1/2 -translate-y-1/2 rounded-control p-2 text-ink-muted hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <PendingButton type="submit" pending={login.isPending} className="w-full">
                  {login.isPending ? 'Memeriksa akun...' : 'Masuk'}
                </PendingButton>
              </div>
            </form>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="lg:border-l lg:border-line lg:pl-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-ink">Akses terbatas</p>
              <p className="mt-5 font-display text-lg font-semibold leading-snug text-ink">
                Ruang kerja khusus pengelola terdaftar.
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                Akun diberikan oleh Pemerintah Desa Loning. Jika Anda pelaku UMKM dan belum memiliki
                akun, ajukan melalui Balai Desa.
              </p>
              <dl className="mt-8 space-y-4 border-t border-line pt-6 text-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                  <div>
                    <dt className="font-medium text-ink">Data terlindungi</dt>
                    <dd className="mt-0.5 text-xs leading-5 text-ink-muted">
                      Sesi terenkripsi, kata sandi tidak pernah disimpan apa adanya.
                    </dd>
                  </div>
                </div>
              </dl>
              <Link
                to="/v2"
                className="focus-ring-v2 group mt-8 inline-flex items-center gap-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                Kembali ke beranda
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
