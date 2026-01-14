import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Heart, Users, Sparkles, MessageCircle, X, ArrowRight, Coffee, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';

interface LonelinessDetection {
    user_id: string;
    isolation_score: number;
    last_social_interaction: string | null;
    consecutive_days_isolated: number;
    suggested_activities: string[];
    trigger_level: 'info' | 'warning' | 'intervention';
}

interface LonelinessInterrupterProps {
    threshold?: number;
    onDismiss?: () => void;
    onActivityJoin?: (activityId: string) => void;
}

export function LonelinessInterrupter({ threshold = 70, onDismiss, onActivityJoin }: LonelinessInterrupterProps) {
    const [detection, setDetection] = useState<LonelinessDetection | null>(null);
    const [showInterruption, setShowInterruption] = useState(false);
    const [loading, setLoading] = useState(true);
    const [nearbyActivities, setNearbyActivities] = useState<any[]>([]);
    const { latitude, longitude } = useLocation();
    const currentUser = JSON.parse(localStorage.getItem('hup_user') || '{}');

    useEffect(() => {
        const checkLoneliness = async () => {
            if (!currentUser?.id) {
                setLoading(false);
                return;
            }

            const { data: presenceData } = await supabase
                .from('user_presence')
                .select('last_seen, intent_icons')
                .eq('user_id', currentUser.id)
                .single();

            const lastInteraction = presenceData?.last_seen ? new Date(presenceData.last_seen) : null;
            const daysIsolated = lastInteraction 
                ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            const score = Math.min(100, daysIsolated * 15 + (presenceData?.intent_icons?.includes('dont_approach') ? 20 : 0));

            if (score >= threshold) {
                const newDetection: LonelinessDetection = {
                    user_id: currentUser.id,
                    isolation_score: score,
                    last_social_interaction: presenceData?.last_seen,
                    consecutive_days_isolated: daysIsolated,
                    suggested_activities: getSuggestedActivities(score, daysIsolated),
                    trigger_level: score >= 90 ? 'intervention' : score >= 75 ? 'warning' : 'info',
                };

                setDetection(newDetection);

                if (score >= threshold && shouldShowInterruption()) {
                    setShowInterruption(true);
                }
            }

            setLoading(false);
        };

        checkLoneliness();
    }, [currentUser?.id, threshold]);

    useEffect(() => {
        const fetchNearbyActivities = async () => {
            if (!latitude || !longitude) return;

            const { data } = await supabase
                .from('activities')
                .select('*')
                .eq('status', 'active')
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(5);

            if (data) {
                setNearbyActivities(data);
            }
        };

        fetchNearbyActivities();
    }, [latitude, longitude]);

    const getSuggestedActivities = (score: number, days: number) => {
        const activities = [
            { icon: Coffee, label: 'Join a chill gathering', type: 'calm' },
            { icon: PartyPopper, label: 'Find a party', type: 'party' },
            { icon: Users, label: 'Group activities', type: 'group' },
            { icon: MessageCircle, label: 'Start a chat', type: 'social' },
            { icon: Sparkles, label: 'Try something new', type: 'creative' },
        ];

        if (days >= 7) {
            return activities.slice(0, 3);
        }
        if (score >= 80) {
            return activities.slice(0, 2);
        }
        return activities.slice(0, 1);
    };

    const shouldShowInterruption = () => {
        const lastShown = localStorage.getItem('hup_loneliness_interruption');
        if (!lastShown) return true;
        const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
        return hoursSince >= 4;
    };

    const handleAccept = async () => {
        localStorage.setItem('hup_loneliness_interruption', Date.now().toString());

        if (detection) {
            await supabase.from('loneliness_detection').insert({
                user_id: currentUser.id,
                isolation_score: detection.isolation_score,
                last_social_interaction: detection.last_social_interaction,
                consecutive_days_isolated: detection.consecutive_days_isolated,
                suggested_activities: detection.suggested_activities,
                trigger_level: detection.trigger_level,
            });
        }

        setShowInterruption(false);
        onDismiss?.();
    };

    const handleDecline = () => {
        localStorage.setItem('hup_loneliness_interruption', Date.now().toString());
        setShowInterruption(false);
        onDismiss?.();
    };

    const handleActivityClick = (activityId: string) => {
        handleAccept();
        onActivityJoin?.(activityId);
    };

    if (loading) return null;

    const getTriggerConfig = (level: string) => {
        switch (level) {
            case 'intervention':
                return {
                    icon: Heart,
                    color: 'from-red-500 to-pink-500',
                    bgColor: 'bg-red-500',
                    title: 'We noticed you\'ve been alone',
                    subtitle: 'A little human connection might help',
                    buttonText: 'Let\'s do something',
                };
            case 'warning':
                return {
                    icon: Users,
                    color: 'from-orange-500 to-yellow-500',
                    bgColor: 'bg-orange-500',
                    title: 'It\'s been a while',
                    subtitle: 'There are people nearby waiting to connect',
                    buttonText: 'See who\'s around',
                };
            default:
                return {
                    icon: Sparkles,
                    color: 'from-blue-500 to-cyan-500',
                    bgColor: 'bg-blue-500',
                    title: 'Fresh activities nearby',
                    subtitle: 'Want to check out what\'s happening?',
                    buttonText: 'Sure, show me',
                };
        }
    };

    if (!detection) return null;

    const config = getTriggerConfig(detection.trigger_level);
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {showInterruption && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="w-full max-w-md bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
                    >
                        <div className={`relative h-2 bg-gradient-to-r ${config.color}`} />

                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.color}`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black mb-1">{config.title}</h3>
                                    <p className="text-white/60">{config.subtitle}</p>
                                </div>
                                <button
                                    onClick={handleDecline}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/40" />
                                </button>
                            </div>

                            {detection.consecutive_days_isolated > 0 && (
                                <div className="bg-white/5 rounded-xl p-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Time since last social activity</span>
                                        <span className="font-bold text-red-400">
                                            {detection.consecutive_days_isolated} day{detection.consecutive_days_isolated > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {nearbyActivities.length > 0 && (
                                <div className="space-y-2 mb-6">
                                    <h4 className="text-sm font-bold text-white/60 uppercase tracking-wider">
                                        Happening Now
                                    </h4>
                                    {nearbyActivities.slice(0, 3).map((activity) => (
                                        <button
                                            key={activity.id}
                                            onClick={() => handleActivityClick(activity.id)}
                                            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <PartyPopper className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold truncate">{activity.title}</div>
                                                <div className="text-xs text-white/60">
                                                    {activity.location_name || 'Nearby'}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-white/40" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={handleAccept}
                                    className={`w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                                >
                                    {config.buttonText}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="w-full py-3 rounded-xl font-medium text-white/60 hover:text-white transition-colors"
                                >
                                    I'm good, thanks
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
