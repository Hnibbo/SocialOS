import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import {
    User,
    MapPin,
    Heart,
    MessageSquare,
    Sparkles,
    Zap,
    Languages,
    Shield,
    Share2,
    CheckCircle2,
    Cpu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface IdentityProfile {
    id: string;
    display_name: string;
    avatar_url: string;
    pronouns: string[];
    gender_identity: string;
    sexual_orientation: string;
    languages: string[];
    bio: string;
    interests: string[];
    active_agents?: { name: string; slug: string }[];
}

export const ProfileDiscovery: React.FC<{ userId?: string }> = ({ userId }) => {
    const [profile, setProfile] = useState<IdentityProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (userId || currentUser?.id) {
            loadProfile();
        }
    }, [userId, currentUser]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const targetId = userId || currentUser?.id;

            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', targetId)
                .single();

            const { data: identityData, error: identityError } = await supabase
                .from('user_identity')
                .select('*')
                .eq('user_id', targetId)
                .single();

            if (profileData) {
                const { data: agents } = await supabase
                    .from('user_installed_agents')
                    .select('agent:marketplace_agents(name, slug)')
                    .eq('user_id', targetId)
                    .eq('is_enabled', true);

                setProfile({
                    id: profileData.id,
                    display_name: profileData.display_name,
                    avatar_url: profileData.avatar_url,
                    pronouns: identityData?.pronouns || [],
                    gender_identity: identityData?.gender_identity || '',
                    sexual_orientation: identityData?.sexual_orientation || '',
                    languages: identityData?.languages || [],
                    bio: identityData?.bio || '',
                    interests: identityData?.interests || [],
                    active_agents: agents?.map(a => (a as any).agent) || []
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto animate-spin text-primary opacity-50" />
            <p className="mt-4 font-bold uppercase tracking-widest text-xs opacity-50">Syncing Identity...</p>
        </div>
    );

    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            {/* Cover/Header Area */}
            <GlassCard className="p-0 overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-primary/30 via-secondary/30 to-purple-500/30 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <ElectricButton variant="ghost" size="sm" className="absolute top-4 right-4 bg-black/20 backdrop-blur-md">
                        <Share2 className="w-4 h-4" />
                    </ElectricButton>
                </div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 flex items-end justify-between mb-6">
                        <div className="flex items-end gap-6">
                            <div className="w-32 h-32 rounded-3xl border-4 border-dark overflow-hidden bg-dark shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="pb-2">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-black tracking-tighter italic">{profile.display_name}</h1>
                                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                                </div>
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mt-1">
                                    <Zap className="w-4 h-4" />
                                    <span>Elite Member</span>
                                    <span className="opacity-30 mx-1">•</span>
                                    <span>Level 24</span>
                                    {profile.active_agents && profile.active_agents.length > 0 && (
                                        <>
                                            <span className="opacity-30 mx-1">•</span>
                                            <span className="text-green-400 animate-pulse">Neural Active</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <ElectricButton variant="secondary" size="md">
                                <MessageSquare className="w-4 h-4" />
                            </ElectricButton>
                            <ElectricButton variant="primary" size="md">
                                FOLLOW
                            </ElectricButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-30">About</h3>
                                <p className="text-lg leading-relaxed">{profile.bio || "No bio set. This user is a mystery..."}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {profile.pronouns.map(p => (
                                    <span key={p} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">{p}</span>
                                ))}
                                {profile.gender_identity && (
                                    <span className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold text-secondary uppercase tracking-widest">{profile.gender_identity}</span>
                                )}
                                {profile.languages.map(l => (
                                    <span key={l} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Languages className="w-3 h-3" /> {l}
                                    </span>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-30">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests.length > 0 ? profile.interests.map(i => (
                                        <div key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 cursor-pointer transition-all flex items-center gap-2 group">
                                            <Star className="w-3 h-3 text-yellow-400 group-hover:animate-spin" />
                                            <span className="text-xs font-bold">{i}</span>
                                        </div>
                                    )) : (
                                        <p className="text-xs opacity-50 italic">No interests added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Stats/Info */}
                        <div className="space-y-6">
                            <GlassCard className="p-4 bg-white/5 border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">Network Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground">Followers</span>
                                        <span className="font-black text-primary">1.2K</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground">Following</span>
                                        <span className="font-black text-primary">450</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground">Posts</span>
                                        <span className="font-black text-primary">84</span>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-4 bg-white/5 border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">Signals</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-xs font-bold uppercase tracking-widest italic text-primary">Open to Dating</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-secondary" />
                                        <span className="text-xs font-bold uppercase tracking-widest italic text-secondary">Looking for Work</span>
                                    </div>
                                </div>
                            </GlassCard>

                            {profile.active_agents && profile.active_agents.length > 0 && (
                                <GlassCard className="p-4 bg-primary/5 border-primary/10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                                        <Cpu className="w-3 h-3" /> Deployed Agents
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.active_agents.map(agent => (
                                            <div key={agent.slug} className="flex items-center gap-2 py-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{agent.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Content Tabs TBD */}
            <div className="flex gap-8 border-b border-white/5 px-2">
                {['Posts', 'Media', 'Matches', 'Challenges'].map(tab => (
                    <button key={tab} className={cn(
                        "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                        tab === 'Posts' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-white"
                    )}>
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Star = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
);
