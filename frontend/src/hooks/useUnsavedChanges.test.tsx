import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChanges } from './useUnsavedChanges';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Harness() {
  const guard = useUnsavedChanges();
  return <div><button onClick={guard.markDirty}>Ubah</button><a href="/next">Keluar</a>{guard.dialog}</div>;
}

describe('useUnsavedChanges', () => {
  it('does not block a clean internal link', () => {
    render(<MemoryRouter><Harness /></MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'Keluar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('shows an accessible decision dialog after a form becomes dirty', () => {
    render(<MemoryRouter><Harness /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah' }));
    fireEvent.click(screen.getByRole('link', { name: 'Keluar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Perubahan belum disimpan');
    fireEvent.click(screen.getByRole('button', { name: 'Tetap di halaman' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('enables beforeunload only while dirty', () => {
    render(<MemoryRouter><Harness /></MemoryRouter>);
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Ubah' }));
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
});
