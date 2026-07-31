import { expect, test } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents } from './support/browser-events';
import { E2E_FIXTURES } from './support/fixtures';

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://localhost:3001/api';
const FRONTEND_ORIGIN = process.env.E2E_FRONTEND_ORIGIN ?? 'http://localhost:3000';
const coordinates = { latitude: -6.891235, longitude: 109.382145 };

async function login(page: Parameters<typeof observeBrowserEvents>[0]) {
  const response = await page.request.post(`${API_BASE}/auth/login`, { headers: { Origin: FRONTEND_ORIGIN }, data: { identifier: E2E_FIXTURES.credentials.owner.identifier, password: E2E_FIXTURES.credentials.owner.password } });
  expect(response.status()).toBe(200);
}

test('owner parses, saves, publishes, and clears business location', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await page.route('https://www.openstreetmap.org/export/embed.html?*', route => route.abort());
  await login(page);
  await page.goto(`/dashboard/umkms/${E2E_FIXTURES.umkm.primaryId}/location`);
  await expect(page.locator('h1').filter({ hasText: 'Lokasi Usaha' })).toBeVisible();
  await page.getByLabel('URL Maps').fill('https://www.google.com/maps/place/Loning/@-6.8912356,109.3821464,17z');
  await page.getByRole('button', { name: 'Baca URL' }).click();
  await expect(page.getByLabel('Latitude')).toHaveValue('-6.891236');
  await expect(page.getByLabel('Longitude')).toHaveValue('109.382146');
  await expect(page.getByTitle(/Peta lokasi/)).toHaveAttribute('src', /marker=-6\.891236,109\.382146/);
  await page.getByRole('button', { name: 'Simpan Lokasi' }).click();
  await expect(page.getByRole('status')).toContainText('berhasil disimpan');

  const publicResponse = await page.request.get(`${API_BASE}/umkms/${E2E_FIXTURES.umkm.primaryId}`);
  const slug = (await publicResponse.json()).data.slug as string;
  await page.goto(`/umkm/${slug}`);
  await expect(page.getByRole('heading', { name: 'Lokasi Usaha' })).toHaveCount(1);
  await expect(page.getByTitle(`Peta lokasi ${E2E_FIXTURES.umkm.primaryName}`)).toHaveAttribute('src', /openstreetmap\.org\/export\/embed\.html/);
  await expect(page.getByRole('link', { name: 'Buka di Google Maps' })).toHaveAttribute('href', /google\.com\/maps\/search/);
  await expect(page.getByRole('link', { name: 'Petunjuk Arah' })).toHaveAttribute('href', /google\.com\/maps\/dir/);

  await page.goto(`/dashboard/umkms/${E2E_FIXTURES.umkm.primaryId}/location`);
  await page.getByRole('button', { name: 'Hapus Lokasi' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus Lokasi' }).click();
  await expect(page.getByRole('status')).toContainText('berhasil dihapus');
  await page.goto(`/umkm/${slug}`);
  await expect(page.getByRole('heading', { name: 'Lokasi Usaha' })).toHaveCount(0);
  assertBrowserEvents(events);
  events.dispose();
});

test('validation rejects short, partial, and out-of-range inputs without saving', async ({ page }) => {
  await login(page);
  await page.goto(`/dashboard/umkms/${E2E_FIXTURES.umkm.primaryId}/location`);
  await page.getByLabel('URL Maps').fill('https://maps.app.goo.gl/abc');
  await page.getByRole('button', { name: 'Baca URL' }).click();
  await expect(page.getByRole('alert')).toContainText('Link pendek belum dapat dibaca otomatis');
  await page.getByLabel('Latitude').fill('-6.8');
  await page.getByLabel('Longitude').fill('');
  await expect(page.getByRole('button', { name: 'Simpan Lokasi' })).toBeDisabled();
  await page.getByLabel('Longitude').fill('181');
  await expect(page.getByRole('button', { name: 'Simpan Lokasi' })).toBeDisabled();
  await page.getByLabel('Latitude').fill(String(coordinates.latitude));
  await page.getByLabel('Longitude').fill(String(coordinates.longitude));
  await expect(page.getByRole('button', { name: 'Simpan Lokasi' })).toBeEnabled();
});

test('anonymous and wrong owner cannot update location', async ({ request }) => {
  const anonymous = await request.patch(`${API_BASE}/manage/umkms/${E2E_FIXTURES.umkm.primaryId}/location`, { data: coordinates, headers: { Origin: FRONTEND_ORIGIN } });
  expect(anonymous.status()).toBe(401);
});

test.afterEach(async ({ request }) => {
  const login = await request.post(`${API_BASE}/auth/login`, { headers: { Origin: FRONTEND_ORIGIN }, data: { identifier: E2E_FIXTURES.credentials.admin.identifier, password: E2E_FIXTURES.credentials.admin.password } });
  if (login.ok()) {
    const csrf = (await login.json()).data.csrfToken as string;
    await request.delete(`${API_BASE}/manage/umkms/${E2E_FIXTURES.umkm.primaryId}/location`, { headers: { Origin: FRONTEND_ORIGIN, 'X-CSRF-Token': csrf } });
  }
});
