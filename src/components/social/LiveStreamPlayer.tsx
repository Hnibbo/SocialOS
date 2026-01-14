import { useEffect, useRef } from 'react';
import { X, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveStreamPlayerProps {
    stream: MediaStream | null;
    connectionState: RTCPeerConnectionState;
    isHost?: boolean;
    onClose: () => void;
}

export function LiveStreamPlayer({ stream, connectionState, isHost = false, onClose }: LiveStreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

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

            {/* Video */}
            <div className="flex-1 flex items-center justify-center">
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
