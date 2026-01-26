import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Send,
    Image as ImageIcon,
    Smile,
    Search,
    MoreVertical,
    Phone,
    Video,
    ChevronLeft,
    Circle,
    Clock,
    Check,
    CheckCheck,
    MessageSquare,
    Plus,
    Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Conversation {
    id: string;
    name: string;
    avatar_url: string;
    type: string;
    last_message_at: string;
    unread_count: number;
    last_message_content: string;
    last_message_sender_id: string;
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    type: string;
    is_read?: boolean;
    read_at?: string;
    reactions?: Record<string, string[]>; // emoji: [user_id1, user_id2]
}

interface GroupCreateData {
    name: string;
    description: string;
}

const MessagingHubComponent: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showList, setShowList] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showGroupCreateDialog, setShowGroupCreateDialog] = useState(false);
    const [groupCreateData, setGroupCreateData] = useState<GroupCreateData>({
        name: '',
        description: ''
    });

    const { user } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchConversations();
            subscribeToConversations();
        }
    }, [user]);

    useEffect(() => {
        if (activeConv) {
            fetchMessages(activeConv.id);
            subscribeToMessages(activeConv.id);
            markAsRead(activeConv.id);
            if (window.innerWidth < 768) setShowList(false);
        }
    }, [activeConv]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_conversations', {
                p_user_id: user?.id
            });
            if (error) throw error;
            setConversations(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*, reactions')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const subscribeToConversations = () => {
        const channel = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                fetchConversations();
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    };

    const subscribeToMessages = (convId: string) => {
        const channel = supabase
            .channel(`public:messages:${convId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${convId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .on('broadcast', { event: 'typing' }, () => {
                setIsTyping(true);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 1500);
            })
            .on('broadcast', { event: 'message-read' }, (payload: any) => {
                const { messageId } = payload.payload;
                setMessages(prev => prev.map(msg => 
                    msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
                ));
            })
            .on('broadcast', { event: 'message-reaction' }, (payload: any) => {
                const { messageId, emoji, userId } = payload.payload;
                setMessages(prev => prev.map(msg => {
                    if (msg.id === messageId) {
                        const newReactions = { ...msg.reactions };
                        if (newReactions[emoji]) {
                            const userIndex = newReactions[emoji].indexOf(userId);
                            if (userIndex > -1) {
                                // Remove reaction if user already reacted
                                newReactions[emoji] = newReactions[emoji].filter((id: string) => id !== userId);
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
                        return { ...msg, reactions: newReactions };
                    }
                    return msg;
                }));
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    };

    const sendTypingIndicator = async () => {
        if (!activeConv) return;
        
        try {
            const channel = supabase.channel(`public:messages:${activeConv.id}`);
            await channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: user?.id }
            });
        } catch (error) {
            console.error('Error sending typing indicator:', error);
        }
    };

    const markAsRead = async (convId: string) => {
        // Update conversation participant last read time
        await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', convId)
            .eq('user_id', user?.id);

        // Mark all unread messages as read
        const { data: unreadMessages, error: fetchError } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', convId)
            .eq('sender_id', 'ne', user?.id) // Not sent by current user
            .eq('is_read', false);

        if (!fetchError && unreadMessages) {
            const messageIds = unreadMessages.map(msg => msg.id);
            await supabase
                .from('messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .in('id', messageIds);

            // Broadcast read receipts to other users
            const channel = supabase.channel(`public:messages:${convId}`);
            for (const messageId of messageIds) {
                await channel.send({
                    type: 'broadcast',
                    event: 'message-read',
                    payload: { messageId }
                });
            }

            // Update local state
            setMessages(prev => prev.map(msg => 
                messageIds.includes(msg.id) ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
            ));
        }

        fetchConversations();
    };



    const handleCreateGroup = async () => {
        if (!user || !groupCreateData.name.trim()) return;

        try {
            // Create conversation
            const { data: conversationData, error: convError } = await supabase
                .from('conversations')
                .insert({
                    type: 'group',
                    name: groupCreateData.name.trim(),
                    description: groupCreateData.description.trim(),
                    created_by: user.id
                })
                .select()
                .single();

            if (convError) throw convError;

            // Add current user as participant
            const { error: participantError } = await supabase
                .from('conversation_participants')
                .insert({
                    conversation_id: conversationData.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (participantError) throw participantError;

            setShowGroupCreateDialog(false);
            setGroupCreateData({ name: '', description: '' });
            fetchConversations();
        } catch (error: any) {
            console.error('Error creating group:', error);
        }
    };

    const handleAddReaction = async (messageId: string, emoji: string) => {
        if (!user) return;

        try {
            // Get current reactions for the message
            const { data: messageData, error: fetchError } = await supabase
                .from('messages')
                .select('reactions')
                .eq('id', messageId)
                .single();

            if (fetchError) throw fetchError;

            const currentReactions = messageData.reactions || {};
            const newReactions = { ...currentReactions };

            if (newReactions[emoji]) {
                const userIndex = newReactions[emoji].indexOf(user.id);
                if (userIndex > -1) {
                    // Remove reaction if user already reacted
                    newReactions[emoji] = newReactions[emoji].filter((id: string) => id !== user.id);
                    if (newReactions[emoji].length === 0) {
                        delete newReactions[emoji];
                    }
                } else {
                    // Add reaction
                    newReactions[emoji].push(user.id);
                }
            } else {
                // Create new reaction array
                newReactions[emoji] = [user.id];
            }

            // Update message with new reactions
            const { error: updateError } = await supabase
                .from('messages')
                .update({ reactions: newReactions })
                .eq('id', messageId);

            if (updateError) throw updateError;

            // Update local state
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, reactions: newReactions } : msg
            ));

            // Broadcast reaction to other users
            const channel = supabase.channel(`public:messages:${activeConv?.id}`);
            await channel.send({
                type: 'broadcast',
                event: 'message-reaction',
                payload: { messageId, emoji, userId: user.id }
            });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeConv || !user) return;

        const content = newMessage;
        setNewMessage('');

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: activeConv.id,
                    sender_id: user.id,
                    content: content,
                    type: 'text',
                    is_read: false,
                    reactions: {}
                });
            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex h-[calc(100vh-120px)] w-full gap-4 p-4 md:p-6 overflow-hidden">
            {/* Conversations List */}
            <GlassCard className={cn(
                "flex-col w-full md:w-80 lg:w-96 flex",
                !showList && "hidden md:flex"
            )}>
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tighter">MESSAGES</h2>
                        <ElectricButton variant="ghost" size="sm" className="p-2">
                            <Search className="w-4 h-4" />
                        </ElectricButton>
                    </div>
                    <div className="flex gap-2">
                        <ElectricButton variant="primary" size="sm" className="flex-1 text-[10px] font-bold h-8">DIRECT</ElectricButton>
                        <ElectricButton variant="ghost" size="sm" className="flex-1 text-[10px] font-bold h-8">GROUPS</ElectricButton>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                                <Skeleton variant="circular" className="w-12 h-12" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton variant="text" className="w-24 h-4" />
                                        <Skeleton variant="text" className="w-8 h-3" />
                                    </div>
                                    <Skeleton variant="text" className="w-full h-3" />
                                </div>
                                <Skeleton variant="circular" className="w-5 h-5" />
                            </div>
                        ))
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setActiveConv(conv)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/5",
                                    activeConv?.id === conv.id ? "bg-primary/20 border border-primary/30" : "border border-transparent"
                                )}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                                        <img src={conv.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm truncate">{conv.name}</h4>
                                        <span className="text-[10px] font-bold opacity-30 whitespace-nowrap">
                                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-xs truncate",
                                        conv.unread_count > 0 ? "text-white font-bold" : "text-muted-foreground"
                                    )}>
                                        {conv.last_message_content || "No messages yet"}
                                    </p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-dark">
                                        {conv.unread_count}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>

            {/* Chat Window */}
            <GlassCard className={cn(
                "flex-1 flex flex-col p-0 overflow-hidden relative",
                showList && "hidden md:flex"
            )}>
                {activeConv ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowList(true)} className="md:hidden p-2 hover:bg-white/5 rounded-full">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-primary/20 p-0.5 overflow-hidden">
                                        <img src={activeConv.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConv.id}`} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{activeConv.name}</h4>
                                        <div className="flex items-center gap-1.5">
                                            <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Active Now</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ElectricButton variant="ghost" size="sm" className="p-2">
                                    <Phone className="w-4 h-4" />
                                </ElectricButton>
                                <ElectricButton variant="ghost" size="sm" className="p-2">
                                    <Video className="w-4 h-4" />
                                </ElectricButton>
                                <ElectricButton variant="ghost" size="sm" className="p-2">
                                    <MoreVertical className="w-4 h-4" />
                                </ElectricButton>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                            <div className="text-center py-8">
                                <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Encryption Active • Messages Secured
                                </div>
                            </div>

                            {messages.map((msg) => {
                                const isMine = msg.sender_id === user?.id;
                                return (
                                    <div key={msg.id} className={cn(
                                        "flex flex-col max-w-[80%] animate-in slide-in-from-bottom-2 duration-300",
                                        isMine ? "ml-auto items-end" : "mr-auto items-start"
                                    )}>
                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm leading-relaxed relative group",
                                            isMine
                                                ? "bg-gradient-to-br from-primary to-secondary text-dark font-medium rounded-tr-none shadow-[0_4px_15px_rgba(0,240,255,0.2)]"
                                                : "bg-white/5 backdrop-blur-md border border-white/10 rounded-tl-none"
                                        )}>
                                            {msg.content}
                                            <div className={cn(
                                                "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-2 px-2 py-1 bg-black/80 rounded-full text-[8px] z-10",
                                                isMine ? "right-full mr-2" : "left-full ml-2"
                                            )}>
                                                <Clock className="w-2.5 h-2.5" />
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {/* Message Reactions */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleAddReaction(msg.id, emoji)}
                                                        className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors"
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="text-[10px]">{users.length}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-1 px-1">
                                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMine && (
                                                <div className="flex items-center gap-1">
                                                    {msg.is_read ? (
                                                        <CheckCheck className="w-3 h-3 text-primary" />
                                                    ) : (
                                                        <Check className="w-3 h-3 text-primary opacity-50" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {isTyping && (
                                <div className="flex items-center gap-2 mr-auto">
                                    <div className="w-6 h-6 rounded-full bg-white/10" />
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs text-muted-foreground">Typing...</span>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                            <div className="flex items-end gap-3 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:border-primary/50 transition-colors">
                                <div className="flex gap-1">
                                    <ElectricButton variant="ghost" size="sm" className="p-2 h-10 w-10 text-muted-foreground hover:text-white">
                                        <Plus className="w-5 h-5" />
                                    </ElectricButton>
                                    <ElectricButton variant="ghost" size="sm" className="p-2 h-10 w-10 text-muted-foreground hover:text-white hidden sm:flex">
                                        <ImageIcon className="w-5 h-5" />
                                    </ElectricButton>
                                </div>

                                <textarea
                                    rows={1}
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        sendTypingIndicator();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="w-full bg-transparent border-none focus:outline-none py-2.5 text-sm resize-none scrollbar-hide max-h-32"
                                />

                                <div className="flex gap-1">
                                    <ElectricButton variant="ghost" size="sm" className="p-2 h-10 w-10 text-muted-foreground hover:text-white hidden sm:flex">
                                        <Smile className="w-5 h-5" />
                                    </ElectricButton>
                                    <ElectricButton
                                        variant="primary"
                                        size="sm"
                                        disabled={!newMessage.trim()}
                                        onClick={handleSendMessage}
                                        className="h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                                    >
                                        <Send className="w-4 h-4 text-dark" />
                                    </ElectricButton>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-8 mt-2 opacity-30">
                                <span className="text-[8px] font-bold uppercase tracking-[0.2em] flex items-center gap-1">Shift + Enter for new line</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.05),transparent_70%)]">
                        <div className="p-8 rounded-full bg-primary/10 mb-6 animate-pulse-glow">
                            <MessageSquare className="w-20 h-20 text-primary opacity-50" />
                        </div>
                        <h3 className="text-3xl font-black italic tracking-tighter mb-2">PICK A FREQUENCY</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">Select a conversation from the list to start transmitting data to the network.</p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            <GlassCard className="p-4 flex flex-col items-center gap-2 hover:bg-white/5 cursor-pointer" hover onClick={() => setShowList(true)}>
                                <Search className="w-6 h-6 text-primary" />
                                <span className="text-[10px] font-bold uppercase">Search</span>
                            </GlassCard>
                            <GlassCard className="p-4 flex flex-col items-center gap-2 hover:bg-white/5 cursor-pointer" hover onClick={() => setShowGroupCreateDialog(true)}>
                                <Users className="w-6 h-6 text-secondary" />
                                <span className="text-[10px] font-bold uppercase">New Group</span>
                            </GlassCard>
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Group Creation Dialog */}
            {showGroupCreateDialog && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
                    <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
                        <GlassCard className="overflow-hidden border-primary/20 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" /> Create New Group
                                </h3>
                                <button 
                                    onClick={() => setShowGroupCreateDialog(false)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-white"
                                >
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Group Name
                                    </label>
                                    <input
                                        type="text"
                                        value={groupCreateData.name}
                                        onChange={(e) => setGroupCreateData({ ...groupCreateData, name: e.target.value })}
                                        placeholder="Enter group name"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={groupCreateData.description}
                                        onChange={(e) => setGroupCreateData({ ...groupCreateData, description: e.target.value })}
                                        placeholder="Enter group description"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
                                    <ElectricButton 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setShowGroupCreateDialog(false)}
                                    >
                                        Cancel
                                    </ElectricButton>
                                    <ElectricButton 
                                        size="sm"
                                        disabled={!groupCreateData.name.trim()}
                                        onClick={handleCreateGroup}
                                    >
                                        Create Group
                                    </ElectricButton>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export const MessagingHub = React.memo(MessagingHubComponent);
