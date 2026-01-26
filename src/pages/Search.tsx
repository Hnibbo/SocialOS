import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import {
    Search,
    User,
    FileText,
    Hash,
    MapPin,
    Filter,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { useAISearch } from '@/hooks/useAISearch';
import { AISearchSuggestions } from '@/components/search/AISearchSuggestions';

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

export default function Search() {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'hashtags'>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const PAGE_SIZE = 10;
    
    const { user } = useAuth();
    const { search, searchSuggestions } = useAISearch();

    useEffect(() => {
        const searchQuery = searchParams.get('q');
        const tabParam = searchParams.get('tab');
        const pageParam = searchParams.get('page');
        
        if (searchQuery) {
            setQuery(searchQuery);
            const pageNum = pageParam ? parseInt(pageParam) : 1;
            setPage(pageNum);
            performSearch(searchQuery, tabParam as 'all' | 'users' | 'posts' | 'hashtags' || 'all', pageNum);
        }
        
        if (tabParam && ['users', 'posts', 'hashtags'].includes(tabParam)) {
            setActiveTab(tabParam as 'users' | 'posts' | 'hashtags');
        }
    }, [searchParams]);

    const performSearch = async (searchQuery: string, type: 'all' | 'users' | 'posts' | 'hashtags' = 'all', pageNum: number = 1) => {
        setLoading(true);
        try {
            const { results: searchResults, totalResults: resultCount } = await search(
                searchQuery,
                type,
                pageNum,
                PAGE_SIZE
            );

            setResults(searchResults);
            setTotalResults(resultCount);
            setTotalPages(Math.ceil(resultCount / PAGE_SIZE));
        } catch (error: any) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: 'all' | 'users' | 'posts' | 'hashtags') => {
        setActiveTab(tab);
        setPage(1);
        if (query) {
            performSearch(query, tab, 1);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setPage(1);
            performSearch(query, activeTab, 1);
            setShowSuggestions(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            performSearch(query, activeTab, newPage);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        setPage(1);
        performSearch(suggestion, activeTab, 1);
        setShowSuggestions(false);
    };

    const handleResultClick = (result: SearchResult) => {
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
    };

    const renderResult = (result: SearchResult) => {
        const aiResult = result as any;
        switch (result.type) {
            case 'user':
                return (
                    <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full border border-primary/20 p-0.5">
                            <img
                                src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.id}`}
                                className="w-full h-full rounded-full object-cover"
                                alt={result.title}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm">{result.title}</h3>
                                {aiResult.score && (
                                    <div className="flex items-center gap-1 text-xs text-primary">
                                        <Sparkles className="w-3 h-3" />
                                        <span>{Math.round(aiResult.score * 100)}%</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {aiResult.relevance || 'View profile'}
                            </p>
                        </div>
                    </div>
                );

            case 'post':
                return (
                    <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="p-4 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-white/5"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                            {aiResult.score && (
                                <div className="flex items-center gap-1 text-xs text-primary">
                                    <Sparkles className="w-3 h-3" />
                                    <span>{Math.round(aiResult.score * 100)}%</span>
                                </div>
                            )}
                            {result.created_at && (
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(result.created_at).toLocaleDateString([], { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                    })}
                                </span>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed mb-3">{result.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Likes: {result.likes_count || 0}</span>
                            <span>Comments: {result.comments_count || 0}</span>
                            {aiResult.relevance && (
                                <span className="text-primary">{aiResult.relevance}</span>
                            )}
                        </div>
                    </div>
                );

            case 'hashtag':
                return (
                    <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <Hash className="w-6 h-6 text-primary" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm">{result.title}</h3>
                                {aiResult.score && (
                                    <div className="flex items-center gap-1 text-xs text-primary">
                                        <Sparkles className="w-3 h-3" />
                                        <span>{Math.round(aiResult.score * 100)}%</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {aiResult.relevance || 'View posts with this hashtag'}
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Search Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-black italic tracking-tighter mb-2">
                        Global Search
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Search the entire SocialOS network for users, posts, and content
                    </p>
                </div>

                {/* Search Form */}
                <GlassCard className="p-6 border-primary/20 bg-primary/5">
                    <div className="relative">
                        <form onSubmit={handleSearchSubmit} className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="Search for users, posts, hashtags..."
                                    className="w-full pl-12 pr-12 py-3 bg-black/30 border border-white/10 rounded-lg text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                />
                                {showSuggestions && (
                                    <AISearchSuggestions
                                        query={query}
                                        onSuggestionClick={handleSuggestionClick}
                                        onSearch={performSearch}
                                    />
                                )}
                            </div>
                            <ElectricButton type="submit" disabled={!query.trim() || loading}>
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Search'
                                )}
                            </ElectricButton>
                        </form>
                    </div>
                </GlassCard>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-white/5">
                    {['all', 'users', 'posts', 'hashtags'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab as 'all' | 'users' | 'posts' | 'hashtags')}
                            className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all ${
                                activeTab === tab
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-white'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <GlassCard className="p-0">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Searching...
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            <div className="p-6 space-y-3">
                                {results.map(renderResult)}
                            </div>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="border-t border-white/5 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {Math.min(((page - 1) * PAGE_SIZE) + 1, totalResults)} to {Math.min(page * PAGE_SIZE, totalResults)} of {totalResults} results
                                        </p>
                                    </div>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious 
                                                    onClick={() => handlePageChange(page - 1)}
                                                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(i + 1)}
                                                        className={`cursor-pointer ${
                                                            page === i + 1 ? 'bg-primary text-white' : ''
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext 
                                                    onClick={() => handlePageChange(page + 1)}
                                                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <Search className="w-16 h-16 mx-auto text-primary opacity-20 mb-6" />
                            <h3 className="text-xl font-black italic tracking-tighter mb-2">
                                No Results Found
                            </h3>
                            <p className="text-muted-foreground">
                                {query 
                                    ? `No matches found for "${query}"` 
                                    : 'Start typing to search the network'}
                            </p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
