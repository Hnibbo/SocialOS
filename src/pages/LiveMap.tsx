// Hup - Live Map Page
// The main map interface that opens on app launch

import { useState } from 'react';
import { LiveMap } from '@/components/map/LiveMap';
import { usePresence } from '@/hooks/useLocation';
import { useAuth } from '@/contexts/AuthContext';
import type { MapMarker, UserAvailability } from '@/types/social-os';

export default function LiveMapPage() {
    const { user } = useAuth();
    const { presence, setAvailability, setVisibility, goInvisible, panicMode } = usePresence();
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    const handleMarkerClick = (marker: MapMarker) => {
        setSelectedMarker(marker);
        // Open appropriate sheet based on marker type
    };

    const handlePanicMode = async () => {
        if (confirm('This will make you completely invisible immediately. Continue?')) {
            await panicMode();
        }
    };

    const availabilityOptions: { value: UserAvailability; label: string; color: string }[] = [
        { value: 'available', label: 'Available', color: 'bg-green-500' },
        { value: 'busy', label: 'Busy', color: 'bg-yellow-500' },
        { value: 'do_not_disturb', label: 'Do Not Disturb', color: 'bg-red-500' },
        { value: 'invisible', label: 'Invisible', color: 'bg-gray-500' },
    ];

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden">
            {/* Full-screen Map */}
            <LiveMap
                className="w-full h-full"
                onMarkerClick={handleMarkerClick}
                showUsers={true}
                showGroups={true}
                showActivities={true}
                showBusinesses={true}
                showStreams={true}
            />

            {/* Only the map itself is rendered here. UI overlays are handled by AppLayout for consistency. */}
        </div>
    );
}

