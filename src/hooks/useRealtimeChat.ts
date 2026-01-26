
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type ChatMessage = {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender_name?: string;
    avatar_url?: string;
    status?: 'sending' | 'sent' | 'failed';
    is_read?: boolean;
    read_at?: string;
    reactions?: Record<string, string[]>; // emoji: [user_id1, user_id2]
};

export function useRealtimeChat(roomId: string, type: 'group' | 'match' = 'group') {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
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
                        is_read,
                        read_at,
                        reactions,
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
                        avatar_url: m.user_profiles?.avatar_url,
                        status: 'sent',
                        is_read: m.is_read,
                        read_at: m.read_at,
                        reactions: m.reactions || {}
                    }));
                    setMessages(mapped);
                }
            } catch (err) {
                console.error("Chat history error:", err);
                toast.error('Failed to load chat history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Subscribe to new messages
        const channel = supabase.channel(`room:${roomId}`, {
            config: { broadcast: { self: false } }
        })
            .on('broadcast', { event: 'message' }, (payload) => {
                const msg = payload.payload as ChatMessage;
                // Avoid duplicates if we broadcast to ourselves
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, { ...msg, status: 'sent' }];
                });
            })
            .on('broadcast', { event: 'typing' }, () => {
                setIsTyping(true);
                const timer = setTimeout(() => setIsTyping(false), 1500);
                return () => clearTimeout(timer);
            })
            .on('broadcast', { event: 'message-read' }, (payload) => {
                const { messageId } = payload.payload as { messageId: string };
                setMessages(prev => prev.map(m => 
                    m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
                ));
            })
            .on('broadcast', { event: 'message-reaction' }, (payload) => {
                const { messageId, emoji, userId } = payload.payload as { messageId: string; emoji: string; userId: string };
                setMessages(prev => prev.map(m => {
                    if (m.id === messageId) {
                        const newReactions = { ...m.reactions };
                        if (newReactions[emoji]) {
                            const userIndex = newReactions[emoji].indexOf(userId);
                            if (userIndex > -1) {
                                // Remove reaction if user already reacted
                                newReactions[emoji] = newReactions[emoji].filter(id => id !== userId);
                                if (newReactions[emoji].length === 0) {
                                    delete newReactions[emoji];
                                }
                            } else {
                                // Add reaction
                                newReactions[emoji].push(userId);
                            }
                        } else {
                            // Create new reaction array
                            newReactions[emoji] = [userId];
                        }
                        return { ...m, reactions: newReactions };
                    }
                    return m;
                }));
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setIsConnected(false);
                    toast.warning('Connection lost, reconnecting...');
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, type]);

    const sendMessage = async (content: string, senderId: string, senderName: string) => {
        if (!channelRef.current || !roomId) {
            toast.error('Not connected to chat');
            return;
        }

        const table = type === 'group' ? 'group_messages' : 'direct_messages';
        const idColumn = type === 'group' ? 'group_id' : 'match_id';

        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            content,
            sender_id: senderId,
            sender_name: senderName,
            created_at: new Date().toISOString(),
            status: 'sending',
            is_read: false,
            reactions: {}
        };

        // 1. Optimistic update
        setMessages(prev => [...prev, msg]);

        try {
            // 2. Persist to DB
            const { error } = await supabase
                .from(table)
                .insert({
                    [idColumn]: roomId,
                    sender_id: senderId,
                    content: content,
                    is_read: false,
                    reactions: {}
                });

            if (error) throw error;

            // 3. Broadcast
            await channelRef.current.send({
                type: 'broadcast',
                event: 'message',
                payload: msg
            });

            // Update status to sent
            setMessages(prev => prev.map(m => 
                m.id === msg.id ? { ...m, status: 'sent' } : m
            ));
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => prev.map(m => 
                m.id === msg.id ? { ...m, status: 'failed' } : m
            ));
            toast.error('Failed to send message');
        }
    };

    const sendTypingIndicator = async () => {
        if (channelRef.current) {
            try {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: {}
                });
            } catch (error) {
                console.error('Failed to send typing indicator:', error);
            }
        }
    };

    const markMessageAsRead = async (messageId: string) => {
        if (!channelRef.current) return;

        try {
            const table = type === 'group' ? 'group_messages' : 'direct_messages';
            const { error } = await supabase
                .from(table)
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', messageId);

            if (error) throw error;

            // Broadcast read receipt
            await channelRef.current.send({
                type: 'broadcast',
                event: 'message-read',
                payload: { messageId }
            });

            // Update local state
            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
            ));
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    };

    const addReaction = async (messageId: string, emoji: string, userId: string) => {
        if (!channelRef.current) return;

        try {
            const table = type === 'group' ? 'group_messages' : 'direct_messages';
            
            // Get current reactions
            const { data: messageData, error: fetchError } = await supabase
                .from(table)
                .select('reactions')
                .eq('id', messageId)
                .single();

            if (fetchError) throw fetchError;

            const currentReactions = messageData.reactions || {};
            const newReactions = { ...currentReactions };

            if (newReactions[emoji]) {
                const userIndex = newReactions[emoji].indexOf(userId);
                if (userIndex > -1) {
                    // Remove reaction if user already reacted
                    newReactions[emoji] = newReactions[emoji].filter(id => id !== userId);
                    if (newReactions[emoji].length === 0) {
                        delete newReactions[emoji];
                    }
                } else {
                    // Add reaction
                    newReactions[emoji].push(userId);
                }
            } else {
                // Create new reaction array
                newReactions[emoji] = [userId];
            }

            // Update DB
            const { error: updateError } = await supabase
                .from(table)
                .update({ reactions: newReactions })
                .eq('id', messageId);

            if (updateError) throw updateError;

            // Broadcast reaction
            await channelRef.current.send({
                type: 'broadcast',
                event: 'message-reaction',
                payload: { messageId, emoji, userId }
            });
        } catch (error) {
            console.error('Failed to add reaction:', error);
            toast.error('Failed to add reaction');
        }
    };

    const retryMessage = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        // Update status to sending
        setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, status: 'sending' } : m
        ));

        // Retry sending
        try {
            const table = type === 'group' ? 'group_messages' : 'direct_messages';
            const idColumn = type === 'group' ? 'group_id' : 'match_id';

            const { error } = await supabase
                .from(table)
                .insert({
                    [idColumn]: roomId,
                    sender_id: message.sender_id,
                    content: message.content
                });

            if (error) throw error;

            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'message',
                    payload: message
                });
            }

            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, status: 'sent' } : m
            ));
            toast.success('Message sent');
        } catch (error) {
            console.error('Failed to retry message:', error);
            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, status: 'failed' } : m
            ));
            toast.error('Failed to send message');
        }
    };

    return { 
        messages, 
        sendMessage, 
        isConnected, 
        loading,
        isTyping,
        sendTypingIndicator,
        retryMessage,
        markMessageAsRead,
        addReaction
    };
}
