/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminPlans from './AdminPlans';
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


describe('AdminPlans', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createSupabaseMock = (plans: any[] = []) => {
        return () => {
            const builder: any = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
            };
            builder.then = (resolve: any) => Promise.resolve(resolve({ data: plans, count: plans.length, error: null }));
            return builder;
        };
    };

    it('should render plans tab by default', async () => {
        const mockPlans = [
            { id: '1', name: 'Free Plan', price_monthly: 0, price_yearly: 0, is_active: true, features: [], limits: {} },
        ];

        (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock(mockPlans));

        render(
            <MemoryRouter>
                <AdminPlans />
            </MemoryRouter>
        );

        expect(screen.getByTestId('loader')).toBeTruthy();

        await waitFor(() => {
            expect(screen.queryByTestId('loader')).toBeNull();
        }, { timeout: 10000 });

        expect(screen.getByText('Free Plan')).toBeTruthy();
    });
});
