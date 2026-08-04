import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

function getProductionSiteUrl(envValue: string | undefined): string {
  if (envValue) return envValue;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://loningmarketplace.vercel.app';
}

function validateProductionSiteUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_PUBLIC_SITE_URL must be a valid absolute URL, received "${value}"`);
  }
  if (url.protocol !== 'https:') throw new Error('VITE_PUBLIC_SITE_URL must use HTTPS for production builds');
  if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error('VITE_PUBLIC_SITE_URL cannot use localhost for production builds');
  if (url.username || url.password) throw new Error('VITE_PUBLIC_SITE_URL cannot contain credentials');
  if (url.search || url.hash) throw new Error('VITE_PUBLIC_SITE_URL cannot contain query parameters or a hash');
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = getProductionSiteUrl(env.VITE_PUBLIC_SITE_URL);

  if (command === 'build') {
    validateProductionSiteUrl(siteUrl);
    process.env.VITE_PUBLIC_SITE_URL = siteUrl;
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    test: {
      environment: 'jsdom',
      env: {
        VITE_API_URL: 'https://api.example.invalid/api',
        VITE_PUBLIC_SITE_URL: 'https://site.example.invalid',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
