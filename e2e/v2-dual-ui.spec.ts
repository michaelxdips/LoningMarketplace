import { expect, test } from '@playwright/test';

test.describe('V2 Dual-UI Suite', () => {
  test('desktop v2 public routes load cleanly without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/v2/');
    await expect(page.locator('h1')).toBeVisible();

    // Pastikan link footer menuju rute V2 tersedia
    await expect(page.locator('footer a[href*="/v2/produk"]')).toBeVisible();
    await expect(page.locator('footer a[href*="/v2/umkm"]')).toBeVisible();

    // Navigasi ke katalog produk
    await page.goto('/v2/produk');
    await expect(page.locator('input#v2-catalog-search')).toBeVisible();

    // Navigasi ke direktori UMKM
    await page.goto('/v2/umkm');
    await expect(page.locator('input#v2-catalog-search')).toBeVisible();

    // Halaman tersimpan
    await page.goto('/v2/tersimpan');
    await expect(page.locator('h1')).toContainText('Tersimpan');

    // Halaman riwayat versi
    await page.goto('/v2/version-history');
    await expect(page.locator('h1')).toContainText('Riwayat');

    expect(errors).toHaveLength(0);
  });

  test('mobile v2 routes load with header and bottom nav', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/m/');
    await expect(page.locator('#m-header')).toBeVisible();
    await expect(page.locator('#m-bottom-nav')).toBeVisible();

    // Cek tab bar
    await expect(page.locator('#m-bottom-nav a[href="/m/produk"]')).toBeVisible();
    await expect(page.locator('#m-bottom-nav a[href="/m/umkm"]')).toBeVisible();
    await expect(page.locator('#m-bottom-nav a[href="/m/tersimpan"]')).toBeVisible();

    // Halaman tersimpan mobile
    await page.goto('/m/tersimpan');
    await expect(page.locator('h1')).toContainText('Tersimpan');

    expect(errors).toHaveLength(0);
  });

  test('dual-ui switcher links correctly between v1 and v2', async ({ page }) => {
    // Di V1 footer, terdapat link ke /v2
    await page.goto('/');
    const toV2Link = page.locator('footer a[href="/v2"]');
    await expect(toV2Link).toBeVisible();

    // Di V2 desktop footer, terdapat link kembali ke /
    await page.goto('/v2/');
    const toV1Link = page.locator('footer a[href="/"]');
    await expect(toV1Link).toBeVisible();
  });
});
