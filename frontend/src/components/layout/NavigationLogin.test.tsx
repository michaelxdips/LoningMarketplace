import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router';
import Footer from './Footer';
import Navbar from './Navbar';

afterEach(cleanup);

function LocationProbe() {
  return <output aria-label="Lokasi saat ini">{useLocation().pathname}</output>;
}

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('public login navigation', () => {
  it('renders one primary desktop login link beside the FAQ contract', () => {
    renderNavbar();
    const primaryNavigation = screen.getByRole('navigation', { name: 'Navigasi utama' });
    const links = within(primaryNavigation).getAllByRole('link');
    const faqIndex = links.findIndex((link) => link.textContent === 'FAQ');
    const loginIndex = links.findIndex((link) => link.textContent === 'Masuk Pengelola');

    expect(within(primaryNavigation).getByRole('link', { name: 'FAQ' })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: 'Masuk Pengelola' })).toHaveAttribute('href', '/login');
    expect(within(primaryNavigation).getAllByRole('link', { name: 'Masuk Pengelola' })).toHaveLength(1);
    expect(loginIndex).toBe(faqIndex + 1);
  });

  it('exposes a focusable mobile login link and closes the menu after navigation', () => {
    renderNavbar();
    const toggle = screen.getByRole('button', { name: 'Buka atau tutup navigasi' });
    fireEvent.click(toggle);

    const mobileNavigation = screen.getByRole('navigation', { name: 'Navigasi seluler' });
    const login = within(mobileNavigation).getByRole('link', { name: 'Masuk Pengelola' });
    expect(login).toHaveAttribute('href', '/login');
    login.focus();
    expect(login).toHaveFocus();

    fireEvent.click(login);
    expect(screen.queryByRole('navigation', { name: 'Navigasi seluler' })).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status', { name: 'Lokasi saat ini' })).toHaveTextContent('/login');
  });

  it('keeps exactly one secondary footer login link', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const footer = screen.getByRole('contentinfo');
    const loginLinks = within(footer).getAllByRole('link', { name: 'Masuk Pengelola' });

    expect(loginLinks).toHaveLength(1);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });
});