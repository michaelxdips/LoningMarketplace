/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Kuliner' | 'Kerajinan' | 'Jasa' | 'Sembako' | 'Pertanian';

export interface UMKM {
  id: string;
  name: string;
  owner: string;
  description: string;
  phone: string; // WhatsApp number
  category: Category;
  imageUrl: string;
  imageAssetId?: string | null;
  altText?: string | null;
  address: string;
  workingHours?: string;
}

export interface Product {
  id: string;
  umkmId: string;
  umkmName: string; // Denormalized for convenience
  name: string;
  price: number | null;
  description: string;
  category: Category;
  imageUrl: string;
  imageAssetId?: string | null;
  altText?: string | null;
  isAvailable: boolean;
  unit?: string; // e.g., "250g", "Pcs", "Porsi"
}
