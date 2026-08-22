import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, User, Lock, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useLogin } from '../hooks/useAuth';
import { ErrorNotice, PendingButton } from '../components/dashboard/Ui';
import { brand } from '../config/brand';

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
              ? '/change-password'
              : ((location.state as { from?: string } | null)?.from ?? '/dashboard'),
            { replace: true }
          ),
      }
    );
  };

  return (
    <main className="min-h-dvh bg-cream-bg text-charcoal">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        {/* Masthead bar */}
        <header className="flex items-center justify-between border-b border-charcoal/15 py-6">
          <Link
            to="/"
            aria-label={`${brand.name} — beranda`}
            className="focus-ring flex items-baseline rounded font-serif text-2xl font-semibold tracking-tight text-charcoal transition-colors hover:text-forest"
          >
            Loning<span className="font-light italic text-terracotta">Maju</span>
          </Link>
          <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-warm-gray sm:block">
            Desa Loning &middot; Pemalang
          </span>
        </header>

        <div className="grid gap-14 py-14 lg:grid-cols-12 lg:gap-20 lg:py-24">
          {/* Editorial statement + form */}
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
              <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
              Ruang pengelola
            </p>
            <h1 className="mt-5 max-w-md font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Masuk ke dashboard
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-warm-gray">
              Gunakan email atau username akun dashboard Anda untuk mengelola etalase Desa Loning.
            </p>

            <form className="mt-12 max-w-md space-y-7" onSubmit={submit}>
              {login.isError && <ErrorNotice error={login.error} />}

              <div>
                <label
                  htmlFor="login-identifier"
                  className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-warm-gray"
                >
                  Email atau username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-terracotta" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@contoh.id atau username"
                    className="w-full border-0 border-b border-charcoal/25 bg-transparent py-2.5 pl-7 text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-warm-gray"
                >
                  Kata sandi
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-terracotta" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-0 border-b border-charcoal/25 bg-transparent py-2.5 pl-7 pr-9 text-sm text-charcoal placeholder:text-warm-gray/50 focus:border-terracotta focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="touch-target absolute right-0 top-1/2 -translate-y-1/2 rounded p-2 text-warm-gray hover:text-charcoal"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <PendingButton
                  type="submit"
                  pending={login.isPending}
                  className="focus-ring touch-target inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-6 text-sm font-bold text-white transition-colors hover:bg-forest-hover active:scale-[0.99]"
                >
                  {login.isPending ? 'Memeriksa akun...' : 'Masuk'}
                </PendingButton>
              </div>
            </form>
          </div>

          {/* Marginalia — operating note */}
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="lg:border-l lg:border-charcoal/15 lg:pl-10">
              <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-terracotta">
                <span className="h-px w-8 bg-terracotta/60" aria-hidden="true" />
                Akses terbatas
              </p>
              <p className="mt-5 font-serif text-lg font-semibold leading-snug">
                Ruang kerja khusus pengelola terdaftar.
              </p>
              <p className="mt-3 text-sm leading-7 text-warm-gray">
                Akun diberikan oleh Pemerintah Desa Loning. Jika Anda pelaku UMKM dan belum
                memiliki akun, ajukan melalui Balai Desa.
              </p>
              <dl className="mt-8 space-y-4 border-t border-charcoal/15 pt-6 text-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  <div>
                    <dt className="font-bold">Data terlindungi</dt>
                    <dd className="mt-0.5 text-xs leading-5 text-warm-gray">
                      Sesi terenkripsi, kata sandi tidak pernah disimpan apa adanya.
                    </dd>
                  </div>
                </div>
              </dl>
              <Link
                to="/"
                className="focus-ring group mt-8 inline-flex items-center gap-2 text-xs font-bold text-warm-gray transition-colors hover:text-forest"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Kembali ke beranda
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
