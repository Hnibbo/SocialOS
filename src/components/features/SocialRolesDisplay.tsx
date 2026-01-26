import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Crown, Sparkles, Zap, Heart, Users, Ghost, Trophy, Star, ChevronRight, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type SocialRole = 'connector' | 'explorer' | 'host' | 'muse' | 'catalyst' | 'legend' | 'ghost' | 'inactive';

interface UserSocialRole {
    user_id: string;
    primary_role: SocialRole;
    secondary_roles: SocialRole[];
    role_points: number;
    role_level: number;
    connections_made: number;
    events_hosted: number;
    groups_led: number;
    badges_earned: string[];
    achievements_unlocked: string[];
    streak_days: number;
    max_streak: number;
    last_role_update: string;
    created_at: string;
    updated_at: string;
}

interface RoleDefinition {
    id: SocialRole;
    name: string;
    icon: typeof Crown;
    color: string;
    bgGradient: string;
    description: string;
    requirements: { type: string; threshold: number }[];
    perks: string[];
}

const roleDefinitions: RoleDefinition[] = [
    {
        id: 'connector',
        name: 'Connector',
        icon: Users,
        color: 'text-blue-400',
        bgGradient: 'from-blue-500 to-cyan-500',
        description: 'You bring people together. Your superpower is building bridges.',
        requirements: [
            { type: 'connections_made', threshold: 50 },
            { type: 'streak_days', threshold: 7 },
        ],
        perks: ['+50% XP for introductions', 'Priority in group suggestions', 'Exclusive Connector badge'],
    },
    {
        id: 'explorer',
        name: 'Explorer',
        icon: Zap,
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-500 to-orange-500',
        description: 'You discover hidden gems and share them with the world.',
        requirements: [
            { type: 'places_visited', threshold: 30 },
            { type: 'unique_activities', threshold: 15 },
        ],
        perks: ['+25% XP for new locations', 'Early access to features', 'Explorer badge'],
    },
    {
        id: 'host',
        name: 'Host',
        icon: Crown,
        color: 'text-purple-400',
        bgGradient: 'from-purple-500 to-pink-500',
        description: 'You create spaces where others feel welcome and engaged.',
        requirements: [
            { type: 'events_hosted', threshold: 10 },
            { type: 'total_attendees', threshold: 100 },
        ],
        perks: ['+30% XP for hosting', 'Custom event templates', 'Host badge'],
    },
    {
        id: 'muse',
        name: 'Muse',
        icon: Heart,
        color: 'text-pink-400',
        bgGradient: 'from-pink-500 to-rose-500',
        description: 'You inspire others and create memorable moments.',
        requirements: [
            { type: 'content_likes', threshold: 500 },
            { type: 'tags_mentioned', threshold: 100 },
        ],
        perks: ['Featured content priority', '+20% XP for interactions', 'Muse badge'],
    },
    {
        id: 'catalyst',
        name: 'Catalyst',
        icon: Sparkles,
        color: 'text-emerald-400',
        bgGradient: 'from-emerald-500 to-teal-500',
        description: 'You spark movements and drive change in your community.',
        requirements: [
            { type: 'initiatives_started', threshold: 5 },
            { type: 'community_impact', threshold: 1000 },
        ],
        perks: ['Create city challenges', '+40% XP for community events', 'Catalyst badge'],
    },
    {
        id: 'legend',
        name: 'Legend',
        icon: Trophy,
        color: 'text-amber-400',
        bgGradient: 'from-amber-500 to-yellow-600',
        description: "Your presence is legendary. You've achieved it all.",
        requirements: [
            { type: 'total_xp', threshold: 10000 },
            { type: 'role_mastery', threshold: 5 },
        ],
        perks: ['Golden profile border', 'All perks unlocked', 'Legend badge', 'Name in hall of fame'],
    },
    {
        id: 'ghost',
        name: 'Ghost',
        icon: Ghost,
        color: 'text-gray-400',
        bgGradient: 'from-gray-500 to-slate-600',
        description: 'You prefer to observe. No judgment, just privacy.',
        requirements: [
            { type: 'incognito_sessions', threshold: 20 },
        ],
        perks: ['Enhanced privacy options', 'Ghost badge'],
    },
];

interface SocialRolesDisplayProps {
    userId?: string;
    compact?: boolean;
}

export function SocialRolesDisplay({ userId, compact = false }: SocialRolesDisplayProps) {
    const [role, setRole] = useState<UserSocialRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const fetchRole = async () => {
            let query = supabase.from('user_social_roles').select('*');
            
            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                const currentUser = JSON.parse(localStorage.getItem('hup_user') || '{}');
                if (currentUser?.id) {
                    query = query.eq('user_id', currentUser.id);
                }
            }

            const { data } = await query.single();
            if (data) {
                setRole(data as UserSocialRole);
            }
            setLoading(false);
        };

        fetchRole();
    }, [userId]);

    const currentRoleDef = roleDefinitions.find(r => r.id === role?.primary_role);
    const RoleIcon = currentRoleDef?.icon || Star;

    if (loading) {
        return (
            <div className="animate-pulse bg-white/5 rounded-3xl p-6 border border-white/10">
                <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="h-16 bg-white/10 rounded-2xl"></div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                {role && currentRoleDef ? (
                    <>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${currentRoleDef.bgGradient}`}>
                            <RoleIcon className={`w-4 h-4 ${currentRoleDef.color}`} />
                        </div>
                        <div>
                            <div className="text-sm font-bold">{currentRoleDef.name}</div>
                            <div className="text-xs text-white/60">Level {role.role_level}</div>
                        </div>
                    </>
                ) : (
                    <>
                        <Star className="w-5 h-5 text-white/40" />
                        <span className="text-sm font-medium text-white/60">Newcomer</span>
                    </>
                )}
            </div>
        );
    }

    if (!role || !currentRoleDef) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl"
            >
                <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                    <Crown className="w-6 h-6 text-primary" />
                    Social Role
                </h3>
                <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Star className="w-10 h-10 text-white/40" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">Newcomer</h4>
                    <p className="text-white/60 mb-6">Start your journey to unlock your social role</p>
                    <div className="space-y-3">
                        {roleDefinitions.slice(0, 4).map((def) => {
                            const DefIcon = def.icon;
                            return (
                                <div key={def.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <DefIcon className={`w-5 h-5 ${def.color}`} />
                                    <span className="font-medium">{def.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
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
                    <Crown className="w-6 h-6 text-primary" />
                    Social Role
                </h3>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
                >
                    {showDetails ? 'Hide' : 'Show'} details
                    <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                </button>
            </div>

            <motion.div
                layout
                className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${currentRoleDef.bgGradient}`}
            >
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                <div className="relative z-10 flex items-start gap-4">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 5, repeatDelay: 2 }}
                        className="p-4 rounded-2xl bg-white/20 backdrop-blur"
                    >
                        <RoleIcon className="w-10 h-10 text-white" />
                    </motion.div>
                    <div className="flex-1">
                        <h4 className="text-2xl font-black text-white mb-1">{currentRoleDef.name}</h4>
                        <p className="text-white/80 text-sm mb-4">{currentRoleDef.description}</p>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur">
                                <span className="text-white font-bold">Level {role.role_level}</span>
                            </div>
                            <div className="text-white/60">
                                {role.role_points.toLocaleString()} points
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                        <span>Progress to Level {role.role_level + 1}</span>
                        <span>{Math.min(100, (role.role_points % 1000) / 10)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (role.role_points % 1000) / 10)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 border-t border-white/10"
                    >
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl font-bold">{role.connections_made}</div>
                                <div className="text-sm text-white/60">Connections Made</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl font-bold">{role.events_hosted}</div>
                                <div className="text-sm text-white/60">Events Hosted</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl font-bold">{role.groups_led}</div>
                                <div className="text-sm text-white/60">Groups Led</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl font-bold">{role.streak_days}</div>
                                <div className="text-sm text-white/60">Day Streak</div>
                            </div>
                        </div>

                        {role.badges_earned.length > 0 && (
                            <div className="mb-6">
                                <h5 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">Badges Earned</h5>
                                <div className="flex flex-wrap gap-2">
                                    {role.badges_earned.map((badge) => (
                                        <span key={badge} className="px-3 py-1.5 bg-primary/20 rounded-full text-xs font-bold text-primary">
                                            {badge.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h5 className="text-sm font-bold text-white/60 uppercase tracking-wider">Role Perks</h5>
                            {currentRoleDef.perks.map((perk, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <Star className="w-4 h-4 text-primary" />
                                    <span>{perk}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function RoleProgressionPath() {
    const userLevel = 3;

    return (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Role Path
            </h3>

            <div className="relative">
                {roleDefinitions.map((role, i) => {
                    const isUnlocked = i <= 2;
                    const isCurrent = i === 2;
                    const RoleIcon = role.icon;

                    return (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative pl-8 pb-6 ${i !== roleDefinitions.length - 1 ? 'border-l-2 border-white/10' : ''}`}
                        >
                            <div className={`absolute left-0 top-0 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
                                isUnlocked
                                    ? `bg-gradient-to-br ${role.bgGradient}`
                                    : 'bg-white/10'
                            }`}>
                                {isUnlocked ? (
                                    <RoleIcon className="w-4 h-4 text-white" />
                                ) : (
                                    <Lock className="w-4 h-4 text-white/40" />
                                )}
                            </div>

                            <div className={`p-4 rounded-xl ${isCurrent ? 'bg-white/10 border border-primary' : 'bg-white/5 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`font-bold ${isUnlocked ? '' : 'text-white/40'}`}>
                                        {role.name}
                                    </h4>
                                    {isCurrent && (
                                        <span className="px-2 py-0.5 bg-primary rounded-full text-xs font-bold">Current</span>
                                    )}
                                </div>
                                <p className="text-sm text-white/60">{role.description}</p>
                                {isUnlocked && (
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        {role.perks.slice(0, 2).map((perk, j) => (
                                            <span key={j} className="text-xs text-white/40">• {perk}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
