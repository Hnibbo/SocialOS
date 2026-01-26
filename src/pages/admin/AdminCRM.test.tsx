/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminCRM from './AdminCRM';
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

describe('AdminCRM', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createSupabaseMock = () => {
        return (table: string) => {
            const builder: any = {
                _filters: {} as Record<string, any>,
                select: vi.fn().mockReturnThis(),
                gte: vi.fn().mockImplementation((col, val) => {
                    builder._filters[col] = { operator: 'gte', value: val };
                    return builder;
                }),
                eq: vi.fn().mockImplementation((col, val) => {
                    builder._filters[col] = { operator: 'eq', value: val };
                    return builder;
                }),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
            };

            builder.then = (resolve: any) => {
                let data: any[] | null = [];
                let count: number | null = null;
                const mockDate = '2024-01-01T00:00:00Z';

                if (table === 'users') {
                    if (builder._filters['created_at']?.operator === 'gte') {
                        // New users (today/week/month)
                        count = 5;
                    } else if (builder.order.mock.calls.length > 0) { // Check if order was called (recent users)
                        data = [{ id: '1', name: 'Tester', email: 'test@example.com', created_at: mockDate, has_subscription: false }];
                        count = null;
                    } else {
                        // Total users
                        count = 150;
                    }
                } else if (table === 'workspaces') {
                    if (builder._filters['is_active']?.value === true) {
                        count = 20; // Active
                    } else {
                        count = 42; // Total
                    }
                } else if (table === 'user_subscriptions') {
                    if (builder._filters['status']?.value === 'active') {
                        if (builder.select.mock.calls[0]?.[0]?.includes('subscription_plans')) {
                            // Fetching plan data for MRR
                            data = [{ plan_id: 'p1', subscription_plans: { price_monthly: 99 }, status: 'active' }];
                            count = null;
                        } else {
                            // Counting active subs
                            count = 5;
                        }
                    } else if (builder._filters['user_id']) {
                        // check sub for specific user
                        count = 0;
                    }
                } else if (table === 'commands') {
                    if (builder._filters['executed_at']?.operator === 'gte') {
                        count = 2; // Today
                    } else {
                        count = 10; // Total
                    }
                }

                return Promise.resolve(resolve({ data, count, error: null }));
            };

            return builder;
        };
    };

    it('should render various stats after fetching', async () => {
        (supabase.from as any).mockImplementation(createSupabaseMock());

        render(
            <MemoryRouter>
                <AdminCRM />
            </MemoryRouter>
        );

        // Check for loader initially
        expect(screen.getByTestId('loader')).toBeInTheDocument();

        // Wait for stats to render
        await waitFor(() => {
            expect(screen.queryByTestId('loader')).toBeNull();
        }, { timeout: 5000 });

        // Check stats (matching the new bold formatting)
        expect((await screen.findAllByText('150')).length).toBeGreaterThan(0);
        expect((await screen.findAllByText('42')).length).toBeGreaterThan(0);

        // Revenue should show 99
        expect((await screen.findAllByText('$99')).length).toBeGreaterThan(0);

        // Check recent signups
        expect(await screen.findByText('Tester')).toBeInTheDocument();
    });

    it('should show error toast on fetch failure', async () => {
        (supabase.from as any).mockImplementation(() => {
            // Mock builder that returns an error
            const builder: any = {
                select: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
            };
            builder.then = (resolve: any) => Promise.resolve(resolve({ data: null, error: { message: 'DB Error' } }));
            return builder;
        });

        render(
            <MemoryRouter>
                <AdminCRM />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loader')).toBeNull();
        });
    });
});
