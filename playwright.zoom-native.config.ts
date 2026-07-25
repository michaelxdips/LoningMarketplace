import { defineConfig } from '@playwright/test';

const frontendOrigin = process.env.E2E_FRONTEND_ORIGIN ?? 'http://localhost:3000';
const apiBase = process.env.E2E_API_BASE_URL ?? 'http://localhost:3001/api';
const backendOrigin = apiBase.replace(/\/api\/?$/, '');
const frontendPort = new URL(frontendOrigin).port || '80';
const backendPort = new URL(backendOrigin).port || '80';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['zoom-native.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  webServer: [
    { command: 'npm --prefix backend run dev', url: `${backendOrigin}/api/ready`, timeout: 120_000, reuseExistingServer: false, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, PORT: backendPort, RATE_LIMIT_MAX: '10000', LOGIN_RATE_LIMIT_MAX: '1000' } },
    { command: `npm --prefix frontend run build && npm --prefix frontend run preview -- --port ${frontendPort} --strictPort`, url: `${frontendOrigin}/login`, timeout: 120_000, reuseExistingServer: false, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, VITE_API_URL: apiBase, VITE_PUBLIC_SITE_URL: 'https://loning.example' } },
  ],
  use: { baseURL: process.env.E2E_BASE_URL ?? frontendOrigin },
});
