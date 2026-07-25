// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyPageMetadata } from './seo';
import { sharePage } from './share';

afterEach(() => {
  document.head.querySelectorAll('meta, link[rel="canonical"], #route-json-ld').forEach((node) => node.remove());
  vi.restoreAllMocks();
});

describe('route metadata', () => {
  it('updates canonical, social metadata, and cleans route JSON-LD', () => {
    window.history.replaceState({}, '', '/produk/kopi');
    vi.stubEnv('VITE_PUBLIC_SITE_URL', 'https://loning.example');
    const cleanup = applyPageMetadata({ title: 'Kopi Loning', description: 'Kopi warga.', image: '/kopi.webp', type: 'product', jsonLd: { '@type': 'Product', name: 'Kopi Loning' } });
    expect(document.title).toBe('Kopi Loning');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain('/produk/kopi');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toContain('/kopi.webp');
    expect(document.getElementById('route-json-ld')?.textContent).toContain('Kopi Loning');
    cleanup();
    expect(document.getElementById('route-json-ld')).toBeNull();
  });
});

describe('page sharing', () => {
  it('uses native share when available', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    await expect(sharePage({ title: 'Produk', url: 'https://example.test/produk/1' })).resolves.toBe('shared');
    expect(nativeShare).toHaveBeenCalledOnce();
  });

  it('copies the URL when native share is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await expect(sharePage({ title: 'Produk', url: 'https://example.test/produk/1' })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://example.test/produk/1');
  });
});
