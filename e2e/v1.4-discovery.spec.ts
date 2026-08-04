import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents } from './support/browser-events';

const stableImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

async function stabilizeImages(page: Page) {
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: stableImage }));
}

async function mockEmptySearch(page: Page, query: string) {
  const handle = async (route: Route) => {
    if (new URL(route.request().url()).searchParams.get('q') === query) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    else await route.continue();
  };
  await page.route('**/api/products?**', handle);
  await page.route('**/api/umkms?**', handle);
}

async function expectCatalogLocation(page: Page, expected: { q?: string; category?: string; hash?: string }) {
  expect(await page.evaluate(() => ({
    pathname: location.pathname,
    q: new URLSearchParams(location.search).get('q'),
    category: new URLSearchParams(location.search).get('category'),
    hash: location.hash,
  }))).toEqual({ pathname: '/', q: expected.q ?? null, category: expected.category ?? null, hash: expected.hash ?? '' });
}

async function expectNoDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => ({
    document: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    body: document.body.scrollWidth <= document.body.clientWidth,
  }))).toEqual({ document: true, body: true });
}

async function expectInsideLayoutViewport(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const geometry = await locator.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: innerWidth, height: innerHeight };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.width + 1);
  expect(geometry.bottom).toBeGreaterThan(0);
  expect(geometry.top).toBeLessThan(geometry.height);
}

test('filtered discovery deep link restores search and category after refresh', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeImages(page);
  await page.goto('/?q=nasi&category=Kuliner#featured-products');
  await page.waitForLoadState('networkidle');

  const products = page.locator('#featured-products');
  const businesses = page.locator('#umkm');
  const category = page.getByRole('group', { name: 'Filter kategori produk' }).getByRole('button', { name: 'Kuliner', exact: true });
  await expectCatalogLocation(page, { q: 'nasi', category: 'Kuliner', hash: '#featured-products' });
  await expect(products.getByRole('searchbox', { name: 'Cari produk lokal' })).toHaveValue('nasi');
  await expect(businesses.getByRole('searchbox', { name: 'Cari pelaku UMKM' })).toHaveValue('nasi');
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  await expect(products.getByRole('status')).toHaveText(/^[1-9]\d* produk tersedia$/);
  await expect(businesses.getByRole('status')).toHaveText(/^\d+ UMKM ditemukan$/);
  await expect(products.locator('[id^="product-card-"]')).not.toHaveCount(0);

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expectCatalogLocation(page, { q: 'nasi', category: 'Kuliner', hash: '#featured-products' });
  await expect(products.getByRole('searchbox', { name: 'Cari produk lokal' })).toHaveValue('nasi');
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  await expect(products.getByRole('status')).toHaveText(/^[1-9]\d* produk tersedia$/);
  assertBrowserEvents(events);
  events.dispose();
});

test('labelled keyboard search keeps focus through the result update', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeImages(page);
  await mockEmptySearch(page, 'query-khusus-keyboard');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const products = page.locator('#featured-products');
  const search = products.getByRole('searchbox', { name: 'Cari produk lokal' });
  await search.focus();
  await search.fill('query-khusus-keyboard');
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('query-khusus-keyboard');
  await expect(products.getByRole('status')).toHaveText('0 produk tersedia');
  await search.press('Enter');
  await expect(products.getByRole('status')).toHaveText('0 produk tersedia');
  await expect(search).toBeFocused();
  assertBrowserEvents(events);
  events.dispose();
});

test('category changes create restorable back and forward history entries', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeImages(page);
  await page.goto('/?q=nasi&category=Kuliner');
  await page.waitForLoadState('networkidle');

  const filters = page.getByRole('group', { name: 'Filter kategori produk' });
  const handicrafts = filters.getByRole('button', { name: 'Kerajinan', exact: true });
  await handicrafts.focus();
  await handicrafts.press('Enter');
  await expectCatalogLocation(page, { q: 'nasi', category: 'Kerajinan' });
  await expect(handicrafts).toHaveAttribute('aria-pressed', 'true');

  await page.goBack();
  await page.waitForLoadState('networkidle');
  await expectCatalogLocation(page, { q: 'nasi', category: 'Kuliner' });
  await expect(filters.getByRole('button', { name: 'Kuliner', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.goForward();
  await page.waitForLoadState('networkidle');
  await expectCatalogLocation(page, { q: 'nasi', category: 'Kerajinan' });
  await expect(handicrafts).toHaveAttribute('aria-pressed', 'true');
  assertBrowserEvents(events);
  events.dispose();
});

test('no-results state can be cleared with labelled keyboard controls', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeImages(page);
  await mockEmptySearch(page, 'hasil-yang-tidak-ada');
  await page.goto('/?q=hasil-yang-tidak-ada&category=Kuliner');
  await page.waitForLoadState('networkidle');

  const products = page.locator('#featured-products');
  const businesses = page.locator('#umkm');
  await expect(products.getByRole('status')).toHaveText('0 produk tersedia');
  await expect(businesses.getByRole('status')).toHaveText('0 UMKM ditemukan');
  await expect(products.getByText('Produk Tidak Ditemukan', { exact: true })).toBeVisible();
  await expect(businesses.getByText('Usaha Tidak Ditemukan', { exact: true })).toBeVisible();

  const clearSearch = products.getByRole('button', { name: 'Bersihkan pencarian' });
  await clearSearch.focus();
  await expect(clearSearch).toBeFocused();
  await clearSearch.press('Enter');
  await expectCatalogLocation(page, { category: 'Kuliner' });
  await expect(products.getByRole('status')).toHaveText(/^[1-9]\d* produk tersedia$/);

  const allCategories = page.getByRole('group', { name: 'Filter kategori produk' }).getByRole('button', { name: 'Semua Produk', exact: true });
  await allCategories.focus();
  await allCategories.press('Space');
  await expectCatalogLocation(page, {});
  await expect(allCategories).toBeFocused();
  await expect(allCategories).toHaveAttribute('aria-pressed', 'true');
  await expect(products.getByRole('status')).toHaveText(/^[1-9]\d* produk tersedia$/);
  await expect(businesses.getByRole('status')).toHaveText(/^[1-9]\d* UMKM ditemukan$/);
  assertBrowserEvents(events);
  events.dispose();
});

test('related product navigation is canonical and back restores discovery', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeImages(page);
  await page.goto('/?q=nasi&category=Kuliner');
  await page.waitForLoadState('networkidle');

  const productLink = page.locator('#featured-products').getByRole('link', { name: /Buka halaman/ }).first();
  const productHref = await productLink.getAttribute('href');
  expect(productHref).toMatch(/^\/produk\/[a-z0-9-]+$/);
  await productLink.click();
  await expect(page).toHaveURL(new RegExp(`${productHref!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const related = page.getByRole('region', { name: 'Produk terkait' });
  await expect(related.getByRole('heading', { level: 2, name: 'Produk terkait' })).toBeVisible();
  const relatedLink = related.getByRole('link', { name: /Buka produk terkait/ }).first();
  const relatedHref = await relatedLink.getAttribute('href');
  expect(relatedHref).toMatch(/^\/produk\/[a-z0-9-]+$/);
  expect(relatedHref).not.toBe(productHref);
  await relatedLink.click();
  await expect(page).toHaveURL(new RegExp(`${relatedHref!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goBack({ waitUntil: 'networkidle' });
  await expect(page).toHaveURL(new RegExp(`${productHref!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await page.goBack({ waitUntil: 'networkidle' });
  await expectCatalogLocation(page, { q: 'nasi', category: 'Kuliner' });
  await expect(page.locator('#featured-products').getByRole('searchbox', { name: 'Cari produk lokal' })).toHaveValue('nasi');
  await expect(page.getByRole('button', { name: 'Kuliner', exact: true })).toHaveAttribute('aria-pressed', 'true');
  assertBrowserEvents(events);
  events.dispose();
});

test('discovery controls remain usable without document overflow at the supported 200% emulation', async ({ page, context }, testInfo) => {
  const events = observeBrowserEvents(page);
  await stabilizeImages(page);
  const longQuery = 'a'.repeat(80);
  await mockEmptySearch(page, longQuery);
  const cdp = await context.newCDPSession(page);
  try {
    if (testInfo.project.name === 'desktop') {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 720, height: 450, deviceScaleFactor: 2, mobile: false, screenWidth: 1440, screenHeight: 900 });
    }
    await page.goto(`/?q=${longQuery}&category=Pertanian#featured-products`);
    await page.waitForLoadState('networkidle');
    if (testInfo.project.name === 'mobile') await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });

    const runtime = await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio, visualScale: visualViewport?.scale ?? 1 }));
    if (testInfo.project.name === 'desktop') expect(runtime).toMatchObject({ width: 720, ratio: 2 });
    else expect(runtime.visualScale).toBeCloseTo(2, 2);

    const products = page.locator('#featured-products');
    const search = products.getByRole('searchbox', { name: 'Cari produk lokal' });
    const filters = page.getByRole('group', { name: 'Filter kategori produk' });
    await expect(search).toHaveValue(longQuery);
    await expect(filters.getByRole('button', { name: 'Pertanian', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(products.getByRole('status')).toHaveText('0 produk tersedia');
    await expectInsideLayoutViewport(page, search);
    await expectInsideLayoutViewport(page, filters);
    await expectInsideLayoutViewport(page, products.getByRole('status'));
    await expectNoDocumentOverflow(page);
    assertBrowserEvents(events);
  } finally {
    events.dispose();
    if (testInfo.project.name === 'mobile') await cdp.send('Emulation.resetPageScaleFactor');
    await cdp.detach();
  }
});
