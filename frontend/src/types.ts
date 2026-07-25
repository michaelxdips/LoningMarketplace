/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Kuliner' | 'Kerajinan' | 'Jasa' | 'Sembako' | 'Pertanian';

export interface UMKM {
  id: string;
  slug: string;
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
  contactVerifiedAt?: string | null;
  catalogUpdatedAt?: string;
  isContactValid?: boolean;
  isContactVerified?: boolean;
  isContactVerificationFresh?: boolean;
  contactVerificationExpiresAt?: string | null;
}

export interface Product {
  id: string;
  slug: string;
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

export interface ProductDetail extends Omit<Product, 'umkmName'> {
  umkm: Pick<UMKM, 'id' | 'slug' | 'name' | 'phone'>;
}
