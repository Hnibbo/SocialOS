import { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Users, Share2, Heart, MessageSquare, Gift, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  viewer_count: number;
  is_live: boolean;
  category: string;
  tags: string[];
  stream_key: string;
  room_name: string;
  host_id: string;
  started_at: string;
  host: {
    id: string;
    username: string;
    avatar_url?: string;
    follower_count: number;
  };
  chat_enabled: boolean;
  gifts_enabled: boolean;
  recording_enabled: boolean;
}

interface ViewerMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  message: string;
  timestamp: string;
  is_host: boolean;
  gift?: {
    type: string;
    amount: number;
  };
}

interface LiveStreamingPanelProps {
  onStartStream?: () => void;
}

export default function LiveStreamingPanel({ onStartStream }: LiveStreamingPanelProps) {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [messages, setMessages] = useState<ViewerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftBalance, setGiftBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const categories = [
    { value: 'all', label: 'All Streams' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'music', label: 'Music' },
    { value: 'talk', label: 'Talk Show' },
    { value: 'creative', label: 'Creative' },
    { value: 'education', label: 'Education' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'sports', label: 'Sports' },
  ];

  useEffect(() => {
    fetchStreams();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStreams = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          host:profiles!live_streams_host_id_fkey(id, username, avatar_url, follower_count)
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinStream = async (streamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('generate-livekit-token', {
        body: { streamId, userId: user.id }
      });

      if (tokenError) throw tokenError;

      setSelectedStream(streams.find(s => s.id === streamId) || null);
      setIsWatching(true);
      setViewerCount(selectedStream?.viewer_count || 0);

      const channel = supabase
        .channel(`stream:${streamId}`)
        .on('broadcast', { event: 'message' }, (payload) => {
          setMessages(prev => [...prev, payload.payload]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error joining stream:', error);
    }
  };

  const leaveStream = () => {
    setIsWatching(false);
    setSelectedStream(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStream) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const message: ViewerMessage = {
        id: Date.now().toString(),
        user_id: user.id,
        username: user.user_metadata?.username || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url,
        message: newMessage,
        timestamp: new Date().toISOString(),
        is_host: false,
      };

      await supabase
        .channel(`stream:${selectedStream.id}`)
        .send({
          type: 'broadcast',
          event: 'message',
          payload: message,
        });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendGift = async (type: string, amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.functions.invoke('send-stream-gift', {
        body: {
          streamId: selectedStream?.id,
          senderId: user.id,
          giftType: type,
          amount,
        }
      });

      if (error) throw error;

      setGiftBalance(prev => prev - amount);
      
      const giftMessage: ViewerMessage = {
        id: Date.now().toString(),
        user_id: user.id,
        username: user.user_metadata?.username || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url,
        message: '',
        timestamp: new Date().toISOString(),
        is_host: false,
        gift: { type, amount },
      };

      setMessages(prev => [...prev, giftMessage]);
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (selectedStream && isWatching) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedStream.host.avatar_url} alt={selectedStream.host.username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {selectedStream.host.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{selectedStream.host.username}</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">LIVE</span>
                <Users className="h-3 w-3" />
                <span>{viewerCount}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="destructive" onClick={leaveStream}>
              Leave Stream
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full"
              autoPlay
              playsInline
              muted={isMuted}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="w-80 border-l flex flex-col bg-background">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Stream Chat
              </h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.is_host ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.avatar_url} alt={message.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        {message.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`max-w-[80%] ${message.is_host ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-lg px-3 py-2 ${
                        message.is_host 
                          ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white' 
                          : 'bg-muted text-foreground'
                      }`}>
                        {message.gift ? (
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            <span>Sent {message.gift.amount} {message.gift.type} gift!</span>
                          </div>
                        ) : (
                          <p className="text-sm">{message.message}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.username} • {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} className="bg-gradient-to-r from-blue-500 to-purple-600">
                  Send
                </Button>
              </div>

              {selectedStream.gifts_enabled && (
                <div className="flex gap-2 p-2 bg-muted/30 rounded">
                  {['❤️ Rose', '⭐ Star', '🎁 Gift', '💎 Diamond'].map((gift, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => sendGift(gift, [1, 5, 10, 50][index])}
                    >
                      {gift}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🔴 Live Streaming
        </h2>
        <Button onClick={onStartStream} className="bg-gradient-to-r from-red-500 to-purple-600">
          <Video className="h-4 w-4 mr-2" />
          Go Live
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.value}
            className="px-4 py-2 border rounded-full bg-background hover:bg-muted transition-colors whitespace-nowrap"
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {streams.map((stream) => (
          <Card key={stream.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => joinStream(stream.id)}>
            <div className="relative">
              {stream.thumbnail_url ? (
                <img 
                  src={stream.thumbnail_url} 
                  alt={stream.title}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-red-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                  <Video className="h-12 w-12 text-white/50" />
                </div>
              )}
              
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
              
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                {stream.viewer_count}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold line-clamp-1 mb-2">{stream.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={stream.host.avatar_url} alt={stream.host.username} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {stream.host.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{stream.host.username}</span>
                <div className="flex gap-1 ml-auto">
                  {stream.chat_enabled && <Badge variant="secondary" className="text-xs">Chat</Badge>}
                  {stream.gifts_enabled && <Badge variant="secondary" className="text-xs">Gifts</Badge>}
                  {stream.recording_enabled && <Badge variant="secondary" className="text-xs">Rec</Badge>}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {stream.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {stream.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {streams.length === 0 && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No live streams</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to start streaming and build your audience!
          </p>
          <Button onClick={onStartStream} className="bg-gradient-to-r from-red-500 to-purple-600">
            <Video className="h-4 w-4 mr-2" />
            Start First Stream
          </Button>
        </div>
      )}
    </div>
  );
}