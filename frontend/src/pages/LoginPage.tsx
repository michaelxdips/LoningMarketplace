import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, User, Lock } from 'lucide-react';
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
    <main className="grid min-h-screen bg-cream-bg lg:grid-cols-[1.05fr_.95fr]">
      {/* Left Panel: Clean & Professional Hero */}
      <section className="hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" aria-label={`${brand.name} — beranda`} className="text-xl font-extrabold tracking-tight">
          Loning<span className="text-[#E9AD91]">Maju</span>
        </Link>

        <div className="max-w-xl">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#E9AD91]">
            Desa Loning, Pemalang
          </p>
          <h1 className="editorial-serif text-5xl font-extrabold leading-tight tracking-tight">
            Kelola etalase lokal dengan lebih tertib.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
            Perbarui profil UMKM dan katalog produk Desa Loning dalam satu ruang kerja digital yang aman dan terintegrasi.
          </p>
        </div>

        <p className="text-xs text-white/50">
          Ruang kerja khusus pengelola terdaftar &bull; Pemerintah Desa Loning
        </p>
      </section>

      {/* Right Panel: Clean Form */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="focus-ring mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-forest hover:text-forest-hover transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-sage-light text-forest">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-charcoal">Masuk ke dashboard</h1>
          <p className="mt-2 text-sm text-warm-gray">Gunakan email atau username akun dashboard Anda.</p>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            {login.isError && <ErrorNotice error={login.error} />}

            {/* Email/Username Field */}
            <div>
              <label htmlFor="login-identifier" className="mb-1.5 block text-sm font-bold text-charcoal">
                Email atau username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@contoh.id atau nama-user"
                  className="focus-ring min-h-11 w-full rounded-xl border border-sage-border bg-white pl-10 pr-4 text-sm text-charcoal placeholder:text-warm-gray/70"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-charcoal">
                Kata sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring min-h-11 w-full rounded-xl border border-sage-border bg-white pl-10 pr-12 text-sm text-charcoal placeholder:text-warm-gray/70"
                />
                <button
                  type="button"
                  className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-warm-gray hover:text-charcoal"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <PendingButton
              type="submit"
              pending={login.isPending}
              className="focus-ring touch-target flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-bold text-white transition-colors hover:bg-forest-hover"
            >
              {login.isPending ? 'Memeriksa akun...' : 'Masuk'}
            </PendingButton>
          </form>
        </div>
      </section>
    </main>
  );
}

