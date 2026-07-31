import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UMKM } from '../../types';
import WhatsAppInquiryDialog from './WhatsAppInquiryDialog';

const trackPublicEvent = vi.fn();
vi.mock('../../lib/analytics', () => ({ trackPublicEvent: (...args: unknown[]) => trackPublicEvent(...args) }));

const umkm: UMKM = { id: '00000000-0000-4000-8000-000000000001', slug: 'dapur-loning', name: 'Dapur Loning', owner: 'Sri', description: 'Kuliner', phone: '628123456789', category: 'Kuliner', imageUrl: '/umkm.webp', address: 'Loning', latitude: null, longitude: null, isContactValid: true };
const renderDialog = (onClose = vi.fn()) => render(<WhatsAppInquiryDialog isOpen onClose={onClose} umkm={umkm} source="umkm_detail" />);

function setClipboard(value: { writeText: ReturnType<typeof vi.fn> } | undefined) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value });
}

afterEach(() => {
  cleanup();
  trackPublicEvent.mockReset();
  vi.restoreAllMocks();
  setClipboard(undefined);
  document.body.style.overflow = '';
  document.body.inert = false;
});

describe('WhatsApp inquiry dialog', () => {
  it('moves focus into the named modal and traps forward and reverse Tab', async () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Kirim Pertanyaan' });
    const close = screen.getByRole('button', { name: 'Tutup dialog' });
    await waitFor(() => expect(close).toHaveFocus());
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const send = screen.getByRole('button', { name: 'Kirim Pertanyaan' });
    send.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    close.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(send).toHaveFocus();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Buka';
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const view = renderDialog(onClose);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    view.unmount();
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });

  it('does not crash when the trigger disappears before focus restoration', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const view = renderDialog();
    trigger.remove();
    expect(() => view.unmount()).not.toThrow();
  });

  it('announces clipboard success and records analytics only after resolution', async () => {
    let resolveCopy!: () => void;
    const writeText = vi.fn(() => new Promise<void>((resolve) => { resolveCopy = resolve; }));
    setClipboard({ writeText });
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Salin Pesan' }));
    expect(trackPublicEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventType: 'message_copied' }));
    resolveCopy();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Pesan berhasil disalin.'));
    expect(trackPublicEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'message_copied' }));
  });

  it.each(['rejected', 'unavailable'] as const)('shows manual-copy feedback when Clipboard API is %s', async (state) => {
    setClipboard(state === 'rejected' ? { writeText: vi.fn().mockRejectedValue(new Error('denied')) } : undefined);
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Salin Pesan' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Salin secara manual'));
    expect(screen.getByText('628123456789')).toHaveClass('select-all');
    expect(trackPublicEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventType: 'message_copied' }));
  });

  it('records a confirmed WhatsApp open and closes only when window.open returns a handle', () => {
    vi.spyOn(window, 'open').mockReturnValue(window);
    const onClose = vi.fn();
    renderDialog(onClose);
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Pertanyaan' }));
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('https://api.whatsapp.com/send'), '_blank', 'noopener,noreferrer');
    expect(trackPublicEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'whatsapp_opened' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows a direct link without false success when the popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const onClose = vi.fn();
    renderDialog(onClose);
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Pertanyaan' }));
    expect(screen.getByRole('status')).toHaveTextContent('Browser memblokir popup');
    expect(screen.getByRole('link', { name: 'Buka WhatsApp secara langsung' })).toHaveAttribute('href', expect.stringContaining('api.whatsapp.com'));
    expect(trackPublicEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventType: 'whatsapp_opened' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('isolates analytics failures from successful CTA behavior', () => {
    vi.spyOn(window, 'open').mockReturnValue(window);
    trackPublicEvent.mockImplementation(() => { throw new Error('analytics unavailable'); });
    const onClose = vi.fn();
    renderDialog(onClose);
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Kirim Pertanyaan' }))).not.toThrow();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
