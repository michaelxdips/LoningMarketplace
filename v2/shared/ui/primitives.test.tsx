// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './Button';
import { describedBy, TextAreaField, TextField } from './Field';
import { Badge } from './Badge';
import { EmptyState, ErrorState } from './EmptyState';

afterEach(cleanup);

describe('describedBy', () => {
  it('hanya menggabungkan id yang benar-benar dirender', () => {
    expect(describedBy([['a', true], ['b', false]])).toBe('a');
    expect(describedBy([['a', true], ['b', true]])).toBe('a b');
  });

  it('mengembalikan undefined (bukan string kosong) saat tidak ada deskriptor', () => {
    // String kosong akan menghasilkan aria-describedby="" di DOM — itu atribut
    // rusak yang menunjuk ke id kosong.
    expect(describedBy([['a', false]])).toBeUndefined();
  });

  it('mempertahankan aria-describedby dari pemakai', () => {
    expect(describedBy([['a', true]], 'luar')).toBe('a luar');
  });
});

describe('TextField — wiring aksesibilitas', () => {
  it('label terhubung ke input (bukan placeholder-as-label)', () => {
    render(<TextField label="Nama produk" />);
    const input = screen.getByLabelText('Nama produk');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('tanpa error: tidak ada aria-invalid, describedby hanya helper', () => {
    render(<TextField label="Harga" helperText="Dalam rupiah" />);
    const input = screen.getByLabelText('Harga');
    expect(input).not.toHaveAttribute('aria-invalid');
    const describedById = input.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById!)).toHaveTextContent('Dalam rupiah');
  });

  it('dengan error: aria-invalid true, error diumumkan lewat role=alert', () => {
    render(<TextField label="Harga" helperText="Dalam rupiah" errorText="Harga wajib diisi" />);
    const input = screen.getByLabelText('Harga');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Harga wajib diisi');

    // describedby harus menunjuk helper DAN error, keduanya id nyata.
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(document.getElementById(id)).not.toBeNull();
  });

  it('required menandai wajib untuk mata dan pembaca layar', () => {
    render(<TextField label="Nama" required />);
    expect(screen.getByLabelText(/Nama/)).toBeRequired();
    // Tanda * saja tidak cukup; harus ada teks untuk pembaca layar.
    expect(screen.getByText('(wajib diisi)')).toBeInTheDocument();
  });

  it('setiap field punya id unik meski labelnya sama', () => {
    render(
      <>
        <TextField label="Catatan" errorText="Salah" />
        <TextField label="Catatan" errorText="Salah" />
      </>,
    );
    const [first, second] = screen.getAllByLabelText('Catatan');
    expect(first.id).not.toBe(second.id);
    expect(first.getAttribute('aria-describedby')).not.toBe(second.getAttribute('aria-describedby'));
  });
});

describe('TextAreaField', () => {
  it('merender textarea dengan label dan error yang terhubung', () => {
    render(<TextAreaField label="Deskripsi" errorText="Terlalu pendek" />);
    const control = screen.getByLabelText('Deskripsi');
    expect(control.tagName).toBe('TEXTAREA');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Terlalu pendek');
  });
});

describe('Button — presedensi state', () => {
  it('default type="button" supaya tidak men-submit form tanpa diminta', () => {
    render(<Button>Simpan</Button>);
    expect(screen.getByRole('button', { name: 'Simpan' })).toHaveAttribute('type', 'button');
  });

  it('type bisa ditimpa eksplisit menjadi submit', () => {
    render(<Button type="submit">Kirim</Button>);
    expect(screen.getByRole('button', { name: 'Kirim' })).toHaveAttribute('type', 'submit');
  });

  it('isLoading membuat tombol tidak bisa dioperasikan dan mengumumkan status', () => {
    render(<Button isLoading loadingLabel="Menyimpan">Simpan</Button>);
    const button = screen.getByRole('button', { name: /Simpan/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent('Menyimpan');
  });

  it('disabled tanpa loading: tidak ada aria-busy', () => {
    render(<Button disabled>Simpan</Button>);
    const button = screen.getByRole('button', { name: 'Simpan' });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('ikon disembunyikan dari accessibility tree agar nama tombol tetap bersih', () => {
    render(
      <Button leadingIcon={<svg data-testid="ikon" />}>Tanya Produk</Button>,
    );
    expect(screen.getByRole('button', { name: 'Tanya Produk' })).toBeInTheDocument();
    expect(screen.getByTestId('ikon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Badge', () => {
  it('ikon status disembunyikan dari pembaca layar, teks tetap terbaca', () => {
    render(<Badge variant="success" icon={<svg data-testid="cek" />}>Buka</Badge>);
    expect(screen.getByText('Buka')).toBeInTheDocument();
    expect(screen.getByTestId('cek').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('EmptyState & ErrorState', () => {
  it('EmptyState menyediakan jalan keluar', () => {
    render(
      <EmptyState
        title="Belum ada produk"
        description="Coba hapus filter."
        action={<Button>Hapus filter</Button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Belum ada produk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus filter' })).toBeInTheDocument();
  });

  it('ErrorState diumumkan sebagai alert', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
