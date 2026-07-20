import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const categoryEnum = pgEnum('category', ['Kuliner', 'Kerajinan', 'Jasa', 'Sembako', 'Pertanian']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'owner']);
export const publicationStatusEnum = pgEnum('publication_status', ['draft', 'published', 'archived']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('owner'),
  isActive: boolean('is_active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  failedLoginCount: integer('failed_login_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_unique').on(table.email),
  roleActiveIdx: index('users_role_is_active_idx').on(table.role, table.isActive),
  failedLoginCheck: check('users_failed_login_count_check', sql`${table.failedLoginCount} >= 0`),
}));

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey(), createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }), originalFilename: text('original_filename'), originalMimeType: text('original_mime_type').notNull(), outputMimeType: text('output_mime_type').notNull(), checksumSha256: text('checksum_sha256').notNull(),
  cardStorageKey: text('card_storage_key').notNull(), thumbnailStorageKey: text('thumbnail_storage_key').notNull(), cardWidth: integer('card_width').notNull(), cardHeight: integer('card_height').notNull(), cardByteSize: integer('card_byte_size').notNull(), thumbnailWidth: integer('thumbnail_width').notNull(), thumbnailHeight: integer('thumbnail_height').notNull(), thumbnailByteSize: integer('thumbnail_byte_size').notNull(), altText: text('alt_text'), orphanedAt: timestamp('orphaned_at', { withTimezone: true }).defaultNow(), deletedAt: timestamp('deleted_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ creatorIdx: index('media_assets_created_by_user_id_idx').on(table.createdByUserId), checksumIdx: index('media_assets_checksum_sha256_idx').on(table.checksumSha256), orphanIdx: index('media_assets_orphaned_at_idx').on(table.orphanedAt), deletedIdx: index('media_assets_deleted_at_idx').on(table.deletedAt), createdIdx: index('media_assets_created_at_idx').on(table.createdAt), cardKeyIdx: uniqueIndex('media_assets_card_storage_key_unique').on(table.cardStorageKey), thumbKeyIdx: uniqueIndex('media_assets_thumbnail_storage_key_unique').on(table.thumbnailStorageKey), dimensionsCheck: check('media_assets_dimensions_check', sql`${table.cardWidth} > 0 AND ${table.cardHeight} > 0 AND ${table.cardByteSize} > 0 AND ${table.thumbnailWidth} > 0 AND ${table.thumbnailHeight} > 0 AND ${table.thumbnailByteSize} > 0`), checksumCheck: check('media_assets_checksum_sha256_check', sql`${table.checksumSha256} ~ '^[0-9a-f]{64}$'`), altTextCheck: check('media_assets_alt_text_check', sql`${table.altText} IS NULL OR char_length(${table.altText}) <= 500`) }));

export const umkms = pgTable('umkms', {
  id: uuid('id').primaryKey(), name: text('name').notNull(), owner: text('owner').notNull(), description: text('description').notNull(),
  phone: text('phone').notNull(), category: categoryEnum('category').notNull(), imageUrl: text('image_url'), imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, { onDelete: 'set null' }), address: text('address').notNull(),
  workingHours: text('working_hours'), ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }), displayOrder: integer('display_order').notNull().default(0),
  publicationStatus: publicationStatusEnum('publication_status').notNull().default('draft'), publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('umkms_category_idx').on(table.category), orderIdx: index('umkms_display_order_idx').on(table.displayOrder), ownerIdx: index('umkms_owner_user_id_idx').on(table.ownerUserId), statusIdx: index('umkms_publication_status_idx').on(table.publicationStatus),
  phoneCheck: check('umkms_phone_digits_check', sql`${table.phone} ~ '^[0-9]+$'`), orderCheck: check('umkms_display_order_check', sql`${table.displayOrder} >= 0`), imageSourceCheck: check('umkms_image_source_check', sql`${table.imageUrl} IS NOT NULL OR ${table.imageAssetId} IS NOT NULL`), imageAssetIdx: index('umkms_image_asset_id_idx').on(table.imageAssetId),
}));

export const products = pgTable('products', {
  id: uuid('id').primaryKey(), umkmId: uuid('umkm_id').notNull().references(() => umkms.id, { onDelete: 'cascade' }), name: text('name').notNull(), price: integer('price'),
  description: text('description').notNull(), category: categoryEnum('category').notNull(), imageUrl: text('image_url'), imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, { onDelete: 'set null' }), isAvailable: boolean('is_available').notNull().default(true),
  unit: text('unit'), displayOrder: integer('display_order').notNull().default(0), publicationStatus: publicationStatusEnum('publication_status').notNull().default('draft'), publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  umkmIdx: index('products_umkm_id_idx').on(table.umkmId), categoryIdx: index('products_category_idx').on(table.category), orderIdx: index('products_display_order_idx').on(table.displayOrder), statusIdx: index('products_publication_status_idx').on(table.publicationStatus), parentStatusOrderIdx: index('products_umkm_status_order_idx').on(table.umkmId, table.publicationStatus, table.displayOrder),
  priceCheck: check('products_price_check', sql`${table.price} IS NULL OR ${table.price} >= 0`), orderCheck: check('products_display_order_check', sql`${table.displayOrder} >= 0`), imageSourceCheck: check('products_image_source_check', sql`${table.imageUrl} IS NOT NULL OR ${table.imageAssetId} IS NOT NULL`), imageAssetIdx: index('products_image_asset_id_idx').on(table.imageAssetId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(), csrfTokenHash: text('csrf_token_hash').notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), lastSeenAt: timestamp('last_seen_at', { withTimezone: true }), ipAddress: text('ip_address'), userAgent: text('user_agent'),
}, (table) => ({ tokenIdx: uniqueIndex('sessions_token_hash_unique').on(table.tokenHash), userIdx: index('sessions_user_id_idx').on(table.userId), expiryIdx: index('sessions_expires_at_idx').on(table.expiresAt) }));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(), actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: uuid('entity_id'), metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  ipAddress: text('ip_address'), userAgent: text('user_agent'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ createdIdx: index('audit_logs_created_at_idx').on(table.createdAt), actorIdx: index('audit_logs_actor_user_id_idx').on(table.actorUserId), actionIdx: index('audit_logs_action_idx').on(table.action) }));
