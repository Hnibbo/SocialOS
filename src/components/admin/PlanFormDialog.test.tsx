import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlanFormDialog from './PlanFormDialog';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getSession: vi.fn(),
        },
        functions: {
            invoke: vi.fn(),
        },
    },
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));


describe('PlanFormDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockOnOpenChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render correctly when open', () => {
        render(
            <PlanFormDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                plan={null}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('Create New Plan')).toBeTruthy();
        expect(screen.getByLabelText(/Plan Name/i)).toBeTruthy();
    });

    it('should handle plan creation', async () => {
        // Mock successful session
        (supabase.auth.getSession as unknown as Mock).mockResolvedValue({
            data: { session: { access_token: 'fake-token' } },
            error: null,
        });

        // Mock supabase insert
        const insertMock = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as unknown as Mock).mockReturnValue({
            insert: insertMock,
        });

        render(
            <PlanFormDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                plan={null}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/Plan Name/i), { target: { value: 'Pro Plan' } });
        fireEvent.change(screen.getByLabelText(/Monthly Price/i), { target: { value: '29' } });

        // Click Save
        fireEvent.click(screen.getByText('Create Plan'));

        await waitFor(() => {
            expect(insertMock).toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});
