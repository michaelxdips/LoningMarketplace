import { chromium, expect, test } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { applyNativeZoom, expectZoom, getApplicationTabForPage, readNativeZoom } from './helpers/native-tab-zoom';
import { createStrictRequestWindow } from './helpers/strict-request-window';

const extensionPath = path.resolve('e2e/fixtures/browser-zoom-extension');
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const apiOrigin = new URL(process.env.E2E_API_BASE_URL ?? 'http://localhost:3001/api').origin;
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const appOrigins = [new URL(baseURL).origin, apiOrigin];

type Ctx = Awaited<ReturnType<typeof chromium.launchPersistentContext>>;
type Worker = Ctx['serviceWorkers'][number];

async function basePage(context: Ctx) {
  const page = await context.newPage();
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: image }));
  return page;
}

// Native Chromium tab zoom IS operable (setZoom/getZoom). Headless Chromium, however, does NOT
// resize the emulated layout viewport for tab zoom (verified: innerWidth/innerHeight stay 390x844,
// visualViewport.scale=1, DPR=1, media queries unchanged). We therefore verify native zoom
// operability (setZoom=2/getZoom≈2) here, and separately test the effective 195x422 CSS layout that
// 200% zoom of 390x844 mathematically produces via setViewportSize.
async function openZoomedPage(context: Ctx, worker: Worker) {
  const page = await basePage(context);
  const tab = await getApplicationTabForPage(worker, 'about:blank', 'about:');
  expectZoom(await applyNativeZoom(worker, tab.id, 2), 2);
  expectZoom(await readNativeZoom(worker, tab.id), 2);
  return { page, tabId: tab.id };
}

// Assert native zoom is still 2 for this tab. In headless Chromium, tab zoom is not applied to the
// emulated layout viewport, so this is the strongest verifiable native-zoom signal.
async function assertZoomNative(worker: Worker, tabId: number) {
  expectZoom(await readNativeZoom(worker, tabId), 2);
}

// 200% zoom of a 390x844 device is an effective CSS viewport of 195x422. Emulate that exact layout
// so overflow and request assertions test what a user at 200% zoom actually sees.
// CDP override is used because setViewportSize does not persist across navigation when the
// persistent context has a fixed viewport option.
async function openEmulatedPage(context: Ctx) {
  const page = await basePage(context);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 195, height: 422, deviceScaleFactor: 1, mobile: false });
  return { page, cdp };
}

async function assertNoOverflow(page: import('@playwright/test').Page) {
  const value = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return {
      document: document.documentElement.scrollWidth <= viewportWidth,
      body: document.body.scrollWidth <= document.body.clientWidth,
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .map(element => ({ element: element.tagName.toLowerCase(), id: element.id, className: element.className, ...element.getBoundingClientRect().toJSON() }))
        .filter(rect => rect.right > viewportWidth + 0.5 || rect.left < -0.5)
        .slice(0, 10),
    };
  });
  expect(value, JSON.stringify(value, null, 2)).toMatchObject({ document: true, body: true });
}

// Direct deep-link routes must use canonical slugs that exist in the ACTIVE database state.
// Hardcoding seeded names (e.g. 'nasi-megono-komplit') is unsafe: the development seed's first
// product shares id e3000000-...0001 with the E2E fixture that e2e:setup upserts in the full e2e
// run, renaming it and 404ing the seeded slug. Resolve the first published product/UMKM slug from
// the same public list endpoints the homepage renders, which always reflect the live state.
async function resolvePublicSlugs(request: import('@playwright/test').APIRequestContext) {
  const productsResponse = await request.get(`${apiOrigin}/api/products?limit=1`);
  const umkmsResponse = await request.get(`${apiOrigin}/api/umkms?limit=1`);
  expect(productsResponse.ok(), 'public products list must be available to resolve a live slug').toBe(true);
  expect(umkmsResponse.ok(), 'public UMKM list must be available to resolve a live slug').toBe(true);
  const products = (await productsResponse.json()).data as Array<{ slug: string }>;
  const umkms = (await umkmsResponse.json()).data as Array<{ slug: string }>;
  expect(products.length, 'at least one published product is required for the direct-product route').toBeGreaterThan(0);
  expect(umkms.length, 'at least one published UMKM is required for the direct-umkm route').toBeGreaterThan(0);
  return { productSlug: products[0].slug, umkmSlug: umkms[0].slug };
}

async function assertPageClean(page: import('@playwright/test').Page, phase: string, action: () => Promise<void>, settle: () => Promise<void>) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const onPageError = (error: Error) => pageErrors.push(error.message);
  const onConsole = (message: import('@playwright/test').ConsoleMessage) => { if (message.type() === 'error') consoleErrors.push(message.text()); };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  const collector = createStrictRequestWindow(page, appOrigins, () => 2);
  collector.begin(phase);
  try {
    await action();
    await settle();
    await collector.waitForIdle();
    collector.assertClean();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } finally {
    collector.dispose();
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }
}

test('native zoom 200% isolated strict acceptance windows', async ({ request }) => {
  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'loning-native-zoom-'));
  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
  let worker: Awaited<ReturnType<typeof chromium.launchPersistentContext>>['serviceWorkers'][number] | undefined;
  const zoomedTabs: Array<{ id: number; page: import('@playwright/test').Page }> = [];
  try {
    context = await chromium.launchPersistentContext(profileDir, { channel: 'chromium', headless: true, viewport: { width: 390, height: 844 }, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
    worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');

    // Part 1 — Native Chromium tab zoom is operable and set to 200% on a real 390x844 tab.
    // Headless Chromium does not resize the emulated layout viewport for tab zoom, so native
    // setZoom/getZoom is the strongest verifiable native-zoom signal here.
    const native = await openZoomedPage(context, worker); zoomedTabs.push({ id: native.tabId, page: native.page });
    await assertPageClean(native.page, 'native-zoom-fresh-homepage', async () => { await native.page.goto('/'); }, async () => {
      await expect(native.page.getByRole('heading', { name: 'Katalog Produk Warga' })).toBeVisible();
      await expect(native.page).toHaveURL(/\/$/); await assertNoOverflow(native.page);
    });
    await assertZoomNative(worker, native.tabId);
    await native.page.close();

    // Part 2 — 200% zoom of a 390x844 device yields an effective CSS viewport of 195x422.
    // Emulate that exact layout so overflow and strict-request assertions test what a user at
    // 200% zoom actually sees. Full route coverage runs at 195x422.
    const homepage = await openEmulatedPage(context);
    await assertPageClean(homepage.page, 'fresh-homepage', async () => { await homepage.page.goto('/'); }, async () => {
      await expect(homepage.page.getByRole('heading', { name: 'Katalog Produk Warga' })).toBeVisible();
      await expect(homepage.page).toHaveURL(/\/$/); await assertNoOverflow(homepage.page);
    });
    await homepage.page.close();

    const spa = await openEmulatedPage(context);
    await assertPageClean(spa.page, 'spa-homepage', async () => { await spa.page.goto('/'); }, async () => { await expect(spa.page.getByRole('heading', { name: 'Katalog Produk Warga' })).toBeVisible(); await assertNoOverflow(spa.page); });
    const productLink = spa.page.locator('[id^="product-card-"]').first().getByRole('link', { name: /Buka halaman/ });
    await assertPageClean(spa.page, 'spa-homepage-to-product', async () => { await productLink.press('Enter'); }, async () => { await expect(spa.page).toHaveURL(/\/produk\/[a-z0-9-]+$/); await expect(spa.page.locator('main')).toBeFocused(); await expect(spa.page.getByRole('heading', { level: 1 })).toBeVisible(); await assertNoOverflow(spa.page); });
    await assertPageClean(spa.page, 'spa-product-to-umkm', async () => { await spa.page.getByRole('link', { name: /^Oleh / }).press('Enter'); }, async () => { await expect(spa.page).toHaveURL(/\/umkm\/[a-z0-9-]+$/); await expect(spa.page.locator('main')).toBeFocused(); await expect(spa.page.getByRole('button', { name: 'Hubungi via WhatsApp' })).toBeVisible(); await assertNoOverflow(spa.page); });
    await spa.page.close();

    const { productSlug, umkmSlug } = await resolvePublicSlugs(request);
    for (const [route, phase, settle] of [
      [`/produk/${productSlug}`, 'direct-product', async (page: import('@playwright/test').Page) => { await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); await expect(page.locator('main')).toBeFocused(); await assertNoOverflow(page); }],
      [`/umkm/${umkmSlug}`, 'direct-umkm', async (page: import('@playwright/test').Page) => { await expect(page.getByRole('button', { name: 'Hubungi via WhatsApp' })).toBeVisible(); await expect(page.locator('main')).toBeFocused(); await assertNoOverflow(page); }],
      ['/faq', 'direct-faq', async (page: import('@playwright/test').Page) => { await expect(page.getByRole('heading', { name: /Pertanyaan Umum & Cara Penggunaan/ })).toBeVisible(); await expect(page.locator('main')).toBeFocused(); await assertNoOverflow(page); }],
      ['/tentang-desa', 'direct-about', async (page: import('@playwright/test').Page) => { await expect(page.getByRole('heading', { name: /Karya & Potensi Lokal/ })).toBeVisible(); await expect(page.locator('main')).toBeFocused(); await assertNoOverflow(page); }],
    ] as const) {
      const target = await openEmulatedPage(context);
      await assertPageClean(target.page, phase, async () => { await target.page.goto(route); }, async () => { await expect(target.page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}$`)); await settle(target.page); });
      await target.page.close();
    }
  } finally {
    if (worker) for (const tab of zoomedTabs) { try { expectZoom(await applyNativeZoom(worker, tab.id, 1), 1); } catch {} }
    await context?.close();
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
