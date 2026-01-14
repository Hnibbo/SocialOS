
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ChatMessage = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender_name?: string;
    avatar_url?: string;
};

export function useRealtimeChat(roomId: string, type: 'group' | 'match' = 'group') {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const table = type === 'group' ? 'group_messages' : 'direct_messages';
                const idColumn = type === 'group' ? 'group_id' : 'match_id';

                const { data, error } = await supabase
                    .from(table)
                    .select(`
                        id,
                        content,
                        sender_id,
                        created_at,
                        user_profiles:sender_id (
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq(idColumn, roomId)
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (error) throw error;

                if (data) {
                    const mapped = data.map((m: any) => ({
                        id: m.id,
                        content: m.content,
                        sender_id: m.sender_id,
                        created_at: m.created_at,
                        sender_name: m.user_profiles?.full_name,
                        avatar_url: m.user_profiles?.avatar_url
                    }));
                    setMessages(mapped);
                }
            } catch (err) {
                console.error("Chat history error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Subscribe to new messages
        const channel = supabase.channel(`room:${roomId}`)
            .on('broadcast', { event: 'message' }, (payload) => {
                const msg = payload.payload as ChatMessage;
                // Avoid duplicates if we broadcast to ourselves
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, type]);

    const sendMessage = async (content: string, senderId: string, senderName: string) => {
        if (!channelRef.current || !roomId) return;

        const table = type === 'group' ? 'group_messages' : 'direct_messages';
        const idColumn = type === 'group' ? 'group_id' : 'match_id';

        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            content,
            sender_id: senderId,
            sender_name: senderName,
            created_at: new Date().toISOString()
        };

        // 1. Optimistic update
        setMessages(prev => [...prev, msg]);

        // 2. Persist to DB
        const { error } = await supabase
            .from(table)
            .insert({
                [idColumn]: roomId,
                sender_id: senderId,
                content: content
            });

        if (error) {
            console.error("Failed to persist message:", error);
            // In a real app we might show an error icon on the message
        }

        // 3. Broadcast
        await channelRef.current.send({
            type: 'broadcast',
            event: 'message',
            payload: msg
        });
    };

    return { messages, sendMessage, isConnected, loading };
}
