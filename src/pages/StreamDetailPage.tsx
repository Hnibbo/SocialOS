import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStreaming, useStreamViewer, LiveStream } from '@/hooks/useStreaming';
import { LiveStreamPlayer } from '@/components/social/LiveStreamPlayer';
import { LiveStreamChat } from '@/components/social/LiveStreamChat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, Share2, MessageSquare, Clock, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

export default function StreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  
  const { joinStream, leaveStream, remoteStream, connectionState } = useStreamViewer(id || '');

  useEffect(() => {
    const fetchStream = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select(`
            *,
            host:user_profiles!host_id (
              display_name,
              username,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setStream(data);
      } catch (error) {
        console.error('Error fetching stream:', error);
        navigate('/live');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [id, navigate]);

  const handleWatch = async () => {
    if (!isWatching) {
      await joinStream();
      setIsWatching(true);
    }
  };

  const handleStopWatching = () => {
    leaveStream();
    setIsWatching(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Stream Not Found</h2>
          <p className="text-gray-400 mb-4">The stream you're looking for doesn't exist or has ended.</p>
          <Button onClick={() => navigate('/live')}>Back to Live Streams</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={stream.title} description={stream.description || 'Live stream from the Social OS community'} />

      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
        {/* Stream Player Section */}
        <div className="relative aspect-video w-full bg-black">
          {isWatching ? (
            <LiveStreamPlayer
              stream={remoteStream}
              connectionState={connectionState}
              isHost={false}
              onClose={handleStopWatching}
              streamId={id}
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&q=80'}
                alt={stream.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-center">
                <Button
                  onClick={handleWatch}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2 px-8 py-6 text-lg shadow-lg shadow-red-600/30"
                >
                  <Eye className="w-6 h-6" /> Watch Stream
                </Button>
                {!stream.is_active && (
                  <Badge className="mt-4 bg-gray-600">Stream Ended</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stream Details */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stream Info */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={stream.host?.avatar_url} alt={stream.host?.full_name} />
                      <AvatarFallback>{stream.host?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-bold text-white">{stream.title}</h1>
                      <p className="text-gray-400 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {stream.host?.full_name || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={stream.is_active ? 'bg-red-600 animate-pulse' : 'bg-gray-600'}>
                      {stream.is_active ? 'LIVE' : 'ENDED'}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10">
                      <Eye className="w-3 h-3 mr-1" /> {stream.viewer_count || 0}
                    </Badge>
                  </div>
                </div>

                {stream.description && (
                  <p className="text-gray-300 mb-4 leading-relaxed">{stream.description}</p>
                )}

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Started {new Date(stream.started_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(stream.started_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {stream.visibility}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stream Actions */}
              <div className="flex gap-4">
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2">
                  <Heart className="w-4 h-4" /> Like
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat
                </Button>
              </div>

              {/* Stream Description */}
              {stream.description && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">About This Stream</h3>
                  <p className="text-gray-300 leading-relaxed">{stream.description}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Chat */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Live Chat
                  </h3>
                </div>
                <div className="h-[600px]">
                  <LiveStreamChat streamId={id || ''} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
