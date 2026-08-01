/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeveloperContactDialog from './DeveloperContactDialog';

describe('DeveloperContactDialog component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', vi.fn());
  });

  it('does not render when isOpen is false', () => {
    render(<DeveloperContactDialog isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders modal title and form controls when isOpen is true', () => {
    render(<DeveloperContactDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Hubungi Developer (Michael)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Anda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pesan \/ Deskripsi Kendala/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', () => {
    render(<DeveloperContactDialog isOpen={true} onClose={onClose} />);

    const submitBtn = screen.getAllByText('Kirim via WhatsApp')[0].closest('button')!;
    fireEvent.click(submitBtn);

    expect(screen.getByText('Nama pengirim wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Pesan atau deskripsi kendala wajib diisi')).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });

  it('formats structured message and opens WhatsApp on valid submission', () => {
    render(<DeveloperContactDialog isOpen={true} onClose={onClose} />);

    const nameInput = screen.getByLabelText(/Nama Anda/i);
    const messageInput = screen.getByLabelText(/Pesan \/ Deskripsi Kendala/i);

    fireEvent.change(nameInput, { target: { value: 'Budi Santoso' } });
    fireEvent.change(messageInput, { target: { value: 'Ada error saat mencoba melihat peta' } });

    const submitBtn = screen.getAllByText('Kirim via WhatsApp')[0].closest('button')!;
    fireEvent.click(submitBtn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const openUrl = (window.open as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(openUrl).toContain('https://wa.me/62818139410');
    expect(openUrl).toContain(encodeURIComponent('Budi Santoso'));
    expect(openUrl).toContain(encodeURIComponent('Ada error saat mencoba melihat peta'));
    expect(onClose).toHaveBeenCalled();
  });
});
