import { expect, test } from '@playwright/test';
import { assertBrowserEvents, observeBrowserEvents } from './support/browser-events';

test('public interactive map route loads directory map, selector, and detail navigation', async ({ page }) => {
  const events = observeBrowserEvents(page);
  await page.route('https://www.openstreetmap.org/export/embed.html?*', route => route.abort());

  await page.goto('/peta-umkm');
  await expect(page.getByRole('heading', { name: 'Peta Lokasi UMKM Desa Loning' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pilih Lokasi Usaha' })).toBeVisible();
  await expect(page.getByText('Memuat data peta UMKM...')).not.toBeVisible();
  await expect(page.locator('span', { hasText: 'Lokasi Terverifikasi' })).toBeVisible();

  // Navigation check with bounded transition for old-document in-flight aborts
  const transition = events.beginExpectedTransition({
    reason: 'navigate-home-from-peta',
    expectedRequests: [
      { method: 'GET', url: /\/api\/(?:products|umkms)(?:\?.*)?$/ },
      { method: 'GET', url: /https:\/\/images\.unsplash\.com\/.*/ }
    ]
  });
  try {
    await page.getByRole('link', { name: 'Kembali ke Beranda', exact: true }).click();
    await expect(page).toHaveURL(/\/#umkm/);
  } finally {
    transition.complete();
  }

  // Re-navigate to peta with a bounded transition
  const backTransition = events.beginExpectedTransition({
    reason: 'reload-peta',
    expectedRequests: [
      { method: 'GET', url: /\/api\/umkms(?:\?.*)?$/ },
      { method: 'GET', url: /\/images\/hero\// },
    ]
  });
  try {
    await page.goto('/peta-umkm');
    await expect(page.getByRole('heading', { name: 'Peta Lokasi UMKM Desa Loning' })).toBeVisible();
  } finally {
    backTransition.complete();
  }

  assertBrowserEvents(events);
  events.dispose();
});
