import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SystemConfig = {
    site_name: string;
    site_description: string;
    maintenance_mode: boolean;
    branding_colors: {
        primary: string;
        accent: string;
        background: string;
    };
    borderRadius: string;
    glassmorphism: boolean;
    feature_toggles: {
        enable_marketplace: boolean;
        enable_agent_sync: boolean;
        show_interactive_demo: boolean;
    };
};

export function usePlatformConfig() {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data, error } = await supabase
                    .from('platform_config')
                    .select('key, value');

                if (error) throw error;

                // Default config
                const newConfig: SystemConfig = {
                    site_name: 'Hup',
                    site_description: 'The Social Operating System',
                    maintenance_mode: false,
                    branding_colors: {
                        primary: '#7c3aed',
                        accent: '#D946EF',
                        background: '#0F172A',
                    },
                    borderRadius: '0.75rem',
                    glassmorphism: true,
                    feature_toggles: {
                        enable_marketplace: true,
                        enable_agent_sync: true,
                        show_interactive_demo: true,
                    },
                };

                // Merge with DB values
                data?.forEach((item) => {
                    const val = item.value as any;
                    if (item.key === 'app_theme') {
                        if (val.primary) newConfig.branding_colors.primary = val.primary;
                        if (val.glassmorphism !== undefined) newConfig.glassmorphism = val.glassmorphism;
                        if (val.radius) newConfig.borderRadius = val.radius;
                    }
                    if (item.key === 'feature_flags') {
                        if (val.enable_dating !== undefined) newConfig.feature_toggles.enable_marketplace = val.enable_dating; // Mapping dating to marketplace for now or add new key
                    }
                    // Add other mappings as needed
                });

                setConfig(newConfig);
            } catch (err) {
                console.error('Failed to load platform config:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();

        // Realtime Subscription
        const channel = supabase
            .channel('platform_config_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'platform_config'
            }, () => {
                // Platform config updated, refreshing
                fetchConfig();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { config, loading };
}
