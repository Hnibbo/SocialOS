import { useState, useRef, useEffect } from "react";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, RefreshCw, AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LiveStreamChatProps {
  streamId: string;
}

export function LiveStreamChat({ streamId }: LiveStreamChatProps) {
  const { messages, sendMessage, isConnected, loading, isTyping, sendTypingIndicator, retryMessage } = useRealtimeChat(`stream:${streamId}`);
  const [input, setInput] = useState("");
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator();
    }, 500);
  };

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(input, user.id, user.user_metadata?.name || 'User');
    setInput("");
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleRetry = (messageId: string) => {
    retryMessage(messageId);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-white/80">Live Chat</span>
        </div>
        <span className="text-xs text-white/40">{messages.length} messages</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs">Loading chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
            <User className="w-8 h-8 opacity-50" />
            <span className="text-xs">Be the first to chat!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.status === 'failed' 
                      ? 'bg-red-500/20 text-white border border-red-500/30'
                      : isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white/10 text-white rounded-bl-none'
                }`}>
                  {msg.content}
                  {msg.status === 'sending' && (
                    <Loader2 className="w-3 h-3 inline-block ml-2 animate-spin" />
                  )}
                  {msg.status === 'failed' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRetry(msg.id)}
                      className="w-5 h-5 ml-2 p-0 hover:bg-red-500/30"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <span className="text-[10px] text-white/30 mt-1 px-1 flex items-center gap-1">
                  {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.status === 'failed' && (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                </span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Someone is typing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
          disabled={!isConnected}
          className={`bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50 ${
            !isConnected ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <Button 
          size="icon" 
          onClick={handleSend} 
          disabled={!input || !isConnected} 
          className="bg-primary hover:bg-primary/90 text-white rounded-xl"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
