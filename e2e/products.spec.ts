import { expect, request as apiRequest, test, type Page, type Request, type TestInfo } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents, type ExpectedBrowserDiagnostic, type ExpectedHttpError } from './support/browser-events';
import { loginFixture, E2E_FIXTURES } from './support/fixtures';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_ORIGIN = 'http://localhost:3000';
const MEDIA_UPLOAD_URL = `${API_BASE}/manage/media/images`;
const ORIGINAL_IMAGE = `${FRONTEND_ORIGIN.replace('3000', '3001')}/media/fixtures/e2e-product.webp`;
const CORRUPT_IMAGE = `${FRONTEND_ORIGIN.replace('3000', '3001')}/media/fixtures/e2e-corrupt.webp`;
const ORIGINAL = {
  umkmId: E2E_FIXTURES.umkm.primaryId,
  price: 35000,
  description: 'Produk deterministik untuk pengujian browser lokal.',
  category: 'Kuliner',
  imageUrl: ORIGINAL_IMAGE,
  imageAssetId: null,
  isAvailable: true,
  unit: 'Pcs',
};
const FIXTURES = E2E_FIXTURES.products;
const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const uploadedAssetIds: string[] = [];

const expectedMediaValidationHttpError: ExpectedHttpError = {
  method: 'POST',
  url: MEDIA_UPLOAD_URL,
  status: 400,
  statusText: 'Bad Request',
  resourceType: 'xhr',
};
const expectedMediaValidationDiagnostic: ExpectedBrowserDiagnostic = {
  text: 'Failed to load resource: the server responded with a status of 400 (Bad Request)',
  locationUrl: MEDIA_UPLOAD_URL,
  consoleType: 'error',
  method: 'POST',
  url: MEDIA_UPLOAD_URL,
  status: 400,
  statusText: 'Bad Request',
  resourceType: 'xhr',
};


type Fixture = (typeof FIXTURES)[keyof typeof FIXTURES];
type NetworkEvents = {
  requests: Array<{ method: string; url: string }>;
  responses: Array<{ method: string; url: string; status: number; body?: string }>;
};

function fixtureFor(testInfo: TestInfo): Fixture {
  return testInfo.project.name === 'mobile' ? FIXTURES.mobile : FIXTURES.desktop;
}

function observe(page: Page): NetworkEvents {
  const events: NetworkEvents = { requests: [], responses: [] };
  page.on('request', request => { if (request.url().includes('/api/')) events.requests.push({ method: request.method(), url: request.url() }); });
  page.on('response', response => {
    if (!response.url().includes('/api/')) return;
    const entry: NetworkEvents['responses'][number] = { method: response.request().method(), url: response.url(), status: response.status() };
    events.responses.push(entry);
    if (response.request().method() === 'PATCH') void response.text().then(body => { entry.body = body.slice(0, 1000); }).catch(() => undefined);
  });
  return events;
}

async function login(page: Page) {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    headers: { Origin: FRONTEND_ORIGIN },
    data: { identifier: loginFixture.identifier, password: loginFixture.password },
  });
  expect(response.status()).toBe(200);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/dashboard/);
}

async function stabilizeLegacyImages(page: Page) {
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: validPng }));
}

function productItem(page: Page, fixture: Fixture) {
  return page.locator('tr:visible, article:visible').filter({ hasText: fixture.name });
}

async function openProducts(page: Page, fixture: Fixture, status?: string) {
  await page.goto('/dashboard/products', { waitUntil: 'domcontentloaded' });
  const item = productItem(page, fixture);
  await expect(item).toContainText(fixture.name);
  if (status) await expect(item).toContainText(status);
}

function publicProductUrl(id: string) {
  return `${API_BASE}/products/${id}`;
}

async function managementProduct(page: Page, id: string) {
  return page.evaluate(async url => {
    const response = await fetch(url, { credentials: 'include' });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }, `${API_BASE}/manage/products/${id}`);
}

async function publicProduct(id: string) {
  const api = await apiRequest.newContext();
  try {
    const response = await api.get(`${API_BASE}/products/${id}`);
    return { status: response.status(), body: await response.json().catch(() => ({})) };
  } finally { await api.dispose(); }
}

async function publicProductFromPage(page: Page, id: string) {
  return page.evaluate(async url => {
    const response = await fetch(url, { credentials: 'include' });
    return { status: response.status, statusText: response.statusText, body: await response.json().catch(() => ({})) };
  }, publicProductUrl(id));
}

function expectedArchivedProductHttpError(id: string): ExpectedHttpError {
  return {
    method: 'GET',
    url: publicProductUrl(id),
    status: 404,
    statusText: 'Not Found',
    resourceType: 'fetch',
  };
}

function expectedArchivedProductDiagnostic(id: string): ExpectedBrowserDiagnostic {
  const url = publicProductUrl(id);
  return {
    text: 'Failed to load resource: the server responded with a status of 404 (Not Found)',
    locationUrl: url,
    consoleType: 'error',
    method: 'GET',
    url,
    status: 404,
    statusText: 'Not Found',
    resourceType: 'fetch',
  };
}

async function saveAndCapturePatch(page: Page, fixture: Fixture, events?: ReturnType<typeof observeBrowserEvents>, deferTransition = false, additionalTransitionRequests: RegExp[] = []) {
  const requestPromise = page.waitForRequest(request => request.method() === 'PATCH' && request.url().endsWith(`/manage/products/${fixture.id}`));
  const responsePromise = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith(`/manage/products/${fixture.id}`));
  const pendingDashboardRequests = new Set<Request>();
  const onRequest = (request: Request) => {
    if (events && request.method() === 'GET' && /^http:\/\/localhost:3001\/api\/manage\/(?:products|umkms)(?:\?.*)?$/.test(request.url())) pendingDashboardRequests.add(request);
  };
  const onRequestDone = (request: Request) => { pendingDashboardRequests.delete(request); };
  const waitForDashboardQuiet = async () => {
    await expect.poll(() => pendingDashboardRequests.size, { timeout: 2000 }).toBe(0);
  };
  const removeListeners = () => {
    if (!events) return;
    page.off('request', onRequest);
    page.off('requestfinished', onRequestDone);
    page.off('requestfailed', onRequestDone);
  };
  const transition = events?.beginExpectedTransition({ reason: `save:${fixture.id}`, expectedRequests: [{ method: 'GET', url: /http:\/\/localhost:3001\/api\/manage\/(?:products|umkms)(?:\?.*)?$/ }, ...additionalTransitionRequests.map(url => ({ method: 'GET' as const, url }))] });
  if (events) {
    page.on('request', onRequest);
    page.on('requestfinished', onRequestDone);
    page.on('requestfailed', onRequestDone);
  }
  try {
    await page.getByRole('button', { name: 'Simpan perubahan' }).click();
    const [request, response] = await Promise.all([requestPromise, responsePromise]);
    const headers = await request.allHeaders();
    expect(headers.origin).toBe(FRONTEND_ORIGIN);
    expect(Boolean(headers.cookie)).toBe(true);
    expect(Boolean(headers['x-csrf-token'])).toBe(true);
    expect(headers['content-type']).toContain('application/json');
    expect(response.status()).toBe(200);
    await page.waitForLoadState('networkidle');
    if (!deferTransition) await waitForDashboardQuiet();
    const result = { payload: request.postDataJSON(), body: await response.json() };
    return deferTransition ? {
      ...result,
      completeTransition: async () => {
        try {
          await waitForDashboardQuiet();
        } finally {
          removeListeners();
          transition?.complete();
        }
      },
    } : result;
  } finally {
    if (!deferTransition) {
      removeListeners();
      transition?.complete();
    }
  }
}

async function resetFixture(fixture: Fixture) {
  const api = await apiRequest.newContext({ baseURL: `${API_BASE}/` });
  try {
    const loginResponse = await api.post('auth/login', {
      headers: { Origin: FRONTEND_ORIGIN },
      data: { identifier: loginFixture.identifier, password: loginFixture.password },
    });
    if (!loginResponse.ok()) throw new Error(`Fixture cleanup login returned ${loginResponse.status()}`);
    const csrf = (await loginResponse.json()).data.csrfToken as string;
    const currentResponse = await api.get(`manage/products/${fixture.id}`);
    const current = currentResponse.ok() ? (await currentResponse.json()).data : undefined;
    const headers = { Origin: FRONTEND_ORIGIN, 'X-CSRF-Token': csrf };
    const restoreResponse = await api.patch(`manage/products/${fixture.id}`, {
      headers,
      data: { ...ORIGINAL, name: fixture.name },
    });
    if (!restoreResponse.ok()) throw new Error(`Fixture cleanup PATCH returned ${restoreResponse.status()}`);
    if (current?.publicationStatus === 'archived') await api.post(`manage/products/${fixture.id}/restore`, { headers });
    if (current?.publicationStatus !== 'published') await api.post(`manage/products/${fixture.id}/publish`, { headers });
    for (const assetId of uploadedAssetIds.splice(0)) {
      const deleteResponse = await api.delete(`manage/media/images/${assetId}`, { headers });
      if (!deleteResponse.ok()) throw new Error(`Fixture media cleanup DELETE ${assetId} returned ${deleteResponse.status()}: ${await deleteResponse.text()}`);
    }
  } finally {
    await api.dispose();
  }
}

test.describe.configure({ mode: 'serial' });

test.afterEach(async ({}, testInfo) => {
  await resetFixture(fixtureFor(testInfo));
});

test('product mutations, price contract, external image, archive, and restore are stable', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const fixture = fixtureFor(testInfo);
  const events = observe(page);
  await stabilizeLegacyImages(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const initialPublicCard = page.locator(`#product-card-${fixture.id}`);
  await expect(initialPublicCard).toContainText(fixture.name);
  await login(page);
  await openProducts(page, fixture, 'Terbit');

  const item = productItem(page, fixture);
  await expect(item).toContainText(fixture.name);
  await expect(item).toContainText('Warung Nasi Khas Loning');
  await expect(item).toContainText('Rp35.000');
  await expect(item).toContainText('Terbit');
  await expect(item).toContainText('Tersedia');
  const manageLink = item.getByRole('link', { name: 'Kelola' });
  await expect(manageLink).toHaveAttribute('href', `/dashboard/products/${fixture.id}`);
  const thumbnail = item.getByRole('img', { name: `Gambar ${fixture.name}` });
  await expect(thumbnail).toHaveCSS('width', '64px');
  await expect(thumbnail).toHaveCSS('height', '64px');

  await page.goto(`/dashboard/products/${fixture.id}`);
  await expect(page.getByLabel('Harga (rupiah)')).toHaveValue('35000');
  const keepCurrent = page.getByRole('radio', { name: 'Pertahankan gambar saat ini' });
  const managedMode = page.getByRole('radio', { name: 'Pakai unggahan terkelola' });
  await expect(keepCurrent).toBeChecked();
  await expect(page.getByText('Belum ada file yang dipilih')).toHaveCount(0);
  await managedMode.focus();
  await page.keyboard.press('Space');
  await expect(managedMode).toBeChecked();
  await keepCurrent.focus();
  await page.keyboard.press('Space');
  await expect(keepCurrent).toBeChecked();
  await expect(page.getByLabel('Pilih gambar')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');

  const before = await managementProduct(page, fixture.id);
  expect(before.status).toBe(200);
  expect(before.body.data.imageUrl).toBe(ORIGINAL_IMAGE);
  expect(before.body.data.imageAssetId).toBeNull();

  const keepDescription = `${ORIGINAL.description} Diperbarui tanpa mengganti gambar.`;
  await page.getByLabel('Deskripsi').fill(keepDescription);
  const keepPatch = await saveAndCapturePatch(page, fixture);
  expect(keepPatch.payload).not.toHaveProperty('imageUrl');
  expect(keepPatch.payload).not.toHaveProperty('imageAssetId');
  expect(keepPatch.payload).toMatchObject({ price: 35000, isAvailable: true, unit: 'Pcs' });
  await expect(page).toHaveURL(/dashboard\/products$/);
  await page.goto(`/dashboard/products/${fixture.id}`);
  await expect(page.getByLabel('Deskripsi')).toHaveValue(keepDescription);
  const afterKeep = await managementProduct(page, fixture.id);
  expect(afterKeep.body.data.imageUrl).toBe(before.body.data.imageUrl);
  expect(afterKeep.body.data.imageAssetId).toBe(before.body.data.imageAssetId);

  await page.getByLabel('Harga (rupiah)').fill('0');
  await saveAndCapturePatch(page, fixture);
  await expect(productItem(page, fixture)).toContainText('Rp0');
  await page.reload();
  await expect(productItem(page, fixture)).toContainText('Rp0');
  expect((await publicProduct(fixture.id)).body.data.price).toBe(0);

  await page.goto(`/dashboard/products/${fixture.id}`);
  await page.getByLabel('Harga (rupiah)').fill('');
  const nullPatch = await saveAndCapturePatch(page, fixture);
  expect(nullPatch.payload).toHaveProperty('price', null);
  await expect(productItem(page, fixture)).toContainText('Harga tidak ditampilkan');
  await page.reload();
  await expect(productItem(page, fixture)).toContainText('Harga tidak ditampilkan');
  expect((await publicProduct(fixture.id)).body.data.price).toBeNull();

  await page.goto(`/dashboard/products/${fixture.id}`);
  await page.getByLabel('Harga (rupiah)').fill('35000');
  await saveAndCapturePatch(page, fixture);
  await expect(productItem(page, fixture)).toContainText('Rp35.000');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const publicCard = page.locator(`#product-card-${fixture.id}`);
  await expect(publicCard).toContainText('Rp35.000');
  await page.goto('/dashboard/products');

  await page.goto(`/dashboard/products/${fixture.id}`);
  await managedMode.check();
  const patchCountBeforeInvalidManagedSave = events.requests.filter(request => request.method === 'PATCH' && request.url.endsWith(fixture.id)).length;
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('alert')).toContainText('Selesaikan unggahan gambar terkelola');
  await expect.poll(() => events.requests.filter(request => request.method === 'PATCH' && request.url.endsWith(fixture.id)).length).toBe(patchCountBeforeInvalidManagedSave);
  expect((await managementProduct(page, fixture.id)).body.data.imageUrl).toBe(ORIGINAL_IMAGE);

  const externalImage = `${ORIGINAL_IMAGE}?mode=external`;
  await page.getByRole('radio', { name: 'Pakai URL gambar eksternal' }).check();
  await page.getByRole('textbox', { name: 'URL gambar eksternal' }).fill(externalImage);
  const externalPatch = await saveAndCapturePatch(page, fixture);
  expect(externalPatch.payload).toMatchObject({ imageUrl: externalImage, imageAssetId: null });
  expect((await managementProduct(page, fixture.id)).body.data.imageUrl).toBe(externalImage);

  let corruptImageRequests = 0;
  const externalEvents = observeBrowserEvents(page);
  page.on('request', request => {
    if (request.url() === CORRUPT_IMAGE) corruptImageRequests += 1;
  });
  try {
    const detailTransition = externalEvents.beginExpectedTransition({ reason: `open-product:${fixture.id}`, expectedRequests: [{ method: 'GET', url: /http:\/\/localhost:3001\/api\/manage\/(?:products(?:\/[^?]+)?|umkms)(?:\?.*)?$/ }] });
    try { await page.goto(`/dashboard/products/${fixture.id}`); await page.waitForLoadState('networkidle'); } finally { detailTransition.complete(); }
    await expect(page.getByRole('radio', { name: 'Pakai URL gambar eksternal' })).toBeVisible();
    await page.getByRole('radio', { name: 'Pakai URL gambar eksternal' }).check();
    await page.getByRole('textbox', { name: 'URL gambar eksternal' }).fill(CORRUPT_IMAGE);
    const corruptPatch = await saveAndCapturePatch(page, fixture, externalEvents, true);
    expect(corruptPatch.payload).toMatchObject({ imageUrl: CORRUPT_IMAGE });
    const fallback = productItem(page, fixture).getByRole('img', { name: `Gambar ${fixture.name}` });
    await expect(fallback).toHaveAttribute('role', 'img');
    expect(await fallback.evaluate(element => element.tagName)).toBe('DIV');
    expect(corruptImageRequests).toBe(1);
    await corruptPatch.completeTransition?.();
    assertBrowserEvents(externalEvents);
  } finally {
    externalEvents.dispose();
  }

  await resetFixture(fixture);
  expect((await managementProduct(page, fixture.id)).body.data.imageUrl).toBe(ORIGINAL_IMAGE);

  await openProducts(page, fixture, 'Terbit');
  await productItem(page, fixture).getByRole('button', { name: 'Arsipkan' }).click();
  const archiveDialog = page.getByRole('dialog');
  await expect(archiveDialog).toContainText(`${fixture.name} akan diperbarui.`);
  const archiveResponse = page.waitForResponse(response => response.request().method() === 'DELETE' && response.url().endsWith(`/manage/products/${fixture.id}`));
  await archiveDialog.getByRole('button', { name: 'Konfirmasi', exact: true }).click();
  expect((await archiveResponse).status()).toBe(200);
  await expect(productItem(page, fixture).getByRole('button', { name: 'Pulihkan' })).toBeVisible();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const archivedPublicCard = page.locator(`#product-card-${fixture.id}`);
  await expect(archivedPublicCard).toHaveCount(0);
  const archivedEvents = observeBrowserEvents(page);
  const archivedApi = await publicProductFromPage(page, fixture.id);
  expect(archivedApi.status).toBe(404);
  expect(archivedApi.statusText).toBe('Not Found');
  expect(archivedApi.body).toEqual({ error: { message: 'Product not found', code: 'NOT_FOUND' } });
  assertBrowserEvents(archivedEvents, {
    httpErrors: [expectedArchivedProductHttpError(fixture.id)],
    browserDiagnostics: [expectedArchivedProductDiagnostic(fixture.id)],
  });
  archivedEvents.dispose();

  await openProducts(page, fixture, 'Diarsipkan');
  const restoreResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith(`/manage/products/${fixture.id}/restore`));
  await productItem(page, fixture).getByRole('button', { name: 'Pulihkan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click();
  expect((await restoreResponse).status()).toBe(200);
  await expect(productItem(page, fixture)).toContainText('Draf');

  const publishResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith(`/manage/products/${fixture.id}/publish`));
  await productItem(page, fixture).getByRole('button', { name: 'Terbitkan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click();
  expect((await publishResponse).status()).toBe(200);
  await expect(productItem(page, fixture)).toContainText('Terbit');

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const restoredPublicCard = page.locator(`#product-card-${fixture.id}`);
  await expect(restoredPublicCard).toContainText(fixture.name);
  const restoredEvents = observeBrowserEvents(page);
  const restoredApi = await publicProductFromPage(page, fixture.id);
  expect(restoredApi.status).toBe(200);
  expect(restoredApi.body.data).toMatchObject({ id: fixture.id, name: fixture.name, price: 35000, imageUrl: ORIGINAL_IMAGE });
  const finalManagement = await managementProduct(page, fixture.id);
  expect(finalManagement.body.data).toMatchObject({ publicationStatus: 'published', price: 35000, imageUrl: ORIGINAL_IMAGE, imageAssetId: null });
  assertBrowserEvents(restoredEvents);
  restoredEvents.dispose();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('managed media upload succeeds and failed uploads preserve the current image', async ({ page }, testInfo) => {
  const fixture = fixtureFor(testInfo);
  const events = observe(page);
  await stabilizeLegacyImages(page);
  await login(page);
  await page.goto(`/dashboard/products/${fixture.id}`);
  await expect(page.getByRole('radio', { name: 'Pakai unggahan terkelola' })).toBeVisible();
  const browserEvents = observeBrowserEvents(page);
  await page.getByRole('radio', { name: 'Pakai unggahan terkelola' }).check();
  const fileInput = page.getByLabel('Pilih gambar');

  await fileInput.setInputFiles({ name: 'catatan.txt', mimeType: 'text/plain', buffer: Buffer.from('bukan gambar') });
  await expect(page.getByRole('alert')).toContainText('JPEG, PNG, atau WebP');
  await fileInput.setInputFiles({ name: 'terlalu-besar.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toContainText('5 MiB');

  const corruptUpload = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/manage/media/images'));
  await fileInput.setInputFiles({ name: 'rusak.png', mimeType: 'image/png', buffer: Buffer.from('bukan png') });
  expect((await corruptUpload).status()).toBe(400);
  await expect(page.getByRole('alert')).toBeVisible();
  expect(events.requests.filter(request => request.method === 'PATCH' && request.url.endsWith(fixture.id))).toEqual([]);
  expect((await managementProduct(page, fixture.id)).body.data.imageUrl).toBe(ORIGINAL_IMAGE);
  expect((await managementProduct(page, fixture.id)).body.data.imageAssetId).toBeNull();

  const uploadResponsePromise = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/manage/media/images'));
  await fileInput.setInputFiles({ name: 'produk-e2e.png', mimeType: 'image/png', buffer: validPng });
  const uploadResponse = await uploadResponsePromise;
  expect(uploadResponse.status()).toBe(201);
  const uploaded = (await uploadResponse.json()).data;
  expect(uploaded.id).toMatch(/^[0-9a-f-]{36}$/i);
  uploadedAssetIds.push(uploaded.id);
  await expect(page.getByText('Unggahan selesai.')).toBeVisible();

  const productListRefresh = page.waitForResponse(response => response.request().method() === 'GET' && response.url() === `${API_BASE}/manage/products?limit=100`);
  const managedPatch = await saveAndCapturePatch(page, fixture, browserEvents, true, [/http:\/\/localhost:3001\/api\/(?:products|umkms)$/]);
  expect((await productListRefresh).status()).toBe(200);
  expect(managedPatch.payload).toMatchObject({ imageUrl: null, imageAssetId: uploaded.id });
  await expect(page).toHaveURL(/dashboard\/products$/);
  const listImage = productItem(page, fixture).getByRole('img', { name: `Gambar ${fixture.name}` });
  await expect(listImage).toHaveAttribute('src', /\/media\/media\//);

  const managedDetail = await managementProduct(page, fixture.id);
  expect(managedDetail.body.data.imageAssetId).toBe(uploaded.id);
  expect(managedDetail.body.data.imageUrl).toContain('/media/media/');
  expect(managedDetail.body.data.imageUrl).not.toContain('blob:');

  const publicCard = page.locator(`#product-card-${fixture.id}`);
  try { await page.goto('/'); await page.waitForLoadState('networkidle'); } finally { await managedPatch.completeTransition?.(); }
  await expect(publicCard).toContainText('Rp35.000');
  await expect(publicCard.getByRole('img', { name: fixture.name })).toHaveAttribute('src', /\/media\/media\//);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  assertBrowserEvents(browserEvents, {
    httpErrors: [expectedMediaValidationHttpError],
    browserDiagnostics: [expectedMediaValidationDiagnostic],
  });
  browserEvents.dispose();
});
