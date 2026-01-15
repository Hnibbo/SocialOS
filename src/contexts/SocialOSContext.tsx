import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SocialOSContextType {
    energy: number;
    xp: number;
    level: number;
    theme: string;
    isCommandHubOpen: boolean;
    setIsCommandHubOpen: (open: boolean) => void;
    isAIOpen: boolean;
    setIsAIOpen: (open: boolean) => void;
    addXP: (amount: number) => void;
    consumeEnergy: (amount: number) => boolean;
}

const SocialOSContext = createContext<SocialOSContextType | undefined>(undefined);

export const SocialOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [energy, setEnergy] = useState(100);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [theme, setTheme] = useState('electric');
    const [isCommandHubOpen, setIsCommandHubOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        if (!user) return;
        try {
            // Load stats from user_profiles
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('energy, xp_points, level')
                .eq('id', user.id)
                .single();

            if (profile) {
                setEnergy(profile.energy ?? 100);
                setXp(profile.xp_points ?? 0);
                setLevel(profile.level ?? 1);
            }

            // Load theme from preferences
            const { data: prefs } = await supabase
                .from('user_preferences')
                .select('theme_color')
                .eq('user_id', user.id)
                .single();

            if (prefs) {
                setTheme(prefs.theme_color || 'electric');
            }
        } catch (error) {
            console.error('Error loading OS data:', error);
        }
    };

    const addXP = async (amount: number) => {
        if (!user) return;
        const newXp = xp + amount;
        setXp(newXp);

        // Push to DB
        await supabase
            .from('user_profiles')
            .update({ xp_points: newXp })
            .eq('id', user.id);

        // Trigger local level up if needed (matches DB trigger logic)
        const newLevel = Math.floor(newXp / 1000) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
        }
    };

    const consumeEnergy = (amount: number): boolean => {
        if (energy >= amount) {
            const nextEnergy = energy - amount;
            setEnergy(nextEnergy);

            // Background sync to DB (don't await to keep UI snappy)
            if (user) {
                supabase
                    .from('user_profiles')
                    .update({ energy: nextEnergy })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.error('Failed to sync energy:', error);
                    });
            }
            return true;
        }
        return false;
    };

    // Re-gen energy over time
    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy(prev => {
                const next = Math.min(100, prev + 1);
                // Periodically sync back to DB if charging
                if (next > prev && user && next % 5 === 0) {
                    supabase.from('user_profiles').update({ energy: next }).eq('id', user.id);
                }
                return next;
            });
        }, 60000); // 1% every minute
        return () => clearInterval(timer);
    }, [user]);

    return (
        <SocialOSContext.Provider value={{
            energy,
            xp,
            level,
            theme,
            isCommandHubOpen,
            setIsCommandHubOpen,
            isAIOpen,
            setIsAIOpen,
            addXP,
            consumeEnergy
        }}>
            {children}
        </SocialOSContext.Provider>
    );
};

export const useSocialOS = () => {
    const context = useContext(SocialOSContext);
    if (context === undefined) {
        throw new Error('useSocialOS must be used within a SocialOSProvider');
    }
    return context;
};
