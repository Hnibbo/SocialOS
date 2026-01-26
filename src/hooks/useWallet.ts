import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description: string | null;
  metadata: Record<string, unknown>;
  tx_hash: string | null;
  escrow_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setWallet(walletData);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setTransactions(transactionsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setWithdrawals(withdrawalsData || []);

      // Fetch deposits
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setDeposits(depositsData || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const requestWithdrawal = async (amount: number, method: string, details: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount,
        currency: 'HUP',
        status: 'pending',
        method,
        details
      });

      if (error) throw error;

      toast.success('Withdrawal requested successfully');
      fetchWalletData();
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error.message);
    }
  };

  const requestDeposit = async (amount: number, method: string, details: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount,
        currency: 'HUP',
        status: 'pending',
        method,
        details
      });

      if (error) throw error;

      toast.success('Deposit requested successfully');
      fetchWalletData();
    } catch (error: any) {
      console.error('Error requesting deposit:', error);
      toast.error(error.message);
    }
  };

  const getTransactionReceipt = async (transactionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      // Check if user is involved in the transaction
      if (data.sender_id !== user.id && data.receiver_id !== user.id) {
        throw new Error('You do not have access to this transaction');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching transaction receipt:', error);
      toast.error(error.message);
      return null;
    }
  };

  const transferHUP = async (receiverId: string, amount: number, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: success, error } = await supabase.rpc('transfer_hup', {
        p_receiver_id: receiverId,
        p_amount: amount,
        p_description: description || 'P2P Transfer'
      });

      if (error) throw error;
      if (!success) throw new Error('Transfer failed');

      toast.success('Transfer successful');
      fetchWalletData();
    } catch (error: any) {
      console.error('Error transferring HUP:', error);
      toast.error(error.message);
    }
  };

  return {
    wallet,
    transactions,
    withdrawals,
    deposits,
    loading,
    refresh: fetchWalletData,
    requestWithdrawal,
    requestDeposit,
    getTransactionReceipt,
    transferHUP
  };
}
