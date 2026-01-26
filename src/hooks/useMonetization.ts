// Hup Global Monetization Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMonetization() {
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [connectId, setConnectId] = useState<string | null>(null);
    const [balance, setBalance] = useState({ available: 0, pending: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch plans
        const { data: plansData } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
        setPlans(plansData || []);

        // Fetch user subscription
        const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(); // Use maybeSingle to avoid 406 on no rows
        setSubscription(subData);

        // Fetch user profile for Connect ID
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('stripe_connect_id')
            .eq('id', user.id)
            .single();

        setConnectId(profile?.stripe_connect_id || null);

        // Fetch user balance from wallet
        const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (walletData) {
            setBalance({
                available: walletData.balance || 0,
                pending: walletData.pending_balance || 0
            });
        }

        // Fetch transaction history
        const { data: transactionsData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        setTransactions(transactionsData || []);

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const requestWithdrawal = async (amount: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase.from('withdrawals').insert({
                user_id: user.id,
                amount,
                currency: 'USD',
                status: 'pending'
            });

            if (error) throw error;
            toast.success('Withdrawal requested successfully');
            fetchData(); // Refresh data after withdrawal request
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return {
        subscription,
        plans,
        connectId,
        balance,
        transactions,
        loading,
        refresh: fetchData,
        requestWithdrawal
    };
}
