
import { useState, useRef, useEffect } from "react";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RealtimeChatProps {
    roomId: string;
}

export default function RealtimeChat({ roomId }: RealtimeChatProps) {
    const { messages, sendMessage, isConnected } = useRealtimeChat(roomId);
    const [input, setInput] = useState("");
    const { user } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !user) return;
        sendMessage(input, user.id, user.user_metadata?.name || 'User');
        setInput("");
    };

    return (
        <div className="flex flex-col h-[400px] w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-white/80">Live Chat</span>
                </div>
                <span className="text-xs text-white/40">v3.0 Engine</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
                        <User className="w-8 h-8 opacity-50" />
                        <span className="text-xs">No messages yet</span>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white/10 text-white rounded-bl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-white/30 mt-1 px-1">
                                    {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50"
                />
                <Button size="icon" onClick={handleSend} disabled={!input} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
