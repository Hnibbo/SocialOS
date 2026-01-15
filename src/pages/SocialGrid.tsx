import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Gift, MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import { useMapEntities } from '@/hooks/useMapEntities';
import { useStreamingMap } from '@/hooks/useStreamingMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { GlobalFeed } from '@/components/social/GlobalFeed';
import { CreatePostDialog } from '@/components/social/CreatePostDialog';
import { Plus } from 'lucide-react';
import { ElectricButton } from '@/components/ui/electric-button';
import { GlassCard } from '@/components/ui/glass-card';

export default function SocialGrid() {
    const { markers } = useMapEntities();
    const { markers: streamMarkers } = useStreamingMap();
    const [activeTab, setActiveTab] = useState('all');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'dominance') {
            fetchLeaderboard();
        } else if (activeTab === 'rooms') {
            fetchRooms();
        }
    }, [activeTab]);

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('user_profiles')
            .select('id, display_name, avatar_url, xp_points, level')
            .order('xp_points', { ascending: false })
            .limit(50);

        setLeaderboard(data || []);
    };

    const fetchRooms = async () => {
        const { data } = await supabase
            .from('groups')
            .select('*')
            .gt('last_active_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
            .order('member_count', { ascending: false })
            .limit(50);

        setRooms(data || []);
    };

    const drops = markers.filter(m => m.type === 'content');
    const streams = streamMarkers;

    return (
        <div className="min-h-screen bg-black text-white pb-32">
            <header className="px-6 py-8 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter italic">THE GRID</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">Global Neural Feed • Active</p>
                    </div>
                    <ElectricButton onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Post
                    </ElectricButton>
                </div>

                <CreatePostDialog
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onPostAdded={() => setActiveTab('all')}
                />
            </header>

            <div className="px-6 space-y-8">
                <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                    {['all', 'live', 'drops', 'dominance', 'rooms'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/5 text-white border border-white/10'}`}
                        >
                            {tab === 'all' && 'All'}
                            {tab === 'live' && 'Live'}
                            {tab === 'drops' && 'Drops'}
                            {tab === 'dominance' && 'Territory'}
                            {tab === 'rooms' && 'Cells'}
                        </button>
                    ))}
                </div>

                {activeTab === 'dominance' && (
                    <div className="px-6">
                        <h2 className="text-2xl font-black mb-6">Territory Masters</h2>
                        <div className="space-y-4">
                            {leaderboard.map((entry, i) => (
                                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-black italic">#{i + 1}</div>
                                        <div>
                                            <img src={entry.user_profiles?.avatar_url || `https://i.pravatar.cc/150?u=${entry.id}`} className="w-16 h-16 rounded-full object-cover" />
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-widest">{entry.user_profiles?.full_name || 'Incognito'}</p>
                                                <p className="text-[8px] text-white/40 uppercase tracking-widest">{entry.grid_id || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-white/20 uppercase tracking-widest">{entry.points || 0}</p>
                                        <div>
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'rooms' && (
                    <div className="px-6">
                        <h2 className="text-2xl font-black mb-6">Active Proximity Cells</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {rooms.map((room) => (
                                <div key={room.id} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-cyan-400/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">{room.name || 'Unknown Cell'}</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {room.member_count} members • {room.last_active_at && <span className="text-cyan-600">active now</span>}
                                            </p>
                                        </div>
                                        <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                                            Enter Cell
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'drops' && (
                    <div className="px-6">
                        <h2 className="text-2xl font-black mb-6">Moment Drops</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {drops.map((drop) => {
                                const dropData = drop.data as { title?: string; type?: string; expires_at?: string };
                                return (
                                    <div key={drop.id} className="bg-zinc-900/80 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100"></div>
                                        <div className="relative z-10">
                                            <Zap className="absolute top-4 right-4 w-12 h-12 bg-yellow-400 rounded-full shadow-lg animate-pulse" />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-lg">{dropData.title || 'Unknown Drop'}</h3>
                                                    <Badge>{dropData.type || 'drop'}</Badge>
                                                </div>
                                                <p className="text-xs text-yellow-200">Expires in {dropData.expires_at ? Math.max(0, Math.floor((new Date(dropData.expires_at).getTime() - new Date().getTime()) / 60000)) : 'Unknown'} minutes</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'all' && (
                    <GlobalFeed />
                )}

                {activeTab === 'live' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Zap className="w-16 h-16 text-primary mb-6 animate-pulse" />
                        <h2 className="text-2xl font-black mb-2 uppercase">Live Transmissions</h2>
                        <p className="text-muted-foreground mb-8">Scanning frequencies for active streams...</p>
                        <ElectricButton onClick={() => window.location.href = '/live'}>Scan Spectrum</ElectricButton>
                    </div>
                )}
            </div>
        </div>
    );
}
