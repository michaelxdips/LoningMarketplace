import { z } from 'zod';
import { categories } from '../db/repository.js';
import { normalizeIndonesianWhatsAppNumber } from '../domain/phone.js';

export const uuid = z.string().uuid();
export const phone = z.string().trim().max(40).transform((value, context) => {
  const normalized = normalizeIndonesianWhatsAppNumber(value);
  if (!normalized) { context.addIssue({ code: 'custom', message: 'Nomor WhatsApp Indonesia tidak valid' }); return z.NEVER; }
  return normalized;
});
export const optionalUrl = z.union([z.string().url(), z.literal(''), z.null()]).optional().transform((val) => (val === '' ? null : val));
export const timeString = z.preprocess(
  (val) => typeof val === 'string' && val.trim() === '' ? null : val,
  z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional()
);
export const umkmInput = z.strictObject({
  name: z.string().trim().min(1).max(200), owner: z.string().trim().min(1).max(200), description: z.string().min(1).max(5000),
  phone, category: z.enum(categories), imageUrl: optionalUrl, imageAssetId: uuid.nullable().optional(), address: z.string().min(1).max(500),
  workingHours: z.string().trim().max(200).nullable().optional(),
  openingTime: timeString.default(null),
  closingTime: timeString.default(null),
});
export const productInput = z.strictObject({
  umkmId: uuid.nullable().optional(), name: z.string().trim().min(1).max(200), price: z.number().int().nonnegative().nullable().optional(), description: z.string().trim().min(1).max(5000),
  category: z.enum(categories), imageUrl: optionalUrl, imageAssetId: uuid.nullable().optional(), isAvailable: z.boolean().optional(), unit: z.string().trim().max(100).nullable().optional(),
  phone: phone.nullable().optional(), sellerName: z.string().trim().min(1).max(200).nullable().optional(),
});
export const error = (message: string, code: string) => ({ error: { message, code } });
export const hasOneImageSource = (value: { imageUrl?: string | null; imageAssetId?: string | null }) => Boolean(value.imageUrl) || Boolean(value.imageAssetId);
