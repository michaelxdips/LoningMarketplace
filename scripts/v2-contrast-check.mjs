#!/usr/bin/env node
/**
 * Gate kontras WCAG untuk token V2.
 *
 * Kenapa ada: seluruh alasan desain V2 bersandar pada klaim "kontras >= 4.5:1".
 * Klaim itu tidak boleh berupa asumsi — script ini membacanya langsung dari
 * v2/shared/styles/tokens.css lalu menghitung rasio sebenarnya.
 *
 * Jalankan: node scripts/v2-contrast-check.mjs
 * Exit 1 kalau ada pasangan yang gagal (dipakai sebagai gate Phase 1).
 *
 * CATATAN STRUKTUR: palet dark ditulis sebagai --v2-dark-* di :root (sumber
 * nilai tunggal), lalu dipetakan ke --color-* di dua selector. Jadi script ini
 * membaca --v2-dark-* langsung, bukan hasil pemetaannya.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(here, '../v2/shared/styles/tokens.css');
// Komentar dibuang lebih dulu. Tanpa ini, indexOf(':root') bisa nyangkut pada
// kata ":root" yang muncul di dalam komentar dokumentasi tokens.css dan parser
// membaca blok yang salah (bug nyata, ketangkap saat menjalankan gate ini).
const css = readFileSync(tokensPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Ambil isi blok CSS pertama yang cocok dengan pola pembuka (brace-balanced). */
function blockBody(source, startPattern) {
  const at = source.indexOf(startPattern);
  if (at === -1) throw new Error(`Blok tidak ditemukan: ${startPattern}`);
  const open = source.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Blok tidak tertutup: ${startPattern}`);
}

/** Kumpulkan custom property berawalan `prefix` yang bernilai hex literal. */
function collectHex(body, prefix) {
  const out = {};
  const re = new RegExp(`--${prefix}([\\w-]+)\\s*:\\s*(#[0-9a-fA-F]{3,8})\\s*;`, 'g');
  for (const m of body.matchAll(re)) out[m[1]] = m[2];
  return out;
}

const light = collectHex(blockBody(css, '@theme'), 'color-');
// Palet dark = nilai --v2-dark-* (sumber tunggal), ditimpa di atas light.
const darkOverrides = collectHex(blockBody(css, ':root'), 'v2-dark-');
const dark = { ...light, ...darkOverrides };

if (Object.keys(light).length === 0) throw new Error('Token light tidak terbaca.');
if (Object.keys(darkOverrides).length === 0) throw new Error('Token dark tidak terbaca.');

function toRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) throw new Error(`Hex tidak valid: ${hex}`);
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) throw new Error(`Hex tidak valid: ${hex}`);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance per WCAG 2.x. */
function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Ambang: 4.5 = teks normal (WCAG 1.4.3), 3 = komponen UI non-teks (1.4.11).
 *
 * Peran token sengaja dipisah, jadi yang diuji juga per peran:
 *   accent          -> non-teks saja (focus ring, mark)      >= 3
 *   accent-ink      -> teks aksen di atas canvas/surface      >= 4.5
 *   accent-fill     -> latar solid dengan label di atasnya    >= 4.5
 *   line/line-strong-> pemisah dekoratif (TIDAK diuji 3:1)
 *   control-border  -> batas kontrol interaktif               >= 3
 */
const PAIRS = [
  // -- teks utama
  ['ink', 'canvas', 4.5, 'body di canvas'],
  ['ink', 'surface', 4.5, 'body di surface'],
  ['ink', 'sunken', 4.5, 'body di sunken'],
  ['ink-muted', 'canvas', 4.5, 'teks sekunder di canvas'],
  ['ink-muted', 'surface', 4.5, 'teks sekunder di surface'],
  ['ink-subtle', 'canvas', 4.5, 'caption di canvas'],
  ['ink-subtle', 'surface', 4.5, 'caption di surface'],
  // -- brand & accent sebagai TEKS
  ['brand', 'canvas', 4.5, 'heading brand di canvas'],
  ['brand', 'surface', 4.5, 'heading brand di surface'],
  ['accent-ink', 'canvas', 4.5, 'eyebrow/label accent di canvas'],
  ['accent-ink', 'surface', 4.5, 'eyebrow/label accent di surface'],
  // -- teks DI ATAS fill (tombol)
  ['on-brand', 'brand', 4.5, 'label tombol primary'],
  ['on-accent-fill', 'accent-fill', 4.5, 'label tombol accent'],
  ['on-accent-fill', 'accent-fill-hover', 4.5, 'label tombol accent (hover)'],
  ['on-brand', 'brand-hover', 4.5, 'label tombol primary (hover)'],
  // -- status sebagai teks
  ['danger-ink', 'canvas', 4.5, 'teks error'],
  ['danger-ink', 'surface', 4.5, 'teks error di surface'],
  ['success-ink', 'canvas', 4.5, 'teks sukses'],
  ['warning-ink', 'canvas', 4.5, 'teks peringatan'],
  ['on-danger', 'danger', 4.5, 'label tombol danger'],
  // -- non-teks (WCAG 1.4.11)
  ['control-border', 'canvas', 3, 'batas kontrol di canvas'],
  ['control-border', 'surface', 3, 'batas kontrol di surface'],
  ['control-border', 'sunken', 3, 'batas kontrol di sunken'],
  ['accent', 'canvas', 3, 'focus ring di canvas'],
  ['accent', 'surface', 3, 'focus ring di surface'],
  ['brand', 'canvas', 3, 'fill brand vs canvas'],
];

let failures = 0;
for (const [mode, tokens] of [['LIGHT', light], ['DARK', dark]]) {
  console.log(`\n=== ${mode} ===`);
  for (const [fgKey, bgKey, need, label] of PAIRS) {
    const fg = tokens[fgKey];
    const bg = tokens[bgKey];
    if (!fg || !bg) {
      console.log(`  MISSING  ${fgKey}/${bgKey} (token tidak ada)`);
      failures += 1;
      continue;
    }
    const r = ratio(fg, bg);
    const ok = r >= need;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${need})  ${fgKey} on ${bgKey}  — ${label}`,
    );
  }
}

console.log(`\n${failures === 0 ? 'SEMUA LOLOS' : `${failures} GAGAL`}`);
process.exit(failures === 0 ? 0 : 1);
