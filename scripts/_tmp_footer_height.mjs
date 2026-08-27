import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Cek V2 Desktop
await page.goto('http://localhost:3000/v2/');
const footerV2 = await page.locator('footer').boundingBox();
console.log('Tinggi Footer V2 (Desktop):', footerV2?.height, 'px');

// Cek V1 Desktop
await page.goto('http://localhost:3000/');
const footerV1 = await page.locator('footer').boundingBox();
console.log('Tinggi Footer V1 (Desktop):', footerV1?.height, 'px');

await browser.close();
