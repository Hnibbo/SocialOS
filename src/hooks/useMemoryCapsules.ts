import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MemoryCapsule {
    id: string;
    title: string;
    content: string;
    location_lat?: number;
    location_lng?: number;
    visited_at: string;
    created_at: string;
    tags: string[];
    is_private: boolean;
    shared_with?: string[];
    mood_score?: number;
    energy_score?: number;
}

export function useMemoryCapsules() {
    const { user } = useAuth();
    const [capsules, setCapsules] = useState<MemoryCapsule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchCapsules = async () => {
            const { data, error } = await supabase
                .from('memory_capsules')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching memory capsules:', error);
                setLoading(false);
                return;
            }

            setCapsules(data || []);
            setLoading(false);
        };

        fetchCapsules();
    }, [user]);

    const createCapsule = async (title: string, content: string, location?: { lat: number, lng: number }, tags: string[] = []) => {
        const { data, error } = await supabase
            .from('memory_capsules')
            .insert({
                user_id: user.id,
                title,
                content,
                location_lat: location?.lat,
                location_lng: location?.lng,
                tags,
                is_private: false,
                shared_with: [],
                mood_score: Math.floor(Math.random() * 100),
                energy_score: Math.floor(Math.random() * 100)
            })
            .select()
            .single();

        if (error) {
            toast.error('Failed to create memory capsule');
            return;
        }

        toast.success('Memory capsule created!');
        await fetchCapsules();
    };

    const deleteCapsule = async (id: string) => {
        const { error } = await supabase
            .from('memory_capsules')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete memory capsule');
            return;
        }

        toast.success('Memory capsule deleted');
        await fetchCapsules();
    };

    const shareCapsule = async (id: string, targetUserId: string) => {
        const { error } = await supabase
            .from('memory_capsules')
            .update({ shared_with: supabase.raw('array_append', 'shared_with', targetUserId) })
            .eq('id', id);

        if (error) {
            toast.error('Failed to share memory capsule');
            return;
        }

        toast.success('Memory capsule shared!');
    };

    return { capsules, loading, createCapsule, deleteCapsule, shareCapsule };
}


export function useMemoryCapsules() {
    const { user } = useAuth();
    const [capsules, setCapsules] = useState<MemoryCapsule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchCapsules = async () => {
            const { data, error } = await supabase
                .from('memory_capsules')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching memory capsules:', error);
                setLoading(false);
                return;
            }

            setCapsules(data || []);
            setLoading(false);
        };

        fetchCapsules();
    }, [user]);

    const createCapsule = async (title: string, content: string, location?: { lat: number, lng: number }, tags: string[] = []) => {
        const { data, error } = await supabase
            .from('memory_capsules')
            .insert({
                user_id: user.id,
                title,
                content,
                location_lat: location?.lat,
                location_lng: location?.lng,
                tags,
                is_private: false,
                shared_with: [],
                mood_score: Math.floor(Math.random() * 100),
                energy_score: Math.floor(Math.random() * 100)
            })
            .select()
            .single();

        if (error) {
            toast.error('Failed to create memory capsule');
            return;
        }

        toast.success('Memory capsule created!');
        await fetchCapsules();
    };

    const deleteCapsule = async (id: string) => {
        const { error } = await supabase
            .from('memory_capsules')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete memory capsule');
            return;
        }

        toast.success('Memory capsule deleted');
        await fetchCapsules();
    };

    const shareCapsule = async (id: string, targetUserId: string) => {
        const { error } = await supabase
            .from('memory_capsules')
            .update({ shared_with: supabase.raw('array_append', 'shared_with', targetUserId) })
            .eq('id', id);

        if (error) {
            toast.error('Failed to share memory capsule');
            return;
        }

        toast.success('Memory capsule shared!');
        await fetchCapsules();
    };

    return { capsules, loading, createCapsule, deleteCapsule, shareCapsule };
}
