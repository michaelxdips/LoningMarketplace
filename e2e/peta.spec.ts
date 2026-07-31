import { expect, test } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents } from './support/browser-events';

test('public interactive map route loads directory map, selector, and detail navigation', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await page.route('https://www.openstreetmap.org/export/embed.html?*', route => route.abort());

  await page.goto('/peta-umkm');
  await expect(page.getByRole('heading', { name: 'Peta Lokasi UMKM Desa Loning' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pilih Lokasi Usaha' })).toBeVisible();

  // Navigation check
  await page.getByRole('link', { name: 'Kembali ke Beranda', exact: true }).click();
  await expect(page).toHaveURL(/\/#umkm/);

  // Re-navigate to peta
  await page.goto('/peta-umkm');
  await expect(page.getByRole('heading', { name: 'Peta Lokasi UMKM Desa Loning' })).toBeVisible();

  assertBrowserEvents(events);
  events.dispose();
});
