import { expect, test, type Locator, type Page } from '@playwright/test';
import { E2E_FIXTURES, loginFixture } from './support/fixtures';

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://localhost:3001/api';
const FRONTEND_ORIGIN = process.env.E2E_FRONTEND_ORIGIN ?? 'http://localhost:3000';
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
  test(`core flow remains interactive at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: image }));

    await page.goto('/');
    await expect(page.getByText('Katalog Produk Warga')).toBeVisible();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    if (viewport.width < 768) {
      await page.getByRole('button', { name: 'Buka atau tutup navigasi' }).click();
      const mobileNavigation = page.getByRole('navigation', { name: 'Navigasi seluler' });
      await expect(mobileNavigation).toBeVisible();
      await mobileNavigation.getByRole('link', { name: 'Masuk Pengelola', exact: true }).click();
    } else {
      await page
        .getByRole('navigation', { name: 'Navigasi utama' })
        .getByRole('link', { name: 'Masuk Pengelola', exact: true })
        .click();
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

test('mobile 390x844 remains task-completable at 200% visual page scale', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 });

  const consoleErrors: Array<{ text: string; url: string }> = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  const mainFrameNavigations: string[] = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`));
  page.on('framenavigated', frame => { if (frame === page.mainFrame() && mainFrameNavigations[mainFrameNavigations.length - 1] !== frame.url()) mainFrameNavigations.push(frame.url()); });
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: image }));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { (window as Window & { __sharedUrl?: string }).__sharedUrl = value; } } });
  });

  const cdp = await page.context().newCDPSession(page);
  try {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });

    const metrics = await cdp.send('Page.getLayoutMetrics');
    const runtimeMetrics = await page.evaluate(() => ({
      configuredViewport: { width: 390, height: 844 },
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualViewportWidth: window.visualViewport?.width,
      visualViewportHeight: window.visualViewport?.height,
      visualViewportScale: window.visualViewport?.scale,
    }));
    console.log('390x844@200% visual page scale runtime metrics', { ...runtimeMetrics, cdpCssVisualViewportScale: metrics.cssVisualViewport.scale });
    expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
    expect(runtimeMetrics.innerWidth).toBe(390);
    expect(runtimeMetrics.innerHeight).toBe(844);
    expect(metrics.cssVisualViewport.scale).toBeCloseTo(2, 2);
    expect(runtimeMetrics.visualViewportScale).toBeCloseTo(2, 2);

    const assertNoOverflow = async () => {
      const overflow = await page.evaluate(() => ({
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
      }));
      expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.documentClientWidth);
      expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.bodyClientWidth);
    };
    const expectInsideLayoutViewport = async (locator: Locator) => {
      await locator.scrollIntoViewIfNeeded();
      // Measure in layout-viewport coordinates. Playwright's boundingBox() is relative to the
      // visual viewport, which Emulation.setPageScaleFactor(2) offsets by visualViewport.offsetLeft
      // (195px here), so a correctly-laid-out full-width element reports a negative x. The layout
      // viewport (getBoundingClientRect + innerWidth/innerHeight) is the 390x844 space we assert on.
      const box = await locator.evaluate(element => { const r = element.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
      expect(box).not.toBeNull();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y + box.height).toBeGreaterThan(0);
      expect(box.y).toBeLessThan(844);
    };
    const expectNoCollision = async (first: Locator, second: Locator) => {
      const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()]);
      expect(a).not.toBeNull(); expect(b).not.toBeNull();
      expect(a!.x + a!.width <= b!.x || b!.x + b!.width <= a!.x || a!.y + a!.height <= b!.y || b!.y + b!.height <= a!.y).toBe(true);
    };

    const heading = page.getByRole('heading', { name: 'Katalog Produk Warga' });
    await expect(heading).toBeVisible();
    await expectInsideLayoutViewport(heading);
    await assertNoOverflow();

    const menuToggle = page.getByRole('button', { name: 'Buka atau tutup navigasi' });
    await menuToggle.focus();
    await expect(menuToggle).toBeFocused();
    expect(await menuToggle.evaluate(element => element.matches(':focus-visible'))).toBe(true);
    await menuToggle.press('Enter');
    const mobileMenu = page.locator('#mobile-nav-menu');
    await expect(mobileMenu).toBeVisible();
    await expectInsideLayoutViewport(mobileMenu);
    const faqLink = mobileMenu.getByRole('link', { name: 'FAQ', exact: true });
    await faqLink.focus();
    await expect(faqLink).toBeFocused();
    await faqLink.press('Enter');
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator('main')).toBeFocused();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
    expect((await cdp.send('Page.getLayoutMetrics')).cssVisualViewport.scale).toBeCloseTo(2, 2);
    expect(await page.evaluate(() => window.visualViewport?.scale)).toBeCloseTo(2, 2);
    const productCard = page.locator('[id^="product-card-"]').first();
    await expectInsideLayoutViewport(productCard);
    await assertNoOverflow();
    const productLink = productCard.getByRole('link', { name: /Buka halaman/ });
    await productLink.focus();
    await expect(productLink).toBeFocused();
    await productLink.press('Enter');
    await expect(page).toHaveURL(/\/produk\/[a-z0-9-]+$/);
    await expect(page.locator('main')).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertNoOverflow();

    const merchantLink = page.getByRole('link', { name: /^Oleh / });
    const inquiryButton = page.getByRole('button', { name: 'Tanya Produk' });
    const shareButton = page.getByRole('button', { name: 'Bagikan' });
    await expectInsideLayoutViewport(inquiryButton);
    await expectInsideLayoutViewport(shareButton);
    await expectNoCollision(inquiryButton, shareButton);
    await shareButton.focus();
    await expect(shareButton).toBeFocused();
    await shareButton.press('Enter');
    await expect(page.getByRole('status')).toHaveText('Tautan disalin.');
    expect(await page.evaluate(() => (window as Window & { __sharedUrl?: string }).__sharedUrl)).toBe(page.url());

    await inquiryButton.focus();
    await expect(inquiryButton).toBeFocused();
    await inquiryButton.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Kirim Pertanyaan' });
    await expect(dialog).toBeVisible();
    await expectInsideLayoutViewport(dialog);
    await expect(page.getByRole('button', { name: 'Tutup dialog' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Kirim Pertanyaan' })).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await merchantLink.focus();
    await expect(merchantLink).toBeFocused();
    await merchantLink.press('Enter');
    await expect(page).toHaveURL(/\/umkm\/[a-z0-9-]+$/);
    await expect(page.locator('main')).toBeFocused();
    await expect(page.getByRole('button', { name: 'Hubungi via WhatsApp' })).toBeVisible();
    await assertNoOverflow();

    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expectInsideLayoutViewport(footer);
    expect(mainFrameNavigations.length).toBeLessThanOrEqual(5);
    expect(requestFailures).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  } finally {
    await cdp.send('Emulation.resetPageScaleFactor');
    await cdp.detach();
  }
});

test('required routes remain task-completable at density override and normal mobile scale', async ({ page, context }, testInfo) => {
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

  await page.locator('[id^="business-card-"]').first().getByRole('button', { name: /Lihat ringkasan/ }).click();
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
