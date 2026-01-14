/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminUsers from './AdminUsers';
import { supabase } from '@/integrations/supabase/client';
import { MemoryRouter } from 'react-router-dom';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock AdminLayout
vi.mock('@/components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-123', email: 'admin@example.com' },
    loading: false,
  }),
}));

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createSupabaseMock = (usersData: any = [], rolesData: any = []) => {
    return (table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: usersData, error: null }),
        eq: vi.fn().mockImplementation((col) => {
          if (table === 'user_roles' && col === 'user_id') {
            // For delete().eq('user_id', id)
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnThis(),
      };

      if (table === 'user_roles') {
        // Return rolesData for select query
        // fetchUsers calls: .select("user_id, role") (no order usually, or implicit)
        // But wait, the component calls .select("user_id, role") and DOES NOT chain order on user_roles.
        // It awaits directly? .select() returns a builder which is also a promise-like.
        // So calling .then on the builder should return (resolve) => resolve({ data: rolesData })
        builder.then = (resolve: any) => Promise.resolve(resolve({ data: rolesData, error: null }));
      }

      return builder;
    };
  };

  it('should render users and handle search', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', name: 'User One', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', email: 'user2@example.com', name: 'User Two', created_at: '2024-01-01T00:00:00Z' },
    ];
    const mockRoles = [
      { user_id: '1', role: 'admin' },
    ];

    (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock(mockUsers, mockRoles));

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).toBeNull();
    });

    expect(await screen.findByText('User One')).toBeTruthy();
    expect(screen.getByText('User Two')).toBeTruthy();
    expect(await screen.findByText('Admin')).toBeTruthy();

    // Test search
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'User One' } });

    expect(screen.getByText('User One')).toBeTruthy();
    expect(screen.queryByText('User Two')).toBeNull();
  });

  it('should open change role dialog', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', name: 'User One', created_at: '2024-01-01T00:00:00Z' },
    ];
    (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock(mockUsers));

    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByTestId('loader')).toBeNull());

    // Click dropdown
    // Wait for dropdown to be ready
    const trigger = await screen.findByTestId('user-actions-btn');
    fireEvent.click(trigger);

    // Wait for dropdown content using findByText which is portal-safe
    const item = await screen.findByText(/Change Role/i);
    fireEvent.click(item);

    expect(await screen.findByText(/Change User Role/i)).toBeTruthy();
  });
});
