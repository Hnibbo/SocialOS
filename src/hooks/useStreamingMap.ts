import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapMarker } from '@/types/social-os';
import { toast } from 'sonner';

export function useStreamingMap() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGeoStreams = useCallback(async () => {
        try {
            // Fetch active streams with location
            const { data, error } = await supabase
                .rpc('get_active_streams_on_map');

            if (error) {
                console.error("Error fetching map streams:", error);
                throw error;
            }

            if (data) {
                const streamMarkers: MapMarker[] = data
                    .filter((s: any) => s.location_lat && s.location_lng)
                    .map((s: any) => ({
                        id: s.id,
                        type: 'stream',
                        coordinates: [s.location_lng!, s.location_lat!] as [number, number],
                        data: s
                    }));
                setMarkers(streamMarkers);
            }
        } catch (error) {
            console.error("Failed to fetch streams:", error);
            toast.error('Failed to load streams on map');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGeoStreams();
        const interval = setInterval(fetchGeoStreams, 30000);
        return () => clearInterval(interval);
    }, [fetchGeoStreams]);

    // Subscribe to real-time stream updates
    useEffect(() => {
        const channel = supabase.channel('live_streams_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_streams',
            }, () => {
                fetchGeoStreams();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchGeoStreams]);

    return { markers, loading };
}
