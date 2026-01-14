import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Zap, Clock, Users, MapPin, Gift, MessageSquare, Heart, Music, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';

type MomentDropType =
    | 'flash_drinks'
    | 'hidden_dj'
    | 'mystery_group'
    | 'rare_asset'
    | 'confession_zone'
    | 'dating_boost'
    | 'anonymous_confession';

interface MomentDrop {
    id: string;
    creator_id: string;
    drop_type: MomentDropType;
    title: string;
    description: string | null;
    location_name: string | null;
    location_coords: { lat: number; lng: number } | null;
    radius_meters: number;
    start_time: string;
    end_time: string;
    max_participants: number | null;
    current_participants: number;
    reward_xp: number | null;
    reward_items: string[];
    is_anonymous: boolean;
    is_viral: boolean;
    viral_count: number;
    created_at: string;
}

interface MomentDropCardProps {
    drop: MomentDrop;
    onJoin?: (dropId: string) => void;
    onLeave?: (dropId: string) => void;
    compact?: boolean;
}

const dropTypeConfig: Record<MomentDropType, { icon: typeof Zap; color: string; bg: string; label: string }> = {
    flash_drinks: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Flash Drinks' },
    hidden_dj: { icon: Music, color: 'text-purple-400', bg: 'bg-purple-400', label: 'Hidden DJ' },
    mystery_group: { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-400', label: 'Mystery Group' },
    rare_asset: { icon: Gift, color: 'text-orange-400', bg: 'bg-orange-400', label: 'Rare Drop' },
    confession_zone: { icon: MessageSquare, color: 'text-pink-400', bg: 'bg-pink-400', label: 'Confession Zone' },
    dating_boost: { icon: Heart, color: 'text-red-400', bg: 'bg-red-400', label: 'Dating Boost' },
    anonymous_confession: { icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-400', label: 'Anonymous' },
};

export function MomentDropCard({ drop, onJoin, onLeave, compact = false }: MomentDropCardProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isJoined, setIsJoined] = useState(false);
    const config = dropTypeConfig[drop.drop_type];
    const Icon = config.icon;

    useEffect(() => {
        const calculateTimeLeft = () => {
            const end = new Date(drop.end_time).getTime();
            const diff = end - Date.now();

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 24) {
                setTimeLeft(`${Math.floor(hours / 24)}d ${hours % 24}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes}m`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(interval);
    }, [drop.end_time]);

    const handleToggleJoin = () => {
        if (isJoined) {
            onLeave?.(drop.id);
        } else {
            onJoin?.(drop.id);
        }
        setIsJoined(!isJoined);
    };

    if (compact) {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
                <div className={`absolute inset-0 bg-gradient-to-r ${config.bg} opacity-5`} />
                <div className="relative flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${config.bg} bg-opacity-20`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{drop.title}</div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <Clock className="w-3 h-3" />
                            <span>{timeLeft}</span>
                            <span>•</span>
                            <Users className="w-3 h-3" />
                            <span>{drop.current_participants}</span>
                        </div>
                    </div>
                    {drop.is_viral && (
                        <div className="px-2 py-1 bg-primary rounded-full">
                            <Sparkles className="w-3 h-3 text-black" />
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 hover:border-white/20 transition-all"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-5`} />

            {drop.is_viral && (
                <div className="absolute top-4 right-4 z-10">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary rounded-full"
                    >
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="text-xs font-bold text-black">VIRAL</span>
                    </motion.div>
                </div>
            )}

            <div className="relative p-6">
                <div className="flex items-start gap-4 mb-4">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
                        className={`p-4 rounded-2xl ${config.bg} bg-opacity-20`}
                    >
                        <Icon className={`w-8 h-8 ${config.color}`} />
                    </motion.div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black mb-1">{drop.title}</h3>
                        <p className="text-sm text-white/60">{config.label}</p>
                    </div>
                </div>

                {drop.description && (
                    <p className="text-white/80 mb-4 line-clamp-2">{drop.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold text-white">{timeLeft}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <Users className="w-4 h-4" />
                        <span>
                            <span className="font-bold text-white">{drop.current_participants}</span>
                            {drop.max_participants && `/${drop.max_participants}`}
                        </span>
                    </div>
                    {drop.location_name && (
                        <div className="flex items-center gap-2 text-sm text-white/60 col-span-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{drop.location_name}</span>
                        </div>
                    )}
                </div>

                {drop.reward_xp && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-white/5 rounded-xl">
                        <Gift className={`w-5 h-5 ${config.color}`} />
                        <span className="font-bold">+{drop.reward_xp} XP</span>
                        {drop.reward_items?.length > 0 && (
                            <span className="text-sm text-white/60">
                                + {drop.reward_items.join(', ')}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleToggleJoin}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                            isJoined
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : `bg-gradient-to-r ${config.color.replace('text-', 'from-').replace('400', '500')} ${config.color.replace('text-', 'to-').replace('400', '400')} text-black hover:opacity-90`
                        }`}
                    >
                        {isJoined ? 'Leave Drop' : 'Join Drop'}
                    </button>
                    <button className="px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <MapPin className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <motion.div
                    className={`h-full ${config.bg}`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{
                        duration: new Date(drop.end_time).getTime() - Date.now() / 1000,
                        ease: 'linear'
                    }}
                />
            </div>
        </motion.div>
    );
}

interface MomentDropsFeedProps {
    radius?: number;
    limit?: number;
}

export function MomentDropsFeed({ radius = 50000, limit = 10 }: MomentDropsFeedProps) {
    const [drops, setDrops] = useState<MomentDrop[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<MomentDropType | 'all'>('all');
    const { latitude, longitude } = useLocation();

    useEffect(() => {
        const fetchDrops = async () => {
            if (!latitude || !longitude) {
                setDrops([]);
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('moment_drops')
                .select('*')
                .gt('end_time', new Date().toISOString())
                .lte('start_time', new Date().toISOString())
                .lte('radius_meters', radius)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (data) {
                setDrops(data as MomentDrop[]);
            }
            setLoading(false);
        };

        fetchDrops();
        const interval = setInterval(fetchDrops, 30000);
        return () => clearInterval(interval);
    }, [latitude, longitude, radius, limit]);

    const filteredDrops = filter === 'all' ? drops : drops.filter(d => d.drop_type === filter);

    const handleJoin = async (dropId: string) => {
        await supabase.from('moment_drop_participants').insert({
            drop_id: dropId,
            user_id: JSON.parse(localStorage.getItem('hup_user') || '{}')?.id,
            joined_at: new Date().toISOString(),
        });

        await supabase
            .from('moment_drops')
            .update({ current_participants: drops.find(d => d.id === dropId)?.current_participants + 1 || 1 })
            .eq('id', dropId);
    };

    const handleLeave = async (dropId: string) => {
        await supabase
            .from('moment_drop_participants')
            .delete()
            .eq('drop_id', dropId)
            .eq('user_id', JSON.parse(localStorage.getItem('hup_user') || '{}')?.id);

        await supabase
            .from('moment_drops')
            .update({ current_participants: Math.max(0, (drops.find(d => d.id === dropId)?.current_participants || 1) - 1) })
            .eq('id', dropId);
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-white/5 rounded-3xl p-6 border border-white/10">
                <div className="h-8 bg-white/10 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/10 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Moment Drops
                </h3>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            filter === 'all' ? 'bg-primary text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                        All
                    </button>
                    {Object.entries(dropTypeConfig).map(([type, config]) => {
                        const TypeIcon = config.icon;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type as MomentDropType)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    filter === type ? config.bg + ' text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                            >
                                <TypeIcon className="w-3 h-3 inline mr-1" />
                                {config.label.split(' ')[0]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {filteredDrops.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No drops nearby</p>
                    <p className="text-sm">Moment drops appear spontaneously</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDrops.map((drop, i) => (
                        <motion.div
                            key={drop.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <MomentDropCard
                                drop={drop}
                                onJoin={handleJoin}
                                onLeave={handleLeave}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
