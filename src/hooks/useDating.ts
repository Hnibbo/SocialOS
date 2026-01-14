// Hup Intellect Dating Hook

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DatingProfile {
    user_id: string;
    first_name: string; // from user_profiles
    age: number; // calculated
    bio: string | null; // from user_profiles
    photos: string[]; // from dating_profiles
    interests: string[];
    distance_km?: number; // calculated
    match_score?: number; // from RPC
}

export function useDating() {
    const [profiles, setProfiles] = useState<DatingProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<any[]>([]);

    const fetchPotentialMatches = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Use Hyper-Matching RPC
            // Get Real Location
            const getLoc = (): Promise<{ lat: number, lng: number }> => {
                return new Promise((resolve) => {
                    if (!navigator.geolocation) resolve({ lat: 37.7749, lng: -122.4194 });
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => resolve({ lat: 37.7749, lng: -122.4194 })
                    );
                });
            };
            const loc = await getLoc();

            // Use Hyper-Matching RPC
            const { data, error } = await supabase.rpc('find_best_matches', {
                p_latitude: loc.lat,
                p_longitude: loc.lng,
                p_radius_meters: 50000,
                p_limit: 20
            });

            if (error) throw error;

            if (data) {
                const formatted = data.map((p: any) => ({
                    user_id: p.user_id,
                    first_name: p.full_name?.split(' ')[0] || 'Anonymous',
                    age: p.age || 25,
                    bio: p.bio,
                    photos: [p.avatar_url || 'https://github.com/shadcn.png'],
                    interests: p.shared_interests || [],
                    distance_km: Math.round((p.distance_meters || 0) / 1000),
                    match_score: Math.round(p.match_score || 0),
                    location: p.location_lng && p.location_lat ? [p.location_lng, p.location_lat] : undefined
                }));
                // Remove existing coordinate markers for matches if any conflict, or just overlay
                setProfiles(formatted);
            }
        } catch (error) {
            console.error('Error fetching best matches:', error);
            toast.error('Could not load matches');
        } finally {
            setLoading(false);
        }
    }, []);

    // Subscribe to new matches (Realtime)
    useEffect(() => {
        const channel = supabase
            .channel('dating_matches')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matches' },
                (payload) => {
                    toast.success("IT'S A MATCH! check your connections.", { icon: '💘', duration: 5000 });
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const swipe = useCallback(async (profileId: string, direction: 'left' | 'right' | 'super') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Remove from local list immediately
        setProfiles(prev => prev.filter(p => p.user_id !== profileId));

        const { error } = await supabase.from('dating_swipes').insert({
            swiper_id: user.id,
            swiped_id: profileId,
            direction
        });

        if (error) {
            console.error('Swipe error:', error);
            // Revert if critical? usually fine to just log
        } else {
            // If it was a match (trigger handled it), we could check matches table or rely on realtime
            if (direction === 'right' || direction === 'super') {
                // Check for match immediately?
                // Real-time subscription handles match alerts usually
            }
        }
    }, []);

    return {
        profiles,
        loading,
        fetchPotentialMatches,
        swipe
    };
}
