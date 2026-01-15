import React, { useState, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import {
    X,
    Image as ImageIcon,
    Video,
    MapPin,
    Smile,
    Send,
    Zap,
    Globe,
    Users,
    Lock,
    Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const CreatePostDialog: React.FC<{ isOpen: boolean; onClose: () => void; onPostAdded?: () => void }> = ({ isOpen, onClose, onPostAdded }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [visibility, setVisibility] = useState('public');
    const [media, setMedia] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setMedia(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index: number) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePost = async () => {
        if (!content.trim() && media.length === 0) return;
        if (!user) return;

        setLoading(true);
        try {
            // 1. Create post record
            const { data: post, error: postError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: content,
                    visibility: visibility,
                    type: media.length > 0 ? 'image' : 'text',
                })
                .select()
                .single();

            if (postError) throw postError;

            // 2. Upload media and create records if any
            if (media.length > 0) {
                for (const [idx, file] of media.entries()) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${post.id}/${idx}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('post_media')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrl } = supabase.storage
                        .from('post_media')
                        .getPublicUrl(fileName);

                    await supabase.from('post_media').insert({
                        post_id: post.id,
                        media_url: publicUrl.publicUrl,
                        media_type: file.type.startsWith('image/') ? 'image' : 'video',
                        order_index: idx
                    });
                }
            }

            toast({
                title: "Post Transmitted!",
                description: "Your data has been successfully broadcast to the Social OS.",
            });

            setContent('');
            setMedia([]);
            setMediaPreviews([]);
            onClose();
            if (onPostAdded) onPostAdded();

        } catch (error: any) {
            toast({
                title: "Transmission Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
            <div className="w-full max-w-lg animate-in zoom-in-95 duration-500">
                <GlassCard className="overflow-hidden border-primary/20 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" /> Create New Post
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full border border-primary/20 p-0.5 shrink-0">
                                <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full rounded-full" />
                            </div>
                            <textarea
                                placeholder="What's happening in your corner of the OS?"
                                className="w-full bg-transparent border-none focus:outline-none py-2 text-lg resize-none min-h-[120px] placeholder:opacity-30"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>

                        {/* Media Previews */}
                        {mediaPreviews.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {mediaPreviews.map((preview, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <img src={preview} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeMedia(i)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all shrink-0"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleMediaSelect}
                        />

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors flex items-center gap-2 group"
                                >
                                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Media</span>
                                </button>
                                <button className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors flex items-center gap-2 group">
                                    <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Location</span>
                                </button>
                                <button className="p-2 hover:bg-yellow-400/10 rounded-lg text-yellow-400 transition-colors flex items-center gap-2 group">
                                    <Smile className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <select
                                    value={visibility}
                                    onChange={(e) => setVisibility(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none hover:border-white/20 transition-colors"
                                >
                                    <option value="public">Public</option>
                                    <option value="friends">Friends</option>
                                    <option value="private">Private</option>
                                </select>

                                <ElectricButton
                                    size="sm"
                                    disabled={loading || (!content.trim() && media.length === 0)}
                                    onClick={handleCreatePost}
                                    className="pl-4 pr-6 py-2"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {loading ? 'Transmitting...' : 'Post'}
                                </ElectricButton>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-primary" /> OS Protocol Active</span>
                        <span>Est. Transmission: 12ms</span>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
