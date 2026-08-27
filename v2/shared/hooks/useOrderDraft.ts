import { useCallback, useSyncExternalStore } from 'react';
import {
  readOrderDraft,
  writeOrderDraft,
  addOrIncrementDraftItem,
  updateDraftItemQuantity,
  removeDraftItem,
  clearDraftForUmkm,
  clearAllDrafts,
  groupDraftByUmkm,
  buildMultiProductOrderMessage,
  type OrderDraftItem,
  type UmkmDraftGroup,
} from '@v2-shared/lib/orderDraft';
import { buildWhatsAppUrl } from '@v2-shared/lib/whatsapp';

let cache: OrderDraftItem[] = readOrderDraft();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function getSnapshot(): OrderDraftItem[] {
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setDraft(next: OrderDraftItem[]) {
  cache = next;
  writeOrderDraft(next);
  emit();
}

export function resetOrderDraftStoreForTests() {
  cache = readOrderDraft();
  emit();
}

export function useOrderDraft() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback(
    (item: Omit<OrderDraftItem, 'quantity' | 'id'> & { quantity?: number; id?: string }) => {
      setDraft(addOrIncrementDraftItem(getSnapshot(), item));
    },
    [],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setDraft(updateDraftItemQuantity(getSnapshot(), id, quantity));
  }, []);

  const removeItem = useCallback((id: string) => {
    setDraft(removeDraftItem(getSnapshot(), id));
  }, []);

  const clearUmkm = useCallback((umkmSlug: string) => {
    setDraft(clearDraftForUmkm(getSnapshot(), umkmSlug));
  }, []);

  const clearAll = useCallback(() => {
    setDraft(clearAllDrafts());
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const found = items.find((i) => i.productId === productId || i.id === productId);
      return found ? found.quantity : 0;
    },
    [items],
  );

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const groups: UmkmDraftGroup[] = groupDraftByUmkm(items);

  const getWhatsAppUrl = useCallback(
    (group: UmkmDraftGroup, visitorName?: string) => {
      const message = buildMultiProductOrderMessage(group, visitorName);
      return buildWhatsAppUrl(group.phone, message);
    },
    [],
  );

  return {
    items,
    groups,
    totalCount,
    totalItems: totalCount,
    addItem,
    updateQuantity,
    removeItem,
    clearUmkm,
    clearAll,
    getItemQuantity,
    getWhatsAppUrl,
  };
}
