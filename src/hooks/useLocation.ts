
// Hup - Location & Presence Hook
// Real-time location tracking and presence management

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserPresence, UserAvailability, GeoPoint, NearbyUser } from '@/types/social-os';

interface UseLocationOptions {
    enableHighAccuracy?: boolean;
    updateIntervalMoving?: number;
    updateIntervalStatic?: number;
    autoUpdatePresence?: boolean;
}

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
    altitude: number | null;
    timestamp: number | null;
    error: GeolocationPositionError | null;
    loading: boolean;
    permissionState: PermissionState | null;
}

export function useLocation(options: UseLocationOptions = {}) {
    const {
        updateIntervalMoving = 5000,
        updateIntervalStatic = 30000,
        autoUpdatePresence = true,
        enableHighAccuracy = true
    } = options;

    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        heading: null,
        speed: null,
        altitude: null,
        timestamp: null,
        error: null,
        loading: true,
        permissionState: null
    });

    const watchIdRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const isMovingRef = useRef<boolean>(false);

    // Check permission state
    useEffect(() => {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                setLocation(prev => ({ ...prev, permissionState: result.state }));

                result.addEventListener('change', () => {
                    setLocation(prev => ({ ...prev, permissionState: result.state }));
                });
            });
        }
    }, []);

    const updatePresence = useCallback(async (position: GeolocationPosition) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { latitude, longitude } = position.coords;

        // Use the secure RPC function to handle PostGIS types correctly
        const { error } = await supabase.rpc('update_user_location', {
            lat: latitude,
            lng: longitude
        });

        if (error) {
            console.error("Failed to update location:", error);
        }
    }, []);

    const handlePosition = useCallback((position: GeolocationPosition) => {
        const now = Date.now();
        const isMoving = (position.coords.speed || 0) > 0.5; // m/s
        isMovingRef.current = isMoving;

        const interval = isMoving ? updateIntervalMoving : updateIntervalStatic;

        // Throttle updates
        if (now - lastUpdateRef.current < interval) return;
        lastUpdateRef.current = now;

        setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            altitude: position.coords.altitude,
            timestamp: position.timestamp,
            error: null,
            loading: false,
            permissionState: 'granted'
        });

        if (autoUpdatePresence) {
            updatePresence(position);
        }
    }, [updateIntervalMoving, updateIntervalStatic, autoUpdatePresence, updatePresence]);

    const handleError = useCallback((error: GeolocationPositionError) => {
        console.warn("Location error:", error.message);
        setLocation(prev => ({
            ...prev,
            error,
            loading: false // Stop loading even on error
        }));
    }, []);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({
                ...prev,
                error: { code: 0, message: 'Geolocation not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError,
                loading: false
            }));
            return;
        }

        // Get initial position quickly
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });

        // Watch for changes
        watchIdRef.current = navigator.geolocation.watchPosition(
            handlePosition,
            handleError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, [handlePosition, handleError]);

    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        startWatching();
        return () => stopWatching();
    }, [startWatching, stopWatching]);

    const requestPermission = useCallback(() => {
        startWatching();
    }, [startWatching]);

    return {
        ...location,
        isMoving: isMovingRef.current,
        requestPermission,
        startWatching,
        stopWatching
    };
}

// Presence management hook - KEPT AS IS FOR NOW
export function usePresence() {
    const [presence, setPresence] = useState<UserPresence | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPresence = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('user_presence')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setPresence(data);
            setLoading(false);
        };

        fetchPresence();
    }, []);

    const updatePresence = useCallback(async (updates: Partial<UserPresence>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('user_presence')
            .upsert({
                user_id: user.id,
                ...updates,
                last_seen: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (!error && data) {
            setPresence(data);
        }

        return { data, error };
    }, []);

    const setAvailability = useCallback((availability: UserAvailability) => {
        return updatePresence({ availability });
    }, [updatePresence]);

    const setVisibility = useCallback((isVisible: boolean, radius?: number) => {
        return updatePresence({
            is_visible: isVisible,
            visibility_mode: isVisible ? 'personal' : 'ghost',
            ...(radius !== undefined && { visibility_radius: radius })
        });
    }, [updatePresence]);

    const setIntents = useCallback((intents: string[]) => {
        return updatePresence({ intent_icons: intents });
    }, [updatePresence]);

    const goInvisible = useCallback(() => {
        return updatePresence({
            is_visible: false,
            visibility_mode: 'ghost',
            availability: 'invisible'
        });
    }, [updatePresence]);

    const panicMode = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Log panic event
        await supabase.from('panic_events').insert({
            user_id: user.id,
            location: presence?.location
        });

        // Go completely invisible
        return updatePresence({
            is_visible: false,
            availability: 'invisible',
            presence_expires_at: new Date().toISOString()
        });
    }, [presence, updatePresence]);

    return {
        presence,
        loading,
        updatePresence,
        setAvailability,
        setVisibility,
        setIntents,
        goInvisible,
        panicMode
    };
}

// Nearby users hook - KEPT AS IS FOR NOW
export function useNearbyUsers(radiusMeters: number = 5000) {
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchNearby = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error: rpcError } = await supabase.rpc('find_nearby_users', {
                p_user_id: user.id,
                p_radius_meters: radiusMeters,
                p_limit: 50
            });

            if (rpcError) throw rpcError;

            setNearbyUsers(data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch nearby users'));
        } finally {
            setLoading(false);
        }
    }, [radiusMeters]);

    useEffect(() => {
        fetchNearby();

        // Refresh every 30 seconds
        const interval = setInterval(fetchNearby, 30000);
        return () => clearInterval(interval);
    }, [fetchNearby]);

    // Subscribe to real-time presence changes
    useEffect(() => {
        const channel = supabase
            .channel('nearby-presence')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_presence'
            }, () => {
                fetchNearby();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNearby]);

    return {
        nearbyUsers,
        loading,
        error,
        refresh: fetchNearby
    };
}
