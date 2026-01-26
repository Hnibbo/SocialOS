import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Users, Target, Clock, MapPin, Star, Crown, ChevronRight, Medal, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CityChallenge {
    id: string;
    name: string;
    description: string | null;
    challenge_type: 'participation' | 'location' | 'social' | 'achievement' | 'competition';
    city: string;
    start_time: string;
    end_time: string;
    target_count: number;
    current_count: number;
    participants: string[];
    rewards_xp: number;
    rewards_badge: string | null;
    rewards_title: string | null;
    is_active: boolean;
    is_global: boolean;
    leaderboard: { user_id: string; score: number; rank: number }[];
    created_at: string;
}

interface ChallengeCardProps {
    challenge: CityChallenge;
    onJoin?: (challengeId: string) => void;
    onViewLeaderboard?: (challengeId: string) => void;
}

const challengeTypeConfig = {
    participation: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-400', label: 'Participation' },
    location: { icon: MapPin, color: 'text-green-400', bg: 'bg-green-400', label: 'Location' },
    social: { icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-400', label: 'Social' },
    achievement: { icon: Target, color: 'text-orange-400', bg: 'bg-orange-400', label: 'Achievement' },
    competition: { icon: Flame, color: 'text-red-400', bg: 'bg-red-400', label: 'Competition' },
};

export function ChallengeCard({ challenge, onJoin, onViewLeaderboard }: ChallengeCardProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isJoined, setIsJoined] = useState(false);
    const config = challengeTypeConfig[challenge.challenge_type];
    const TypeIcon = config.icon;
    const progress = Math.min(100, (challenge.current_count / challenge.target_count) * 100);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const end = new Date(challenge.end_time).getTime();
            const diff = end - Date.now();

            if (diff <= 0) {
                setTimeLeft('Ended');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 7) {
                setTimeLeft(`${Math.floor(days / 7)}w ${days % 7}d`);
            } else if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else {
                setTimeLeft(`${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(interval);
    }, [challenge.end_time]);

    const handleJoin = () => {
        if (!isJoined) {
            onJoin?.(challenge.id);
        }
        setIsJoined(true);
    };

    const isEnded = new Date(challenge.end_time) < new Date();
    const isCompleted = challenge.current_count >= challenge.target_count;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 transition-all ${
                isEnded ? 'opacity-50' : ''
            }`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-5`} />

            {challenge.is_global && (
                <div className="absolute top-4 right-4 z-10">
                    <span className="px-2 py-1 bg-amber-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        GLOBAL
                    </span>
                </div>
            )}

            <div className="relative p-5">
                <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${config.bg} bg-opacity-20`}>
                        <TypeIcon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-black text-lg">{challenge.name}</h4>
                        <p className="text-sm text-white/60">{config.label} Challenge</p>
                    </div>
                </div>

                {challenge.description && (
                    <p className="text-white/80 text-sm mb-4 line-clamp-2">{challenge.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                        <Users className="w-4 h-4 mx-auto mb-1 text-white/40" />
                        <div className="text-sm font-bold">{challenge.participants.length}</div>
                        <div className="text-xs text-white/40">Joined</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-white/40" />
                        <div className="text-sm font-bold">{timeLeft}</div>
                        <div className="text-xs text-white/40">Remaining</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                        <Star className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                        <div className="text-sm font-bold">+{challenge.rewards_xp}</div>
                        <div className="text-xs text-white/40">XP Reward</div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/60">Progress</span>
                        <span className="font-bold">{challenge.current_count} / {challenge.target_count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${config.bg}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {isCompleted && (
                    <div className="mb-4 p-3 bg-green-500/20 rounded-xl flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-bold text-green-400">Challenge Complete!</span>
                    </div>
                )}

                <div className="flex gap-2">
                    {!isEnded && !isJoined && (
                        <button
                            onClick={handleJoin}
                            className={`flex-1 py-3 rounded-xl font-bold text-black bg-gradient-to-r ${config.bg} hover:opacity-90 transition-opacity`}
                        >
                            Join Challenge
                        </button>
                    )}
                    {isJoined && !isEnded && (
                        <button className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors">
                            Joined
                        </button>
                    )}
                    {onViewLeaderboard && (
                        <button
                            onClick={() => onViewLeaderboard(challenge.id)}
                            className="px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        >
                            <Medal className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

interface CityChallengesFeedProps {
    city?: string;
    limit?: number;
}

export function CityChallengesFeed({ city = 'New York', limit = 10 }: CityChallengesFeedProps) {
    const [challenges, setChallenges] = useState<CityChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'participation' | 'location' | 'social' | 'achievement' | 'competition'>('all');
    const [selectedChallenge, setSelectedChallenge] = useState<CityChallenge | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('hup_user') || '{}');

    useEffect(() => {
        const fetchChallenges = async () => {
            const query = supabase
                .from('city_challenges')
                .select('*')
                .eq('is_active', true)
                .or(`city.eq.${city},is_global.eq.true`)
                .lte('start_time', new Date().toISOString())
                .gte('end_time', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            const { data, error } = await query;
            if (!error && data) {
                setChallenges(data as CityChallenge[]);
            } else {
                setChallenges([]);
            }
            setLoading(false);
        };

        fetchChallenges();
        const interval = setInterval(fetchChallenges, 60000);
        return () => clearInterval(interval);
    }, [city, limit]);

    const filteredChallenges = filter === 'all'
        ? challenges
        : challenges.filter(c => c.challenge_type === filter);

    const handleJoin = async (challengeId: string) => {
        const challenge = challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        await supabase
            .from('city_challenges')
            .update({
                participants: [...challenge.participants, currentUser.id],
                current_count: challenge.current_count + 1,
            })
            .eq('id', challengeId);
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
                    <Trophy className="w-6 h-6 text-amber-400" />
                    City Challenges
                </h3>
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'participation', 'location', 'social', 'achievement', 'competition'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filter === f ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredChallenges.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active challenges</p>
                    <p className="text-sm">Check back soon for new challenges</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChallenges.map((challenge, i) => (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <ChallengeCard
                                challenge={challenge}
                                onJoin={handleJoin}
                                onViewLeaderboard={setSelectedChallenge}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {selectedChallenge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedChallenge(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-zinc-900 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black">{selectedChallenge.name}</h2>
                                    <p className="text-white/60">{selectedChallenge.city}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedChallenge(null)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {selectedChallenge.description && (
                                <p className="text-lg text-white/80 mb-6">{selectedChallenge.description}</p>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-sm text-white/60">Participants</div>
                                    <div className="text-2xl font-bold">{selectedChallenge.participants.length}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-sm text-white/60">Your Progress</div>
                                    <div className="text-2xl font-bold">
                                        {selectedChallenge.participants.includes(currentUser.id)
                                            ? `${selectedChallenge.current_count}/${selectedChallenge.target_count}`
                                            : 'Not joined'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <h4 className="font-bold text-white/60">Leaderboard</h4>
                                {selectedChallenge.leaderboard?.slice(0, 10).map((entry, i) => (
                                    <div
                                        key={entry.user_id}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${
                                            entry.user_id === currentUser.id
                                                ? 'bg-primary/20 border border-primary'
                                                : 'bg-white/5'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                            i === 0 ? 'bg-amber-500 text-black' :
                                            i === 1 ? 'bg-gray-400 text-black' :
                                            i === 2 ? 'bg-amber-700 text-white' :
                                            'bg-white/10'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold">
                                                {entry.user_id === currentUser.id ? 'You' : `User ${entry.user_id.slice(0, 4)}`}
                                            </div>
                                        </div>
                                        <div className="font-bold">{entry.score}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-5 h-5 text-amber-400" />
                                    <span className="font-bold">Rewards</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold">+{selectedChallenge.rewards_xp} XP</span>
                                    {selectedChallenge.rewards_badge && (
                                        <span className="px-3 py-1 bg-amber-500 rounded-full text-sm font-bold text-black">
                                            {selectedChallenge.rewards_badge}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
