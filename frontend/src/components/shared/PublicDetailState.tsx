import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router';

type Props = { state: 'loading' | 'error' | 'not-found'; onRetry?: () => void };
export default function PublicDetailState({ state, onRetry }: Props) {
  const loading = state === 'loading';
  return <div className="mx-auto grid min-h-[55vh] max-w-3xl place-items-center px-6 py-24 text-center">
    <div>
      {loading ? <LoaderCircle className="mx-auto animate-spin text-forest" size={28} aria-hidden="true" /> : <AlertCircle className="mx-auto text-terracotta" size={28} aria-hidden="true" />}
      <h1 className="mt-5 text-2xl font-bold text-charcoal">{loading ? 'Memuat informasi…' : state === 'not-found' ? 'Informasi tidak ditemukan' : 'Informasi belum dapat dimuat'}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-warm-gray">{loading ? 'Mohon tunggu sebentar.' : state === 'not-found' ? 'Tautan mungkin sudah berubah atau informasi tidak lagi dipublikasikan.' : 'Periksa koneksi Anda, lalu coba kembali.'}</p>
      {!loading && <div className="mt-6 flex justify-center gap-3">{onRetry && <button onClick={onRetry} className="focus-ring touch-target rounded-lg bg-forest px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">Coba Lagi</button>}<Link to="/" className="focus-ring touch-target inline-flex items-center rounded-lg border border-sage-border px-5 py-3 text-xs font-bold uppercase tracking-wider text-forest">Ke Beranda</Link></div>}
    </div>
  </div>;
}
