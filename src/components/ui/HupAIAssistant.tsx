import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Send,
    X,
    Brain,
    History,
    Settings,
    Zap,
    MessageSquare,
    Sparkles,
    Command,
    Plus,
    ArrowRight,
    User,
    Activity
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useSocialOS } from '@/contexts/SocialOSContext';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const HupAIAssistant: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'tasks'>('chat');
    const [memories, setMemories] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();
    const { energy, consumeEnergy } = useSocialOS();

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadHistory = async () => {
        if (!user) return;
        try {
            // Get conversation or create if none exists
            const { data: convos } = await supabase
                .from('ai_conversations')
                .select('id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            let convo = convos?.[0];

            if (!convo) {
                const { data: newConvo } = await supabase
                    .from('ai_conversations')
                    .insert({ user_id: user.id, title: 'Main Stream' })
                    .select()
                    .single();
                convo = newConvo;
            }

            const { data: msgs } = await supabase
                .from('ai_messages')
                .select('*')
                .eq('conversation_id', convo?.id)
                .order('created_at', { ascending: true });

            if (msgs) {
                setMessages(msgs as any);
            } else {
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: "Protocol H-U-P active. Greetings, citizen. I am your neural interface. How can I optimize your experience today?"
                }]);
            }
        } catch (error) {
            console.error('Error loading AI history:', error);
        }
    };

    const loadMemories = async () => {
        if (!user) return;
        setIsDataLoading(true);
        try {
            const { data } = await supabase
                .from('ai_memories')
                .select('*')
                .eq('user_id', user.id)
                .order('importance', { ascending: false });
            setMemories(data || []);
        } catch (error) {
            console.error('Error loading memories:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const loadTasks = async () => {
        if (!user) return;
        setIsDataLoading(true);
        try {
            const { data } = await supabase
                .from('ai_tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            setTasks(data || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'chat') loadHistory();
            if (activeTab === 'memory') loadMemories();
            if (activeTab === 'tasks') loadTasks();
        }
    }, [isOpen, activeTab]);

    const handleSend = async () => {
        if (!input.trim() || !user || isLoading) return;

        if (!consumeEnergy(2)) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: "Warning: Low Energy core. Please wait for replenishment before initiating further neural queries."
            }]);
            return;
        }

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Save user message to DB
            const { data: convo } = await supabase.from('ai_conversations').select('id').eq('user_id', user.id).single();
            await supabase.from('ai_messages').insert({
                conversation_id: convo?.id,
                role: 'user',
                content: input
            });

            // Call real AI Hub (OpenRouter/OpenAI based)
            const { data, error } = await supabase.functions.invoke('hup-ai-hub', {
                body: {
                    prompt: input,
                    feature: 'support_bot',
                    context: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
                }
            });

            if (error) throw error;

            const aiResponseContent = data.content;
            const aiResponse: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponseContent };

            setMessages(prev => [...prev, aiResponse]);

            // Save AI response to DB
            if (convo) {
                await supabase.from('ai_messages').insert({
                    conversation_id: convo.id,
                    role: 'assistant',
                    content: aiResponseContent
                });
            }

        } catch (error: any) {
            console.error('Neural error:', error);
            setMessages(prev => [...prev, {
                id: 'error',
                role: 'system',
                content: `Neural link interrupted: ${error.message || 'Re-sync necessary.'}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-end pointer-events-none p-4 md:p-8">
            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg h-[600px] pointer-events-auto"
            >
                <GlassCard className="h-full flex flex-col border-primary/30 shadow-[0_0_80px_rgba(0,240,255,0.1)] overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center relative">
                                <Bot className="w-6 h-6 text-primary" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                    Hup AI <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">Neural Layer Active</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={cn("p-2 rounded-lg transition-colors", activeTab === 'chat' ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-white")}
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setActiveTab('memory')}
                                className={cn("p-2 rounded-lg transition-colors", activeTab === 'memory' ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-white")}
                            >
                                <Brain className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={cn("p-2 rounded-lg transition-colors", activeTab === 'tasks' ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-white")}
                            >
                                <Zap className="w-4 h-4" />
                            </button>
                            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                        {activeTab === 'chat' ? (
                            <>
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn(
                                                "flex gap-4 max-w-[85%]",
                                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border",
                                                msg.role === 'user' ? "bg-secondary/10 border-secondary/20 text-secondary" :
                                                    msg.role === 'system' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                        "bg-primary/10 border-primary/20 text-primary"
                                            )}>
                                                {msg.role === 'user' ? <User className="w-4 h-4" /> : msg.role === 'system' ? <Zap className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm leading-relaxed",
                                                msg.role === 'user' ? "bg-secondary/5 text-secondary-foreground" :
                                                    msg.role === 'system' ? "bg-red-500/5 text-red-500 font-bold italic" :
                                                        "bg-white/5 border border-white/5"
                                            )}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Bot className="w-4 h-4 text-primary animate-pulse" /></div>
                                            <div className="flex gap-1.5 p-4 rounded-2xl bg-white/5">
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-white/5 bg-black/40">
                                    <div className="relative">
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-16 text-sm outline-none focus:border-primary transition-all placeholder:opacity-30"
                                            placeholder="Send neural command..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded italic">2% Energy</span>
                                            <ElectricButton onClick={handleSend} size="sm" className="w-10 h-10 p-0 rounded-xl">
                                                <Send className="w-4 h-4" />
                                            </ElectricButton>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 justify-center mt-3">
                                        {['Check Balance', 'Send 10 HUP to Admin', 'App Help'].map(hint => (
                                            <button
                                                key={hint}
                                                onClick={() => setInput(hint)}
                                                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors hover:scale-105"
                                            >
                                                {hint}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : activeTab === 'memory' ? (
                            <div className="p-6 space-y-6 overflow-y-auto h-full scrollbar-hide">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Persistent Memory Nodes</h4>
                                    <Plus className="w-4 h-4 opacity-30 cursor-pointer hover:text-white transition-colors" />
                                </div>
                                {isDataLoading ? (
                                    <div className="flex justify-center py-10"><Zap className="w-6 h-6 animate-spin text-primary/30" /></div>
                                ) : memories.length > 0 ? (
                                    <div className="space-y-4">
                                        {memories.map((mem) => (
                                            <GlassCard key={mem.id} className="p-4 flex items-center gap-4 bg-white/5 border-white/5 group hover:border-primary/30 transition-all">
                                                <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                                                    <Brain className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{mem.memory_type}</p>
                                                        <span className="text-[8px] font-mono opacity-30">{Math.round(mem.importance * 100)}%</span>
                                                    </div>
                                                    <p className="text-xs font-bold">{mem.content}</p>
                                                </div>
                                            </GlassCard>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                                        <Brain className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Neural memories empty</p>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'tasks' ? (
                            <div className="p-6 space-y-6 overflow-y-auto h-full scrollbar-hide">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Autonomous Neural Tasks</h4>
                                    <Activity className="w-4 h-4 opacity-30" />
                                </div>
                                {isDataLoading ? (
                                    <div className="flex justify-center py-10"><Zap className="w-6 h-6 animate-spin text-primary/30" /></div>
                                ) : tasks.length > 0 ? (
                                    <div className="space-y-4">
                                        {tasks.map((task) => (
                                            <GlassCard key={task.id} className="p-4 bg-white/5 border-white/5 group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            task.status === 'completed' ? "bg-green-500" :
                                                                task.status === 'in_progress' ? "bg-primary animate-pulse" : "bg-muted"
                                                        )} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">{task.title}</p>
                                                    </div>
                                                    <Badge className="text-[8px] h-4 uppercase tracking-tighter bg-white/5 text-muted-foreground border-white/5">{task.status}</Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mb-3">{task.description}</p>
                                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: task.status === 'completed' ? '100%' : '40%' }}
                                                        className={cn("h-full", task.status === 'completed' ? "bg-green-500" : "bg-primary")}
                                                    />
                                                </div>
                                            </GlassCard>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                                        <Zap className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No active autonomous tasks</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-[8px] font-black opacity-30 uppercase tracking-[0.2em] italic">
                        <span>Protocol: HUP-CORE-AI-v4</span>
                        <span>Latency: 4ms</span>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};
