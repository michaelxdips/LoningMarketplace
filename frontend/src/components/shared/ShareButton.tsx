import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { sharePage } from '../../lib/share';

export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [status, setStatus] = useState('');
  const share = async () => { try { const result = await sharePage({ title, text, url: window.location.href }); setStatus(result === 'copied' ? 'Tautan disalin.' : result === 'shared' ? 'Menu berbagi dibuka.' : 'Berbagi dibatalkan.'); } catch { setStatus('Tautan tidak dapat dibagikan.'); } };
  return <><button id="share-page-button" type="button" onClick={share} className="focus-ring touch-target inline-flex items-center gap-2 rounded-lg border border-sage-border bg-cream-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-forest hover:bg-sage-light"><Share2 size={14}/> Bagikan</button><span className="sr-only" role="status" aria-live="polite">{status}</span></>;
}
