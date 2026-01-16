import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Target,
    Users,
    Shield,
    Cpu,
    Map as MapIcon,
    MessageSquare,
    TrendingUp,
    Award,
    Crown,
    Sparkles,
    Search,
    ChevronRight,
    Activity,
    History,
    Terminal
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { useAuth } from '@/hooks/useAuth';
import { useSocialOS } from '@/contexts/SocialOSContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';

export default function Dashboard() {
    const { user } = useAuth();
    const { energy, xp, level, setIsCommandHubOpen, setIsAIOpen } = useSocialOS();
    const [stats, setStats] = useState({
        matches: 0,
        transmissions: 0,
        territory: 0,
        assets: 0
    });
    const [recentSignals, setRecentSignals] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            // This would normally be a series of counts or a robust RPC
            // Simulation for now to keep it lightning fast
            setStats({
                matches: 12,
                transmissions: 145,
                territory: 3,
                assets: 8
            });

            // Fetch recent messages or matches
            const { data: signals } = await supabase
                .from('conversations')
                .select('*, participants(*)')
                .order('last_message_at', { ascending: false })
                .limit(3);

            setRecentSignals(signals || []);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Node-77';

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_50%)] p-4 md:p-8 pb-32">
            <SEO title="Command Center" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* OS Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Operational Status: Optimal</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter italic flex items-center gap-4">
                            COMMAND CENTER <span className="text-2xl not-italic opacity-30">//</span> <span className="text-gradient">{userName.toUpperCase()}</span>
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <ElectricButton variant="secondary" onClick={() => setIsCommandHubOpen(true)}>
                            <Search className="w-4 h-4 mr-2" /> Global Search
                        </ElectricButton>
                        <ElectricButton variant="primary" onClick={() => setIsAIOpen(true)}>
                            <Sparkles className="w-4 h-4 mr-2" /> Summon AI
                        </ElectricButton>
                    </div>
                </div>

                {/* Main Stats HUD */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Neural Matches', value: stats.matches, icon: HeartIcon, color: 'text-pink-500', trend: '+2 today' },
                        { label: 'Global Rank', value: '#1,240', icon: Crown, color: 'text-amber-500', trend: 'Top 5%' },
                        { label: 'Network Energy', value: `${energy}%`, icon: Zap, color: 'text-primary', trend: 'Regenerating' },
                        { label: 'Level', value: level, icon: Award, color: 'text-secondary', trend: `${1000 - (xp % 1000)} XP to next` }
                    ].map((stat, i) => (
                        <GlassCard key={i} className="p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <stat.icon className={cn("w-12 h-12", stat.color)} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">{stat.label}</p>
                            <h3 className="text-4xl font-black tracking-tighter mb-1">{stat.value}</h3>
                            <p className={cn("text-[9px] font-bold uppercase tracking-widest", stat.color)}>{stat.trend}</p>
                        </GlassCard>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Control Panel */}
                    <div className="lg:col-span-2 space-y-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground pl-2 italic">Active Transmissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlassCard className="p-0 overflow-hidden group border-primary/20 hover:border-primary/50" onClick={() => window.open('/map', '_self')}>
                                <div className="h-48 bg-zinc-900 relative">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                                    <div className="absolute bottom-4 left-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapIcon className="w-4 h-4 text-primary" />
                                            <h4 className="font-black italic uppercase tracking-widest">Territory Map</h4>
                                        </div>
                                        <p className="text-[10px] text-white/60 uppercase tracking-widest">3 Cells Captured • 12.4km Explored</p>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-0 overflow-hidden group border-secondary/20 hover:border-secondary/50" onClick={() => window.open('/social', '_self')}>
                                <div className="h-48 bg-zinc-900 relative">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                                    <div className="absolute bottom-4 left-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="w-4 h-4 text-secondary" />
                                            <h4 className="font-black italic uppercase tracking-widest">The Grid Pulse</h4>
                                        </div>
                                        <p className="text-[10px] text-white/60 uppercase tracking-widest">12 New Broadcasts • 5.1k Engagement</p>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Recent Neural Activity */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground italic">Neural Signals</h3>
                                <button className="text-[8px] font-black uppercase tracking-widest text-primary hover:underline">View Deep Log</button>
                            </div>
                            <div className="space-y-3">
                                {recentSignals.length > 0 ? recentSignals.map((signal, i) => (
                                    <GlassCard key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${signal.id}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold">{signal.name || 'Anonymous Node'}</h4>
                                                <p className="text-xs text-muted-foreground">Last synchronized {new Date(signal.last_message_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <ElectricButton variant="ghost" size="sm" onClick={() => window.location.href = '/messaging'}>
                                            <MessageSquare className="w-4 h-4" />
                                        </ElectricButton>
                                    </GlassCard>
                                )) : (
                                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                                        <Activity className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Listening for frequencies...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar HUD */}
                    <div className="space-y-8">
                        {/* OS Identity */}
                        <GlassCard className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-2xl font-black italic">
                                    {userName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic italic tracking-tighter">{userName}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Elite Member • v2.5 Protocol</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span>System XP</span>
                                        <span>{xp % 1000} / 1000</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(xp % 1000) / 10}%` }}
                                            className="h-full bg-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span>Bio-Neural Energy</span>
                                        <span>{energy}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${energy}%` }}
                                            className="h-full bg-secondary shadow-[0_0_10px_rgba(240,0,255,0.5)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Recent Discoveries */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground pl-2 italic">Neural Repository</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-all">
                                        <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                                            {i % 2 === 0 ? <Cpu className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <ElectricButton variant="secondary" className="w-full text-[10px]" onClick={() => window.location.href = '/wallet'}>
                                ENTER VAULT
                            </ElectricButton>
                        </div>

                        {/* Event Feed */}
                        <GlassCard className="p-4 bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Global Event</h4>
                            </div>
                            <h5 className="font-bold text-sm mb-1 italic">NEURAL SYNC: TOKYO NIGHTS</h5>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">A mass synchronization event is starting in 2 hours. Join to earn 2x XP.</p>
                        </GlassCard>

                        {/* Console Access */}
                        <div className="p-4 rounded-3xl bg-black border border-white/5 font-mono text-[10px] space-y-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
                            <div className="flex items-center gap-2 text-green-500 mb-2">
                                <Terminal className="w-3 h-3" />
                                <span className="font-black uppercase tracking-widest">Kernel Access</span>
                            </div>
                            <p className="text-gray-500 group-hover:text-green-500/50 transition-colors">{">"} sync_protocol --version 2.5</p>
                            <p className="text-gray-500 group-hover:text-green-500/50 transition-colors">{">"} loading_vibe_matrix... [DONE]</p>
                            <p className="text-gray-500 group-hover:text-green-500/50 transition-colors">{">"} status: ready_for_transmission</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const HeartIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);
