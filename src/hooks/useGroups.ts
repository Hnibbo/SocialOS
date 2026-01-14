// Hup Groups Hook

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Group, GroupMember } from '@/types/social-os';
import { toast } from 'sonner';

export function useGroups() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPublicGroups = useCallback(async (lat?: number, lng?: number, radius: number = 50000) => {
        setLoading(true);
        // Use PostGIS distance filter via RPC
        const { data, error } = await supabase.rpc('find_nearby_groups', {
            p_lat: lat || 0,
            p_long: lng || 0,
            p_radius_meters: radius
        });

        if (error) {
            toast.error('Failed to load nearby groups');
            console.error(error);
        } else {
            const mapped: Group[] = (data || []).map((g: any) => ({
                id: g.id,
                name: g.name,
                description: g.description,
                avatar_url: g.avatar_url,
                member_count: g.member_count,
                location: { lat: g.lat, lng: g.long },
                distance: g.distance_meters
            } as Group));
            setGroups(mapped);
        }
        setLoading(false);
    }, []);

    const fetchMyGroups = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('group_members')
            .select('group_id, groups(*)')
            .eq('user_id', user.id);

        if (error) {
            console.error(error);
        } else {
            // @ts-ignore - Supabase nested query typings are tricky
            setMyGroups(data.map(d => d.groups));
        }
    }, []);

    const createGroup = useCallback(async (groupData: Partial<Group>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please login first');
            return null;
        }

        const { data, error } = await supabase
            .from('groups')
            .insert({
                ...groupData,
                creator_id: user.id,
                member_count: 1 // Trigger will optimize this but good to be explicit
            })
            .select()
            .single();

        if (error) {
            toast.error(error.message);
            return null;
        }

        // Add creator as owner
        await supabase.from('group_members').insert({
            group_id: data.id,
            user_id: user.id,
            role: 'owner'
        });

        toast.success('Group created!');
        fetchMyGroups();
        return data as Group;
    }, [fetchMyGroups]);

    const joinGroup = useCallback(async (groupId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please login first');
            return;
        }

        const { error } = await supabase.from('group_members').insert({
            group_id: groupId,
            user_id: user.id
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Joined group!');
            fetchMyGroups();
        }
    }, [fetchMyGroups]);

    return {
        groups,
        myGroups,
        loading,
        fetchPublicGroups,
        fetchMyGroups,
        createGroup,
        joinGroup
    };
}
