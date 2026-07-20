import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { MediaField } from '../components/dashboard/Ui';
import { productImageInput, validateMediaFile } from './ManagementForms';
import { formatPrice, normalizePrice } from '../lib/price';
import { ProductImage } from '../components/product/ProductImage';

afterEach(cleanup);

describe('validateMediaFile', () => {
  it('accepts supported image types up to 5 MiB', () => {
    expect(validateMediaFile(new File(['image'], 'photo.webp', { type: 'image/webp' }))).toBeUndefined();
  });

  it('rejects unsupported types and oversized files', () => {
    expect(validateMediaFile(new File(['text'], 'photo.gif', { type: 'image/gif' }))).toContain('JPEG');
    expect(validateMediaFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'photo.png', { type: 'image/png' }))).toContain('5 MiB');
  });
});

describe('price contract', () => {
  it('normalizes supported values and rejects ambiguous values', () => {
    expect(normalizePrice(null)).toBeNull();
    expect(normalizePrice('')).toBeNull();
    expect(normalizePrice('0')).toBe(0);
    expect(normalizePrice(35000)).toBe(35000);
    expect(normalizePrice('35000')).toBe(35000);
    expect(normalizePrice('12.5')).toBeNull();
    expect(formatPrice(35000)).toBe('Rp35.000');
    expect(formatPrice(null)).toBe('Harga tidak ditampilkan');
  });
});

describe('product image payload', () => {
  it('omits persisted image fields for keep-current', () => {
    expect(productImageInput('keep-current', 'stale-asset', 'blob:stale')).toEqual({});
  });

  it('uses only the selected managed or external source', () => {
    expect(productImageInput('managed-upload', 'asset-id', 'https://example.com/stale.webp')).toEqual({ imageUrl: null, imageAssetId: 'asset-id' });
    expect(productImageInput('external-url', 'stale-asset', 'https://example.com/current.webp')).toEqual({ imageUrl: 'https://example.com/current.webp', imageAssetId: null });
  });
});

describe('MediaField', () => {
  it('labels the file input and clears the current source', () => {
    const onClear = vi.fn();
    render(<MediaField currentUrl="https://example.com/current.webp" onFile={vi.fn()} onClear={onClear} />);
    expect(screen.getByLabelText('Pilih gambar')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    fireEvent.click(screen.getByRole('button', { name: 'Hapus sumber' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('revokes a selected file preview URL when replaced', () => {
    const createObjectURL = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const { rerender, unmount } = render(<MediaField file={new File(['one'], 'one.png', { type: 'image/png' })} onFile={vi.fn()} onClear={vi.fn()} />);
    rerender(<MediaField file={new File(['two'], 'two.png', { type: 'image/png' })} onFile={vi.fn()} onClear={vi.fn()} />);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second');
  });
});

describe('ProductImage', () => {
  it('keeps stable dimensions and replaces a failed request with a fallback', () => {
    const source = 'https://example.com/missing-product-image.webp';
    const first = render(<ProductImage src={source} alt="Gambar produk" className="h-16 w-16 shrink-0 object-cover" />);
    const image = screen.getByRole('img', { name: 'Gambar produk' });
    expect(image).toHaveClass('h-16', 'w-16', 'shrink-0', 'object-cover');
    fireEvent.error(image);
    expect(screen.getByRole('img', { name: 'Gambar produk' })).toHaveClass('h-16', 'w-16', 'shrink-0');
    expect(screen.queryByRole('img', { name: 'Gambar produk' })?.tagName).toBe('DIV');
    first.unmount();
    render(<ProductImage src={source} alt="Gambar produk" className="h-16 w-16 shrink-0 object-cover" />);
    expect(screen.getByRole('img', { name: 'Gambar produk' }).tagName).toBe('DIV');
  });
});
