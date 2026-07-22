import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 30_000,
  webServer: [
    { command: 'npm --prefix backend run dev', url: 'http://localhost:3001/api/ready', timeout: 120_000, reuseExistingServer: false, stdout: 'pipe', stderr: 'pipe', env: { RATE_LIMIT_MAX: '10000', LOGIN_RATE_LIMIT_MAX: '1000' } },
    { command: 'npm run dev:frontend', url: 'http://localhost:3000/login', timeout: 120_000, reuseExistingServer: false, stdout: 'pipe', stderr: 'pipe' },
  ],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
