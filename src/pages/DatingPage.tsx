import { useEffect, useState } from 'react';
import { useDating } from '@/hooks/useDating';
import { DatingCard } from '@/components/social/DatingCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Heart, X, Star, MessageSquare, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatingProfileEditor } from '@/components/profile/DatingProfileEditor';
import { GlassCard } from '@/components/ui/glass-card';

export default function DatingPage() {
    const { profiles, loading, matches, matchLoading, fetchPotentialMatches, fetchMatches, like, superLike, pass } = useDating();
    const [activeTab, setActiveTab] = useState('discover');
    const [showProfileEditor, setShowProfileEditor] = useState(false);

    useEffect(() => {
        if (activeTab === 'discover') {
            fetchPotentialMatches();
        } else if (activeTab === 'matches') {
            fetchMatches();
        }
    }, [activeTab, fetchPotentialMatches, fetchMatches]);

    if (loading && profiles.length === 0 && activeTab === 'discover') {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Heart className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-black tracking-tighter italic">Hup Dates</h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowProfileEditor(true)}
                    className="hover:bg-white/5"
                >
                    <Settings className="w-5 h-5" />
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black border-b border-white/5 rounded-none p-0">
                        <TabsTrigger value="discover" className="rounded-none py-3 text-sm font-bold uppercase tracking-widest">
                            Discover
                        </TabsTrigger>
                        <TabsTrigger value="matches" className="rounded-none py-3 text-sm font-bold uppercase tracking-widest">
                            Matches ({matches.length})
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="discover" className="h-full p-0">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="relative w-full max-w-sm h-[600px]">
                                {profiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-white">
                                        <p className="text-xl font-semibold">No more profiles nearby</p>
                                        <p className="text-gray-400">Expand your discovery settings to see more people.</p>
                                        <Button onClick={() => fetchPotentialMatches()} variant="outline" className="mt-4 gap-2">
                                            <RefreshCw className="w-4 h-4" />
                                            Refresh
                                        </Button>
                                    </div>
                                ) : (
                                    profiles.map((profile, index) => (
                                        <DatingCard
                                            key={profile.user_id}
                                            profile={profile}
                                            active={index === profiles.length - 1} // Only top card active
                                            onSwipe={(dir) => {
                                                if (dir === 'right') like(profile.user_id);
                                                else if (dir === 'super') superLike(profile.user_id);
                                                else pass(profile.user_id);
                                            }}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Swipe Controls */}
                            {profiles.length > 0 && (
                                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all"
                                        onClick={() => pass(profiles[profiles.length - 1].user_id)}
                                    >
                                        <X className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-yellow-500/20 hover:text-yellow-500 hover:border-yellow-500/50 transition-all"
                                        onClick={() => superLike(profiles[profiles.length - 1].user_id)}
                                    >
                                        <Star className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/50 transition-all"
                                        onClick={() => like(profiles[profiles.length - 1].user_id)}
                                    >
                                        <Heart className="w-6 h-6" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="matches" className="h-full p-0">
                        <div className="h-full overflow-y-auto p-4">
                            {matchLoading ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            ) : matches.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-white">
                                    <Heart className="w-16 h-16 text-primary opacity-20" />
                                    <p className="text-xl font-semibold">No matches yet</p>
                                    <p className="text-gray-400">Keep swiping to find your perfect match!</p>
                                    <Button onClick={() => setActiveTab('discover')} variant="outline">
                                        Start Swiping
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {matches.map((match) => (
                                        <GlassCard key={match.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                                                <img
                                                    src={match.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user_id}`}
                                                    alt={match.display_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sm">{match.display_name}</h3>
                                                <p className="text-xs text-gray-400">Matched {new Date(match.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="hover:bg-white/5">
                                                <MessageSquare className="w-5 h-5" />
                                            </Button>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Profile Editor Modal */}
            {showProfileEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-500">
                        <DatingProfileEditor onClose={() => setShowProfileEditor(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
