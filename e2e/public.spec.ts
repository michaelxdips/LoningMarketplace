import { test, expect, type Page } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents, type ExpectedBrowserDiagnostic, type ExpectedHttpError } from './support/browser-events';

const API_BASE = 'http://localhost:3001/api';
const AUTH_SESSION_URL = 'http://localhost:3001/api/auth/session';
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

test('public homepage loads the directory shell', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await stabilizeLegacyImages(page);
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByText('Katalog Produk Warga')).toBeVisible();
  assertBrowserEvents(events);
  events.dispose();
});

test('login route is reachable and keyboard accessible', async ({ page }) => {
  const events = observeBrowserEvents(page);
  const sessionResponse = page.waitForResponse(response => response.url() === AUTH_SESSION_URL);
  await page.goto('/login');
  const response = await sessionResponse;
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: { message: 'Authentication required', code: 'UNAUTHENTICATED' } });
  await expect(page.getByRole('heading', { name: 'Masuk ke dashboard' })).toBeVisible();
  await page.getByLabel('Alamat email').focus();
  await expect(page.getByLabel('Alamat email')).toBeFocused();
  assertUnauthenticatedEvents(events);
  events.dispose();
});

test('admin login settles and enforces password change', async ({ page, context }) => {
  const events = observeBrowserEvents(page);
  await page.goto('/login');
  await page.getByLabel('Alamat email').fill('admin.e2e@local.test');
  await page.getByLabel('Kata sandi', { exact: true }).fill('local-e2e-passphrase-123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/change-password$/);
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === 'loning_session')?.httpOnly).toBe(true);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  assertUnauthenticatedEvents(events);
  events.dispose();
});

test('owner is blocked from admin routes and can logout', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await page.goto('/login');
  await page.getByLabel('Alamat email').fill('owner.e2e@local.test');
  await page.getByLabel('Kata sandi', { exact: true }).fill('local-e2e-passphrase-123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/dashboard/users');
  await expect(page).toHaveURL(/\/dashboard$/);
  if (page.viewportSize()?.width === 390) await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL(/\/login$/);
  assertUnauthenticatedEvents(events);
  events.dispose();
});
