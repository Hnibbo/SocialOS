import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    MapPin,
    Zap,
    Send,
    Bookmark,
    Plus,
    Play
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Bot, Sparkles, Brain } from 'lucide-react';

interface Post {
    id: string;
    user_id: string;
    display_name: string;
    avatar_url: string;
    content: string;
    type: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    media: any[];
}

export const GlobalFeed: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [summarizing, setSummarizing] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_feed_posts', {
                p_user_id: user?.id,
                p_limit: 20
            });

            if (error) throw error;
            setPosts(data || []);

            // Auto-generate AI summary if posts exist
            if (data && data.length > 0) {
                generateNeuralSummary(data);
            }
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateNeuralSummary = async (feedPosts: Post[]) => {
        setSummarizing(true);
        try {
            const feedText = feedPosts.slice(0, 10).map(p => `${p.display_name}: ${p.content}`).join('\n');
            const { data, error } = await supabase.functions.invoke('hup-ai-hub', {
                body: {
                    prompt: `Analyze these recent feed posts and provide a concise 2-sentence "Daily Vibe" summary for the Social OS:\n\n${feedText}`,
                    feature: 'feed_analyzer'
                }
            });
            if (data?.content) setSummary(data.content);
        } catch (err) {
            console.error('AI Summary failed:', err);
        } finally {
            setSummarizing(false);
        }
    };

    const handleLike = async (postId: string, isLiked: boolean) => {
        if (!user) return;

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    is_liked: !isLiked,
                    likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1
                };
            }
            return p;
        }));

        try {
            if (isLiked) {
                await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
            } else {
                await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
            }
        } catch (error) {
            // Revert if error
            fetchFeed();
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto py-8 px-4">
            {/* Stories Bar */}
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                <div className="flex flex-col items-center gap-2 min-w-[70px]">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-primary/50 group cursor-pointer hover:border-primary transition-all">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                                    <User className="w-6 h-6 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-dark text-dark">
                            <Plus className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Your Story</span>
                </div>

                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full p-0.5 border-2 border-primary animate-pulse-glow cursor-pointer hover:scale-105 transition-all">
                            <div className="w-full h-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">User {i + 1}</span>
                    </div>
                ))}
            </div>

            {/* AI Neural Summary */}
            {(summary || summarizing) && (
                <GlassCard className="border-primary/20 bg-primary/5 p-4 overflow-hidden relative group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                Neural Synthesis <Sparkles className="w-3 h-3 animate-pulse" />
                            </h4>
                        </div>
                    </div>
                    {summarizing ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-primary/10" />
                            <Skeleton className="h-4 w-3/4 bg-primary/10" />
                        </div>
                    ) : (
                        <p className="text-sm font-bold leading-relaxed italic opacity-90">
                            "{summary}"
                        </p>
                    )}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Brain className="w-12 h-12 text-primary" />
                    </div>
                </GlassCard>
            )}

            {/* Feed Area */}
            {loading ? (
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <GlassCard key={i} className="p-0 overflow-hidden">
                            <div className="p-4 flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="w-24 h-4" />
                                    <Skeleton className="w-32 h-3" />
                                </div>
                            </div>
                            <Skeleton className="w-full aspect-video" />
                            <div className="p-4 space-y-2">
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-2/3 h-4" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : posts.length > 0 ? (
                posts.map((post) => (
                    <GlassCard key={post.id} className="p-0 overflow-hidden group">
                        {/* Post Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-primary/20 p-0.5">
                                    <img src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{post.display_name}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                        <MapPin className="w-3 h-3 text-primary/50" />
                                        <span>Berlin, Germany</span>
                                        <span className="mx-1">•</span>
                                        <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                            <ElectricButton variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                            </ElectricButton>
                        </div>

                        {/* Post Media */}
                        {post.media && post.media.length > 0 && (
                            <div className="relative aspect-video bg-black/40 overflow-hidden">
                                <img
                                    src={post.media[0].url}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    alt="Post content"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        {/* Post Content */}
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleLike(post.id, post.is_liked)}
                                        className={cn(
                                            "flex items-center gap-1.5 transition-all hover:scale-110",
                                            post.is_liked ? "text-red-500" : "text-white"
                                        )}
                                    >
                                        <Heart className={cn("w-6 h-6", post.is_liked && "fill-current")} />
                                        <span className="text-xs font-bold leading-none">{post.likes_count}</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-white hover:text-primary transition-all hover:scale-110">
                                        <MessageCircle className="w-6 h-6" />
                                        <span className="text-xs font-bold leading-none">{post.comments_count}</span>
                                    </button>
                                    <button className="text-white hover:text-primary transition-all hover:scale-110">
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                                <button className="text-white hover:text-primary transition-all">
                                    <Bookmark className="w-6 h-6" />
                                </button>
                            </div>

                            <div>
                                <p className="text-sm leading-relaxed">
                                    <span className="font-bold mr-2">{post.display_name}</span>
                                    {post.content}
                                </p>
                            </div>

                            {/* Latest Comment Snippet */}
                            <div className="pt-2 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sam" className="w-6 h-6 rounded-full" />
                                    <p className="text-[11px] text-muted-foreground">
                                        <span className="font-bold text-white mr-1">User2</span>
                                        This looks absolutely incredible! 🔥
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fast Comment Bar */}
                        <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-0.5">
                                <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <input
                                placeholder="Write a message..."
                                className="bg-transparent border-none focus:outline-none text-xs flex-1 placeholder:opacity-30"
                            />
                            <button className="text-primary hover:scale-110 transition-transform">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </GlassCard>
                ))
            ) : (
                <div className="text-center py-20 px-4">
                    <Zap className="w-16 h-16 mx-auto mb-6 text-primary opacity-20" />
                    <h2 className="text-2xl font-bold mb-2">Your Feed is Empty</h2>
                    <p className="text-muted-foreground mb-8">Follow people on the map or invite friends to start seeing content!</p>
                    <ElectricButton onClick={() => window.location.href = '/map'}>
                        Go to Map
                    </ElectricButton>
                </div>
            )}
        </div>
    );
};
