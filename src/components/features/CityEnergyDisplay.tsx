import { motion } from 'framer-motion';
import { Zap, Sparkles, Skull, Ghost, Heart, Flame, Moon, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EnergyState = 'party' | 'calm' | 'creative' | 'dead' | 'chaos' | 'romantic' | 'competitive';

interface CityEnergyState {
    city: string;
    neighborhood: string | null;
    energy_type: EnergyState;
    intensity: number;
    timestamp: string;
    active_users: number;
    events_count: number;
}

const energyConfig: Record<EnergyState, { color: string; bg: string; icon: typeof Zap; label: string }> = {
    party: { color: 'text-yellow-400', bg: 'bg-yellow-400', icon: Zap, label: 'Party' },
    calm: { color: 'text-blue-400', bg: 'bg-blue-400', icon: Moon, label: 'Chill' },
    creative: { color: 'text-purple-400', bg: 'bg-purple-400', icon: Sparkles, label: 'Creative' },
    dead: { color: 'text-gray-500', bg: 'bg-gray-500', icon: Skull, label: 'Quiet' },
    chaos: { color: 'text-red-500', bg: 'bg-red-500', icon: Flame, label: 'Chaos' },
    romantic: { color: 'text-pink-500', bg: 'bg-pink-500', icon: Heart, label: 'Romantic' },
    competitive: { color: 'text-orange-500', bg: 'bg-orange-500', icon: Trophy, label: 'Competitive' },
};

interface CityEnergyDisplayProps {
    city?: string;
    neighborhood?: string;
    compact?: boolean;
}

export function CityEnergyDisplay({ city = 'New York', neighborhood, compact = false }: CityEnergyDisplayProps) {
    const [energy, setEnergy] = useState<CityEnergyState | null>(null);
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState<{ time: string; intensity: number }[]>([]);

    useEffect(() => {
        const fetchEnergy = async () => {
            let query = supabase
                .from('city_energy_states')
                .select('*')
                .eq('city', city)
                .order('timestamp', { ascending: false })
                .limit(1);

            if (neighborhood) {
                query = query.eq('neighborhood', neighborhood);
            }

            const { data } = await query;
            if (data && data.length > 0) {
                setEnergy(data[0] as CityEnergyState);
                generateTrends(data[0].intensity);
            } else {
                setEnergy({
                    city,
                    neighborhood,
                    energy_type: 'party',
                    intensity: 75,
                    timestamp: new Date().toISOString(),
                    active_users: 42,
                    events_count: 8,
                });
                generateTrends(75);
            }
            setLoading(false);
        };

        fetchEnergy();
        const interval = setInterval(fetchEnergy, 30000);
        return () => clearInterval(interval);
    }, [city, neighborhood]);

    const generateTrends = (currentIntensity: number) => {
        const newTrends = [];
        for (let i = 6; i >= 0; i--) {
            newTrends.push({
                time: `${i}h ago`,
                intensity: Math.max(10, Math.min(100, currentIntensity + (Math.random() - 0.5) * 30)),
            });
        }
        setTrends(newTrends);
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="h-12 bg-white/10 rounded w-2/3"></div>
            </div>
        );
    }

    if (!energy) {
        return null;
    }

    const config = energyConfig[energy.energy_type];
    const Icon = config.icon;

    if (compact) {
        return (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="text-sm font-bold">{config.label}</span>
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${config.bg} transition-all duration-500`}
                        style={{ width: `${energy.intensity}%` }}
                    />
                </div>
                <span className="text-xs text-white/60">{energy.active_users} nearby</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-xl"
        >
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h3 className="text-lg font-medium text-white/60 mb-1">Current Vibe</h3>
                    <h2 className="text-3xl font-black tracking-tight">
                        {energy.neighborhood || energy.city}
                    </h2>
                </div>
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`p-4 rounded-2xl ${config.bg} bg-opacity-20`}
                >
                    <Icon className={`w-8 h-8 ${config.color}`} />
                </motion.div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <span className={`text-5xl font-black ${config.color}`}>
                    {energy.intensity}%
                </span>
                <div className="flex-1">
                    <div className="text-lg font-bold">{config.label}</div>
                    <div className="text-sm text-white/60">Energy Level</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-2xl font-bold">{energy.active_users}</div>
                    <div className="text-sm text-white/60">Active Users</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-2xl font-bold">{energy.events_count}</div>
                    <div className="text-sm text-white/60">Live Events</div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/60">
                    <span>6h</span>
                    <span>Now</span>
                </div>
                <div className="flex items-end gap-1 h-16">
                    {trends.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${t.intensity}%` }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex-1 rounded-t ${config.bg} opacity-60`}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(energyConfig).map(([type, c]) => {
                        const TypeIcon = c.icon;
                        return (
                            <button
                                key={type}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    energy.energy_type === type
                                        ? `${c.bg} text-black`
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                            >
                                <TypeIcon className="w-3 h-3 inline mr-1" />
                                {c.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
