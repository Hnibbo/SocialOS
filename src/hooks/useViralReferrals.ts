
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useViralReferrals(userId: string) {
    const [inviteCode, setInviteCode] = useState<string>('');
    const [inviteCount, setInviteCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const loadReferrals = async () => {
            // 1. Get or create invite code (simple hash of user id for now)
            const code = userId.substring(0, 8).toUpperCase();
            setInviteCode(code);

            // 2. Count invites
            const { count, error } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', userId);

            if (!error && count !== null) {
                setInviteCount(count);
            }
            setLoading(false);
        };

        loadReferrals();
    }, [userId]);

    const copyInviteLink = () => {
        const link = `${window.location.origin}/signup?ref=${inviteCode}`;
        navigator.clipboard.writeText(link);
        return link;
    };

    return { inviteCode, inviteCount, copyInviteLink, loading };
}
