/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CATEGORIES = ['Kuliner', 'Sembako & Kebutuhan Harian', 'Fashion & Konveksi', 'Bahan Bangunan & Material', 'Jasa & Otomotif', 'Pertanian, Peternakan & Perikanan', 'Ritel & Perabot', 'Kerajinan & Olahan Kreatif', 'Lainnya'] as const;
export type Category = typeof CATEGORIES[number];

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
  latitude: number | null;
  longitude: number | null;
  contactVerifiedAt?: string | null;
  catalogUpdatedAt?: string;
  updatedAt?: string;
  assignedProductCount?: number;
  publishedProductCount?: number;
  isContactValid?: boolean;
  isContactVerified?: boolean;
  isContactVerificationFresh?: boolean;
  contactVerificationExpiresAt?: string | null;
}

export interface Product {
  id: string;
  slug: string;
  umkmId?: string | null;
  umkmName: string; // Denormalized for convenience
  phone?: string | null;
  sellerName?: string | null;
  name: string;
  price: number | null;
  description: string;
  category: Category;
  imageUrl: string;
  imageAssetId?: string | null;
  altText?: string | null;
  isAvailable: boolean;
  unit?: string;
  images?: Array<{ id: string; url: string; thumbUrl: string; width: number; height: number; altText: string | null }>;
}

export interface ProductDetail extends Omit<Product, 'umkmName'> {
  umkm: Pick<UMKM, 'id' | 'slug' | 'name' | 'phone'>;
}
