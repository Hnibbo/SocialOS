import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import {
    Search,
    X,
    User,
    FileText,
    Hash,
    MapPin,
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string;
    type: 'user' | 'post' | 'hashtag' | 'location';
    title: string;
    subtitle?: string;
    avatar_url?: string;
    content?: string;
    created_at?: string;
    likes_count?: number;
    comments_count?: number;
}

interface SearchSuggestion {
    id: string;
    type: 'suggestion';
    title: string;
    subtitle: string;
}

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<(SearchResult | SearchSuggestion)[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    const { user } = useAuth();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            search(query.trim());
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query]);

    const search = async (searchQuery: string) => {
        setLoading(true);
        try {
            const results: (SearchResult | SearchSuggestion)[] = [];

            // Add search suggestions
            const suggestions: SearchSuggestion[] = [
                {
                    id: `suggestion-users-${searchQuery}`,
                    type: 'suggestion',
                    title: `Search users for "${searchQuery}"`,
                    subtitle: 'Find people with matching names'
                },
                {
                    id: `suggestion-posts-${searchQuery}`,
                    type: 'suggestion',
                    title: `Search posts for "${searchQuery}"`,
                    subtitle: 'Find posts with matching content'
                },
                {
                    id: `suggestion-hashtags-${searchQuery}`,
                    type: 'suggestion',
                    title: `Search hashtags for "${searchQuery}"`,
                    subtitle: 'Find trending hashtags'
                }
            ];
            results.push(...suggestions);

            // Search users
            const { data: users, error: usersError } = await supabase
                .from('user_profiles')
                .select('id, display_name, avatar_url')
                .ilike('display_name', `%${searchQuery}%`)
                .limit(3);

            if (usersError) console.error('Error searching users:', usersError);
            if (users) {
                users.forEach(user => {
                    results.push({
                        id: user.id,
                        type: 'user',
                        title: user.display_name,
                        avatar_url: user.avatar_url
                    });
                });
            }

            // Search posts
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select('id, content, created_at, user_id, likes_count, comments_count')
                .ilike('content', `%${searchQuery}%`)
                .eq('visibility', 'public')
                .limit(3);

            if (postsError) console.error('Error searching posts:', postsError);
            if (posts) {
                const userIds = [...new Set(posts.map(post => post.user_id))];
                const { data: postUsers } = await supabase
                    .from('user_profiles')
                    .select('id, display_name')
                    .in('id', userIds);

                posts.forEach(post => {
                    const postUser = postUsers?.find(u => u.id === post.user_id);
                    results.push({
                        id: post.id,
                        type: 'post',
                        title: post.content.substring(0, 80) + (post.content.length > 80 ? '...' : ''),
                        subtitle: postUser?.display_name,
                        content: post.content,
                        created_at: post.created_at,
                        likes_count: post.likes_count,
                        comments_count: post.comments_count
                    });
                });
            }

            // Search hashtags (extract from posts)
            const hashtagPattern = new RegExp(`#${searchQuery}[\\w]*`, 'g');
            const allPosts = await supabase
                .from('posts')
                .select('content')
                .eq('visibility', 'public');

            if (!allPosts.error && allPosts.data) {
                const hashtags = new Set<string>();
                allPosts.data.forEach(post => {
                    const matches = post.content.match(hashtagPattern);
                    if (matches) {
                        matches.forEach(hashtag => {
                            hashtags.add(hashtag.toLowerCase());
                        });
                    }
                });

                Array.from(hashtags).slice(0, 3).forEach(hashtag => {
                    results.push({
                        id: hashtag,
                        type: 'hashtag',
                        title: hashtag
                    });
                });
            }

            setResults(results.slice(0, 12));
            setShowResults(true);
        } catch (error: any) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (result: SearchResult | SearchSuggestion) => {
        if (result.type === 'suggestion') {
            // Handle search suggestions
            if (result.title.includes('users')) {
                window.location.href = `/search?q=${query}&tab=users`;
            } else if (result.title.includes('posts')) {
                window.location.href = `/search?q=${query}&tab=posts`;
            } else if (result.title.includes('hashtags')) {
                window.location.href = `/search?q=${query}&tab=hashtags`;
            }
        } else {
            // Handle regular results
            switch (result.type) {
                case 'user':
                    window.location.href = `/profile/${result.id}`;
                    break;
                case 'post':
                    window.location.href = `/post/${result.id}`;
                    break;
                case 'hashtag':
                    window.location.href = `/search/hashtag/${result.id.replace('#', '')}`;
                    break;
                case 'location':
                    window.location.href = `/search/location/${result.title}`;
                    break;
            }
        }
        setShowResults(false);
        setQuery('');
    };

    const renderResultIcon = (type: string) => {
        switch (type) {
            case 'user':
                return <User className="w-4 h-4" />;
            case 'post':
                return <FileText className="w-4 h-4" />;
            case 'hashtag':
                return <Hash className="w-4 h-4" />;
            case 'location':
                return <MapPin className="w-4 h-4" />;
            case 'suggestion':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <Search className="w-4 h-4" />;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setShowResults(true)}
                    placeholder="Search users, posts, hashtags..."
                    className="w-full pl-10 pr-10 py-2 bg-black/30 border border-white/10 rounded-lg text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setShowResults(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Search Results */}
            {showResults && (
                <GlassCard className="absolute top-full left-0 right-0 mt-2 max-h-[500px] overflow-y-auto p-2 border-primary/20 shadow-[0_0_50px_rgba(0,240,255,0.1)] z-50">
                    {loading ? (
                        <div className="p-4 text-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        results.map((result, index) => (
                            <div
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleResultClick(result)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    {renderResultIcon(result.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold truncate">{result.title}</h4>
                                        <span className="text-xs text-muted-foreground capitalize">{result.type}</span>
                                    </div>
                                    {result.subtitle && (
                                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                    )}
                                    {('created_at' in result && result.created_at) && (
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(result.created_at).toLocaleDateString([], { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <Search className="w-12 h-12 mx-auto text-primary opacity-20 mb-4" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                No Results
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                No matches found for "{query}"
                            </p>
                        </div>
                    )}
                </GlassCard>
            )}
        </div>
    );
};
