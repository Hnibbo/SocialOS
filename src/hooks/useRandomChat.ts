import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessage {
    id: string;
    sender_id: string | null;
    content: string;
    created_at: string;
    is_me: boolean;
}

export function useRandomChat() {
    const [inQueue, setInQueue] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!chatId) return;

        const channel = supabase.channel(`chat:${chatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'random_chat_messages',
                filter: `chat_id=eq.${chatId}`
            }, async (payload) => {
                const { data: { user } } = await supabase.auth.getUser();
                const newMsg = payload.new as any;
                setMessages(prev => [...prev, {
                    id: newMsg.id,
                    sender_id: newMsg.sender_id,
                    content: newMsg.content,
                    created_at: newMsg.created_at,
                    is_me: user?.id === newMsg.sender_id
                }]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId]);

    const joinQueue = useCallback(async () => {
        setInQueue(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Login required');
            setInQueue(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            await supabase.from('user_profiles').update({
                latitude: latitude,
                longitude: longitude,
                last_seen: new Date().toISOString()
            }).eq('id', user.id);
        }, (err) => {
            console.warn("Location denied for Chat Grid", err);
        });

        const { data: availableUsers } = await supabase
            .from('random_chat_queue')
            .select('*')
            .neq('user_id', user.id)
            .gt('expires_at', new Date().toISOString())
            .limit(1);

        if (availableUsers && availableUsers.length > 0) {
            const partner = availableUsers[0];
            const { error: deleteError } = await supabase
                .from('random_chat_queue')
                .delete()
                .eq('id', partner.id);

            if (!deleteError) {
                const { data: chat, error } = await supabase
                    .from('random_chats')
                    .insert({
                        user1_id: user.id,
                        user2_id: partner.user_id,
                        is_anonymous: true
                    })
                    .select()
                    .single();

                if (chat) {
                    setChatId(chat.id);
                    setInQueue(false);
                    toast.success('Match found!');
                    return;
                }
            }
        }

        const { error: queueError } = await supabase
            .from('random_chat_queue')
            .upsert({
                user_id: user.id,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            });

        if (queueError) {
            toast.error('Failed to join queue');
            setInQueue(false);
        } else {
            channelRef.current = supabase.channel(`user_matches:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'random_chats',
                    filter: `user2_id=eq.${user.id}`
                }, (payload) => {
                    setChatId(payload.new.id);
                    setInQueue(false);
                    toast.success('Match found!');
                })
                .subscribe();
        }
    }, []);

    const leaveQueue = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('random_chat_queue').delete().eq('user_id', user.id);
        }
        setInQueue(false);
        if (channelRef.current) supabase.removeChannel(channelRef.current);
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!chatId) return;
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('random_chat_messages').insert({
            chat_id: chatId,
            sender_id: user?.id,
            content: text
        });
    }, [chatId]);

    const leaveChat = useCallback(async () => {
        setChatId(null);
        setMessages([]);
    }, []);

    return {
        inQueue,
        chatId,
        messages,
        joinQueue,
        leaveQueue,
        sendMessage,
        leaveChat
    };
}
