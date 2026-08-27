import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:3000/v2/');
await page.locator('footer').screenshot({ path: 'scripts/footer-v2.png' });

await page.goto('http://localhost:3000/');
await page.locator('footer').screenshot({ path: 'scripts/footer-v1.png' });

await browser.close();
console.log('Capture selesai');
