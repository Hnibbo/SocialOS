import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import {
    Send,
    Image as ImageIcon,
    Smile,
    Paperclip,
    Search,
    MoreVertical,
    Phone,
    Video,
    ChevronLeft,
    Circle,
    Clock,
    Check,
    CheckCheck
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
}

export const MessagingHub: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showList, setShowList] = useState(true);

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
                .select('*')
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
            .subscribe();
        return () => supabase.removeChannel(channel);
    };

    const markAsRead = async (convId: string) => {
        await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', convId)
            .eq('user_id', user?.id);
        fetchConversations();
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
                    type: 'text'
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
                    {conversations.map((conv) => (
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
                    ))}
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

                            {messages.map((msg, i) => {
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
                                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMine && <CheckCheck className="w-3 h-3 text-primary opacity-50" />}
                                        </div>
                                    </div>
                                );
                            })}
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
                                    onChange={(e) => setNewMessage(e.target.value)}
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
                            <GlassCard className="p-4 flex flex-col items-center gap-2 hover:bg-white/5 cursor-pointer" hover>
                                <Plus className="w-6 h-6 text-secondary" />
                                <span className="text-[10px] font-bold uppercase">New Group</span>
                            </GlassCard>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
