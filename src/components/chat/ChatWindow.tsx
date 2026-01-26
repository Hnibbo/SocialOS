import { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  sender: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatWindowProps {
  chatId: string;
  receiver: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  onClose: () => void;
}

export default function ChatWindow({ chatId, receiver, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${supabase.auth.getUser()?.data.user?.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === receiver.id || newMsg.receiver_id === receiver.id) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, receiver.id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(username, avatar_url)
        `)
        .or(`(sender_id.eq.${receiver.id},receiver_id.eq.${supabase.auth.getUser()?.data.user?.id}),(sender_id.eq.${supabase.auth.getUser()?.data.user?.id},receiver_id.eq.${receiver.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          receiver_id: receiver.id,
          chat_id: chatId,
        })
        .select(`
          *,
          sender:profiles(username, avatar_url)
        `);

      if (error) throw error;
      
      setMessages(prev => [...prev, data[0]]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={receiver.avatar_url} alt={receiver.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {receiver.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{receiver.username}</p>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Video className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === (supabase.auth.getUser()?.data.user?.id);
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                onClick={() => !isOwn && markAsRead(message.id)}
              >
                <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src={message.sender.avatar_url} alt={message.sender.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {message.sender.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      {!isOwn && !message.read && (
                        <span className="ml-2 text-blue-500">• Unread</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background/80 backdrop-blur-sm"
            maxLength={2000}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}