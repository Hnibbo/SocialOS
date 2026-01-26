import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrgMembersDialog from '@/components/admin/OrgMembersDialog';
import { supabase } from '@/integrations/supabase/client';

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => {
      const obj = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      return obj;
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

describe('OrgMembersDialog', () => {
  const mockOrganization = {
    id: '123',
    name: 'Test Organization',
  };

  it('renders the dialog with correct title', () => {
    render(
      <OrgMembersDialog
        open={true}
        onOpenChange={() => {}}
        organization={mockOrganization}
      />
    );
    
    expect(screen.getByText(/Manage Members/)).toBeInTheDocument();
    expect(screen.getByText(mockOrganization.name)).toBeInTheDocument();
  });

  it('renders loading state initially', async () => {
    render(
      <OrgMembersDialog
        open={true}
        onOpenChange={() => {}}
        organization={mockOrganization}
      />
    );
    
    expect(screen.getByText(/Fetching members.../)).toBeInTheDocument();
  });

  it('renders no members message when there are no members', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'organization_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          in: vi.fn().mockReturnThis(),
        };
      } else if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }
      const obj = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      return obj;
    });

    render(
      <OrgMembersDialog
        open={true}
        onOpenChange={() => {}}
        organization={mockOrganization}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/No members found/)).toBeInTheDocument();
    });
  });

  it('renders members list when there are members', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        full_name: 'Test User 1',
        avatar_url: null,
        created_at: '2023-01-01',
        organization_id: mockOrganization.id,
      },
    ];

    const mockRoles = [
      { user_id: '1', role: 'member', organization_id: mockOrganization.id },
    ];

    // Create a complete mock for the fetchMembers query chain
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockImplementation(() => Promise.resolve({ 
              data: mockUsers, 
              error: null 
            })),
          })),
        };
      } else if (table === 'organization_roles') {
        return {
          select: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockImplementation(() => ({
              in: vi.fn().mockImplementation(() => Promise.resolve({ 
                data: mockRoles, 
                error: null 
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(
      <OrgMembersDialog
        open={true}
        onOpenChange={() => {}}
        organization={mockOrganization}
      />
    );
    
    await waitFor(() => {
      // Check if the members list is rendered by looking for user details
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });
  });

  it('displays error toast when there is an error fetching members', async () => {
    const mockError = new Error('Failed to fetch');
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'organization_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation(() => ({
            single: vi.fn().mockRejectedValue(mockError),
          })),
          in: vi.fn().mockReturnThis(),
        };
      } else if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      const obj = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      return obj;
    });

    render(
      <OrgMembersDialog
        open={true}
        onOpenChange={() => {}}
        organization={mockOrganization}
      />
    );
    
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });
});
