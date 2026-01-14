import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPresence {
    userId: string;
    username: string;
    avatar?: string;
    cursor?: { x: number; y: number };
    lastSeen: number;
}

export function usePresence(workspaceId: string) {
    const [users, setUsers] = useState<UserPresence[]>([]);
    const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!workspaceId) return;

        // Create presence channel
        const presenceChannel = supabase.channel(`workspace:${workspaceId}`, {
            config: {
                presence: {
                    key: workspaceId,
                },
            },
        });

        // Track presence
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const presentUsers: UserPresence[] = [];

                Object.keys(state).forEach((key) => {
                    const presences = state[key];
                    presences.forEach((presence: Record<string, unknown>) => {
                        presentUsers.push({
                            userId: presence.user_id,
                            username: presence.username,
                            avatar: presence.avatar,
                            cursor: presence.cursor,
                            lastSeen: Date.now(),
                        });
                    });
                });

                setUsers(presentUsers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) {
                        await presenceChannel.track({
                            user_id: user.id,
                            username: user.email?.split('@')[0] || 'Anonymous',
                            online_at: new Date().toISOString(),
                        });
                    }
                }
            });

        setChannel(presenceChannel);

        return () => {
            presenceChannel.unsubscribe();
        };
    }, [workspaceId]);

    const updateCursor = async (x: number, y: number) => {
        if (channel) {
            await channel.track({
                cursor: { x, y },
            });
        }
    };

    return { users, updateCursor };
}
