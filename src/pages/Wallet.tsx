import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, ShieldCheck, Box, Zap, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function WalletPage() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const hupPrice = 0.42;
    const [activeTab, setActiveTab] = useState<'finance' | 'vault'>('finance');

    useEffect(() => {
        if (!user) return;

        const fetchWallet = async () => {
            try {
                // 1. Get Wallet
                const { data: wallet, error: walletError } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (walletError) throw walletError;

                if (wallet) {
                    setBalance(wallet.balance);

                    // 2. Get Transactions
                    const { data: txs, error: txsError } = await supabase
                        .from('wallet_transactions') // Updated table name if applicable, or keep original
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (txsError) throw txsError;
                    setTransactions(txs || []);

                    // 3. Get Assets
                    const { data: assetData, error: assetError } = await supabase
                        .from('digital_assets')
                        .select('*')
                        .eq('owner_id', user.id);

                    if (assetError) throw assetError;
                    setAssets(assetData || []);
                }

            } catch (err) {
                console.error("Error fetching wallet:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, [user]);

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32 lg:pb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight text-white">Wallet</h1>
                    <p className="text-gray-400">Manage your HUP assets and subscription.</p>
                </div>
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 px-3 py-1">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Secure
                </Badge>
            </motion.div>

            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-black z-0" />
                <div className="absolute inset-0 bg-[url('/logo.png')] opacity-5 bg-center bg-no-repeat bg-contain z-0 mix-blend-overlay" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
                        <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                            {balance.toLocaleString()} <span className="text-purple-500">HUP</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-2">≈ ${(balance * hupPrice).toFixed(2)} USD</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Button size="lg" className="flex-1 md:flex-none rounded-xl bg-white text-black hover:bg-gray-200 font-bold">
                            <ArrowDownLeft className="w-4 h-4 mr-2" />
                            Deposit
                        </Button>
                        <Button size="lg" className="flex-1 md:flex-none rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold border border-white/10">
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Send
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Tab Switcher */}
            <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('finance')}
                    className={`px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'finance' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                        }`}
                >
                    Finance
                </button>
                <button
                    onClick={() => setActiveTab('vault')}
                    className={`px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vault' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                        }`}
                >
                    Vault
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'finance' ? (
                    <motion.div
                        key="finance"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="h-full bg-black/40 border-white/10 backdrop-blur">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-purple-500" />
                                        Payment Methods
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-6 bg-blue-500/20 rounded border border-blue-500/50" />
                                            <div>
                                                <p className="text-sm font-medium text-white">Visa ending in 4242</p>
                                                <p className="text-xs text-gray-400">Expires 12/28</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">Default</Badge>
                                    </div>
                                    <Button variant="outline" className="w-full border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40">
                                        + Add Payment Method
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* History */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-full bg-black/40 border-white/10 backdrop-blur">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <History className="w-5 h-5 text-cyan-500" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {loading && <p className="text-gray-400">Loading blockchain data...</p>}
                                        {!loading && transactions.length === 0 && <p className="text-gray-400">No transactions found.</p>}
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'received' || tx.type === 'deposit' ? 'bg-green-500/20 text-green-500' :
                                                        tx.type === 'send' || tx.type === 'purchase' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-blue-500/20 text-blue-500'
                                                        }`}>
                                                        {tx.type === 'received' || tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> :
                                                            tx.type === 'send' || tx.type === 'purchase' ? <ArrowUpRight className="w-4 h-4" /> :
                                                                <Wallet className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white capitalize">
                                                            {tx.description || tx.type}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(tx.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`font-mono font-bold ${tx.type === 'received' || tx.type === 'deposit' ? 'text-green-500' : 'text-white'
                                                    }`}>
                                                    {(tx.type === 'received' || tx.type === 'deposit') ? '+' : '-'}{tx.amount}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="vault"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    >
                        {assets.length === 0 ? (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <Box className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">Your vault is empty</p>
                                <Button variant="link" className="text-primary mt-2">Explore the Social Grid to find assets</Button>
                            </div>
                        ) : (
                            assets.map((asset) => (
                                <Card key={asset.id} className="bg-black/40 border-white/10 overflow-hidden group hover:border-primary/50 transition-all">
                                    <div className="aspect-square bg-gradient-to-br from-zinc-800 to-black p-8 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {asset.asset_type === 'sticker' && <span className="text-6xl animate-bounce-slow">🎨</span>}
                                        {asset.asset_type === 'hologram' && <Zap className="w-16 h-16 text-primary animate-pulse" />}
                                        {asset.asset_type === 'gem' && <Gem className="w-16 h-16 text-cyan-400" />}
                                        <div className="absolute top-2 right-2">
                                            <Badge className="bg-primary/20 text-primary border-primary/20 text-[8px]">{asset.asset_type.toUpperCase()}</Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <h4 className="text-sm font-bold text-white truncate">{asset.metadata?.name || 'Unknown Fragment'}</h4>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Found in Tokyo Sector</p>
                                        <Button size="sm" variant="ghost" className="w-full mt-4 h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white">
                                            Activate
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
