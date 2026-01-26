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
    Play,
    User,
    Trash2,
    Edit2,
    Copy,
    ExternalLink,
    Smile
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Bot, Sparkles, Brain } from 'lucide-react';

interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    display_name: string;
    avatar_url: string;
    content: string;
    created_at: string;
    is_edited: boolean;
}

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
    comments?: Comment[];
}

const parseContent = (content: string) => {
    // Parse hashtags
    const hashtagRegex = /#(\w+)/g;
    let parsedContent = content.replace(hashtagRegex, '<a href="/search?tag=$1" class="text-blue-400 hover:text-blue-300">#$1</a>');
    
    // Parse mentions
    const mentionRegex = /@(\w+)/g;
    parsedContent = parsedContent.replace(mentionRegex, '<a href="/profile/$1" class="text-blue-400 hover:text-blue-300">@$1</a>');
    
    return parsedContent;
};

const GlobalFeedComponent: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [summarizing, setSummarizing] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editContent, setEditContent] = useState('');
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [showComments, setShowComments] = useState<Record<string, boolean>>({});
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
    const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
    const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
    const { user } = useAuth();
    const { fetchRecommendedProfiles } = useProfiles();
    const { toast } = useToast();

    useEffect(() => {
        fetchFeed();
        fetchRecommendedPosts();
        loadActiveProfiles();
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

    const loadActiveProfiles = async () => {
        if (!user) return;
        const profiles = await fetchRecommendedProfiles(user.id);
        setActiveProfiles(profiles);
    };

    const fetchRecommendedPosts = async () => {
        try {
            // Fetch personalized recommendations based on user interests (from onboarding)
            const userInterests = JSON.parse(localStorage.getItem('user_interests') || '[]');
            
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    user_profiles (
                        display_name,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            // Filter posts by user interests if available
            if (userInterests.length > 0) {
                query = query.or(userInterests.map(interest => `content.ilike.%${interest}%`).join(','));
            }

            const { data, error } = await query.limit(8);

            if (error) throw error;

            const mappedPosts: Post[] = data.map(post => ({
                id: post.id,
                user_id: post.user_id,
                display_name: post.user_profiles.display_name,
                avatar_url: post.user_profiles.avatar_url,
                content: post.content,
                type: post.post_type,
                created_at: post.created_at,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                is_liked: false,
                media: post.media_urls ? JSON.parse(post.media_urls) : []
            }));

            setRecommendedPosts(mappedPosts);
        } catch (error) {
            console.error('Error fetching recommended posts:', error);
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
        const newIsLiked = !isLiked;
        setLikedPosts(prev => ({ ...prev, [postId]: newIsLiked }));
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    is_liked: newIsLiked,
                    likes_count: newIsLiked ? p.likes_count + 1 : p.likes_count - 1
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

    const handleDelete = async (postId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user.id);

            if (error) throw error;

            setPosts(prev => prev.filter(p => p.id !== postId));
            toast({
                title: "Post Deleted",
                description: "Your post has been successfully deleted.",
            });
        } catch (error: any) {
            toast({
                title: "Delete Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleEdit = async (postId: string) => {
        if (!user || !editingPost) return;

        try {
            const { error } = await supabase
                .from('posts')
                .update({ content: editContent })
                .eq('id', postId)
                .eq('user_id', user.id);

            if (error) throw error;

            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, content: editContent };
                }
                return p;
            }));

            setEditingPost(null);
            setEditContent('');
            toast({
                title: "Post Updated",
                description: "Your post has been successfully updated.",
            });
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const fetchComments = async (postId: string) => {
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select('*, user_profiles(display_name, avatar_url)')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const mappedComments: Comment[] = data.map(comment => ({
                id: comment.id,
                post_id: comment.post_id,
                user_id: comment.user_id,
                display_name: comment.user_profiles.display_name,
                avatar_url: comment.user_profiles.avatar_url,
                content: comment.content,
                created_at: comment.created_at,
                is_edited: comment.is_edited
            }));

            setComments(prev => ({ ...prev, [postId]: mappedComments }));
        } catch (error: any) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleCommentChange = (postId: string, value: string) => {
        setCommentInputs(prev => ({ ...prev, [postId]: value }));
    };

    const handleCommentSubmit = async (postId: string) => {
        if (!user) return;

        const content = commentInputs[postId];
        if (!content?.trim()) return;

        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: content.trim()
                })
                .select('*, user_profiles(display_name, avatar_url)')
                .single();

            if (error) throw error;

            const newComment: Comment = {
                id: data.id,
                post_id: data.post_id,
                user_id: data.user_id,
                display_name: data.user_profiles.display_name,
                avatar_url: data.user_profiles.avatar_url,
                content: data.content,
                created_at: data.created_at,
                is_edited: data.is_edited
            };

            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));

            setCommentInputs(prev => ({ ...prev, [postId]: '' }));

            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, comments_count: p.comments_count + 1 };
                }
                return p;
            }));

            toast({
                title: "Comment Added",
                description: "Your comment has been successfully posted.",
            });
        } catch (error: any) {
            toast({
                title: "Comment Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleCommentDelete = async (postId: string, commentId: string) => {
        if (!user) return;

        try {
            const { data: commentData, error: fetchError } = await supabase
                .from('post_comments')
                .select('user_id')
                .eq('id', commentId)
                .single();

            if (fetchError) throw fetchError;

            if (commentData.user_id !== user.id) {
                toast({
                    title: "Delete Failed",
                    description: "You can only delete your own comments.",
                    variant: "destructive",
                });
                return;
            }

            const { error } = await supabase
                .from('post_comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));

            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, comments_count: p.comments_count - 1 };
                }
                return p;
            }));

            toast({
                title: "Comment Deleted",
                description: "Your comment has been successfully deleted.",
            });
        } catch (error: any) {
            toast({
                title: "Delete Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleShare = async (postId: string) => {
        const shareUrl = `${window.location.origin}/post/${postId}`;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this post',
                    text: 'Check out this post on SocialOS',
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                toast({
                    title: "Link Copied",
                    description: "Post link has been copied to clipboard.",
                });
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing post:', error);
                toast({
                    title: "Share Failed",
                    description: "Failed to share post. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto py-8 px-4">


            {/* Neural Activity (Stories Replacement) */}
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
                    <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Your Vibe</span>
                </div>

                {activeProfiles.map((profile) => (
                    <div key={profile.id} className="flex flex-col items-center gap-2 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full p-0.5 border-2 border-primary animate-pulse-glow cursor-pointer hover:scale-105 transition-all">
                            <div className="w-full h-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
                                <img 
                                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-tighter truncate max-w-[70px]">{profile.display_name?.split(' ')[0] || 'User'}</span>
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

            {/* Recommended Posts */}
            {recommendedPosts.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Recommended for you</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendedPosts.map((post) => (
                            <GlassCard key={post.id} className="p-0 overflow-hidden group">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-purple-500/20 p-0.5">
                                            <img src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{post.display_name}</h4>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                <span>Recommended</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 pb-2">
                                    <p className="text-sm leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: parseContent(post.content) }} />
                                </div>
                                {post.media && post.media.length > 0 && (
                                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                                        <img
                                            src={post.media[0].url}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            alt="Post content"
                                        />
                                    </div>
                                )}
                                <div className="p-4 pt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleLike(post.id, post.is_liked)}
                                            className={cn(
                                                "flex items-center gap-1.5 transition-all hover:scale-110",
                                                (likedPosts[post.id] || post.is_liked) ? "text-red-500" : "text-white"
                                            )}
                                        >
                                            <Heart className={cn("w-5 h-5", (likedPosts[post.id] || post.is_liked) && "fill-current animate-pulse")} />
                                            <span className="text-xs font-bold leading-none">{post.likes_count}</span>
                                        </button>
                                        <button 
                                            className="flex items-center gap-1.5 text-white hover:text-primary transition-all hover:scale-110"
                                            onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            <span className="text-xs font-bold leading-none">{post.comments_count}</span>
                                        </button>
                                        <button 
                                            className="text-white hover:text-primary transition-all hover:scale-110"
                                            onClick={() => handleShare(post.id)}
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
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
                            {user?.id === post.user_id && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ElectricButton 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                            setEditingPost(post);
                                            setEditContent(post.content);
                                        }}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </ElectricButton>
                                    <ElectricButton 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDelete(post.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </ElectricButton>
                                </div>
                            )}
                        </div>

                        {/* Post Media */}
                        {/* Post Media Grid */}
                        {post.media && post.media.length > 0 && (
                            <div className={cn(
                                "relative bg-black/40 overflow-hidden",
                                post.media.length > 1 ? "grid gap-0.5" : "aspect-video",
                                post.media.length === 2 && "grid-cols-2 aspect-video",
                                post.media.length >= 3 && "grid-cols-2 aspect-square"
                            )}>
                                {post.media.slice(0, 4).map((media: any, index: number) => (
                                    <div key={index} className={cn(
                                        "relative overflow-hidden group/media cursor-pointer",
                                        post.media.length === 3 && index === 0 && "row-span-2",
                                        post.media.length === 1 && "h-full w-full"
                                    )}>
                                        <img
                                            src={media.url}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-105"
                                            alt="Post content"
                                        />
                                        {post.media.length > 4 && index === 3 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-2xl font-bold">+{post.media.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        )}

                        {/* Post Content */}
                        <div className="p-4 space-y-4">
                            {editingPost?.id === post.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-black/30 border border-primary/30 rounded-lg p-2 text-sm resize-none"
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <ElectricButton 
                                            size="sm" 
                                            onClick={() => handleEdit(post.id)}
                                        >
                                            Save
                                        </ElectricButton>
                                        <ElectricButton 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setEditingPost(null)}
                                        >
                                            Cancel
                                        </ElectricButton>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm leading-relaxed">
                                        <span className="font-bold mr-2">{post.display_name}</span>
                                        <span dangerouslySetInnerHTML={{ __html: parseContent(post.content) }} />
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleLike(post.id, post.is_liked)}
                                        className={cn(
                                            "flex items-center gap-1.5 transition-all hover:scale-110",
                                            (likedPosts[post.id] || post.is_liked) ? "text-red-500" : "text-white"
                                        )}
                                    >
                                        <Heart className={cn("w-6 h-6", (likedPosts[post.id] || post.is_liked) && "fill-current animate-pulse")} />
                                        <span className="text-xs font-bold leading-none">{post.likes_count}</span>
                                    </button>
                                    <button 
                                        className="flex items-center gap-1.5 text-white hover:text-primary transition-all hover:scale-110"
                                        onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                    >
                                        <MessageCircle className="w-6 h-6" />
                                        <span className="text-xs font-bold leading-none">{post.comments_count}</span>
                                    </button>
                                    <button 
                                        className="text-white hover:text-primary transition-all hover:scale-110"
                                        onClick={() => handleShare(post.id)}
                                    >
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                                <button className="text-white hover:text-primary transition-all">
                                    <Bookmark className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Latest Comment Snippet - Fetched dynamically or hidden */}
                            {!showComments[post.id] && post.comments_count > 0 && (
                                <div className="pt-2 border-t border-white/5">
                                    <button 
                                        className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                                        onClick={() => {
                                            if (!comments[post.id]) fetchComments(post.id);
                                            setShowComments(prev => ({ ...prev, [post.id]: true }));
                                        }}
                                    >
                                        View all {post.comments_count} comments
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Fast Comment Bar */}
                        <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-0.5">
                                <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <input
                                placeholder="Write a message..."
                                className="bg-transparent border-none focus:outline-none text-xs flex-1 placeholder:opacity-30"
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCommentSubmit(post.id);
                                    }
                                }}
                            />
                            <button 
                                className="text-primary hover:scale-110 transition-transform disabled:opacity-50"
                                disabled={!commentInputs[post.id]?.trim()}
                                onClick={() => handleCommentSubmit(post.id)}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Comments Section */}
                        {showComments[post.id] && comments[post.id]?.length > 0 && (
                            <div className="px-4 pb-4 space-y-3 animate-fadeIn">
                                {comments[post.id].map((comment) => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full border border-white/20 p-0.5 flex-shrink-0">
                                            <img 
                                                src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} 
                                                className="w-full h-full rounded-full object-cover" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white/5 rounded-lg p-2">
                                                <p className="text-xs leading-relaxed">
                                                    <span className="font-bold mr-1">{comment.display_name}</span>
                                                    <span dangerouslySetInnerHTML={{ __html: parseContent(comment.content) }} />
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {user?.id === comment.user_id && (
                                                    <button 
                                                        className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                                                        onClick={() => handleCommentDelete(post.id, comment.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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

export const GlobalFeed = React.memo(GlobalFeedComponent);
