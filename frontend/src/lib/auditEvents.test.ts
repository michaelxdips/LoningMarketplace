import { describe, expect, it } from 'vitest';
import { formatAuditEvent, sanitizeMetadata } from './auditEvents';

describe('auditEvents helper', () => {
  it('formats known audit event actions into Indonesian human-readable titles', () => {
    expect(formatAuditEvent('auth.login_succeeded')).toEqual({
      title: 'Berhasil masuk ke dashboard',
      category: 'auth',
      categoryLabel: 'Autentikasi',
    });
    expect(formatAuditEvent('umkm.created')).toEqual({
      title: 'Menambahkan UMKM baru',
      category: 'umkm',
      categoryLabel: 'UMKM',
    });
    expect(formatAuditEvent('product.published')).toEqual({
      title: 'Menerbitkan produk ke publik',
      category: 'product',
      categoryLabel: 'Produk',
    });
  });

  it('provides a graceful human fallback for unknown actions without crashing', () => {
    const res = formatAuditEvent('custom_group.special_action');
    expect(res.title).toContain('Special action');
    expect(res.category).toBe('system');
  });

  it('redacts sensitive keys from metadata recursively', () => {
    const dirty = {
      actorType: 'admin',
      password: 'secret-password-123',
      newPassword: 'my-new-password',
      token: 'jwt.token.here',
      nested: {
        csrf: 'csrf-token',
        fields: ['name', 'role'],
      },
    };

    const clean = sanitizeMetadata(dirty);
    expect(clean).toEqual({
      actorType: 'admin',
      nested: {
        fields: ['name', 'role'],
      },
    });
  });

  it('returns null for empty or all-redacted metadata objects', () => {
    expect(sanitizeMetadata(null)).toBeNull();
    expect(sanitizeMetadata({ password: '123' })).toBeNull();
  });
});
