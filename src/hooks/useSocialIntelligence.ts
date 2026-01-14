import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMapEntities } from '@/hooks/useMapEntities';
import { toast } from 'sonner';

export function useSocialIntelligence() {
    const { profile } = useAuth();
    const { markers } = useMapEntities();
    const [isolationLevel, setIsolationLevel] = useState(0); // 0-100

    useEffect(() => {
        if (!profile || !markers.length) return;

        // Calculate density: local users within 1km
        const nearbyUsers = markers.filter(m => m.type === 'user' && m.id !== profile.id);

        // isolation rules
        if (nearbyUsers.length === 0 && profile.intent_signal !== 'quiet') {
            // Trigger "Longing" state or suggestion
            const timeout = setTimeout(() => {
                toast("Signal Strength Low", {
                    description: "No one nearby is looking to hang. Try switching to 'Quiet' mode or move towards the Vibe Layer.",
                    action: {
                        label: "Open Map",
                        onClick: () => { } // navigate to map
                    }
                });
            }, 300000); // 5 mins of isolation

            return () => clearTimeout(timeout);
        }

        if (nearbyUsers.length > 5 && profile.intent_signal === 'quiet') {
            // Suggest joining the vibe
            toast("High Energy Nearby!", {
                description: `${nearbyUsers.length} people are active around you. Want to switch to 'Chat' mode?`,
                action: {
                    label: "Go Visible",
                    onClick: () => { } // trigger profile update
                }
            });
        }
    }, [markers, profile]);

    return { isolationLevel };
}
