import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * OfflineIndicator V2 — banner status offline mandiri.
 * Muncul secara otomatis saat browser kehilangan koneksi internet.
 */
export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-warning/40 bg-warning-ink px-4 py-2 text-xs font-medium text-white shadow-sm"
    >
      <WifiOff size={14} strokeWidth={2} aria-hidden="true" />
      <span>Mode Offline — Menampilkan katalog dan data UMKM yang tersimpan di perangkat Anda.</span>
    </div>
  );
}
