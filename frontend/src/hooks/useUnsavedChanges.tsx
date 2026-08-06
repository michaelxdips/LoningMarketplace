import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/dashboard/Ui';

export const UNSAVED_CHANGES_MESSAGE = 'Anda memiliki perubahan yang belum disimpan. Jika meninggalkan halaman, perubahan tersebut akan hilang.';

type PendingNavigation = { href: string } | null;

/**
 * Page-scoped unsaved-change protection. Internal links use the existing
 * accessible dialog; refresh/tab close and browser history use the platform
 * confirmation because browsers do not allow a custom asynchronous dialog.
 */
export function useUnsavedChanges(initialDirty = false) {
  const [isDirty, setDirty] = useState(initialDirty);
  const dirtyRef = useRef(isDirty);
  const [pending, setPending] = useState<PendingNavigation>(null);
  dirtyRef.current = isDirty;

  const markDirty = useCallback(() => setDirty(true), []);
  const markClean = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
    setPending(null);
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const click = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}${destination.hash}` === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
      event.preventDefault();
      event.stopPropagation();
      setPending({ href: destination.href });
    };
    const popState = () => {
      if (!dirtyRef.current) return;
      if (window.confirm(UNSAVED_CHANGES_MESSAGE)) {
        dirtyRef.current = false;
        setDirty(false);
      } else {
        window.history.forward();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);
    window.addEventListener('popstate', popState);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', click, true);
      window.removeEventListener('popstate', popState);
    };
  }, []);

  const discard = useCallback(() => {
    const href = pending?.href;
    markClean();
    if (href) window.location.assign(href);
  }, [markClean, pending]);

  const dialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      title="Perubahan belum disimpan"
      description={UNSAVED_CHANGES_MESSAGE}
      cancelLabel="Tetap di halaman"
      confirmLabel="Tinggalkan halaman"
      onCancel={() => setPending(null)}
      onConfirm={discard}
    />
  );

  return { isDirty, markDirty, markClean, setDirty, dialog };
}
