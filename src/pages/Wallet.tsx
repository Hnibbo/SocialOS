import React, { useState, useEffect } from 'react';
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
    Gem,
    Send,
    Plus,
    RefreshCw,
    TrendingUp,
    ExternalLink,
    ChevronRight,
    Search,
    Lock,
    PieChart,
    Activity
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function UltimateWallet() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [balance, setBalance] = useState<number>(0);
    const [credits, setCredits] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'finance' | 'vault' | 'stats'>('finance');
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    // Transfer form state
    const [transferTarget, setTransferTarget] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    const hupPrice = 0.42;

    useEffect(() => {
        if (user) {
            fetchWalletData();
        }
    }, [user]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);

            // 1. Get Wallet Balance
            const { data: wallet } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (wallet) {
                setBalance(wallet.balance);
                setCredits(wallet.credits_balance || 0);
            }

            // 2. Get Transaction History (Combined from legacy and ultimate table)
            const { data: txs } = await supabase
                .from('financial_transactions')
                .select('*')
                .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
                .order('created_at', { ascending: false });

            setTransactions(txs || []);

            // 3. Get Inventory
            const { data: assets } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', user?.id);

            setInventory(assets || []);

        } catch (error) {
            console.error('Error fetching wallet:', error);
        } finally {
            setLoading(false);
        }
    };

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

            const { data: success, error } = await supabase.rpc('process_platform_transaction', {
                p_receiver_id: targetProfile.id,
                p_amount: parseFloat(transferAmount),
                p_type: 'p2p_transfer',
                p_description: 'Neural Transmission via Social OS'
            });

            if (error) throw error;

            toast({
                title: "Data Transferred!",
                description: `${transferAmount} HUP successfully transmitted to ${transferTarget}.`,
            });

            setIsTransferOpen(false);
            setTransferTarget('');
            setTransferAmount('');
            fetchWalletData();
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
                        <ElectricButton variant="secondary" size="sm" onClick={fetchWalletData}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                            Sync Network
                        </ElectricButton>
                        <ElectricButton variant="primary" size="sm" onClick={() => setIsTransferOpen(true)}>
                            <Send className="w-4 h-4 mr-2" />
                            Fast Transfer
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
                                <h2 className="text-5xl font-black tracking-tighter">{balance.toLocaleString()}</h2>
                                <span className="text-xl font-bold text-primary mb-1">HUP</span>
                            </div>
                            <p className="text-sm font-bold opacity-50">≈ ${(balance * hupPrice).toLocaleString()} USD</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vault Value</span>
                            <div className="flex items-end gap-2">
                                <h2 className="text-5xl font-black tracking-tighter">{inventory.length}</h2>
                                <span className="text-xl font-bold text-secondary mb-1">ASSETS</span>
                            </div>
                            <p className="text-sm font-bold opacity-50">3 Legendary • 5 Epic</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Digital Credits (USD Value)</span>
                            <div className="flex items-end gap-2 text-primary">
                                <h2 className="text-5xl font-black tracking-tighter">${credits.toLocaleString()}</h2>
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
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground pl-2">Transaction Pulse</h3>
                                <div className="space-y-3">
                                    {transactions.length > 0 ? transactions.map((tx) => {
                                        const isOutgoing = tx.sender_id === user?.id;
                                        return (
                                            <GlassCard key={tx.id} className="p-4 hover:bg-white/5 transition-all cursor-pointer group">
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

                            {inventory.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {inventory.map((asset) => (
                                        <motion.div
                                            key={asset.id}
                                            whileHover={{ y: -5 }}
                                            className="group"
                                        >
                                            <GlassCard className="p-0 overflow-hidden border-white/5 group-hover:border-primary/30 transition-all">
                                                <div className="aspect-square relative bg-zinc-900 overflow-hidden">
                                                    <img src={asset.media_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute top-2 right-2">
                                                        <div className={cn(
                                                            "p-1 rounded bg-black/60 border border-white/10",
                                                            asset.rarity === 'legendary' ? "text-yellow-400" : "text-primary"
                                                        )}>
                                                            <Gem className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest truncate">{asset.name}</h4>
                                                    <p className="text-[8px] text-muted-foreground mt-1 uppercase">{asset.asset_type}</p>
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                    {/* Placeholder for "Unlock more" */}
                                    <div className="border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-6 text-center group hover:border-primary/20 cursor-pointer transition-all">
                                        <Lock className="w-8 h-8 text-white/10 group-hover:text-primary/30 transition-colors mb-2" />
                                        <span className="text-[10px] font-black text-muted-foreground uppercase">Discover More</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
                                    <Box className="w-16 h-16 mx-auto mb-6 text-white/5" />
                                    <h4 className="text-xl font-bold mb-2 uppercase">Vault Offline</h4>
                                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">You haven't collected any digital artifacts yet. Explore the world map to find secret drops.</p>
                                    <ElectricButton variant="secondary" onClick={() => window.location.href = '/map'}>
                                        Launch Explorer
                                    </ElectricButton>
                                </div>
                            )}
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
                                            <span>Current: {balance} HUP</span>
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
        </div>
    );
}

const X = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <svg onClick={onClick} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
