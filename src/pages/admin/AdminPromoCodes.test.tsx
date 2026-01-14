/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminPromoCodes from './AdminPromoCodes';
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

describe('AdminPromoCodes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createSupabaseMock = (promoData: any = [], plansData: any = []) => {
        return (table: string) => {
            const builder: any = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: promoData, error: null }),
                eq: vi.fn().mockImplementation(() => {
                    // For plans fetch: .select().eq('is_active', true)
                    // For update/delete: .update().eq() or .delete().eq()
                    // We can just resolve successfully for all eq calls for now
                    if (table === 'subscription_plans') {
                        return Promise.resolve({ data: plansData, error: null });
                    }
                    return Promise.resolve({ data: null, error: null });
                }),
                insert: vi.fn().mockResolvedValue({ data: null, error: null }),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
            };
            return builder;
        };
    };

    it('should render promo codes and stats', async () => {
        const mockPromoCodes = [
            { id: '1', code: 'SAVE10', discount_type: 'percentage', discount_value: 10, is_active: true, created_at: '2024-01-01T00:00:00Z', plan_id: 'plan1' },
            { id: '2', code: 'SAVE20', discount_type: 'percentage', discount_value: 20, is_active: false, created_at: '2024-01-01T00:00:00Z', plan_id: null },
        ];
        const mockPlans = [{ id: 'plan1', name: 'Test Plan' }];

        (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock(mockPromoCodes, mockPlans));

        render(
            <MemoryRouter>
                <AdminPromoCodes />
            </MemoryRouter>
        );

        expect(screen.getByTestId('loader')).toBeTruthy();

        await waitFor(() => {
            expect(screen.queryByTestId('loader')).toBeNull();
        });

        expect(screen.getByText('SAVE10')).toBeTruthy();
        expect(screen.getByText('SAVE20')).toBeTruthy();
        expect(screen.getByText('1')).toBeTruthy(); // Active count correctly shown in stat card
    });

    it('should handle promo code creation', async () => {
        (supabase.from as unknown as Mock).mockImplementation(createSupabaseMock());

        render(
            <MemoryRouter>
                <AdminPromoCodes />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.queryByTestId('loader')).toBeNull());

        // Click New Promo Code button
        fireEvent.click(screen.getByTestId('new-promo-btn'));

        expect(screen.getByText(/Create Promo Code/i)).toBeTruthy();

        // Fill form using data-testids
        fireEvent.change(screen.getByTestId('promo-code-input'), { target: { value: 'WELCOME20' } });
        fireEvent.change(screen.getByTestId('promo-value-input'), { target: { value: '20' } });

        // Save
        fireEvent.click(screen.getByText('Create'));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('promo_codes');
        });
    });
});
