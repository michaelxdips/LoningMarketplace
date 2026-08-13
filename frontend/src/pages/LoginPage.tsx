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
    <main className="grid min-h-dvh bg-gradient-to-br from-cream-bg via-cream-tint/20 to-cream-bg lg:grid-cols-[1fr_1fr]">
      {/* Left Panel: Clean & Professional Hero */}
      <section className="relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Subtle Decorative Background Blurs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-forest-hover/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#E9AD91]/15 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" aria-label={`${brand.name} — beranda`} className="inline-flex items-center gap-3 text-2xl font-black uppercase tracking-wider">
            <img src={brand.logoSvg} alt="" className="h-24 w-24 object-contain shrink-0" />
            <span>LONING<span className="text-[#E9AD91]">MAJU</span></span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#E9AD91]">
            Desa Loning, Pemalang
          </p>
          <h1 className="editorial-serif text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Kelola etalase lokal dengan lebih mudah dan efisien.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/80 sm:text-base">
            Perbarui profil UMKM dan katalog produk Desa Loning dalam satu ruang kerja digital yang aman dan terintegrasi.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/15 pt-6 text-xs text-white/60">
          <ShieldCheck className="h-4 w-4 text-[#E9AD91] shrink-0" />
          <span>Ruang kerja khusus pengelola terdaftar &bull; Pemerintah Desa Loning</span>
        </div>
      </section>

      {/* Right Panel: Clean Card Form */}
      <section className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back Navigation */}
          <Link
            to="/"
            className="focus-ring group mb-6 inline-flex items-center gap-2 rounded-xl border border-sage-border/60 bg-white px-3.5 py-2 text-xs font-bold text-forest shadow-2xs hover:bg-cream-tint transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-forest transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke beranda</span>
          </Link>

          {/* Login Card Form Container */}
          <div className="rounded-3xl border border-sage-border/80 bg-white p-7 shadow-xl shadow-forest/5 sm:p-9">

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal">Masuk ke dashboard</h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-warm-gray">Gunakan email atau username akun dashboard Anda.</p>

            <form className="mt-7 space-y-5" onSubmit={submit}>
              {login.isError && <ErrorNotice error={login.error} />}

              {/* Email/Username Field */}
              <div>
                <label htmlFor="login-identifier" className="mb-2 block text-xs sm:text-sm font-bold text-charcoal">
                  Email atau username
                </label>
                <div className="group relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray transition-colors group-focus-within:text-forest" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@contoh.id atau username"
                    className="focus-ring min-h-[46px] w-full rounded-xl border border-sage-border bg-white pl-10 pr-4 text-xs sm:text-sm text-charcoal placeholder:text-warm-gray/60 shadow-2xs transition-all focus:border-forest focus:ring-2 focus:ring-forest/15"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className="mb-2 block text-xs sm:text-sm font-bold text-charcoal">
                  Kata sandi
                </label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray transition-colors group-focus-within:text-forest" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="focus-ring min-h-[46px] w-full rounded-xl border border-sage-border bg-white pl-10 pr-12 text-xs sm:text-sm text-charcoal placeholder:text-warm-gray/60 shadow-2xs transition-all focus:border-forest focus:ring-2 focus:ring-forest/15"
                  />
                  <button
                    type="button"
                    className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-warm-gray hover:bg-cream-tint hover:text-charcoal transition-colors"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <PendingButton
                  type="submit"
                  pending={login.isPending}
                  className="focus-ring touch-target flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-bold text-white shadow-md hover:bg-forest-hover hover:shadow-lg active:scale-[0.99] transition-all duration-150"
                >
                  {login.isPending ? 'Memeriksa akun...' : 'Masuk'}
                </PendingButton>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
