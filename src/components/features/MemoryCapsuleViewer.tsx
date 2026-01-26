import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Heart, Image, Video, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemoryCapsule {
    id: string;
    user_id: string;
    capsule_type: 'place' | 'person' | 'group' | 'moment';
    title: string;
    description: string | null;
    media_urls: string[];
    location_name: string | null;
    location_coords: { lat: number; lng: number } | null;
    person_name: string | null;
    person_avatar_url: string | null;
    group_name: string | null;
    group_avatar_url: string | null;
    tags: string[];
    mood: string | null;
    created_at: string;
    visited_at: string | null;
}

interface MemoryCapsuleViewerProps {
    userId?: string;
    limit?: number;
    compact?: boolean;
}

export function MemoryCapsuleViewer({ userId, limit = 10, compact = false }: MemoryCapsuleViewerProps) {
    const [capsules, setCapsules] = useState<MemoryCapsule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCapsule, setSelectedCapsule] = useState<MemoryCapsule | null>(null);
    const [filter, setFilter] = useState<'all' | 'place' | 'person' | 'group' | 'moment'>('all');

    useEffect(() => {
        const fetchCapsules = async () => {
            let query = supabase
                .from('memory_capsules')
                .select('*')
                .order('visited_at', { ascending: false })
                .limit(limit);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;
            if (!error && data) {
                setCapsules(data as MemoryCapsule[]);
            } else {
                setCapsules([]);
            }
            setLoading(false);
        };

        fetchCapsules();
    }, [userId, limit]);

    const filteredCapsules = filter === 'all' 
        ? capsules 
        : capsules.filter(c => c.capsule_type === filter);

    const getCapsuleIcon = (type: string) => {
        switch (type) {
            case 'place': return MapPin;
            case 'person': return Users;
            case 'group': return Heart;
            case 'moment': return Calendar;
            default: return Archive;
        }
    };

    const getCapsuleColor = (type: string) => {
        switch (type) {
            case 'place': return 'from-blue-500 to-cyan-500';
            case 'person': return 'from-purple-500 to-pink-500';
            case 'group': return 'from-orange-500 to-red-500';
            case 'moment': return 'from-yellow-500 to-amber-500';
            default: return 'from-gray-500 to-zinc-500';
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-white/5 rounded-3xl p-6 border border-white/10">
                <div className="h-8 bg-white/10 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-white/10 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="space-y-3">
                {filteredCapsules.slice(0, 3).map((capsule, i) => {
                    const Icon = getCapsuleIcon(capsule.capsule_type);
                    return (
                        <motion.div
                            key={capsule.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => setSelectedCapsule(capsule)}
                        >
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${getCapsuleColor(capsule.capsule_type)}`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold truncate">{capsule.title}</div>
                                <div className="text-xs text-white/60 truncate">
                                    {capsule.location_name || capsule.person_name || capsule.group_name}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
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
                    <Archive className="w-6 h-6 text-primary" />
                    Memory Capsules
                </h3>
                <div className="flex gap-2">
                    {(['all', 'place', 'person', 'group', 'moment'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                filter === f
                                    ? 'bg-primary text-black'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredCapsules.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                    <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No memories yet</p>
                    <p className="text-sm">Start creating moments to build your archive</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCapsules.map((capsule, i) => {
                        const Icon = getCapsuleIcon(capsule.capsule_type);
                        const colorClass = getCapsuleColor(capsule.capsule_type);

                        return (
                            <motion.div
                                key={capsule.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                onClick={() => setSelectedCapsule(capsule)}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 transition-opacity`} />

                                {capsule.media_urls?.[0] && (
                                    <img
                                        src={capsule.media_urls[0]}
                                        alt={capsule.title}
                                        className="w-full h-32 object-cover"
                                    />
                                )}

                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${colorClass}`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                                            {capsule.capsule_type}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-lg mb-1">{capsule.title}</h4>
                                    {capsule.description && (
                                        <p className="text-sm text-white/60 line-clamp-2 mb-3">
                                            {capsule.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-white/40">
                                        {capsule.location_name && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {capsule.location_name}
                                            </span>
                                        )}
                                        {capsule.visited_at && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(capsule.visited_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {capsule.tags && capsule.tags.length > 0 && (
                                        <div className="flex gap-1 mt-3 flex-wrap">
                                            {capsule.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {selectedCapsule && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedCapsule(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-zinc-900 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${getCapsuleColor(selectedCapsule.capsule_type)}`}>
                                    {(() => {
                                        const Icon = getCapsuleIcon(selectedCapsule.capsule_type);
                                        return <Icon className="w-6 h-6 text-white" />;
                                    })()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedCapsule.title}</h2>
                                    <p className="text-white/60 capitalize">{selectedCapsule.capsule_type}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCapsule(null)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedCapsule.description && (
                            <p className="text-lg text-white/80 mb-6">{selectedCapsule.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {selectedCapsule.location_name && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <MapPin className="w-5 h-5 text-primary mb-2" />
                                    <div className="text-sm text-white/60">Location</div>
                                    <div className="font-bold">{selectedCapsule.location_name}</div>
                                </div>
                            )}
                            {selectedCapsule.visited_at && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <Calendar className="w-5 h-5 text-primary mb-2" />
                                    <div className="text-sm text-white/60">Date</div>
                                    <div className="font-bold">
                                        {new Date(selectedCapsule.visited_at).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedCapsule.media_urls && selectedCapsule.media_urls.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-bold text-white/60">Gallery</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedCapsule.media_urls.map((url, i) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`Memory ${i + 1}`}
                                            className="w-full h-32 object-cover rounded-xl"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}
