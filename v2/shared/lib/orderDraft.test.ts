import { describe, expect, it } from 'vitest';
import {
  addOrIncrementDraftItem,
  clearAllDrafts,
  clearDraftForUmkm,
  groupDraftByUmkm,
  removeDraftItem,
  updateDraftItemQuantity,
  type OrderDraftItem,
} from './orderDraft';

const mockItem: Omit<OrderDraftItem, 'id' | 'quantity'> = {
  productId: 'prod-1',
  productName: 'Nasi Megono',
  productSlug: 'nasi-megono',
  price: 15000,
  unit: 'porsi',
  umkmSlug: 'warung-loning',
  umkmName: 'Warung Loning',
  phone: '628123456789',
};

describe('orderDraft store logic', () => {
  it('tambah item baru ke dalam draft kosong', () => {
    const list = addOrIncrementDraftItem([], mockItem);
    expect(list).toHaveLength(1);
    expect(list[0].quantity).toBe(1);
    expect(list[0].productName).toBe('Nasi Megono');
  });

  it('menambah kuantitas jika produk yang sama ditambahkan lagi', () => {
    let list = addOrIncrementDraftItem([], mockItem);
    list = addOrIncrementDraftItem(list, mockItem);
    expect(list).toHaveLength(1);
    expect(list[0].quantity).toBe(2);
  });

  it('mengubah kuantitas item dan menghapus jika kuantitas <= 0', () => {
    let list = addOrIncrementDraftItem([], mockItem);
    const id = list[0].id;
    list = updateDraftItemQuantity(list, id, 5);
    expect(list[0].quantity).toBe(5);

    list = updateDraftItemQuantity(list, id, 0);
    expect(list).toHaveLength(0);
    expect(removeDraftItem([], 'random')).toHaveLength(0);
  });

  it('mengelompokkan catatan belanja berdasarkan UMKM', () => {
    let list = addOrIncrementDraftItem([], mockItem);
    list = addOrIncrementDraftItem(list, {
      ...mockItem,
      productId: 'prod-2',
      productName: 'Kerupuk Kulit',
      price: 5000,
    });
    list = addOrIncrementDraftItem(list, {
      productId: 'prod-3',
      productName: 'Kopi Robusta',
      productSlug: 'kopi-robusta',
      price: 20000,
      unit: 'cup',
      umkmSlug: 'kedai-kopi',
      umkmName: 'Kedai Kopi Loning',
      phone: '628987654321',
    });

    const groups = groupDraftByUmkm(list);
    expect(groups).toHaveLength(2);
    const warungGroup = groups.find((g) => g.umkmSlug === 'warung-loning');
    const kedaiGroup = groups.find((g) => g.umkmSlug === 'kedai-kopi');

    expect(warungGroup).toBeDefined();
    expect(warungGroup?.totalPrice).toBe(20000); // 15000 + 5000
    expect(kedaiGroup).toBeDefined();
    expect(kedaiGroup?.totalPrice).toBe(20000);
  });

  it('menghapus catatan untuk satu UMKM spesifik dan clearAll', () => {
    let list = addOrIncrementDraftItem([], mockItem);
    list = addOrIncrementDraftItem(list, {
      productId: 'prod-3',
      productName: 'Kopi Robusta',
      productSlug: 'kopi-robusta',
      price: 20000,
      unit: 'cup',
      umkmSlug: 'kedai-kopi',
      umkmName: 'Kedai Kopi Loning',
      phone: '628987654321',
    });

    list = clearDraftForUmkm(list, 'warung-loning');
    expect(list).toHaveLength(1);
    expect(list[0].umkmSlug).toBe('kedai-kopi');

    list = clearAllDrafts();
    expect(list).toHaveLength(0);
  });
});
