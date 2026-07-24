import { expect, test, type Locator, type Page } from '@playwright/test';
import { E2E_FIXTURES, loginFixture } from './support/fixtures';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_ORIGIN = 'http://localhost:3000';
const desktopProduct = E2E_FIXTURES.products.desktop;
const mobileProduct = E2E_FIXTURES.products.mobile;
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

async function noDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function withinViewport(page: Page, selector: Locator) {
  const bounds = await selector.boundingBox();
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + Math.min(bounds!.height, viewport.height)).toBeLessThanOrEqual(viewport.height + 1);
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 320, height: 700 }]) {
  test(`core flow remains interactive at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Explicit viewport acceptance runs once in Chromium');
    await page.setViewportSize(viewport);
    await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: image }));

    await page.goto('/');
    await expect(page.getByText('Katalog Produk Warga')).toBeVisible();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    if (viewport.width < 768) {
      await page.getByRole('button', { name: 'Toggle navigasi' }).click();
      await expect(page.locator('#mobile-nav-menu')).toBeVisible();
      await page.getByRole('link', { name: 'Masuk Pengelola' }).click();
    } else {
      await page.getByRole('navigation').getByRole('link', { name: 'Masuk Pengelola' }).click();
    }
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email atau username').fill(loginFixture.identifier);
    await page.getByLabel('Kata sandi', { exact: true }).fill(loginFixture.password);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    if (viewport.width < 768) await page.getByRole('button', { name: 'Buka navigasi' }).click();
    const productLink = page.getByRole('link', { name: 'Produk', exact: true });
    await productLink.focus();
    await expect(productLink).toBeFocused();
    await productLink.click();
    await expect(page).toHaveURL(/\/dashboard\/products$/);
    await expect(page.getByRole('link', { name: 'Tambah produk' })).toBeVisible();
    await noDocumentOverflow(page);
  });
}

test('required routes remain task-completable at 200% desktop zoom and normal mobile scale', async ({ page, context }, testInfo) => {
  const consoleErrors: Array<{ text: string; url: string }> = [];
  const pageErrors: string[] = [];
  const apiFailures: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => { if (request.url().includes('/api/') && request.failure()?.errorText !== 'net::ERR_ABORTED') apiFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`); });
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: image }));

  if (testInfo.project.name === 'desktop') {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 720, height: 450, deviceScaleFactor: 2, mobile: false, screenWidth: 1440, screenHeight: 900 });
  }

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  if (testInfo.project.name === 'desktop') {
    expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
  } else {
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
    expect(await page.evaluate(() => window.innerWidth)).toBe(390);
  }

  await expect(page.getByText('Katalog Produk Warga')).toBeVisible();
  await expect(page.getByLabel('Cari produk lokal')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Semua Produk', exact: true })).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await noDocumentOverflow(page);

  await page.locator('[id^="business-card-"]').first().getByRole('button', { name: /Kunjungi Profil/ }).click();
  const businessDialog = page.getByRole('dialog');
  await expect(businessDialog).toBeVisible();
  await withinViewport(page, businessDialog);
  await page.keyboard.press('Escape');
  await expect(businessDialog).toBeHidden();

  await page.locator('[id^="product-card-"]').first().getByRole('button', { name: /Tanya Produk/ }).click();
  const inquiryDialog = page.getByRole('dialog');
  await expect(inquiryDialog).toBeVisible();
  await withinViewport(page, inquiryDialog);
  await page.keyboard.press('Escape');
  await expect(inquiryDialog).toBeHidden();

  const sessionResponse = page.waitForResponse(response => response.url() === `${API_BASE}/auth/session`);
  await page.goto('/login');
  expect((await sessionResponse).status()).toBe(401);
  await expect(page.getByLabel('Email atau username')).toBeVisible();
  await expect(page.getByLabel('Kata sandi', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tampilkan kata sandi' })).toBeVisible();
  await page.getByLabel('Email atau username').focus();
  await expect(page.getByLabel('Email atau username')).toBeFocused();
  await noDocumentOverflow(page);

  await page.getByLabel('Email atau username').fill(loginFixture.identifier);
  await page.getByLabel('Kata sandi', { exact: true }).fill(loginFixture.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Selamat datang/ })).toBeVisible();
  await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await expect(page.getByRole('navigation', { name: 'Navigasi dashboard' })).toBeVisible();
  await page.getByRole('link', { name: 'Produk', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/products$/);

  const fixture = testInfo.project.name === 'mobile' ? mobileProduct : desktopProduct;
  const item = page.locator('article:visible').filter({ hasText: fixture.name });
  await expect(page.getByLabel('Cari produk')).toBeVisible();
  await expect(page.getByLabel('Filter kategori')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tambah produk' })).toBeVisible();
  await expect(item).toBeVisible();
  await expect(item.getByRole('link', { name: 'Kelola' })).toBeVisible();
  await noDocumentOverflow(page);

  const archiveButton = item.getByRole('button', { name: 'Arsipkan' });
  await archiveButton.click();
  const archiveDialog = page.getByRole('dialog');
  await expect(archiveDialog).toContainText(fixture.name);
  await withinViewport(page, archiveDialog);
  await page.keyboard.press('Escape');
  await expect(archiveDialog).toBeHidden();
  await expect(archiveButton).toBeFocused();

  await item.getByRole('link', { name: 'Kelola' }).click();
  await expect(page.getByLabel('Nama produk')).toBeVisible();
  await expect(page.getByLabel('Harga (rupiah)')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Pertahankan gambar saat ini' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Pakai unggahan terkelola' })).toBeVisible();
  await expect(page.getByLabel('Pilih gambar')).toBeAttached();
  await expect(page.getByText('Pilih gambar', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Deskripsi')).toBeVisible();
  await page.getByRole('radio', { name: 'Pakai unggahan terkelola' }).check();
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(page.getByRole('alert')).toContainText('Selesaikan unggahan gambar terkelola');
  await page.getByRole('button', { name: 'Simpan perubahan' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Simpan perubahan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Batal' })).toBeVisible();
  await noDocumentOverflow(page);

  expect(apiFailures).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([{ text: 'Failed to load resource: the server responded with a status of 401 (Unauthorized)', url: `${API_BASE}/auth/session` }]);
});
