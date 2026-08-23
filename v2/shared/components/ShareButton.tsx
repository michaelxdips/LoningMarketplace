import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { sharePage } from '@loning/shared/lib/share';
import { Button } from '@v2-shared/ui/Button';

/**
 * Tombol bagikan V2.
 *
 * Memakai Web Share API bila tersedia, jatuh ke clipboard. Status dibacakan
 * lewat elemen sr-only role=status supaya tidak mengubah layout saat berubah.
 */
export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [status, setStatus] = useState('');

  const share = async () => {
    try {
      const result = await sharePage({ title, text, url: window.location.href });
      setStatus(
        result === 'copied'
          ? 'Tautan disalin.'
          : result === 'shared'
            ? 'Menu berbagi dibuka.'
            : 'Berbagi dibatalkan.',
      );
    } catch {
      setStatus('Tautan tidak dapat dibagikan.');
    }
  };

  return (
    <>
      <Button variant="outline" leadingIcon={<Share2 size={15} strokeWidth={1.5} />} onClick={() => void share()}>
        Bagikan
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
