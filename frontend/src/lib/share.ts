export type ShareResult = 'shared' | 'copied' | 'cancelled';
export async function sharePage(data: ShareData): Promise<ShareResult> {
  if (navigator.share) {
    try { await navigator.share(data); return 'shared'; }
    catch (error) {
      // Only a user-initiated cancel is treated as 'cancelled'. Any other
      // failure must not silently fall through to the clipboard fallback and
      // be misreported as 'copied' — surface it to the caller instead.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      try {
        if (!navigator.clipboard) throw new Error('Tautan tidak dapat disalin pada perangkat ini.');
        await navigator.clipboard.writeText(data.url ?? window.location.href);
        return 'copied';
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }
  if (!navigator.clipboard) throw new Error('Tautan tidak dapat disalin pada perangkat ini.');
  await navigator.clipboard.writeText(data.url ?? window.location.href);
  return 'copied';
}
