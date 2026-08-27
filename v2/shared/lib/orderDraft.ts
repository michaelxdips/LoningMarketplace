/**
 * Draft Catatan Belanja WhatsApp V2 — logika MURNI (tanpa DOM/React), V2-only.
 *
 * Menyimpan catatan belanja multi-produk pengunjung per UMKM di localStorage.
 * Format item: { id, productId, productName, productSlug, price, unit, quantity, umkmSlug, umkmName, phone }.
 */

export interface OrderDraftItem {
  id: string; // unik per produk atau kombinasi produk-umkm
  productId: string;
  productName: string;
  productSlug: string;
  price: number | null;
  unit?: string | null;
  quantity: number;
  umkmSlug: string;
  umkmName: string;
  phone: string;
}

export const ORDER_DRAFT_STORAGE_KEY = 'loning_v2_order_draft';
export const ORDER_DRAFT_MAX_ITEMS = 50;

function isOrderDraftItem(value: unknown): value is OrderDraftItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.productId === 'string' &&
    typeof item.productName === 'string' &&
    typeof item.productSlug === 'string' &&
    (item.price === null || typeof item.price === 'number') &&
    (item.unit === undefined || item.unit === null || typeof item.unit === 'string') &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.umkmSlug === 'string' &&
    typeof item.umkmName === 'string' &&
    typeof item.phone === 'string'
  );
}

export function readOrderDraft(storage?: Pick<Storage, 'getItem'>): OrderDraftItem[] {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store?.getItem(ORDER_DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const result: OrderDraftItem[] = [];
    for (const item of parsed) {
      if (!isOrderDraftItem(item)) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
    return result.slice(0, ORDER_DRAFT_MAX_ITEMS);
  } catch {
    return [];
  }
}

export function writeOrderDraft(
  items: OrderDraftItem[],
  storage?: Pick<Storage, 'setItem' | 'removeItem'>,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    if (!store) return;
    if (items.length === 0) store.removeItem(ORDER_DRAFT_STORAGE_KEY);
    else store.setItem(ORDER_DRAFT_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* localStorage full/blocked */
  }
}

export function addOrIncrementDraftItem(
  items: OrderDraftItem[],
  item: Omit<OrderDraftItem, 'quantity' | 'id'> & { quantity?: number; id?: string },
): OrderDraftItem[] {
  const itemId = item.id || item.productId;
  const quantityToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const existingIndex = items.findIndex((i) => i.id === itemId);

  if (existingIndex >= 0) {
    const updated = [...items];
    const existing = updated[existingIndex];
    updated[existingIndex] = {
      ...existing,
      ...item,
      quantity: existing.quantity + quantityToAdd,
    };
    return updated;
  }

  const newItem: OrderDraftItem = {
    id: itemId,
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    price: item.price,
    unit: item.unit,
    quantity: quantityToAdd,
    umkmSlug: item.umkmSlug,
    umkmName: item.umkmName,
    phone: item.phone,
  };

  return [newItem, ...items].slice(0, ORDER_DRAFT_MAX_ITEMS);
}

export function updateDraftItemQuantity(
  items: OrderDraftItem[],
  id: string,
  quantity: number,
): OrderDraftItem[] {
  if (quantity <= 0) {
    return items.filter((i) => i.id !== id);
  }
  return items.map((i) => (i.id === id ? { ...i, quantity } : i));
}

export function removeDraftItem(items: OrderDraftItem[], id: string): OrderDraftItem[] {
  return items.filter((i) => i.id !== id);
}

export function clearDraftForUmkm(items: OrderDraftItem[], umkmSlug: string): OrderDraftItem[] {
  return items.filter((i) => i.umkmSlug !== umkmSlug);
}

export function clearAllDrafts(): OrderDraftItem[] {
  return [];
}

export interface UmkmDraftGroup {
  umkmSlug: string;
  umkmName: string;
  phone: string;
  items: OrderDraftItem[];
  totalPrice: number;
  hasUnpricedItem: boolean;
}

export function groupDraftByUmkm(items: OrderDraftItem[]): UmkmDraftGroup[] {
  const map = new Map<string, UmkmDraftGroup>();

  for (const item of items) {
    let group = map.get(item.umkmSlug);
    if (!group) {
      group = {
        umkmSlug: item.umkmSlug,
        umkmName: item.umkmName,
        phone: item.phone,
        items: [],
        totalPrice: 0,
        hasUnpricedItem: false,
      };
      map.set(item.umkmSlug, group);
    }
    group.items.push(item);
    if (item.price !== null) {
      group.totalPrice += item.price * item.quantity;
    } else {
      group.hasUnpricedItem = true;
    }
  }

  return Array.from(map.values());
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildMultiProductOrderMessage(group: UmkmDraftGroup, visitorName?: string): string {
  const introPart = `Halo Kak (${group.umkmName}), saya ingin menanyakan ketersediaan / memesan beberapa produk yang saya temukan di katalog digital Desa Loning:`;

  const senderPart = visitorName && visitorName.trim()
    ? `\n\nPerkenalkan, nama saya *${visitorName.trim()}*.`
    : '';

  const itemLines = group.items.map((item, idx) => {
    const unitPart = item.unit ? ` ${item.unit}` : '';
    const pricePart = item.price !== null
      ? ` - ${formatRupiah(item.price * item.quantity)} (${formatRupiah(item.price)}/${item.unit || 'item'})`
      : ' - (Konfirmasi harga)';
    return `${idx + 1}. *${item.productName}* (${item.quantity}${unitPart})${pricePart}`;
  });

  const itemsPart = `\n\n*Daftar Catatan Pesanan:*\n${itemLines.join('\n')}`;

  let totalPart = '';
  if (group.totalPrice > 0) {
    totalPart = `\n\n*Estimasi Total:* ${formatRupiah(group.totalPrice)}${group.hasUnpricedItem ? ' (+ harga produk yang belum tercantum)' : ''}`;
  }

  const closingPart = `\n\nApakah produk-produk di atas ready untuk dipesan? Mohon info ketersediaan dan rincian pembayarannya.\n\nTerima kasih!`;

  return `${introPart}${senderPart}${itemsPart}${totalPart}${closingPart}`;
}
