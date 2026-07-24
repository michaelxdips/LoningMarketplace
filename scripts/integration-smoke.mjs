const baseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001/api').replace(/\/+$/, '');
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const fixtureId = 'e3000000-0000-4000-8000-000000000001';
const testIdentifier = process.env.E2E_ADMIN_EMAIL ?? 'admin1@local.test';
const testPassword = process.env.E2E_ADMIN_PASSWORD ?? 'loning_local_dev';

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

if (health.body.status !== 'ok' || ready.body.status !== 'ok' || !umkms.body.data.length || !products.body.data.length || !category.body.data.length) {
  throw new Error('Local API smoke assertions failed');
}

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
