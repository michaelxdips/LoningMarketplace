const baseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const fixtureId = 'e3000000-0000-4000-8000-000000000001';
const testIdentifier = process.env.E2E_ADMIN_EMAIL ?? 'admin1@local.test';
const testPassword = process.env.E2E_ADMIN_PASSWORD ?? 'admin1234';

async function request(path, options = {}, expected = [200]) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { throw new Error(`${path} returned non-JSON response with status ${response.status}`); }
  if (!expected.includes(response.status)) throw new Error(`${options.method ?? 'GET'} ${path} returned ${response.status}: ${body.error?.message ?? 'request failed'}`);
  return { response, body };
}

function cookieFrom(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  const sessionCookie = cookies.find(value => value.startsWith('loning_session='));
  if (!sessionCookie) throw new Error('Login did not establish the expected local session cookie');
  return sessionCookie.split(';')[0];
}

const health = await request('/health');
const ready = await request('/ready');
const umkms = await request('/umkms');
const products = await request('/products');
const category = await request('/umkms?category=Kuliner');
const trimmedProducts = await request('/products?q=%20nAsI%20&category=Kuliner&limit=2');
const joinedParentProducts = await request('/products?q=Warung%20Nasi%20Khas%20Loning&limit=100');
const ownerUmkms = await request('/umkms?q=siti%20aminah&limit=100');
const emptyQueryProducts = await request('/products?q=%20%20&limit=1');
const invalidProductCategory = await request('/products?category=Invalid', {}, [400]);
const invalidUmkmCategory = await request('/umkms?category=Invalid', {}, [400]);
const oversizedProductQuery = await request(`/products?q=${'a'.repeat(81)}`, {}, [400]);
const boundedProductLimit = await request('/products?limit=101', {}, [400]);

if (health.body.status !== 'ok' || ready.body.status !== 'ok' || !umkms.body.data.length || !products.body.data.length || !category.body.data.length) {
  throw new Error('Local API smoke assertions failed');
}
if (!trimmedProducts.body.data.length || trimmedProducts.body.data.some(item => item.category !== 'Kuliner') || trimmedProducts.body.data.length > 2) throw new Error('Combined trimmed product search failed');
if (!joinedParentProducts.body.data.length || joinedParentProducts.body.data.some(item => item.umkmName !== 'Warung Nasi Khas Loning')) throw new Error('Product search by public parent name failed');
if (ownerUmkms.body.data.length !== 1 || ownerUmkms.body.data[0].owner !== 'Siti Aminah') throw new Error('Case-insensitive UMKM owner search failed');
if (emptyQueryProducts.body.data.length !== 1) throw new Error('Whitespace-only search did not preserve the bounded catalog');
for (const result of [invalidProductCategory, invalidUmkmCategory, oversizedProductQuery, boundedProductLimit]) if (result.body.error?.code !== 'VALIDATION_ERROR') throw new Error('Public filter validation did not use VALIDATION_ERROR');
const productIds = products.body.data.map(item => item.id);
if (new Set(productIds).size !== productIds.length) throw new Error('Public products contain duplicate rows');
for (const id of ['e3000000-0000-4000-8000-000000000045', 'e3000000-0000-4000-8000-000000000048', 'e3000000-0000-4000-8000-000000000009']) if (productIds.includes(id)) throw new Error(`Non-public product leaked into list: ${id}`);
const firstProduct = products.body.data[0];
const related = await request(`/products/${firstProduct.slug}/related?limit=4`);
if (related.body.data.length > 4 || related.body.data.some(item => item.id === firstProduct.id) || new Set(related.body.data.map(item => item.id)).size !== related.body.data.length) throw new Error('Related-product bounds or uniqueness failed');
if (related.body.data.length && related.body.data[0].umkmId !== firstProduct.umkmId) throw new Error('Related-product same-UMKM secondary priority failed');
const relatedAgain = await request(`/products/${firstProduct.slug}/related?limit=4`);
if (JSON.stringify(relatedAgain.body.data.map(item => item.id)) !== JSON.stringify(related.body.data.map(item => item.id))) throw new Error('Related-product ordering is not deterministic');

const preflight = await fetch(`${baseUrl}/manage/products/${fixtureId}`, {
  method: 'OPTIONS',
  headers: {
    Origin: frontendOrigin,
    'Access-Control-Request-Method': 'PATCH',
    'Access-Control-Request-Headers': 'content-type,x-csrf-token',
  },
});
if (preflight.status !== 204) throw new Error(`Product PATCH preflight returned ${preflight.status}`);
const allowedMethods = preflight.headers.get('access-control-allow-methods') ?? '';
const allowedHeaders = (preflight.headers.get('access-control-allow-headers') ?? '').toLowerCase();
if (!allowedMethods.split(',').map(value => value.trim().toUpperCase()).includes('PATCH')) throw new Error('Product PATCH preflight does not allow PATCH');
if (!allowedHeaders.includes('x-csrf-token')) throw new Error('Product PATCH preflight does not allow X-CSRF-Token');

const login = await request('/auth/login', {
  method: 'POST',
  headers: { Origin: frontendOrigin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: testIdentifier, password: testPassword }),
});
const cookie = cookieFrom(login.response);
const session = await request('/auth/session', { headers: { Cookie: cookie } });
const csrf = session.body.data?.csrfToken;
if (!csrf) throw new Error('Session did not provide a CSRF token');

const before = await request(`/manage/products/${fixtureId}`, { headers: { Cookie: cookie } });
const beforeProduct = before.body.data;
const patchPayload = {
  umkmId: beforeProduct.umkmId,
  name: beforeProduct.name,
  price: 35001,
  description: 'Integration smoke PATCH description.',
  category: beforeProduct.category,
  isAvailable: beforeProduct.isAvailable,
  unit: beforeProduct.unit,
};
const patched = await request(`/manage/products/${fixtureId}`, {
  method: 'PATCH',
  headers: { Cookie: cookie, Origin: frontendOrigin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
  body: JSON.stringify(patchPayload),
});
if (patched.body.data.description !== patchPayload.description || patched.body.data.price !== 35001) throw new Error('PATCH response did not reflect persisted product fields');
if (patched.body.data.imageAssetId !== beforeProduct.imageAssetId) throw new Error('Unrelated PATCH changed the product image asset');

const after = await request(`/manage/products/${fixtureId}`, { headers: { Cookie: cookie } });
if (after.body.data.description !== patchPayload.description || after.body.data.price !== 35001) throw new Error('Management detail did not persist PATCH fields');
if (after.body.data.imageUrl !== beforeProduct.imageUrl || after.body.data.imageAssetId !== beforeProduct.imageAssetId) throw new Error('Management detail did not preserve the product image');
const publicAfter = await request(`/products/${fixtureId}`);
if (publicAfter.body.data.price !== 35001 || publicAfter.body.data.description !== patchPayload.description) throw new Error('Public product detail did not reflect the published update');

const restorePayload = { ...patchPayload, price: beforeProduct.price, description: beforeProduct.description };
const restored = await request(`/manage/products/${fixtureId}`, {
  method: 'PATCH',
  headers: { Cookie: cookie, Origin: frontendOrigin, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
  body: JSON.stringify(restorePayload),
});
if (restored.body.data.price !== beforeProduct.price || restored.body.data.description !== beforeProduct.description) throw new Error('Fixture restoration failed');

console.log(`API smoke passed: ${umkms.body.data.length} UMKMs, ${products.body.data.length} products, authenticated PATCH persisted and restored.`);
