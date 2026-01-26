import React, { useState, useEffect, useRef } from 'react';
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
    Cpu,
    Camera,
    Edit2,
    Save,
    X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
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
    cover_image_url?: string;
    active_agents?: { name: string; slug: string }[];
}

export const ProfileEditor: React.FC<{ userId?: string; onClose?: () => void }> = ({ userId, onClose }) => {
    const [profile, setProfile] = useState<IdentityProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<IdentityProfile>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    
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

                const userProfile: IdentityProfile = {
                    id: profileData.id,
                    display_name: profileData.display_name,
                    avatar_url: profileData.avatar_url,
                    cover_image_url: profileData.cover_image_url,
                    pronouns: identityData?.pronouns || [],
                    gender_identity: identityData?.gender_identity || '',
                    sexual_orientation: identityData?.sexual_orientation || '',
                    languages: identityData?.languages || [],
                    bio: identityData?.bio || '',
                    interests: identityData?.interests || [],
                    active_agents: agents?.map(a => (a as any).agent) || []
                };

                setProfile(userProfile);
                setFormData(userProfile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof IdentityProfile, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadFile = async (file: File, folder: string, fileName: string): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${folder}/${fileName}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('user_media')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
            .from('user_media')
            .getPublicUrl(filePath);

        return publicUrl.publicUrl;
    };

    const handleSave = async () => {
        if (!profile || !currentUser) return;

        setSaving(true);
        try {
            const updates: any = {};

            // Handle avatar upload
            if (avatarFile) {
                const avatarUrl = await uploadFile(avatarFile, 'avatars', profile.id);
                updates.avatar_url = avatarUrl;
            }

            // Handle cover image upload
            if (coverFile) {
                const coverUrl = await uploadFile(coverFile, 'covers', profile.id);
                updates.cover_image_url = coverUrl;
            }

            // Update user profile
            if (Object.keys(updates).length > 0) {
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update(updates)
                    .eq('id', profile.id);

                if (profileError) throw profileError;
            }

            // Update user identity
            const { error: identityError } = await supabase
                .from('user_identity')
                .update({
                    pronouns: formData.pronouns || [],
                    gender_identity: formData.gender_identity || '',
                    sexual_orientation: formData.sexual_orientation || '',
                    languages: formData.languages || [],
                    bio: formData.bio || '',
                    interests: formData.interests || []
                })
                .eq('user_id', profile.id);

            if (identityError) throw identityError;

            // Update display name in auth
            if (formData.display_name && formData.display_name !== profile.display_name) {
                const { error: authError } = await supabase.auth.updateUser({
                    data: { name: formData.display_name }
                });

                if (authError) throw authError;
            }

            // Refresh profile data
            await loadProfile();
            setEditing(false);
            setAvatarFile(null);
            setCoverFile(null);
            setAvatarPreview(null);
            setCoverPreview(null);
            
            if (onClose) {
                onClose();
            }
        } catch (error: any) {
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
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
                {/* Cover Image */}
                <div className="h-48 relative">
                    <img 
                        src={coverPreview || profile.cover_image_url || `https://images.unsplash.com/photo-1557683316-973673baf929?w=1200&h=400&fit=crop`} 
                        className="w-full h-full object-cover" 
                        alt="Cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-purple-500/30" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    
                    {editing && (
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
                        >
                            <Camera className="w-4 h-4 text-white" />
                        </button>
                    )}
                    
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverChange}
                    />
                </div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 flex items-end justify-between mb-6">
                        {/* Avatar */}
                        <div className="flex items-end gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-3xl border-4 border-dark overflow-hidden bg-dark shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <img 
                                        src={avatarPreview || profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                                        className="w-full h-full object-cover" 
                                        alt="Avatar"
                                    />
                                </div>
                                
                                {editing && (
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-full hover:bg-primary/80 transition-colors border-2 border-dark"
                                    >
                                        <Camera className="w-4 h-4 text-dark" />
                                    </button>
                                )}
                                
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <div className="pb-2">
                                {editing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={formData.display_name || ''}
                                            onChange={(e) => handleInputChange('display_name', e.target.value)}
                                            className="text-3xl font-black tracking-tighter italic bg-transparent border-b-2 border-primary p-1"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-3xl font-black tracking-tighter italic">{profile.display_name}</h1>
                                        <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                                    </div>
                                )}

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

                        {/* Edit/Save Button */}
                        <div className="flex gap-2">
                            {editing ? (
                                <>
                                    <ElectricButton 
                                        variant="ghost" 
                                        size="md"
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData(profile);
                                            setAvatarFile(null);
                                            setCoverFile(null);
                                            setAvatarPreview(null);
                                            setCoverPreview(null);
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </ElectricButton>
                                    <ElectricButton 
                                        variant="primary" 
                                        size="md"
                                        disabled={saving}
                                        onClick={handleSave}
                                    >
                                        {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {saving ? 'Saving...' : 'Save'}
                                    </ElectricButton>
                                </>
                            ) : (
                                <ElectricButton 
                                    variant="primary" 
                                    size="md"
                                    onClick={() => setEditing(true)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </ElectricButton>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-30">About</h3>
                                {editing ? (
                                    <textarea
                                        value={formData.bio || ''}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-lg leading-relaxed focus:border-primary/50 focus:outline-none resize-none"
                                        rows={4}
                                    />
                                ) : (
                                    <p className="text-lg leading-relaxed">{profile.bio || "No bio set. This user is a mystery..."}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-30">Interests</h3>
                                {editing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Add interests separated by commas"
                                            value={formData.interests?.join(', ') || ''}
                                            onChange={(e) => handleInputChange('interests', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                        />
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <GlassCard className="p-4 bg-white/5 border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">Personal Info</h3>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pronouns</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.pronouns?.join(', ') || ''}
                                                onChange={(e) => handleInputChange('pronouns', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.pronouns.map(p => (
                                                    <span key={p} className="px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">{p}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Languages</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.languages?.join(', ') || ''}
                                                onChange={(e) => handleInputChange('languages', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.languages.map(l => (
                                                    <span key={l} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                        <Languages className="w-3 h-3" /> {l}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gender Identity</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.gender_identity || ''}
                                                onChange={(e) => handleInputChange('gender_identity', e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                            />
                                        ) : (
                                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                                                <p className="text-sm font-bold">{profile.gender_identity || 'Not specified'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sexual Orientation</label>
                                        {editing ? (
                                            <input
                                                type="text"
                                                value={formData.sexual_orientation || ''}
                                                onChange={(e) => handleInputChange('sexual_orientation', e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                            />
                                        ) : (
                                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                                                <p className="text-sm font-bold">{profile.sexual_orientation || 'Not specified'}</p>
                                            </div>
                                        )}
                                    </div>

                                    {editing && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gender Identity</label>
                                                <input
                                                    type="text"
                                                    value={formData.gender_identity || ''}
                                                    onChange={(e) => handleInputChange('gender_identity', e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sexual Orientation</label>
                                                <input
                                                    type="text"
                                                    value={formData.sexual_orientation || ''}
                                                    onChange={(e) => handleInputChange('sexual_orientation', e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                                                />
                                            </div>
                                        </>
                                    )}
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
        </div>
    );
};

const Star = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
);
