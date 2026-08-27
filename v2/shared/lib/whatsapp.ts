import type { Product, UMKM } from '@loning/shared';

/**
 * Penyusun pesan WhatsApp V2 — logika MURNI (tanpa DOM/React).
 *
 * Dipisah dari komponen dialog supaya bisa diuji terpisah dan dipakai ulang
 * oleh v2/desktop maupun v2/mobile (bottom sheet) tanpa duplikasi.
 *
 * Format pesan MEMPERTAHANKAN kontrak UI lama (tanda *bold* WhatsApp, susunan
 * intro + nama + pertanyaan + penutup) supaya pelaku usaha yang sudah terbiasa
 * membaca pesan dari platform lama tidak menemukan perubahan mendadak.
 */

export function buildInquiryMessage(input: {
  product?: Product | null;
  umkm?: UMKM | null;
  visitorName: string;
  visitorQuestion: string;
  templateType?: 'general' | 'availability' | 'price' | 'custom';
}): string {
  const { product, umkm, visitorName, visitorQuestion, templateType = 'general' } = input;
  const merchantName = product ? product.umkmName : umkm ? umkm.name : 'Nama UMKM';
  const ownerName = umkm ? umkm.owner : product ? 'Penjual' : 'Pelaku UMKM';

  const introPart = product
    ? `Halo Kak ${ownerName} (${merchantName}), saya tertarik dengan produk *${product.name}* yang saya temukan di katalog digital Desa Loning.`
    : `Halo Kak ${ownerName} (${merchantName}), saya tertarik dengan usaha *${merchantName}* yang saya temukan di direktori digital Desa Loning.`;

  const senderPart = visitorName.trim()
    ? `\n\nPerkenalkan, nama saya *${visitorName.trim()}*.`
    : '';

  let defaultQuestion = 'Apakah produk/layanan ini saat ini tersedia untuk dipesan?';
  if (templateType === 'availability') {
    defaultQuestion = 'Apakah stok / pesanan untuk saat ini ready atau perlu preorder?';
  } else if (templateType === 'price') {
    defaultQuestion = 'Bisa minta rincian harga, varian ukuran/rasa, atau ongkir ke alamat saya?';
  } else if (templateType === 'custom') {
    defaultQuestion = 'Apakah melayani pemesanan khusus / custom order dalam jumlah tertentu?';
  }

  const questionPart = visitorQuestion.trim()
    ? `\n\nPertanyaan saya:\n"${visitorQuestion.trim()}"`
    : `\n\n${defaultQuestion}`;

  return `${introPart}${senderPart}${questionPart}\n\nTerima kasih!`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
