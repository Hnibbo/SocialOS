import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Zap,
    MessageSquare,
    Map as MapIcon,
    User,
    Settings,
    Plus,
    Star,
    Command as CommandIcon,
    ArrowRight,
    Sparkles,
    Heart,
    Calendar,
    Wallet,
    Shield,
    Palette
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const CommandHub: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<'all' | 'actions' | 'people' | 'messages'>('all');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation within the menu
    useEffect(() => {
        const handleNav = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % (results.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleExecute(results[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleNav);
        return () => window.removeEventListener('keydown', handleNav);
    }, [isOpen, results, selectedIndex]);

    const actions = [
        { id: 'go_map', title: 'Open World Map', icon: <MapIcon className="w-4 h-4" />, category: 'actions', action: () => navigate('/map') },
        { id: 'go_dating', title: 'Start Dating', icon: <Heart className="w-4 h-4" />, category: 'actions', action: () => navigate('/dating') },
        { id: 'go_wallet', title: 'Open Wallet', icon: <Wallet className="w-4 h-4" />, category: 'actions', action: () => navigate('/wallet') },
        { id: 'go_events', title: 'Search Events', icon: <Calendar className="w-4 h-4" />, category: 'actions', action: () => navigate('/events') },
        { id: 'go_settings', title: 'OS Settings', icon: <Settings className="w-4 h-4" />, category: 'actions', action: () => navigate('/settings') },
        { id: 'new_post', title: 'Create New Post', icon: <Plus className="w-4 h-4" />, category: 'actions', action: () => navigate('/create') },
        { id: 'theme_custom', title: 'Customize Theme', icon: <Palette className="w-4 h-4" />, category: 'actions', action: () => navigate('/settings/customization') },
    ];

    useEffect(() => {
        const search = async () => {
            if (!query && category === 'all') {
                setResults(actions);
                return;
            }

            setLoading(true);

            const filteredActions = actions.filter(a =>
                a.title.toLowerCase().includes(query.toLowerCase())
            );

            // In a real app, search people and messages from Supabase here
            const mockPeople = query ? [
                { id: 'p1', title: `Search for "${query}" in People`, icon: <User className="w-4 h-4" />, category: 'people', isSearch: true },
            ] : [];

            const mockMessages = query ? [
                { id: 'm1', title: `Search for "${query}" in Messages`, icon: <MessageSquare className="w-4 h-4" />, category: 'messages', isSearch: true },
            ] : [];

            setResults([...filteredActions, ...mockPeople, ...mockMessages]);
            setLoading(false);
        };

        const timer = setTimeout(search, 150);
        return () => clearTimeout(timer);
    }, [query, category]);

    const handleExecute = (item: any) => {
        if (item.action) {
            item.action();
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300"
                ref={containerRef}
            >
                <GlassCard className="overflow-hidden border-primary/30 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                    {/* Header / Input */}
                    <div className="relative flex items-center p-4 border-b border-white/10">
                        <Search className="w-6 h-6 text-primary animate-pulse-glow" />
                        <input
                            ref={inputRef}
                            className="w-full bg-transparent border-none focus:outline-none px-4 text-xl placeholder:text-muted-foreground/50"
                            placeholder="Search, action, or ask Hup AI..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                            <span className="text-[10px] font-bold opacity-50">ESC to close</span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Sparkles className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                                <p>AI is thinking...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-4 py-2">
                                {['actions', 'people', 'messages'].map(cat => {
                                    const catResults = results.filter(r => r.category === cat);
                                    if (catResults.length === 0) return null;

                                    return (
                                        <div key={cat} className="space-y-1">
                                            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2 flex items-center gap-2">
                                                {cat}
                                            </h4>
                                            {catResults.map((item, idx) => {
                                                const globalIdx = results.indexOf(item);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-3 py-3 rounded-xl transition-all cursor-pointer group",
                                                            selectedIndex === globalIdx ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5 border border-transparent"
                                                        )}
                                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                        onClick={() => handleExecute(item)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 group-hover:scale-110 transition-all",
                                                                selectedIndex === globalIdx && "bg-primary/30"
                                                            )}>
                                                                {item.icon}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">{item.title}</p>
                                                                {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                                                            </div>
                                                        </div>
                                                        {selectedIndex === globalIdx && (
                                                            <div className="flex items-center gap-2 text-primary">
                                                                <span className="text-[10px] font-bold">ENTER</span>
                                                                <ArrowRight className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <CommandIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No results for "{query}"</p>
                                <p className="text-sm">Try searching for "map", "dating" or "settings"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> Command Hub v1.0</span>
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-secondary" /> Secure OS</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/10">↑↓ Navigate</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/10">↵ Select</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
