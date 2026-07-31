import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import BusinessLocation from './BusinessLocation';

const base = { umkmName: 'Dapur Loning', address: 'Dusun Loning' };

describe('BusinessLocation', () => {
  it.each([
    ['null coordinates', { latitude: null, longitude: null }],
    ['missing coordinates', { latitude: undefined, longitude: undefined }],
    ['partial coordinates', { latitude: -6.89, longitude: null }],
    ['out-of-range coordinates', { latitude: -96.5, longitude: 109.3 }],
  ])('renders nothing for %s', (_label, coords) => {
    const { container } = render(<BusinessLocation {...base} latitude={coords.latitude as number | null} longitude={coords.longitude as number | null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the map, attribution, and links for valid coordinates', () => {
    render(<BusinessLocation {...base} latitude={-6.891235} longitude={109.382145} />);
    expect(screen.getByText('Lokasi Usaha')).toBeInTheDocument();
    expect(screen.getByText('Dusun Loning')).toBeInTheDocument();
    const iframe = screen.getByTitle('Peta lokasi Dapur Loning');
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    expect(iframe.getAttribute('src')).toContain('https://www.openstreetmap.org/export/embed.html?bbox=');
    expect(iframe.getAttribute('src')).toContain('marker=-6.891235,109.382145');
    expect(screen.getByText(/kontributor OpenStreetMap/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buka di Google Maps/ })).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=-6.891235,109.382145');
    expect(screen.getByRole('link', { name: /Petunjuk Arah/ })).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=-6.891235,109.382145');
    for (const link of screen.getAllByRole('link')) expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('normalizes coordinates before building any URL', () => {
    render(<BusinessLocation {...base} latitude={-6.8912346} longitude={109.3821454} />);
    const iframe = screen.getByTitle('Peta lokasi Dapur Loning');
    expect(iframe.getAttribute('src')).toContain('marker=-6.891235,109.382145');
  });
});
