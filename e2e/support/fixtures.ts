export const E2E_FIXTURES = {
  credentials: {
    admin: { identifier: 'admin.products.e2e@local.test', username: 'admin.products.e2e', password: 'local-e2e-passphrase-123' },
    adminMustChangePassword: { identifier: 'admin.e2e@local.test', username: 'admin.e2e', password: 'local-e2e-passphrase-123' },
    owner: { identifier: 'owner.e2e@local.test', username: 'owner.e2e', password: 'local-e2e-passphrase-123' },
  },
  umkm: {
    primaryId: 'e2000000-0000-4000-8000-000000000001',
    primaryName: 'Warung Nasi Khas Loning',
  },
  products: {
    desktop: { id: 'e3000000-0000-4000-8000-000000000001', name: 'E2E Produk Stabilization Desktop' },
    mobile: { id: 'e3000000-0000-4000-8000-000000000002', name: 'E2E Produk Stabilization Mobile' },
  },
} as const;

export const loginFixture = E2E_FIXTURES.credentials.admin;