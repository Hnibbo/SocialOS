/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminSupport from './AdminSupport';
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

describe('AdminSupport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createSupabaseMock = (
        conversations: any[] = [],
        users: any[] = [],
        messages: any[] = []
    ) => {
        return (table: string) => {
            const builder: any = {
                _filters: {} as Record<string, any>,
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                eq: vi.fn().mockImplementation((col, val) => {
                    builder._filters[col] = { operator: 'eq', value: val };
                    return builder;
                }),
                in: vi.fn().mockReturnThis(),
                single: vi.fn(),
            };

            builder.then = (resolve: any) => {
                let data: any[] | null = [];
                let count: number | null = null;

                if (table === 'support_conversations') {
                    data = conversations;
                    count = conversations.length;
                } else if (table === 'users') {
                    data = users;
                } else if (table === 'support_messages') {
                    // Check if filtering by conversation_id
                    if (builder._filters['conversation_id']) {
                        data = messages;
                    } else {
                        data = [];
                    }
                }

                return Promise.resolve(resolve({ data, count, error: null }));
            };

            return builder;
        };
    };

    it('should render conversations and stats', async () => {
        const mockConversations = [
            { id: 'c1', user_id: 'u1', status: 'active', updated_at: '2024-01-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
            { id: 'c2', user_id: 'u2', status: 'resolved', updated_at: '2024-01-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
        ];
        const mockUsers = [
            { id: 'u1', email: 'user1@example.com' },
            { id: 'u2', email: 'user2@example.com' },
        ];

        (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock(mockConversations, mockUsers));

        render(
            <MemoryRouter>
                <AdminSupport />
            </MemoryRouter>
        );



        // Check conversation item
        expect(await screen.findByText('user1@example.com')).toBeInTheDocument();
    });

    it('should open messages when a conversation is clicked', async () => {
        const mockConversations = [{ id: 'c1', user_id: 'u1', status: 'active', updated_at: '2024-01-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' }];
        const mockMessages = [{ id: 'm1', role: 'user', content: 'Hello World', created_at: '2024-01-01T00:00:00Z' }];
        const mockUsers = [{ id: 'u1', email: 'user1@example.com' }];

        (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock(mockConversations, mockUsers, mockMessages));

        render(
            <MemoryRouter>
                <AdminSupport />
            </MemoryRouter>
        );

        // Click conversation
        const convItem = await screen.findByText('user1@example.com');
        fireEvent.click(convItem);

        // Check if message content is displayed
        await waitFor(() => {
            expect(screen.getByText('Hello World')).toBeInTheDocument();
        });
    });
});
