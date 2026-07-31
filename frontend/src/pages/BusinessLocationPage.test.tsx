import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import BusinessLocationPage from './BusinessLocationPage';

const umkm = { id: 'u1', slug: 'dapur', name: 'Dapur Loning', owner: 'Sri', description: 'Kuliner', phone: '6281', category: 'Kuliner', imageUrl: '/x', address: 'Dusun Loning', latitude: null, longitude: null, ownerUserId: 'x', publicationStatus: 'published' };
vi.mock('../lib/management', async original => { const actual = await original<typeof import('../lib/management')>(); return { ...actual, managementApi: { ...actual.managementApi, umkms: { ...actual.managementApi.umkms, get: vi.fn(async () => umkm), setLocation: vi.fn(async (_id, coordinates) => ({ ...umkm, ...coordinates })), clearLocation: vi.fn(async () => ({ ...umkm, latitude: null, longitude: null })) } } }; });
vi.mock('../hooks/useAuth', () => ({ useCsrfToken: () => 'csrf' }));

function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/dashboard/umkms/u1/location']}><Routes><Route path="/dashboard/umkms/:id/location" element={<BusinessLocationPage/>}/></Routes></MemoryRouter></QueryClientProvider>); }
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('BusinessLocationPage', () => {
  it('parses a full URL, normalizes coordinates, previews, and saves', async () => {
    renderPage(); await screen.findByRole('heading', { name: 'Lokasi Usaha' });
    fireEvent.change(screen.getByLabelText('URL Maps'), { target: { value: 'https://www.google.com/maps/@-6.8912346,109.3821454,17z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Baca URL' }));
    expect(screen.getByLabelText('Latitude')).toHaveValue('-6.891235'); expect(screen.getByLabelText('Longitude')).toHaveValue('109.382145');
    expect(screen.getByTitle('Peta lokasi Dapur Loning')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Lokasi' })); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('berhasil disimpan'));
  });
  it('reports a short link and returns focus to the URL input', async () => {
    renderPage(); const input = await screen.findByLabelText('URL Maps'); fireEvent.change(input, { target: { value: 'https://maps.app.goo.gl/abc' } }); fireEvent.click(screen.getByRole('button', { name: 'Baca URL' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Link pendek belum dapat dibaca otomatis'); expect(input).toHaveFocus();
  });
  it('rejects partial and out-of-range manual coordinates', async () => {
    renderPage(); const latitude = await screen.findByLabelText('Latitude'); const longitude = screen.getByLabelText('Longitude'); fireEvent.change(latitude, { target: { value: '-6.8' } }); expect(screen.getByRole('button', { name: 'Simpan Lokasi' })).toBeDisabled(); fireEvent.change(longitude, { target: { value: '181' } }); expect(longitude).toHaveAttribute('aria-invalid', 'true');
  });
});
