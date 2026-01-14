
import { useState, useEffect } from 'react';
import type { Activity } from '@/types/social-os';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';

export function useActivities() {
    const { latitude, longitude } = useLocation();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!latitude || !longitude) return;

        const fetchActivities = async () => {
            setLoading(true);
            try {
                // Fetch real activities from Supabase using geospatial RPC
                const { data, error } = await supabase.rpc('find_nearby_activities', {
                    p_lat: latitude,
                    p_long: longitude,
                    p_radius_meters: 50000 // 50km
                });

                if (error) throw error;

                if (data) {
                    const mapped: Activity[] = data.map((act: any) => ({
                        id: act.id,
                        title: act.title,
                        description: act.description,
                        activity_type: act.activity_type,
                        location_name: act.location_name,
                        location: { lat: act.lat, lng: act.long },
                        expires_at: act.expires_at,
                        distance: act.distance_meters
                    }));
                    setActivities(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch activities:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
        const interval = setInterval(fetchActivities, 30000);
        return () => clearInterval(interval);

    }, [latitude, longitude]);

    return { activities, loading };
}
