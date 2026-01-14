// Hup Safety & Trust Hook
// Handles panic mode, blocks, and reports

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PanicEvent {
    id: string;
    triggered_at: string;
    location?: { lat: number; lng: number };
    context?: Record<string, any>;
    resolved_at?: string;
}

interface Block {
    id: string;
    blocked_id: string;
    blocked_at: string;
    reason?: string;
}

export function useSafety() {
    const [panicActive, setPanicActive] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch blocked users
    const fetchBlocks = useCallback(async () => {
        const { data } = await supabase
            .from('blocks')
            .select('*')
            .order('blocked_at', { ascending: false });
        setBlocks(data || []);
    }, []);

    // Trigger Panic Mode
    const triggerPanic = async (location?: { lat: number; lng: number }, context?: Record<string, any>) => {
        setLoading(true);
        try {
            // 1. Create panic event
            const { error } = await supabase.from('panic_events').insert({
                location: location ? `POINT(${location.lng} ${location.lat})` : null,
                context
            });

            if (error) throw error;

            // 2. Update presence to invisible/offline
            await supabase.from('user_presence').update({
                is_visible: false,
                availability: 'offline',
                panic_mode: true
            }).eq('user_id', (await supabase.auth.getUser()).data.user?.id);

            setPanicActive(true);
            toast.success('Panic mode activated. Your location is now hidden.');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Deactivate panic mode
    const deactivatePanic = async () => {
        setLoading(true);
        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;

            // Update panic event as resolved
            await supabase.from('panic_events')
                .update({ resolved_at: new Date().toISOString(), resolution: 'manual_deactivation' })
                .eq('user_id', userId)
                .is('resolved_at', null);

            // Restore visibility
            await supabase.from('user_presence').update({
                is_visible: true,
                availability: 'available',
                panic_mode: false
            }).eq('user_id', userId);

            setPanicActive(false);
            toast.success('Panic mode deactivated. You are visible again.');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Block a user
    const blockUser = async (blockedId: string, reason?: string) => {
        try {
            const { error } = await supabase.from('blocks').insert({
                blocked_id: blockedId,
                reason
            });
            if (error) throw error;
            toast.success('User blocked');
            fetchBlocks();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Unblock a user
    const unblockUser = async (blockedId: string) => {
        try {
            const { error } = await supabase.from('blocks').delete()
                .eq('blocked_id', blockedId);
            if (error) throw error;
            toast.success('User unblocked');
            fetchBlocks();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Report content/user
    const report = async (targetType: 'user' | 'content' | 'message' | 'group', targetId: string, reason: string, details?: string) => {
        try {
            const { error } = await supabase.from('reports').insert({
                target_type: targetType,
                target_id: targetId,
                reason,
                details
            });
            if (error) throw error;
            toast.success('Report submitted. Thank you for keeping our community safe.');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return {
        panicActive,
        blocks,
        loading,
        triggerPanic,
        deactivatePanic,
        blockUser,
        unblockUser,
        report,
        fetchBlocks
    };
}
