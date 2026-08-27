import { describe, expect, it } from 'vitest';
import { buildInquiryMessage, buildWhatsAppUrl } from './whatsapp';
import type { Product, UMKM } from '@loning/shared';

/**
 * Test penyusun pesan WhatsApp (logika murni).
 * Kontrak format pesan harus stabil karena pelaku usaha membaca pesan ini.
 */

const product: Product = {
  id: 'p1',
  slug: 'nasi-megono',
  umkmName: 'Warung Nasi Khas Loning',
  name: 'Nasi Megono Komplit',
  price: 18000,
  description: '',
  category: 'Kuliner',
  imageUrl: '',
  isAvailable: true,
};

const umkm: UMKM = {
  id: 'u1',
  slug: 'warung-nasi',
  name: 'Warung Nasi Khas Loning',
  owner: 'Sri Wahyuni',
  description: '',
  phone: '628123456789',
  category: 'Kuliner',
  imageUrl: '',
  address: '',
  latitude: null,
  longitude: null,
};

describe('buildInquiryMessage', () => {
  it('produk: menyebut nama produk dan usaha, dengan nama pengunjung + pertanyaan', () => {
    const message = buildInquiryMessage({
      product,
      visitorName: 'Budi',
      visitorQuestion: 'Apakah ready hari ini?',
    });

    expect(message).toContain('*Nasi Megono Komplit*');
    expect(message).toContain('Warung Nasi Khas Loning');
    expect(message).toContain('nama saya *Budi*');
    expect(message).toContain('Apakah ready hari ini?');
    expect(message).toContain('Terima kasih!');
  });

  it('produk tanpa nama pengunjung: pakai pertanyaan default', () => {
    const message = buildInquiryMessage({ product, visitorName: '', visitorQuestion: '' });
    expect(message).toContain('tersedia untuk dipesan?');
    expect(message).not.toContain('Perkenalkan');
  });

  it('umkm: menyebut nama usaha, bukan produk', () => {
    const message = buildInquiryMessage({ umkm, visitorName: '', visitorQuestion: '' });
    expect(message).toContain('usaha *Warung Nasi Khas Loning*');
    expect(message).not.toContain('produk *');
  });

  it('templateType: mendukung varian template pertanyaan instan', () => {
    const msgAvailability = buildInquiryMessage({ product, visitorName: '', visitorQuestion: '', templateType: 'availability' });
    expect(msgAvailability).toContain('ready atau perlu preorder');

    const msgPrice = buildInquiryMessage({ product, visitorName: '', visitorQuestion: '', templateType: 'price' });
    expect(msgPrice).toContain('rincian harga');

    const msgCustom = buildInquiryMessage({ product, visitorName: '', visitorQuestion: '', templateType: 'custom' });
    expect(msgCustom).toContain('custom order');
  });
});

describe('buildWhatsAppUrl', () => {
  it('mengencode pesan ke dalam URL wa.me', () => {
    const url = buildWhatsAppUrl('628123456789', 'Halo Kak, selamat pagi!');
    expect(url).toContain('https://api.whatsapp.com/send?phone=628123456789');
    expect(url).toContain('text=');
    expect(url).toContain(encodeURIComponent('Halo Kak, selamat pagi!'));
  });
});
