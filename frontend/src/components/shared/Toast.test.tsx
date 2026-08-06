import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function TestConsumer() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Data berhasil disimpan', 'success')}>Trigger Success</button>
      <button onClick={() => showToast('Gagal memuat data', 'error')}>Trigger Error</button>
    </div>
  );
}

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders success toast when triggered and auto dismisses', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Success'));

    expect(screen.getByText('Data berhasil disimpan')).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(screen.queryByText('Data berhasil disimpan')).toBeNull();
  });

  it('renders error toast with alert role and allows manual dismiss', () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Error'));

    expect(screen.getByText('Gagal memuat data')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();

    const closeButton = screen.getByRole('button', { name: 'Tutup notifikasi' });
    expect(closeButton).toBeDefined();

    fireEvent.click(closeButton);

    expect(screen.queryByText('Gagal memuat data')).toBeNull();
  });
});
