
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MapMarker } from '@/types/social-os';
import { useLocation } from '@/hooks/useLocation';

export function useMapEntities() {
    const { latitude, longitude } = useLocation();
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!latitude || !longitude) return;

        const fetchEntities = async () => {
            setLoading(true);
            try {
                // Fetch in parallel using correct parameter names from database
                const [users, activities, groups, drops, assets] = await Promise.all([
                    supabase.rpc('find_nearby_users', { p_lat: latitude, p_lng: longitude, p_radius_meters: 50000 }),
                    supabase.rpc('find_nearby_activities', { lat: latitude, lng: longitude, radius_meters: 50000 }),
                    supabase.rpc('find_nearby_groups', { p_lat: latitude, p_long: longitude, p_radius_meters: 50000 }),
                    supabase.rpc('find_nearby_drops', { p_lat: latitude, p_lng: longitude, p_radius_meters: 50000 }),
                    supabase.rpc('find_nearby_assets', { p_lat: latitude, p_lng: longitude, p_radius_meters: 10000 })
                ]);

                const newMarkers: MapMarker[] = [];

                // Process Users (Real Data)
                if (users.data) {
                    users.data.forEach((u: any) => {
                        newMarkers.push({
                            id: u.id,
                            type: 'user',
                            coordinates: [u.lng, u.lat],
                            data: {
                                id: u.id,
                                display_name: u.display_name || 'Anonymous',
                                avatar_url: u.avatar_url,
                                intent_signal: u.intent_signal,
                                energy_level: u.energy_level,
                                avatar_cosmetics: u.avatar_cosmetics,
                                category: 'user'
                            }
                        });
                    });
                }

                // Process Moment Drops
                if (drops.data) {
                    drops.data.forEach((d: any) => {
                        newMarkers.push({
                            id: d.id,
                            type: 'content', // Use content type for special drops
                            coordinates: [d.lng, d.lat],
                            data: {
                                id: d.id,
                                title: d.title,
                                description: d.description,
                                type: d.drop_type,
                                expires_at: d.end_time,
                                radius: d.radius,
                                category: 'drop'
                            }
                        });
                    });
                }

                // Process Activities
                if (activities.data) {
                    activities.data.forEach((a: any) => {
                        newMarkers.push({
                            id: a.id,
                            type: 'activity',
                            coordinates: [a.location_lng, a.location_lat],
                            data: {
                                id: a.id,
                                title: a.title,
                                description: a.description,
                                category: a.activity_type
                            }
                        });
                    });
                }

                // Process Groups
                if (groups.data) {
                    groups.data.forEach((g: any) => {
                        newMarkers.push({
                            id: g.id,
                            type: 'business', // Groups mapped to business/community nodes
                            coordinates: [g.location_lng, g.location_lat],
                            data: {
                                id: g.id,
                                name: g.name,
                                description: g.description,
                                category: 'group'
                            }
                        });
                    });
                }

                // Process Digital Assets (The Game Layer)
                if (assets.data) {
                    assets.data.forEach((asset: any) => {
                        newMarkers.push({
                            id: asset.id,
                            type: 'activity', // Reuse activity styling or add new gift type
                            coordinates: [asset.lng, asset.lat],
                            data: {
                                id: asset.id,
                                title: asset.name || 'Asset Fragment',
                                description: `A collectible ${asset.asset_type}. Tap to collect.`,
                                category: 'gift',
                                asset_type: asset.asset_type
                            }
                        });
                    });
                }

                setMarkers(newMarkers);
            } catch (err) {
                console.error("Failed to fetch map entities:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEntities();
        // Poll every 30s
        const interval = setInterval(fetchEntities, 30000);
        return () => clearInterval(interval);

    }, [latitude, longitude]);

    return { markers, loading };
}
