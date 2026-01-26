import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
    MessageCircle, 
    Eye, 
    Users, 
    Coffee, 
    Zap, 
    Heart, 
    XCircle,
    Frown,
    PartyPopper,
    Skull,
    HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';

type SocialSignal = 
    | 'open_to_talk'
    | 'dont_approach'
    | 'looking_for_chaos'
    | 'looking_for_calm'
    | 'open_to_dating'
    | 'just_watching'
    | 'party_mode'
    | 'needs_company'
    | 'panic_mode';

interface SocialSignalOption {
    id: SocialSignal;
    icon: typeof MessageCircle;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

const signalOptions: SocialSignalOption[] = [
    {
        id: 'open_to_talk',
        icon: MessageCircle,
        label: 'Open to Chat',
        description: "I'm down for conversation",
        color: 'text-green-400',
        bgColor: 'bg-green-400',
        borderColor: 'border-green-400/50',
    },
    {
        id: 'dont_approach',
        icon: XCircle,
        label: 'Do Not Disturb',
        description: 'Need some space',
        color: 'text-red-400',
        bgColor: 'bg-red-400',
        borderColor: 'border-red-400/50',
    },
    {
        id: 'looking_for_chaos',
        icon: Zap,
        label: 'Bring the Chaos',
        description: 'Looking for adventure',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400',
        borderColor: 'border-yellow-400/50',
    },
    {
        id: 'looking_for_calm',
        icon: Coffee,
        label: 'Chill Vibes',
        description: 'Keep it lowkey',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400',
        borderColor: 'border-blue-400/50',
    },
    {
        id: 'open_to_dating',
        icon: Heart,
        label: 'Open to Dating',
        description: 'Looking for connections',
        color: 'text-pink-400',
        bgColor: 'bg-pink-400',
        borderColor: 'border-pink-400/50',
    },
    {
        id: 'just_watching',
        icon: Eye,
        label: 'Just Watching',
        description: 'Observing for now',
        color: 'text-gray-400',
        bgColor: 'bg-gray-400',
        borderColor: 'border-gray-400/50',
    },
    {
        id: 'party_mode',
        icon: PartyPopper,
        label: 'Party Mode',
        description: 'Ready to mingle',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400',
        borderColor: 'border-purple-400/50',
    },
    {
        id: 'needs_company',
        icon: Users,
        label: 'Need Company',
        description: "Don't want to be alone",
        color: 'text-orange-400',
        bgColor: 'bg-orange-400',
        borderColor: 'border-orange-400/50',
    },
    {
        id: 'panic_mode',
        icon: Skull,
        label: 'Panic Mode',
        description: 'Need help ASAP',
        color: 'text-red-500',
        bgColor: 'bg-red-500',
        borderColor: 'border-red-500/50',
    },
];

interface SocialSignalsSelectorProps {
    compact?: boolean;
    onSignalChange?: (signal: SocialSignal | null) => void;
}

export function SocialSignalsSelector({ compact = false, onSignalChange }: SocialSignalsSelectorProps) {
    const [currentSignal, setCurrentSignal] = useState<SocialSignal | null>(null);
    const [nearbySignals, setNearbySignals] = useState<{ signal: SocialSignal; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPicker, setShowPicker] = useState(false);
    const { latitude, longitude } = useLocation();
    const currentUser = JSON.parse(localStorage.getItem('hup_user') || '{}');

    useEffect(() => {
        const fetchCurrentSignal = async () => {
            if (!currentUser?.id) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('user_presence')
                .select('intent_icons')
                .eq('user_id', currentUser.id)
                .single();

            if (data?.intent_icons?.[0]) {
                setCurrentSignal(data.intent_icons[0] as SocialSignal);
            }
            setLoading(false);
        };

        fetchCurrentSignal();
    }, [currentUser?.id]);

    useEffect(() => {
        const fetchNearbySignals = async () => {
            if (!latitude || !longitude) return;

            const { data } = await supabase
                .from('social_signals')
                .select('signal, user_id')
                .gt('expires_at', new Date().toISOString())
                .gt('location', `ST_MakePoint(${longitude}, ${latitude})::geography`);

            if (data) {
                const counts: Record<string, number> = {};
                data.forEach((s: any) => {
                    counts[s.signal] = (counts[s.signal] || 0) + 1;
                });
                setNearbySignals(Object.entries(counts).map(([signal, count]) => ({ signal, count })));
            }
        };

        fetchNearbySignals();
        const interval = setInterval(fetchNearbySignals, 30000);
        return () => clearInterval(interval);
    }, [latitude, longitude]);

    const handleSelectSignal = async (signal: SocialSignal) => {
        setCurrentSignal(signal);
        setShowPicker(false);
        onSignalChange?.(signal);

        if (currentUser?.id) {
            await supabase
                .from('user_presence')
                .update({
                    intent_icons: [signal],
                    last_location_update: new Date().toISOString(),
                })
                .eq('user_id', currentUser.id);
        }

        if (signal === 'panic_mode') {
            const { data: nearbyHelpers } = await supabase
                .from('user_presence')
                .select('user_id')
                .lt('distance', 1000);

            if (nearbyHelpers?.length) {
                await supabase.from('notifications').insert(
                    nearbyHelpers.map((h: any) => ({
                        user_id: h.user_id,
                        notification_type: 'panic_help',
                        title: 'Someone nearby needs help',
                        body: 'A user has activated panic mode within 1km',
                        data: { requester_id: currentUser.id },
                    }))
                );
            }
        }
    };

    const handleClearSignal = async () => {
        setCurrentSignal(null);
        onSignalChange?.(null);

        if (currentUser?.id) {
            await supabase
                .from('user_presence')
                .update({ intent_icons: [] })
                .eq('user_id', currentUser.id);
        }
    };

    const currentOption = signalOptions.find(s => s.id === currentSignal);

    if (compact) {
        return (
            <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 border border-white/10 transition-all"
            >
                {currentOption ? (
                    <>
                        <currentOption.icon className={`w-5 h-5 ${currentOption.color}`} />
                        <span className="text-sm font-medium">{currentOption.label}</span>
                    </>
                ) : (
                    <>
                        <HelpCircle className="w-5 h-5 text-white/40" />
                        <span className="text-sm font-medium text-white/60">Set Signal</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black tracking-tight">Your Signal</h3>
                    {currentSignal && (
                        <button
                            onClick={handleClearSignal}
                            className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="animate-pulse h-24 bg-white/5 rounded-2xl" />
                ) : currentSignal && currentOption ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`relative overflow-hidden rounded-2xl p-6 border-2 ${currentOption.borderColor} bg-gradient-to-br from-white/5 to-transparent`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-5" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-4 rounded-2xl ${currentOption.bgColor} bg-opacity-20`}>
                                <currentOption.icon className={`w-8 h-8 ${currentOption.color}`} />
                            </div>
                            <div>
                                <div className={`text-2xl font-black ${currentOption.color}`}>
                                    {currentOption.label}
                                </div>
                                <div className="text-white/60">{currentOption.description}</div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <button
                        onClick={() => setShowPicker(true)}
                        className="w-full h-24 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 transition-all flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white"
                    >
                        <HelpCircle className="w-8 h-8" />
                        <span className="font-medium">Set your social signal</span>
                    </button>
                )}

                {nearbySignals.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-medium text-white/60 mb-4">Nearby Signals</h4>
                        <div className="flex flex-wrap gap-2">
                            {nearbySignals.map(({ signal, count }) => {
                                const option = signalOptions.find(s => s.id === signal);
                                if (!option) return null;
                                return (
                                    <div
                                        key={signal}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10`}
                                    >
                                        <option.icon className={`w-4 h-4 ${option.color}`} />
                                        <span className="text-sm">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowPicker(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-black mb-6">Set Your Signal</h3>
                            <div className="space-y-3">
                                {signalOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSelectSignal(option.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                                            currentSignal === option.id
                                                ? `${option.bgColor} bg-opacity-20 border-2 ${option.borderColor}`
                                                : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                        }`}
                                    >
                                        <option.icon className={`w-6 h-6 ${option.color}`} />
                                        <div className="text-left flex-1">
                                            <div className="font-bold">{option.label}</div>
                                            <div className="text-sm text-white/60">{option.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
