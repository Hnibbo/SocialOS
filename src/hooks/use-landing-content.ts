import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LandingSection = {
    section_key: string;
    title: string;
    subtitle: string;
    content: Record<string, unknown>;
};

export function useLandingContent() {
    const [sections, setSections] = useState<Record<string, LandingSection>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLanding() {
            try {
                const { data, error } = await supabase
                    .from('landing_sections')
                    .select('*')
                    .eq('is_active', true)
                    .order('order_index', { ascending: true });

                if (error) throw error;

                const sectionMap: Record<string, LandingSection> = {};
                data.forEach((s) => {
                    sectionMap[s.section_key] = s;
                });

                setSections(sectionMap);
            } catch (err) {
                console.error('Failed to load landing content:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchLanding();
    }, []);

    return { sections, loading };
}
