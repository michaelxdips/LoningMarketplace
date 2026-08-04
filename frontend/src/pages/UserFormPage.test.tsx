import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { SessionUser } from '../lib/auth';
import { UserFormPage } from './ManagementForms';

let sessionUser: SessionUser;
vi.mock('../hooks/useAuth', () => ({
  useSession: () => ({ data: { user: sessionUser } }),
  useCsrfToken: () => 'csrf',
}));
vi.mock('../hooks/useManagement', () => ({
  useManagedList: () => ({ data: [], isPending: false, isError: false }),
  useManagedMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useManagedItem: () => ({ data: undefined, isPending: false, isError: false }),
}));

function user(role: SessionUser['role'], roleLabel: string, options: SessionUser['assignableUserRoleOptions']): SessionUser {
  return { id: 'actor-1', username: 'actor', displayName: 'Actor', role, roleLabel, capabilities: ['users:view', 'users:update'], assignableUserRoles: options.map((option) => option.value), manageableUserRoles: options.map((option) => option.value), assignableUserRoleOptions: options, manageableUserRoleOptions: options, isActive: true, mustChangePassword: false };
}

function renderForm() {
  return render(<MemoryRouter initialEntries={['/dashboard/users/new']}><Routes><Route path="/dashboard/users/new" element={<UserFormPage />} /></Routes></MemoryRouter>);
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('UserFormPage role options', () => {
  it('shows only operational roles to Admin Desa', () => {
    sessionUser = user('admin', 'Admin Desa', [{ value: 'perangkat_desa', label: 'Perangkat Desa' }, { value: 'pelaku_umkm', label: 'Pelaku UMKM' }]);
    renderForm();
    const options = Array.from(screen.getByRole('combobox').querySelectorAll('option')).map((option) => option.textContent);
    expect(options).toEqual(['Pilih peran', 'Perangkat Desa', 'Pelaku UMKM']);
  });

  it('shows all four roles to Super Admin', () => {
    sessionUser = user('superadmin', 'Super Admin', [{ value: 'superadmin', label: 'Super Admin' }, { value: 'admin', label: 'Admin Desa' }, { value: 'perangkat_desa', label: 'Perangkat Desa' }, { value: 'pelaku_umkm', label: 'Pelaku UMKM' }]);
    renderForm();
    expect(screen.getByRole('combobox')).toHaveTextContent('Super Admin');
    expect(screen.getByRole('combobox')).toHaveTextContent('Admin Desa');
    expect(screen.getByRole('combobox')).toHaveTextContent('Perangkat Desa');
    expect(screen.getByRole('combobox')).toHaveTextContent('Pelaku UMKM');
  });
});
