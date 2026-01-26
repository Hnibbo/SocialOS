import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    CreditCard,
    ShieldCheck,
    Box,
    Zap,
    Send,
    Plus,
    RefreshCw,
    Download,
    Upload,
    Receipt,
    Filter,
    X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useWallet, Transaction } from '@/hooks/useWallet';

export default function UltimateWallet() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { wallet, transactions, withdrawals, deposits, loading, refresh, requestWithdrawal, requestDeposit, getTransactionReceipt, transferHUP } = useWallet();
    const [activeTab, setActiveTab] = useState<'finance' | 'vault' | 'stats'>('finance');
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [filterType, setFilterType] = useState<string>('all');

    // Transfer form state
    const [transferTarget, setTransferTarget] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    // Withdrawal form state
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalMethod, setWithdrawalMethod] = useState('bank');
    const [withdrawalLoading, setWithdrawalLoading] = useState(false);

    // Deposit form state
    const [depositAmount, setDepositAmount] = useState('');
    const [depositMethod, setDepositMethod] = useState('card');
    const [depositLoading, setDepositLoading] = useState(false);

    const hupPrice = 0.42;

    const filteredTransactions = filterType === 'all' 
        ? transactions 
        : transactions.filter(tx => tx.type === filterType);

    const handleTransfer = async () => {
        if (!transferTarget || !transferAmount || !user) return;

        setTransferLoading(true);
        try {
            // Find user by display name or email (simplified for now, ideally search by node ID/public address)
            const { data: targetProfile } = await supabase
                .from('user_profiles')
                .select('id')
                .or(`display_name.ilike.${transferTarget}`)
                .single();

            if (!targetProfile) throw new Error('Target node not found in OS network.');

            await transferHUP(targetProfile.id, parseFloat(transferAmount), 'Neural Transmission via Social OS');

            setIsTransferOpen(false);
            setTransferTarget('');
            setTransferAmount('');
        } catch (error: any) {
            toast({
                title: "Transmission Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setTransferLoading(false);
        }
    };

    const handleWithdrawal = async () => {
        if (!withdrawalAmount) return;

        setWithdrawalLoading(true);
        try {
            await requestWithdrawal(
                parseFloat(withdrawalAmount),
                withdrawalMethod,
                { details: 'Withdrawal request' }
            );

            setIsWithdrawalOpen(false);
            setWithdrawalAmount('');
            setWithdrawalMethod('bank');
        } catch (error: any) {
            toast({
                title: "Withdrawal Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setWithdrawalLoading(false);
        }
    };

    const handleDeposit = async () => {
        if (!depositAmount) return;

        setDepositLoading(true);
        try {
            await requestDeposit(
                parseFloat(depositAmount),
                depositMethod,
                { details: 'Deposit request' }
            );

            setIsDepositOpen(false);
            setDepositAmount('');
            setDepositMethod('card');
        } catch (error: any) {
            toast({
                title: "Deposit Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setDepositLoading(false);
        }
    };

    const handleViewReceipt = async (transaction: Transaction) => {
        setSelectedTransaction(transaction);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)] p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* OS Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter italic flex items-center gap-3">
                            <Wallet className="w-10 h-10 text-primary" /> BANK OF THE FUTURE
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">
                            Central Finance Node • <span className="text-green-500">Secure Protocol v2.5</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ElectricButton variant="secondary" size="sm" onClick={refresh}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                            Sync Network
                        </ElectricButton>
                        <ElectricButton variant="primary" size="sm" onClick={() => setIsTransferOpen(true)}>
                            <Send className="w-4 h-4 mr-2" />
                            Fast Transfer
                        </ElectricButton>
                        <ElectricButton variant="outline" size="sm" onClick={() => setIsDepositOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Deposit
                        </ElectricButton>
                        <ElectricButton variant="outline" size="sm" onClick={() => setIsWithdrawalOpen(true)}>
                            <Download className="w-4 h-4 mr-2" />
                            Withdraw
                        </ElectricButton>
                    </div>
                </div>

                {/* Main Stats Card */}
                <GlassCard className="p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-48 h-48 text-primary -rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Liquidity</span>
                            <div className="flex items-end gap-2">
                                <h2 className="text-5xl font-black tracking-tighter">{wallet?.balance.toLocaleString() || '0'}</h2>
                                <span className="text-xl font-bold text-primary mb-1">HUP</span>
                            </div>
                            <p className="text-sm font-bold opacity-50">≈ ${(wallet?.balance || 0 * hupPrice).toLocaleString()} USD</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pending Withdrawals</span>
                            <div className="flex items-end gap-2">
                                <h2 className="text-5xl font-black tracking-tighter">{withdrawals.filter(w => w.status === 'pending').length}</h2>
                                <span className="text-xl font-bold text-secondary mb-1">REQUESTS</span>
                            </div>
                            <p className="text-sm font-bold opacity-50">${withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0).toLocaleString()} USD</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Digital Credits (USD Value)</span>
                            <div className="flex items-end gap-2 text-primary">
                                <h2 className="text-5xl font-black tracking-tighter">${0}</h2>
                                <span className="text-sm font-bold mb-1">CREDITS</span>
                            </div>
                            <p className="text-[9px] font-bold opacity-50 uppercase">Internal Transaction Token</p>
                        </div>

                        <div className="flex flex-col gap-2 justify-center">
                            <ElectricButton variant="primary" className="w-full h-12 text-xs font-black italic shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                                PURCHASE CREDITS
                            </ElectricButton>
                            <ElectricButton variant="secondary" className="w-full h-10 text-[10px] font-black uppercase">
                                EXCHANGE HUP
                            </ElectricButton>
                        </div>
                    </div>
                </GlassCard>

                {/* Navigation Tabs */}
                <div className="flex gap-6 border-b border-white/5 pb-4 px-2">
                    {[
                        { id: 'finance', label: 'Cash & Flows', icon: <Activity className="w-4 h-4" /> },
                        { id: 'vault', label: 'Asset Vault', icon: <Box className="w-4 h-4" /> },
                        { id: 'stats', label: 'Analytics', icon: <PieChart className="w-4 h-4" /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {activeTab === 'finance' && (
                        <>
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground pl-2">Transaction Pulse</h3>
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <select 
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs outline-none focus:border-primary/50"
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                        >
                                            <option value="all">All Types</option>
                                            <option value="transfer">Transfers</option>
                                            <option value="payment">Payments</option>
                                            <option value="payout">Payouts</option>
                                            <option value="deposit">Deposits</option>
                                            <option value="withdrawal">Withdrawals</option>
                                            <option value="reward">Rewards</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => {
                                        const isOutgoing = tx.sender_id === user?.id;
                                        return (
                                            <GlassCard key={tx.id} className="p-4 hover:bg-white/5 transition-all cursor-pointer group" onClick={() => handleViewReceipt(tx)}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
                                                            isOutgoing ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500"
                                                        )}>
                                                            {isOutgoing ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold">{isOutgoing ? 'Transmission Sent' : 'Data Received'}</h4>
                                                                <Badge variant="outline" className="text-[8px] border-white/10 uppercase">{tx.type}</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{tx.description || 'Secure Node Transfer'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "text-lg font-black tracking-tight",
                                                            isOutgoing ? "text-white" : "text-green-500"
                                                        )}>
                                                            {isOutgoing ? '-' : '+'}{tx.amount} <span className="text-[10px] font-bold">HUP</span>
                                                        </p>
                                                        <p className="text-[10px] font-bold opacity-30 mt-1 uppercase">
                                                            {new Date(tx.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        );
                                    }) : (
                                        <div className="py-20 text-center text-muted-foreground">
                                            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="font-bold uppercase tracking-widest text-xs">No activity detected on this frequency</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground pl-2">Node Assets</h3>
                                <div className="space-y-4">
                                    <GlassCard className="p-6 border-primary/20 bg-primary/5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-primary/20 rounded-2xl">
                                                <ShieldCheck className="w-6 h-6 text-primary" />
                                            </div>
                                            <Badge className="bg-primary text-dark font-black">ACTIVE</Badge>
                                        </div>
                                        <h4 className="font-bold text-lg mb-1">Staking Node v1</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">Earn passive HUP rewards by supporting the Social OS network infrastructure.</p>
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest border-t border-primary/10 pt-4">
                                            <span>EARNED</span>
                                            <span className="text-primary">+124.50 HUP</span>
                                        </div>
                                    </GlassCard>

                                    <GlassCard className="p-6 hover:bg-white/5 cursor-pointer">
                                        <div className="flex items-center justify-between mb-4">
                                            <CreditCard className="w-6 h-6 text-muted-foreground" />
                                            <Plus className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <h4 className="font-bold mb-1">Bank Account</h4>
                                        <p className="text-xs text-muted-foreground">Connect for seamless fiat on-ramp/off-ramp.</p>
                                    </GlassCard>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'vault' && (
                        <div className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Digital Artifacts & Asset Collection</h3>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input placeholder="Search vault..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                                <Box className="w-16 h-16 mx-auto mb-6 text-white/5" />
                                <h4 className="text-xl font-bold mb-2 uppercase">Vault Offline</h4>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">You haven't collected any digital artifacts yet. Explore the world map to find secret drops.</p>
                                <ElectricButton variant="secondary" onClick={() => window.location.href = '/map'}>
                                    Launch Explorer
                                </ElectricButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transfer Dialog */}
            <AnimatePresence>
                {isTransferOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black tracking-tighter italic">NEW TRANSMISSION</h3>
                                    <button onClick={() => setIsTransferOpen(false)} className="text-muted-foreground hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Node (Name/ID)</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary transition-all"
                                                placeholder="Search user..."
                                                value={transferTarget}
                                                onChange={(e) => setTransferTarget(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Transmit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-4xl font-black outline-none focus:border-primary transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                value={transferAmount}
                                                onChange={(e) => setTransferAmount(e.target.value)}
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">HUP</div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                                            <span>Current: {wallet?.balance} HUP</span>
                                            <span>Fee: 0.00 HUP</span>
                                        </div>
                                    </div>

                                    <ElectricButton
                                        className="w-full py-4 text-md font-black italic"
                                        disabled={transferLoading || !transferTarget || !transferAmount}
                                        onClick={handleTransfer}
                                    >
                                        {transferLoading ? 'SECURING CHANNEL...' : 'BROADCAST TRANSFER'}
                                    </ElectricButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Withdrawal Dialog */}
            <AnimatePresence>
                {isWithdrawalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black tracking-tighter italic">WITHDRAWAL</h3>
                                    <button onClick={() => setIsWithdrawalOpen(false)} className="text-muted-foreground hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Withdrawal Method</label>
                                        <select 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-sm"
                                            value={withdrawalMethod}
                                            onChange={(e) => setWithdrawalMethod(e.target.value)}
                                        >
                                            <option value="bank">Bank Transfer</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="crypto">Crypto Wallet</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Withdraw</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-4xl font-black outline-none focus:border-primary transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                value={withdrawalAmount}
                                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">HUP</div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                                            <span>Available: {wallet?.balance} HUP</span>
                                            <span>Fee: 2.5%</span>
                                        </div>
                                    </div>

                                    <ElectricButton
                                        className="w-full py-4 text-md font-black italic"
                                        disabled={withdrawalLoading || !withdrawalAmount}
                                        onClick={handleWithdrawal}
                                    >
                                        {withdrawalLoading ? 'PROCESSING...' : 'REQUEST WITHDRAWAL'}
                                    </ElectricButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Deposit Dialog */}
            <AnimatePresence>
                {isDepositOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black tracking-tighter italic">DEPOSIT</h3>
                                    <button onClick={() => setIsDepositOpen(false)} className="text-muted-foreground hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deposit Method</label>
                                        <select 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-primary transition-all text-sm"
                                            value={depositMethod}
                                            onChange={(e) => setDepositMethod(e.target.value)}
                                        >
                                            <option value="card">Credit/Debit Card</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="crypto">Crypto Wallet</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Deposit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-4xl font-black outline-none focus:border-primary transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">USD</div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-2 opacity-50">
                                            <span>Exchange Rate: 1 HUP = ${hupPrice}</span>
                                            <span>Fee: 1.5%</span>
                                        </div>
                                    </div>

                                    <ElectricButton
                                        className="w-full py-4 text-md font-black italic"
                                        disabled={depositLoading || !depositAmount}
                                        onClick={handleDeposit}
                                    >
                                        {depositLoading ? 'PROCESSING...' : 'REQUEST DEPOSIT'}
                                    </ElectricButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Transaction Receipt Dialog */}
            <AnimatePresence>
                {selectedTransaction && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black tracking-tighter italic">TRANSACTION RECEIPT</h3>
                                    <button onClick={() => setSelectedTransaction(null)} className="text-muted-foreground hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Receipt className="w-8 h-8 text-primary" />
                                        <div>
                                            <h4 className="font-bold text-lg">{selectedTransaction.type.toUpperCase()} RECEIPT</h4>
                                            <p className="text-xs text-muted-foreground">Transaction ID: {selectedTransaction.id}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</span>
                                            <p className="text-sm font-bold">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</span>
                                            <Badge variant={selectedTransaction.status === 'completed' ? 'default' : 'outline'} className={selectedTransaction.status === 'completed' ? 'bg-green-500' : ''}>
                                                {selectedTransaction.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</span>
                                            <p className="text-sm font-bold">{selectedTransaction.amount} HUP</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Currency</span>
                                            <p className="text-sm font-bold">{selectedTransaction.currency}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</span>
                                        <p className="text-sm font-bold">{selectedTransaction.description || 'No description'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Transaction Hash</span>
                                        <p className="text-sm font-mono text-muted-foreground break-all">{selectedTransaction.tx_hash || 'N/A'}</p>
                                    </div>

                                    {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Additional Details</span>
                                            <div className="text-sm font-mono text-muted-foreground">
                                                {JSON.stringify(selectedTransaction.metadata, null, 2)}
                                            </div>
                                        </div>
                                    )}

                                    <ElectricButton
                                        className="w-full py-4 text-md font-black italic"
                                        onClick={() => setSelectedTransaction(null)}
                                    >
                                        CLOSE RECEIPT
                                    </ElectricButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const X = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <svg onClick={onClick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
