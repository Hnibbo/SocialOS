import { useEffect, useRef, useState } from 'react';
import { X, Wifi, WifiOff, Loader2, MessageSquare, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveStreamChat } from './LiveStreamChat';

interface LiveStreamPlayerProps {
  stream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  isHost?: boolean;
  onClose: () => void;
  streamId?: string;
}

export function LiveStreamPlayer({ stream, connectionState, isHost = false, onClose, streamId }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return { icon: Wifi, text: 'Connected', color: 'text-green-500' };
      case 'connecting':
        return { icon: Loader2, text: 'Connecting...', color: 'text-yellow-500' };
      case 'disconnected':
      case 'failed':
      case 'closed':
        return { icon: WifiOff, text: 'Disconnected', color: 'text-red-500' };
      default:
        return { icon: Loader2, text: 'Initializing...', color: 'text-gray-500' };
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicEnabled;
        setIsMicEnabled(!isMicEnabled);
      }
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraEnabled;
        setIsCameraEnabled(!isCameraEnabled);
      }
    }
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${status.color} ${connectionState === 'connecting' ? 'animate-spin' : ''}`} />
            <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
            {isHost && <span className="text-xs text-white/60 ml-2">Broadcasting</span>}
          </div>
          <div className="flex items-center gap-2">
            {streamId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(!showChat)}
                className="text-white hover:bg-white/10"
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video */}
        <div className={`flex-1 flex items-center justify-center ${showChat && streamId ? 'w-2/3' : 'w-full'}`}>
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isHost} // Mute own stream to prevent feedback
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-white/40 animate-spin mx-auto mb-4" />
              <p className="text-white/60">Waiting for stream...</p>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && streamId && (
          <div className="w-1/3 border-l border-white/10 bg-black/60 backdrop-blur-sm">
            <LiveStreamChat streamId={streamId} />
          </div>
        )}
      </div>

      {/* Control Bar */}
      {isHost && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={toggleMic}
            className={`${isMicEnabled ? 'text-white' : 'text-red-500'}`}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={toggleCamera}
            className={`${isCameraEnabled ? 'text-white' : 'text-red-500'}`}
          >
            {isCameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Connection Error Overlay */}
      {(connectionState === 'failed' || connectionState === 'disconnected') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-8">
            <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
            <p className="text-white/60 mb-6">The stream has been disconnected</p>
            <Button onClick={onClose} variant="outline" className="text-white border-white/20">
              Close Player
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
