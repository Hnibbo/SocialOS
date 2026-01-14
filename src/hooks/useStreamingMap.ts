import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapMarker } from '@/types/social-os';

export function useStreamingMap() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);

    useEffect(() => {
        const fetchGeoStreams = async () => {
            // In a real app we'd filter by bounds, but for now fetch global active streams
            const { data } = await supabase
                .from('live_streams') // Assuming we add lat/lng to live_streams or join with user location
                .select(`
                    id,
                    title,
                    host_id,
                    user_profiles!host_id (
                        location_lat,
                        location_lng,
                        avatar_url
                    )
                `)
                .eq('is_active', true);

            if (data) {
                const streamMarkers: MapMarker[] = data
                    .filter(s => s.user_profiles?.location_lat && s.user_profiles?.location_lng)
                    .map(s => ({
                        id: s.id,
                        type: 'stream',
                        coordinates: [s.user_profiles.location_lng!, s.user_profiles.location_lat!] as [number, number],
                        data: s
                    }));
                setMarkers(streamMarkers);
            }
        };

        fetchGeoStreams();
        const interval = setInterval(fetchGeoStreams, 30000);
        return () => clearInterval(interval);
    }, []);

    return { markers };
}
