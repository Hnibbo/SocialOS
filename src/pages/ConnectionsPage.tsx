import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Briefcase,
    Sparkles,
    RefreshCw,
    X,
    Check,
    Search,
    Filter,
    Zap,
    Target,
    Star,
    Shield,
    MessageSquare,
    UserPlus
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ConnectionsPage() {
    const [mode, setMode] = useState<'romantic' | 'professional'>('romantic');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchSubscribers();
    }, [mode]);

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('find_neural_matches', {
                p_match_type: mode,
                p_limit: 20
            });

            if (error) throw error;
            setProfiles(data || []);
            setCurrentIndex(0);
        } catch (error: any) {
            toast({
                title: "Neural Scan Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (profiles.length === 0) return;

        const targetProfile = profiles[currentIndex];

        if (direction === 'right') {
            toast({
                title: mode === 'romantic' ? "Spark Ignited!" : "Connection Request Sent!",
                description: `You've transmitted a signal to ${targetProfile.display_name}.`,
            });

            // Record match intent in DB
            if (mode === 'romantic') {
                await supabase.from('dating_swipes').insert({
                    swiper_id: user?.id,
                    target_id: targetProfile.id,
                    direction: 'right'
                });
            } else {
                await supabase.from('pro_matches').insert({
                    user_one: user?.id,
                    user_two: targetProfile.id,
                    intent_type: 'collaboration'
                });
            }
        }

        if (currentIndex < profiles.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setProfiles([]);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Control */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative">
                        <button
                            onClick={() => setMode('romantic')}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all z-10",
                                mode === 'romantic' ? "text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", mode === 'romantic' && "fill-primary text-primary")} /> Discovery
                        </button>
                        <button
                            onClick={() => setMode('professional')}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all z-10",
                                mode === 'professional' ? "text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <Briefcase className={cn("w-4 h-4", mode === 'professional' && "fill-secondary text-secondary")} /> Networking
                        </button>
                        <motion.div
                            layoutId="mode-bg"
                            className="absolute inset-y-1 bg-white/10 rounded-xl"
                            initial={false}
                            animate={{
                                x: mode === 'romantic' ? 0 : '100%',
                                width: '50%'
                            }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <ElectricButton variant="secondary" size="sm" onClick={fetchSubscribers}>
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </ElectricButton>
                        <ElectricButton variant="secondary" size="sm">
                            <Filter className="w-4 h-4" />
                        </ElectricButton>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative flex justify-center items-center h-[600px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center space-y-4"
                            >
                                <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] italic">Scanning Neural Frequencies...</h3>
                            </motion.div>
                        ) : profiles.length > 0 && currentIndex < profiles.length ? (
                            <motion.div
                                key={profiles[currentIndex].id}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x > 100) handleSwipe('right');
                                    else if (info.offset.x < -100) handleSwipe('left');
                                }}
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 200 }}
                                className="w-full max-w-sm"
                            >
                                <GlassCard className="h-[550px] p-0 overflow-hidden relative group border-white/10 shadow-2xl">
                                    <img
                                        src={profiles[currentIndex].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profiles[currentIndex].id}`}
                                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                    />

                                    {/* Info Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-3xl font-black tracking-tighter italic">{profiles[currentIndex].display_name}</h2>
                                                        <Shield className="w-4 h-4 text-primary fill-primary/20" />
                                                    </div>
                                                    <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                                                        <Zap className="w-3 h-3" /> Compatible Node • 98% Match
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl font-black leading-none">24</span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Level</span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-300 line-clamp-2 italic leading-relaxed">
                                                {profiles[currentIndex].bio || "Initializing identity buffer... This node has no public bio data yet."}
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {mode === 'romantic' ? (
                                                    ['Art', 'Web3', 'Tokyo'].map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    ['React', 'UI/UX', 'Fullstack'].map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-secondary">
                                                            {tag}
                                                        </span>
                                                    ))
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex justify-between items-center pt-6 gap-4">
                                                <button
                                                    onClick={() => handleSwipe('left')}
                                                    className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group/btn"
                                                >
                                                    <X className="w-8 h-8 text-gray-400 group-hover/btn:text-white group-hover/btn:scale-110 transition-all" />
                                                </button>

                                                <ElectricButton
                                                    onClick={() => handleSwipe('right')}
                                                    className="flex-1 h-14 text-md font-black italic shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                                                >
                                                    {mode === 'romantic' ? <Heart className="w-6 h-6 mr-2 fill-dark text-dark" /> : <UserPlus className="w-6 h-6 mr-2" />}
                                                    {mode === 'romantic' ? 'IGNITE' : 'CONNECT'}
                                                </ElectricButton>

                                                <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group/btn">
                                                    <Star className="w-6 h-6 text-yellow-400 group-hover/btn:scale-120 transition-all" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-8"
                            >
                                <div className="p-8 rounded-full bg-white/5 border border-white/5 w-32 h-32 flex items-center justify-center mx-auto">
                                    <Target className="w-16 h-16 text-white/20" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">End of Spectrum</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">No more active nodes detected on this frequency. Expand your range or check back during peak transmissions.</p>
                                </div>
                                <ElectricButton onClick={fetchSubscribers}>Broaden Search Range</ElectricButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Viral CTA */}
                <GlassCard className="p-6 border-dashed border-primary/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Expand the Network</h4>
                            <p className="text-xs text-muted-foreground">Invite friends to your city and earn 500 HUP.</p>
                        </div>
                    </div>
                    <ElectricButton variant="ghost" size="sm" className="bg-primary/10 hover:bg-primary transition-all group">
                        Invite <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </ElectricButton>
                </GlassCard>
            </div>
        </div>
    );
}

const ArrowRight = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);
