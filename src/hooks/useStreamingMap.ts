import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapMarker } from '@/types/social-os';

export function useStreamingMap() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);

    useEffect(() => {
        const fetchGeoStreams = async () => {
            // In a real app we'd filter by bounds, but for now fetch global active streams
            // Fetch active streams with location via RPC to avoid embedding limits
            const { data, error } = await supabase
                .rpc('get_active_streams_on_map');

            if (error) {
                console.error("Error fetching map streams:", error);
                return;
            }

            if (data) {
                const streamMarkers: MapMarker[] = data
                    .filter(s => s.location_lat && s.location_lng)
                    .map(s => ({
                        id: s.id,
                        type: 'stream',
                        coordinates: [s.location_lng!, s.location_lat!] as [number, number],
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
