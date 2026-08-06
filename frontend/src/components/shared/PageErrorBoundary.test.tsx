import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageErrorBoundary } from './PageErrorBoundary';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Broken({ fail }: { fail: boolean }) { if (fail) throw new Error('sensitive stack detail'); return <p>Normal</p>; }

describe('PageErrorBoundary', () => {
  it('renders children normally', () => {
    render(<MemoryRouter><PageErrorBoundary><Broken fail={false}/></PageErrorBoundary></MemoryRouter>);
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });
  it('isolates a page error without exposing stack detail and can retry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<MemoryRouter><PageErrorBoundary><Broken fail /></PageErrorBoundary></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('Halaman tidak dapat ditampilkan');
    expect(screen.queryByText('sensitive stack detail')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
