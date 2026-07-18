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
  address: string;
  workingHours?: string;
}

export interface Product {
  id: string;
  umkmId: string;
  umkmName: string; // Denormalized for convenience
  name: string;
  price?: number; // Optional or neutral state
  description: string;
  category: Category;
  imageUrl: string;
  isAvailable: boolean;
  unit?: string; // e.g., "250g", "Pcs", "Porsi"
}

export interface VillageAnnouncement {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  imageUrl: string;
}
