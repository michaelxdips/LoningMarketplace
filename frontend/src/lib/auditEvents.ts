export type AuditCategory = 'auth' | 'umkm' | 'product' | 'user' | 'media' | 'system';

export interface HumanAuditLog {
  title: string;
  category: AuditCategory;
  categoryLabel: string;
}

const auditMap: Record<string, { title: string; category: AuditCategory; categoryLabel: string }> = {
  'auth.login_succeeded': { title: 'Berhasil masuk ke dashboard', category: 'auth', categoryLabel: 'Autentikasi' },
  'auth.login_failed': { title: 'Percobaan masuk gagal', category: 'auth', categoryLabel: 'Autentikasi' },
  'auth.login_denied_invalid_role': { title: 'Akses ditolak (peran tidak valid)', category: 'auth', categoryLabel: 'Autentikasi' },
  'auth.logout': { title: 'Keluar dari dashboard', category: 'auth', categoryLabel: 'Autentikasi' },
  'auth.password_changed': { title: 'Mengubah kata sandi mandiri', category: 'auth', categoryLabel: 'Autentikasi' },
  'auth.password_reset': { title: 'Kata sandi direset oleh admin', category: 'auth', categoryLabel: 'Autentikasi' },
  'auth.superadmin_bootstrapped': { title: 'Inisialisasi akun Administrator Utama', category: 'auth', categoryLabel: 'Autentikasi' },

  'umkm.created': { title: 'Menambahkan UMKM baru', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.updated': { title: 'Memperbarui profil UMKM', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.contact_verified': { title: 'Memverifikasi kontak UMKM', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.location_updated': { title: 'Memperbarui lokasi peta UMKM', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.published': { title: 'Menerbitkan UMKM ke publik', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.unpublished': { title: 'Membatalkan publikasi UMKM', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.archived': { title: 'Mengarsipkan UMKM', category: 'umkm', categoryLabel: 'UMKM' },
  'umkm.restored': { title: 'Memulihkan UMKM dari arsip', category: 'umkm', categoryLabel: 'UMKM' },

  'product.created': { title: 'Menambahkan produk baru', category: 'product', categoryLabel: 'Produk' },
  'product.updated': { title: 'Memperbarui data produk', category: 'product', categoryLabel: 'Produk' },
  'product.published': { title: 'Menerbitkan produk ke publik', category: 'product', categoryLabel: 'Produk' },
  'product.unpublished': { title: 'Membatalkan publikasi produk', category: 'product', categoryLabel: 'Produk' },
  'product.archived': { title: 'Mengarsipkan produk', category: 'product', categoryLabel: 'Produk' },
  'product.restored': { title: 'Memulihkan produk dari arsip', category: 'product', categoryLabel: 'Produk' },

  'user.created': { title: 'Menambahkan pengguna dashboard baru', category: 'user', categoryLabel: 'Pengguna' },
  'user.updated': { title: 'Memperbarui data pengguna', category: 'user', categoryLabel: 'Pengguna' },
  'user.password_reset': { title: 'Mereset kata sandi pengguna', category: 'user', categoryLabel: 'Pengguna' },
  'user.sessions_revoked': { title: 'Mencabut seluruh sesi aktif pengguna', category: 'user', categoryLabel: 'Pengguna' },

  'media.uploaded': { title: 'Mengunggah gambar baru', category: 'media', categoryLabel: 'Media' },
  'media.updated': { title: 'Memperbarui deskripsi alternatif gambar', category: 'media', categoryLabel: 'Media' },
  'media.deleted': { title: 'Menghapus gambar', category: 'media', categoryLabel: 'Media' },
  'media.cleaned_up': { title: 'Pembersihan gambar kadaluarsa', category: 'media', categoryLabel: 'Media' },
};

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'passwordhash',
  'secret',
  'token',
  'resettoken',
  'sessiontoken',
  'csrf',
  'cookie',
  'authorization',
  'apikey',
  'privatekey',
  'databaseurl',
  'connectionstring',
]);

export function formatAuditEvent(action: string): HumanAuditLog {
  if (auditMap[action]) return auditMap[action];

  const parts = action.split('.');
  const group = parts[0] || 'system';
  const name = parts.slice(1).join(' ') || action;
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');

  let category: AuditCategory = 'system';
  let categoryLabel = 'Sistem';

  if (group === 'auth') { category = 'auth'; categoryLabel = 'Autentikasi'; }
  else if (group === 'umkm') { category = 'umkm'; categoryLabel = 'UMKM'; }
  else if (group === 'product') { category = 'product'; categoryLabel = 'Produk'; }
  else if (group === 'user') { category = 'user'; categoryLabel = 'Pengguna'; }
  else if (group === 'media') { category = 'media'; categoryLabel = 'Media'; }

  return {
    title: categoryLabel + ': ' + capitalizedName,
    category,
    categoryLabel,
  };
}

export function sanitizeMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nestedClean = sanitizeMetadata(value as Record<string, unknown>);
      if (nestedClean && Object.keys(nestedClean).length > 0) clean[key] = nestedClean;
    } else if (value !== undefined) {
      clean[key] = value;
    }
  }

  return Object.keys(clean).length > 0 ? clean : null;
}
