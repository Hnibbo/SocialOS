import { useEffect } from 'react';
import { useDating } from '@/hooks/useDating';
import { DatingCard } from '@/components/social/DatingCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DatingPage() {
    const { profiles, loading, fetchPotentialMatches, swipe } = useDating();

    useEffect(() => {
        fetchPotentialMatches();
    }, [fetchPotentialMatches]);

    if (loading && profiles.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center">
            {/* UI overlaps are now handled by AppLayout */}

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
                            onSwipe={(dir) => swipe(profile.user_id, dir)}
                        />
                    ))
                )}
            </div>

            {/* Footer / Controls often overlayed */}
        </div>
    );
}
