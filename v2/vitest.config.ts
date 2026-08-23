import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Konfigurasi test untuk workspace V2.
 *
 * Kenapa perlu file sendiri: root repo tidak punya vite.config.ts, jadi
 * `vitest run v2` sebelumnya berjalan TANPA alias. Dua test awal (theme,
 * primitives) kebetulan lolos karena seluruh impornya relatif — begitu sebuah
 * test menyentuh `@loning/shared` atau `@v2-shared`, resolusinya gagal.
 *
 * Alias di bawah HARUS mencerminkan frontend/vite.config.ts. Kalau di sana
 * ditambah alias baru, tambahkan juga di sini.
 */
const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  // WAJIB: tanpa root+include, `vitest run --config v2/vitest.config.ts` yang
  // dijalankan dari root repo akan men-scan SELURUH monorepo dan menjalankan
  // test frontend/backend di bawah config yang salah (terbukti: 65 file / 409
  // test, 11 gagal palsu). Batasi ke folder v2 saja.
  root: here,
  resolve: {
    alias: {
      '@loning/shared': `${here}../shared/src`,
      '@v2-shared': `${here}shared`,
      '@loning/assets': `${here}../frontend/src/assets`,
    },
  },
  test: {
    include: ['**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    // Nilai palsu yang jelas-jelas tidak valid: kalau ada request nyata yang
    // lolos dari mock, ia gagal keras alih-alih diam-diam menembak localhost.
    env: {
      VITE_API_URL: 'https://api.example.invalid/api',
      VITE_PUBLIC_SITE_URL: 'https://site.example.invalid',
    },
  },
});
