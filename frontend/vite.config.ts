import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function validateProductionSiteUrl(value: string | undefined) {
  if (!value) throw new Error('VITE_PUBLIC_SITE_URL is required for production builds');
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('VITE_PUBLIC_SITE_URL must be a valid absolute URL'); }
  if (url.protocol !== 'https:') throw new Error('VITE_PUBLIC_SITE_URL must use HTTPS for production builds');
  if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error('VITE_PUBLIC_SITE_URL cannot use localhost for production builds');
  if (url.username || url.password) throw new Error('VITE_PUBLIC_SITE_URL cannot contain credentials');
  if (url.search || url.hash) throw new Error('VITE_PUBLIC_SITE_URL cannot contain query parameters or a hash');
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (command === 'build') validateProductionSiteUrl(env.VITE_PUBLIC_SITE_URL);
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      env: {
        VITE_API_URL: 'https://api.example.invalid/api',
        VITE_PUBLIC_SITE_URL: 'https://site.example.invalid',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
