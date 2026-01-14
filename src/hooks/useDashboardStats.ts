
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        matches: 0,
        nearbyPeople: 0,
        groupInvites: 0,
        activeChats: 0,
        loading: true
    });

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                // 1. Matches (Dating)
                const { count: matchesCount } = await supabase
                    .from('dating_matches')
                    .select('*', { count: 'exact', head: true })
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                    .eq('status', 'active');

                // 2. Nearby People (Recent visibility)
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                const { count: nearbyCount } = await supabase
                    .from('user_presence')
                    .select('*', { count: 'exact', head: true })
                    .gt('last_location_updated_at', fiveMinutesAgo)
                    .eq('is_visible', true)
                    .neq('user_id', user.id);

                // 3. Group Invites
                const { count: invitesCount } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('role', 'invited'); // Assuming 'invited' role for pending invites

                // 4. Active Chats
                const { count: chatsCount } = await supabase
                    .from('dating_matches')
                    .select('*', { count: 'exact', head: true })
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                    .eq('chat_started', true);

                setStats({
                    matches: matchesCount || 0,
                    nearbyPeople: nearbyCount || 0,
                    groupInvites: invitesCount || 0,
                    activeChats: chatsCount || 0,
                    loading: false
                });
            } catch (err) {
                console.error("Dashboard stats error:", err);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [user]);

    return stats;
}
