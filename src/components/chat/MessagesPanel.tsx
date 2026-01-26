import { useState, useEffect } from 'react';
import { Search, MoreVertical, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import ChatWindow from './ChatWindow';

interface Conversation {
  id: string;
  participant_id: string;
  participant: {
    username: string;
    avatar_url?: string;
    status: 'online' | 'offline' | 'away';
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unread_count: number;
}

export default function MessagesPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant:profiles!conversations_participant_id_fkey(
            username,
            avatar_url,
            status
          )
        `)
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const transformedConversations = await Promise.all(
        data?.map(async (conv) => {
          const participantId = conv.user_one_id === user.id ? conv.user_two_id : conv.user_one_id;
          
          const { data: participant } = await supabase
            .from('profiles')
            .select('username, avatar_url, status')
            .eq('id', participantId)
            .single();

          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', user.id)
            .eq('read', false);

          return {
            id: conv.id,
            participant_id: participantId,
            participant: participant || { username: 'Unknown', status: 'offline' },
            last_message: latestMessage || { content: 'No messages yet', created_at: conv.created_at, sender_id: '', read: true },
            unread_count: unreadCount || 0
          };
        }) || []
      );

      setConversations(transformedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Active now';
      case 'away':
        return 'Away';
      default:
        return 'Offline';
    }
  };

  if (selectedChat) {
    const conversation = conversations.find(c => c.id === selectedChat);
    return (
      <div className="h-full flex flex-col">
        <ChatWindow
          chatId={selectedChat}
          receiver={{
            id: conversation?.participant_id || '',
            username: conversation?.participant.username || '',
            avatar_url: conversation?.participant.avatar_url
          }}
          onClose={() => setSelectedChat(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/80 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No conversations yet</p>
            <p className="text-sm">Start a conversation to see it here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedChat(conversation.id)}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.participant.avatar_url} alt={conversation.participant.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {conversation.participant.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(conversation.participant.status)}`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-foreground truncate">
                      {conversation.participant.username}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message.sender_id === (supabase.auth.getUser()?.data.user?.id) && 'You: '}
                      {conversation.last_message.content}
                    </p>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-2 min-w-[20px] h-5 text-xs flex items-center justify-center">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {getStatusText(conversation.participant.status)}
                  </p>
                </div>
                
                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}