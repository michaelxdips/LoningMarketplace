import { test, expect, type Page } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents, type ExpectedBrowserDiagnostic, type ExpectedHttpError } from './support/browser-events';
import { E2E_FIXTURES } from './support/fixtures';

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://localhost:3001/api';
const AUTH_SESSION_URL = `${API_BASE}/auth/session`;
const BRAND_NAME = 'Loning Maju';
const LEGACY_BRAND_NAME = 'Loning Digital';
const BRAND_TITLE = 'Loning Maju — Direktori UMKM Desa Loning';
const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const expectedUnauthenticatedHttpError: ExpectedHttpError = {
  method: 'GET',
  url: AUTH_SESSION_URL,
  status: 401,
  statusText: 'Unauthorized',
  resourceType: 'fetch',
};
const expectedUnauthenticatedDiagnostic: ExpectedBrowserDiagnostic = {
  text: 'Failed to load resource: the server responded with a status of 401 (Unauthorized)',
  locationUrl: AUTH_SESSION_URL,
  consoleType: 'error',
  method: 'GET',
  url: AUTH_SESSION_URL,
  status: 401,
  statusText: 'Unauthorized',
  resourceType: 'fetch',
};


function assertUnauthenticatedEvents(
  events: ReturnType<typeof observeBrowserEvents>,
  requestFailures: Parameters<typeof assertBrowserEvents>[1]['requestFailures'] = [],
) {
  assertBrowserEvents(events, {
    httpErrors: [expectedUnauthenticatedHttpError],
    requestFailures,
    browserDiagnostics: [expectedUnauthenticatedDiagnostic],
  });
}

async function stabilizeLegacyImages(page: Page) {
  await page.route('https://images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: validPng }));
}

async function gotoWithExpectedTransition(events: ReturnType<typeof observeBrowserEvents>, page: Page, path: string, apiPattern: RegExp = /http:\/\/localhost:3(?:001|101)\/api\/(?:products|umkms|auth\/session)/) {
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const transition = events.beginExpectedTransition({ reason: `navigate:${path}`, expectedRequests: [{ method: 'GET', url: new RegExp(`${escapedPath}(?:\\?.*)?$`) }, { method: 'GET', url: apiPattern }] });
  try { await page.goto(path); await page.waitForLoadState('networkidle'); } finally { transition.complete(); }
}

async function runExpectedAction(events: ReturnType<typeof observeBrowserEvents>, page: Page, reason: string, action: () => Promise<void>, apiPattern: RegExp) {
  const transition = events.beginExpectedTransition({ reason, expectedRequests: [{ method: 'GET', url: apiPattern }] });
  try { await action(); await page.waitForLoadState('networkidle'); } finally { transition.complete(); }
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test('public homepage loads the directory shell and core interactions', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeLegacyImages(page);
  await gotoWithExpectedTransition(events, page, '/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByText('Katalog Produk Warga')).toBeVisible();
  await expect(page.getByRole('link', { name: `${BRAND_NAME} — kembali ke beranda` })).toBeVisible();
  await expect(page.getByText(LEGACY_BRAND_NAME, { exact: true })).toHaveCount(0);
  await expect(page).toHaveTitle(BRAND_TITLE);
  expect(await page.locator('html').getAttribute('lang')).toBe('id');

  const featuredSection = page.locator('#featured-products');
  await expect(featuredSection).toBeAttached();

  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const navigation = page.getByRole('navigation', { name: 'Navigasi utama' });
    const desktopMenuLabels = ['Produk', 'Profil UMKM', 'Tentang Desa', 'FAQ'];
    const desktopMenuItems = desktopMenuLabels.map((name) => navigation.getByRole('link', { name, exact: true }));
    for (const item of desktopMenuItems) await expect(item).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Masuk Pengelola' })).toHaveAttribute('href', '/login');

    const menuBoxes = await Promise.all(desktopMenuItems.map((item) => item.boundingBox()));
    expect(menuBoxes.every((box) => box !== null)).toBe(true);
    expect(menuBoxes.slice(1).every((box, index) => box!.x > menuBoxes[index]!.x)).toBe(true);

    const desktopCta = navigation.getByRole('link', { name: 'Jelajahi Produk', exact: true });
    await expect(desktopCta).toBeVisible();
    await expect(desktopCta).toBeEnabled();
    await desktopCta.focus();
    await expect(desktopCta).toBeFocused();
    await desktopCta.press('Enter');
    await expect(featuredSection).toBeInViewport();

    await desktopCta.click();
    await expect(featuredSection).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  } else {
    const toggle = page.getByRole('button', { name: 'Buka atau tutup navigasi' });
    await toggle.click();
    const mobileMenu = page.locator('#mobile-nav-menu');
    await expect(mobileMenu).toBeVisible();

    const mobileMenuLabels = ['Produk', 'Profil UMKM', 'Tentang Desa', 'FAQ'];
    const mobileMenuItems = mobileMenuLabels.map((name) => mobileMenu.getByRole('link', { name, exact: true }));
    for (const item of mobileMenuItems) await expect(item).toBeVisible();

    const mobileCta = mobileMenu.getByRole('link', { name: 'Jelajahi Produk', exact: true });
    await expect(mobileCta).toBeVisible();
    await expect(mobileCta).toBeEnabled();
    await mobileCta.click();
    await expect(mobileMenu).toBeHidden();
    await expect(featuredSection).toBeInViewport();

    await toggle.click();
    await expect(mobileMenu).toBeVisible();
    const reopenedMobileCta = mobileMenu.getByRole('link', { name: 'Jelajahi Produk', exact: true });
    await reopenedMobileCta.focus();
    await expect(reopenedMobileCta).toBeFocused();
    await reopenedMobileCta.press('Enter');
    await expect(mobileMenu).toBeHidden();
    await expect(featuredSection).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  }

  const footer = page.locator('footer');
  await expect(footer.getByRole('heading', { name: 'Peta Situs' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Pengelola' })).toHaveAttribute('href', '/login');
  const profileTrigger = page.locator('[id^="business-card-"]').first().getByRole('button', { name: /Lihat ringkasan/ });
  await profileTrigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  const inquiryTrigger = page.locator('[id^="product-card-"]').first().getByRole('button', { name: /Tanya Produk/ });
  await inquiryTrigger.click();
  const inquiryDialog = page.getByRole('dialog', { name: 'Kirim Pertanyaan' });
  await expect(inquiryDialog).toBeVisible();
  await inquiryDialog.getByLabel('Nama Anda (Opsional)').fill('Pengunjung E2E');
  await expect(inquiryDialog).toContainText('Pengunjung E2E');
  await inquiryDialog.getByRole('button', { name: 'Batal' }).click();
  await expect(inquiryDialog).toBeHidden();
  await expectNoHorizontalOverflow(page);
  assertBrowserEvents(events);
  events.dispose();
});

test('public detail URLs replace legacy UUIDs with canonical slugs', async ({ page }) => {
  await stabilizeLegacyImages(page);
  const product = E2E_FIXTURES.products.desktop;
  const productSlug = 'e2e-produk-stabilization-desktop';
  await page.goto('/');
  await expect(page.locator(`#product-card-${product.id}`).getByRole('link', { name: `Buka halaman ${product.name}` })).toHaveAttribute('href', `/produk/${productSlug}`);

  await page.goto(`/produk/${product.id}`);
  await expect(page).toHaveURL(new RegExp(`/produk/${productSlug}$`));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/produk/${productSlug}$`));

  const umkmResponse = await page.request.get(`${API_BASE}/umkms/${E2E_FIXTURES.umkm.primaryId}`);
  expect(umkmResponse.ok()).toBe(true);
  const umkmSlug = (await umkmResponse.json()).data.slug as string;
  await page.goto(`/umkm/${E2E_FIXTURES.umkm.primaryId}`);
  await expect(page).toHaveURL(new RegExp(`/umkm/${umkmSlug}$`));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/umkm/${umkmSlug}$`));
});

test('login route is reachable and keyboard accessible', async ({ page }) => {
  const events = observeBrowserEvents(page);
  const sessionResponse = page.waitForResponse(response => response.url() === AUTH_SESSION_URL);
  await gotoWithExpectedTransition(events, page, '/login');
  const response = await sessionResponse;
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: { message: 'Authentication required', code: 'UNAUTHENTICATED' } });
  await expect(page.getByRole('heading', { name: 'Masuk ke dashboard' })).toBeVisible();
  if (page.viewportSize()?.width !== 390) await expect(page.getByRole('link', { name: `${BRAND_NAME} — beranda` })).toBeVisible();
  await page.getByLabel('Email atau username').focus();
  await expect(page.getByLabel('Email atau username')).toBeFocused();
  assertUnauthenticatedEvents(events);
  events.dispose();
});

test('admin login settles and enforces password change', async ({ page, context }) => {
  const events = observeBrowserEvents(page);
  await gotoWithExpectedTransition(events, page, '/login');
  await page.getByLabel('Email atau username').fill(E2E_FIXTURES.credentials.adminMustChangePassword.identifier);
  await page.getByLabel('Kata sandi', { exact: true }).fill(E2E_FIXTURES.credentials.adminMustChangePassword.password);
  await runExpectedAction(events, page, 'admin-login-redirect', async () => { await page.getByRole('button', { name: 'Masuk' }).click(); await expect(page).toHaveURL(/\/change-password$/); }, /http:\/\/localhost:3(?:001|101)\/api\/(?:auth\/session|auth\/me)/);
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === 'loning_session')?.httpOnly).toBe(true);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  assertUnauthenticatedEvents(events);
  events.dispose();
});

test('owner is blocked from admin routes and can logout', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await gotoWithExpectedTransition(events, page, '/login');
  await page.getByLabel('Email atau username').fill(E2E_FIXTURES.credentials.owner.identifier);
  await page.getByLabel('Kata sandi', { exact: true }).fill(E2E_FIXTURES.credentials.owner.password);
  await runExpectedAction(events, page, 'owner-login-redirect', async () => { await page.getByRole('button', { name: 'Masuk' }).click(); await expect(page).toHaveURL(/\/dashboard$/); }, /http:\/\/localhost:3(?:001|101)\/api\/(?:auth\/session|auth\/me|manage\/(?:products|umkms))/);
  if (page.viewportSize()?.width === 390) await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await expect(page.getByRole('link', { name: `${BRAND_NAME} — beranda` })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await gotoWithExpectedTransition(events, page, '/dashboard/users', /http:\/\/localhost:3(?:001|101)\/api\/manage\/(?:products|umkms)/);
  await expect(page).toHaveURL(/\/dashboard$/);
  if (page.viewportSize()?.width === 390) await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await runExpectedAction(events, page, 'owner-logout-redirect', async () => { await page.getByRole('button', { name: 'Keluar' }).click(); await expect(page).toHaveURL(/\/login$/); }, /http:\/\/localhost:3(?:001|101)\/api\/(?:auth\/session|auth\/me|manage\/(?:products|umkms))/);
  assertUnauthenticatedEvents(events);
  events.dispose();
});
