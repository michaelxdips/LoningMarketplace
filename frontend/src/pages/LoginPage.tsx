import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, Store, TrendingUp, User, Lock } from 'lucide-react';
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
    <main className="grid min-h-screen bg-cream-bg lg:grid-cols-[1.1fr_.9fr]">
      {/* Left Decorative Hero Section */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#12261C] via-forest to-[#1A382A] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Subtle Ambient Background Glowing Orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-forest-hover/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#E9AD91]/10 blur-3xl" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" aria-label={`${brand.name} — beranda`} className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <span>Loning</span>
            <span className="text-[#E9AD91]">Maju</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#E9AD91]" />
            Portal Pengelola
          </span>
        </div>

        {/* Hero Central Content */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <span className="editorial-label mb-3 inline-block font-extrabold text-[#E9AD91]">
            Desa Loning, Pemalang
          </span>
          <h1 className="editorial-serif text-5xl font-extrabold leading-[1.15] tracking-tight">
            Kelola etalase lokal dengan lebih tertib.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
            Perbarui profil UMKM dan katalog produk Desa Loning dalam satu ruang kerja digital yang aman dan terintegrasi.
          </p>

          {/* Feature Highlights Grid */}
          <div className="mt-10 grid gap-4">
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[#E9AD91]/20 text-[#E9AD91]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Keamanan Akses Terjamin</h2>
                <p className="mt-0.5 text-xs text-white/70">Peran bertingkat untuk Superadmin, Admin Desa, & Pemilik UMKM.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[#E9AD91]/20 text-[#E9AD91]">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Manajemen Katalog Ringkas</h2>
                <p className="mt-0.5 text-xs text-white/70">Kemudahan update foto produk, profil usaha, dan kontak WhatsApp.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[#E9AD91]/20 text-[#E9AD91]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Insight Inquiry Real-Time</h2>
                <p className="mt-0.5 text-xs text-white/70">Pantau indikator kunjungan dan minat pembeli secara etis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/60">
          <span>&copy; {new Date().getFullYear()} Pemerintah Desa Loning</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Aktif
          </span>
        </div>
      </section>

      {/* Right Login Form Section */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <Link
            to="/"
            className="focus-ring mb-8 inline-flex items-center gap-2 rounded-xl text-xs font-extrabold text-forest hover:text-forest-hover transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          {/* Form Header Card */}
          <div className="rounded-3xl border border-sage-border bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-forest/20 bg-forest/10 text-forest shadow-xs">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Masuk ke Dashboard</h1>
                <p className="text-xs font-medium text-warm-gray">Ketik email atau username akun Anda</p>
              </div>
            </div>

            {/* Login Form */}
            <form className="space-y-5" onSubmit={submit}>
              {login.isError && <ErrorNotice error={login.error} />}

              {/* Identifier Input Field */}
              <div>
                <label htmlFor="login-identifier" className="mb-1.5 block text-xs font-bold text-charcoal">
                  Email atau Username
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
                    placeholder="nama@contoh.id atau username"
                    className="focus-ring min-h-12 w-full rounded-xl border border-sage-border bg-white pl-10 pr-4 text-sm text-charcoal placeholder:text-warm-gray/60"
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-charcoal">
                  Kata Sandi
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
                    className="focus-ring min-h-12 w-full rounded-xl border border-sage-border bg-white pl-10 pr-12 text-sm text-charcoal placeholder:text-warm-gray/60"
                  />
                  <button
                    type="button"
                    className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-warm-gray hover:text-charcoal"
                    onClick={() => setShowPassword((prev) => !prev)}
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
                className="focus-ring touch-target group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-sm font-extrabold text-white transition-all hover:bg-forest-hover shadow-sm"
              >
                {login.isPending ? (
                  'Memeriksa Akun...'
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </PendingButton>
            </form>

            <div className="mt-6 border-t border-sage-border pt-4 text-center">
              <p className="text-[11px] font-medium text-warm-gray">
                Akses terbatas khusus untuk perangkat desa & pelaku UMKM Loning.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
