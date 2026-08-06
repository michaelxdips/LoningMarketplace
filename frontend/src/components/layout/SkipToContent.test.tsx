import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PublicPageShell from './PublicPageShell';
import DashboardShell from '../dashboard/DashboardShell';

vi.mock('../../hooks/useAuth', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'u1',
        username: 'admin',
        displayName: 'Admin Desa',
        role: 'admin_desa',
        capabilities: ['dashboard:view', 'umkms:view-all', 'products:view-all', 'users:view', 'audit:view-global', 'analytics:view-global'],
      },
      capabilities: ['dashboard:view', 'umkms:view-all', 'products:view-all', 'users:view', 'audit:view-global', 'analytics:view-global'],
    },
  }),
  useLogout: () => vi.fn(),
}));

describe('Skip-to-Content and Main Landmark Audit', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a single skip link and single main landmark across all public and dashboard routes', () => {
    const routes = [
      { name: 'PublicPageShell (FAQ)', ui: <PublicPageShell><div>FAQ Content</div></PublicPageShell> },
      { name: 'DashboardShell', ui: <DashboardShell /> },
    ];

    for (const route of routes) {
      const { container, unmount } = render(
        <MemoryRouter>
          {route.ui}
        </MemoryRouter>
      );

      const skipLinks = screen.getAllByRole('link', { name: /lewati ke konten utama/i });
      expect(skipLinks).toHaveLength(1);
      expect(skipLinks[0].getAttribute('href')).toBe('#main-content');

      const mainLandmarks = container.querySelectorAll('main');
      expect(mainLandmarks).toHaveLength(1);

      const mainContent = container.querySelector('#main-content');
      expect(mainContent).not.toBeNull();
      expect(mainContent?.tagName.toLowerCase()).toBe('main');
      expect(mainContent?.getAttribute('tabindex')).toBe('-1');

      // Ensure no nested main elements
      const nestedMains = mainContent?.querySelectorAll('main');
      expect(nestedMains).toHaveLength(0);

      unmount();
    }
  });
});
