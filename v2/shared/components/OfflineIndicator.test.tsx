import { render, screen, act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import OfflineIndicator from './OfflineIndicator';

describe('OfflineIndicator component', () => {
  afterEach(() => {
    cleanup();
  });

  it('tidak merender apa-apa saat online', () => {
    render(<OfflineIndicator />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('menampilkan banner saat event offline ditembakkan', () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    const banner = screen.getByRole('status');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Mode Offline');

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('status')).toBeNull();
  });
});
