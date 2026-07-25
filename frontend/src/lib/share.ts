export type ShareResult = 'shared' | 'copied' | 'cancelled';
export async function sharePage(data: ShareData): Promise<ShareResult> {
  if (navigator.share) {
    try { await navigator.share(data); return 'shared'; }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'; }
  }
  if (!navigator.clipboard) throw new Error('Tautan tidak dapat disalin pada perangkat ini.');
  await navigator.clipboard.writeText(data.url ?? window.location.href);
  return 'copied';
}
