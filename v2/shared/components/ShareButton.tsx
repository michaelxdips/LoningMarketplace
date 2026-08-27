import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { sharePage } from '@loning/shared/lib/share';
import { Button } from '@v2-shared/ui/Button';

/**
 * Tombol bagikan V2.
 *
 * Memakai Web Share API bila tersedia, jatuh ke clipboard. Status dibacakan
 * lewat elemen sr-only role=status dan label visual sementara saat tautan disalin.
 */
export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [status, setStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const share = async () => {
    try {
      const result = await sharePage({ title, text, url: window.location.href });
      if (result === 'copied') {
        setIsCopied(true);
        setStatus('Tautan berhasil disalin ke papan klip.');
        setTimeout(() => setIsCopied(false), 2500);
      } else if (result === 'shared') {
        setStatus('Menu berbagi dibuka.');
      } else {
        setStatus('Berbagi dibatalkan.');
      }
    } catch {
      setStatus('Tautan tidak dapat dibagikan.');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        leadingIcon={isCopied ? <Check size={15} strokeWidth={2} className="text-brand" /> : <Share2 size={15} strokeWidth={1.5} />}
        onClick={() => void share()}
      >
        {isCopied ? 'Tersalin!' : 'Bagikan'}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
