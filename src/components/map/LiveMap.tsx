// Hup - Live Map Component
// Real-time map showing users, groups, activities, businesses, and streams

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import type { MapMarker } from '@/types/social-os';


import { createRoot } from 'react-dom/client';
import { MapMarkerContent } from './MapMarker';
import { useActivities } from '@/hooks/useActivities';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { useMapEntities } from '@/hooks/useMapEntities';
import { useStreamingMap } from '@/hooks/useStreamingMap';
import { useDating } from '@/hooks/useDating';

interface LiveMapProps {
    className?: string;
    showUsers?: boolean;
    showGroups?: boolean;
    showActivities?: boolean;
    showBusinesses?: boolean;
    showStreams?: boolean;
    showContent?: boolean;
    onMarkerClick?: (marker: MapMarker) => void;
    onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

export function LiveMap({
    className = '',
    showUsers = true,
    showGroups = true,
    showActivities = true,
    showBusinesses = true,
    showStreams = true,
    showContent = false,
    onMarkerClick,
    onMapClick
}: LiveMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Map<string, { marker: maplibregl.Marker, root: any }>>(new Map());

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    const { latitude, longitude, loading: locationLoading, error: locationError } = useLocation();
    const { markers: entityMarkers } = useMapEntities();
    const { activities } = useActivities();
    const { markers: streamMarkers } = useStreamingMap();
    const { profiles: datingProfiles } = useDating();
    const [energyHeatmap, setEnergyHeatmap] = useState<any>(null);
    const [selectedEntity, setSelectedEntity] = useState<MapMarker | null>(null);
    const [territoryInfo, setTerritoryInfo] = useState<any>(null);
    const [showVibe, setShowVibe] = useState(true);

    // Fetch Energy States for Heatmap (disabled - table doesn't exist)
    // useEffect(() => {
    //     if (!longitude || !latitude) return;
    //     const fetchEnergy = async () => {
    //         const { data } = await supabase
    //             .from('world_energy_states')
    //             .select('lat, lng, energy_score')
    //             .gte('updated_at', new Date(Date.now() - 3600000).toISOString());
    //         if (data) {
    //             const geojson = {
    //                 type: 'FeatureCollection',
    //                 features: data.map(d => ({
    //                     type: 'Feature',
    //                     geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
    //                     properties: { weight: d.energy_score / 100 }
    //                 }))
    //             };
    //             setEnergyHeatmap(geojson);
    //         }
    //     };
    //     fetchEnergy();
    //     const interval = setInterval(fetchEnergy, 60000);
    //     return () => clearInterval(interval);
    // }, [latitude, longitude]);

    // Merge all marker sources
    const markers: MapMarker[] = [
        ...entityMarkers,
        ...activities.map(act => ({
            id: act.id,
            type: 'activity' as const,
            coordinates: (act.location as any).coordinates as [number, number],
            data: act
        })),
        ...streamMarkers,
        ...datingProfiles
            .filter(p => p.location) // Ensure location exists
            .map(p => ({
                id: p.user_id,
                type: 'user' as const, // Re-using 'user' type but could be 'match'
                coordinates: p.location as [number, number],
                data: { ...p, isMatch: true }
            }))
    ];

    const initializeMap = useCallback(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        try {
            const map = new maplibregl.Map({
                container: mapContainerRef.current,
                style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Premium Dark OS Look
                center: [longitude || -74.006, latitude || 40.7128],
                zoom: 14,
                pitch: 45,
                bearing: 0,
                attributionControl: false
            });

            map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

            map.on('load', () => {
                setMapLoaded(true);
                map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

                const geolocate = new maplibregl.GeolocateControl({
                    positionOptions: { enableHighAccuracy: true },
                    trackUserLocation: true,
                    showUserHeading: true
                });
                map.addControl(geolocate, 'top-right');

                // Add Energy Heatmap Layer
                map.addSource('energy-vibe', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.addLayer({
                    id: 'vibe-heat',
                    type: 'heatmap',
                    source: 'energy-vibe',
                    maxzoom: 15,
                    layout: {
                        'visibility': showVibe ? 'visible' : 'none'
                    },
                    paint: {
                        'heatmap-weight': ['get', 'weight'],
                        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(0,0,0,0)',
                            0.2, 'rgba(124,58,237,0.1)',
                            0.4, 'rgba(124,58,237,0.3)',
                            0.6, 'rgba(139,92,246,0.5)',
                            0.8, 'rgba(167,139,250,0.7)',
                            1, 'rgba(255,255,255,0.8)'
                        ],
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 40],
                        'heatmap-opacity': 0.6
                    }
                });
            });

            map.on('click', async (e) => {
                onMapClick?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });

                // Fetch dominance for this cell
                const { data } = await supabase.rpc('get_cell_dominance', {
                    p_lat: e.lngLat.lat,
                    p_lng: e.lngLat.lng
                });
                if (data && data.length > 0) {
                    setTerritoryInfo(data[0]);
                } else {
                    setTerritoryInfo(null);
                }
            });

            map.on('error', (e) => {
                console.error('Map error:', e);
            });

            mapRef.current = map;
        } catch (err) {
            console.error("Map initialization failed:", err);
            setMapError("Failed to initialize map engine");
        }
    }, [latitude, longitude, onMapClick]);

    useEffect(() => {
        if (!mapRef.current && (latitude && longitude || !locationLoading)) {
            initializeMap();
        }
    }, [latitude, longitude, locationLoading, initializeMap]);

    useEffect(() => {
        if (mapRef.current && latitude && longitude && mapLoaded) {
            mapRef.current.flyTo({
                center: [longitude, latitude],
                zoom: 16,
                pitch: 50,
                duration: 2000
            });
        }
    }, [latitude, longitude, mapLoaded]);

    useEffect(() => {
        if (mapRef.current && mapLoaded) {
            const geolocateControl = document.querySelector('.maplibregl-ctrl-geolocate') as HTMLElement;
            if (geolocateControl) {
                setTimeout(() => geolocateControl.click(), 1000);
            }
        }
    }, [mapLoaded]);

    useEffect(() => {
        if (mapRef.current && mapLoaded) {
            mapRef.current.setLayoutProperty('vibe-heat', 'visibility', showVibe ? 'visible' : 'none');
        }
    }, [showVibe, mapLoaded]);

    useEffect(() => {
        if (mapRef.current && mapLoaded && energyHeatmap) {
            const source = mapRef.current.getSource('energy-vibe') as maplibregl.GeoJSONSource;
            if (source) {
                source.setData(energyHeatmap);
            }
        }
    }, [energyHeatmap, mapLoaded]);

    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        const activeIds = new Set(markers.map(m => m.id));

        // Remove old markers
        markersRef.current.forEach((value, key) => {
            if (!activeIds.has(key)) {
                value.marker.remove();
                value.root.unmount();
                markersRef.current.delete(key);
            }
        });

        // Add/Update markers
        markers.forEach(markerData => {
            if (markersRef.current.has(markerData.id)) {
                // Update position if needed (omitted for brevity in this step, mostly static mocks)
                const { marker } = markersRef.current.get(markerData.id)!;
                marker.setLngLat(markerData.coordinates);
                return;
            }

            // check visibility filters
            if (markerData.type === 'user' && !showUsers) return;
            if (markerData.type === 'group' && !showGroups) return;
            if (markerData.type === 'business' && !showBusinesses) return;
            if (markerData.type === 'activity' && !showActivities) return;


            const el = document.createElement('div');
            el.className = 'map-marker-root';

            const root = createRoot(el);
            root.render(
                <MapMarkerContent
                    marker={markerData}
                    onClick={(m) => {
                        setSelectedEntity(m);
                        onMarkerClick?.(m);
                    }}
                />
            );

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat(markerData.coordinates)
                .addTo(mapRef.current!);

            markersRef.current.set(markerData.id, { marker, root });
        });

    }, [markers, mapLoaded, showUsers, showGroups, showBusinesses, showActivities, onMarkerClick]);


    if (mapError) {
        return (
            <div className={`flex items-center justify-center bg-background text-foreground ${className}`}>
                <div className="text-center p-8">
                    <div className="text-4xl mb-4 animate-pulse">🗺️</div>
                    <h3 className="text-xl font-bold mb-2 font-display">Map Engine Offline</h3>
                    <p className="text-muted-foreground">{mapError}</p>
                </div>
            </div>
        );
    }

    if (locationError && locationError.code === 1) {
        return (
            <div className={`flex items-center justify-center bg-background text-foreground ${className}`}>
                <div className="text-center p-8 max-w-md">
                    <div className="text-4xl mb-4">📍</div>
                    <h3 className="text-xl font-bold mb-2 font-display">Location Required</h3>
                    <p className="text-muted-foreground mb-6">
                        Hup needs your location to show you the "God Mode" social map.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold transition-all shadow-lg shadow-primary/25"
                    >
                        Enable Access
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <div
                ref={mapContainerRef}
                className="w-full h-full outline-none"
                style={{ minHeight: '100vh', background: '#111' }}
            />

            {(locationLoading || (!mapLoaded && !mapRef.current)) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
                        <p className="text-foreground font-medium animate-pulse">
                            {locationLoading ? 'Acquiring Signal...' : 'Initializing 3D Map...'}
                        </p>
                    </div>
                </div>
            )}

            {mapLoaded && (
                <div className="absolute bottom-32 left-4 right-4 flex justify-center gap-3 overflow-x-auto py-2 no-scrollbar z-20">
                    {[
                        { label: 'People', icon: '👥', active: showUsers },
                        { label: 'Events', icon: '🎉', active: showActivities },
                        { label: 'Places', icon: '📍', active: showBusinesses },
                        { label: 'Live', icon: '🔴', active: showStreams },
                        { label: 'Vibe', icon: '✨', active: showVibe, onClick: () => setShowVibe(!showVibe) }
                    ].map(btn => (
                        <button
                            key={btn.label}
                            onClick={btn.onClick || (() => { })}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap backdrop-blur-md border ${btn.active
                                ? 'bg-primary/90 text-white border-primary/50 shadow-lg shadow-primary/25'
                                : 'bg-black/40 text-white/80 border-white/10 hover:bg-black/60'
                                }`}
                        >
                            <span>{btn.icon}</span> {btn.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Entity Detail Panel */}
            <AnimatePresence>
                {selectedEntity && (
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        className="absolute bottom-0 left-0 right-0 z-[60] p-4 lg:left-4 lg:right-auto lg:top-4 lg:bottom-auto lg:w-96"
                    >
                        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                            <button
                                onClick={() => setSelectedEntity(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex gap-4 items-start mb-6">
                                {selectedEntity.type === 'user' ? (
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50 text-2xl">
                                        {selectedEntity.data.avatar_url ? <img src={selectedEntity.data.avatar_url} className="w-full h-full rounded-full object-cover" /> : '👤'}
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50 text-3xl">
                                        {selectedEntity.data.category === 'drop' ? '⚡' : '🔥'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter text-white">
                                        {selectedEntity.data.display_name || selectedEntity.data.title || selectedEntity.data.name || 'Unknown Node'}
                                    </h3>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-primary">
                                        {selectedEntity.type} • {selectedEntity.data.category || 'Standard'}
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-white/70 mb-6 leading-relaxed">
                                {selectedEntity.data.description || 'No description provided for this proximity node. Tap to interact.'}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={async () => {
                                        if (selectedEntity.data.category === 'gift') {
                                            const { error } = await supabase.rpc('collect_dropped_asset', { p_asset_id: selectedEntity.id });
                                            if (error) toast.error("Failed to collect");
                                            else toast.success("Asset added to Vault!");
                                            setSelectedEntity(null);
                                        }
                                    }}
                                    className="rounded-2xl h-12 bg-primary hover:bg-primary/90 font-bold"
                                >
                                    {selectedEntity.data.category === 'gift' ? 'COLLECT' : 'INTERACT'}
                                </Button>
                                <Button variant="outline" className="rounded-2xl h-12 border-white/10 hover:bg-white/5 font-bold">
                                    NAVIGATE
                                </Button>
                            </div>

                            {/* Territory Mini-Card */}
                            {territoryInfo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Crown className="w-4 h-4 text-amber-400" />
                                        <div>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Territory Owner</p>
                                            <p className="text-[10px] font-black text-white uppercase">{territoryInfo.dominant_user_name || 'No Ruler'}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/20 text-primary text-[8px] font-black tracking-widest uppercase border-none">
                                        {territoryInfo.vibe_type}
                                    </Badge>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />
        </div>
    );
}

export default LiveMap;
