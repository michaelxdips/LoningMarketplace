import { describe, expect, it } from 'vitest';
import { generateQRCodeSVG } from './qrcode';

describe('generateQRCodeSVG', () => {
  it('menghasilkan string SVG valid dengan dimensi sesuai', () => {
    const svg = generateQRCodeSVG('https://loning.desa.id/umkm/warung-nasi', { size: 250 });
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 250 250"');
    expect(svg).toContain('width="250"');
    expect(svg).toContain('height="250"');
    expect(svg).toContain('<path');
  });

  it('menggunakan warna foreground & background kustom', () => {
    const svg = generateQRCodeSVG('https://loning.desa.id', {
      foregroundColor: '#123456',
      backgroundColor: '#FAFAFA',
    });
    expect(svg).toContain('fill="#FAFAFA"');
    expect(svg).toContain('fill="#123456"');
  });
});
