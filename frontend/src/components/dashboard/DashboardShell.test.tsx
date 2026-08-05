import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { SessionUser } from '../../lib/auth';
import DashboardShell from './DashboardShell';

let sessionUser: SessionUser;
vi.mock('../../hooks/useAuth', () => ({
  useSession: () => ({ data: { user: sessionUser } }),
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

function user(role: SessionUser['role'], roleLabel: string, capabilities: string[]): SessionUser {
  return { id: 'user-1', username: 'user', displayName: 'Rina', role, roleLabel, capabilities, assignableUserRoles: [], manageableUserRoles: [], assignableUserRoleOptions: [], manageableUserRoleOptions: [], isActive: true, mustChangePassword: false };
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<p>Dashboard content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('DashboardShell capability navigation', () => {
  it('does not show global actions to Pelaku UMKM', () => {
    sessionUser = user('pelaku_umkm', 'Pelaku UMKM', ['dashboard:view', 'umkms:view-own', 'products:view-own']);
    renderShell();
    expect(screen.getAllByText('Pelaku UMKM').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'UMKM' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Produk' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pengguna' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Insight inquiry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit log' })).not.toBeInTheDocument();
  });

  it('shows catalogue insight, but not privileged user or audit links, to Perangkat Desa', () => {
    sessionUser = user('perangkat_desa', 'Perangkat Desa', ['dashboard:view', 'umkms:view-all', 'products:view-all', 'analytics:view-global']);
    renderShell();
    expect(screen.getByRole('link', { name: 'Insight inquiry' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pengguna' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audit log' })).not.toBeInTheDocument();
  });

  it('toggles profile popup menu and renders Ubah kata sandi link', () => {
    sessionUser = user('superadmin', 'Administrator Utama', ['dashboard:view', 'umkms:view-all', 'products:view-all', 'users:view', 'analytics:view-global', 'audit:view-global']);
    renderShell();

    const profileTrigger = screen.getByRole('button', { expanded: false });
    expect(screen.queryByRole('menuitem', { name: /ubah kata sandi/i })).not.toBeInTheDocument();

    fireEvent.click(profileTrigger);
    expect(screen.getByRole('menuitem', { name: /ubah kata sandi/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /keluar/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: /ubah kata sandi/i })).not.toBeInTheDocument();
  });
});
