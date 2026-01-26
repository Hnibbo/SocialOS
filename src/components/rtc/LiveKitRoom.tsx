
import { useEffect, useRef, useState } from 'react';
import { useLiveKit } from '@/hooks/useLiveKit';
import { Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface LiveKitRoomProps {
    url: string;
    token: string;
    onLeave?: () => void;
}

export default function LiveKitRoom({ url, token, onLeave }: LiveKitRoomProps) {
    const { 
        room, 
        isConnecting, 
        error, 
        participants, 
        localStream,
        startLocalStream,
        stopLocalStream,
        publishStream,
        unpublishStream
    } = useLiveKit(url, token);

    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Toggle microphone
    const toggleMic = async () => {
        if (!room) return;
        
        try {
            const tracks = room.localParticipant.getTracks();
            const audioTrack = tracks.find(t => t.kind === Track.Kind.Audio);
            
            if (audioTrack) {
                const isEnabled = !audioTrack.publication.isMuted;
                await audioTrack.publication.setMuted(isEnabled);
                setIsMicEnabled(!isEnabled);
            }
        } catch (error) {
            console.error('Failed to toggle mic:', error);
        }
    };

    // Toggle camera
    const toggleCamera = async () => {
        if (!room) return;
        
        try {
            const tracks = room.localParticipant.getTracks();
            const videoTrack = tracks.find(t => t.kind === Track.Kind.Video);
            
            if (videoTrack) {
                const isEnabled = !videoTrack.publication.isMuted;
                await videoTrack.publication.setMuted(isEnabled);
                setIsCameraEnabled(!isEnabled);
            }
        } catch (error) {
            console.error('Failed to toggle camera:', error);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-red-500">
                <div className="text-lg font-semibold mb-2">Connection Error</div>
                <div className="text-sm">{error.message}</div>
                <Button onClick={onLeave} variant="outline" className="mt-4">
                    Return
                </Button>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-primary animate-pulse">
                <div className="text-lg font-semibold mb-2">Connecting...</div>
                <div className="text-sm">Establishing secure connection</div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full text-white/50">
                <div className="text-lg font-semibold mb-2">Room Not Connected</div>
                <div className="text-sm">Initializing RTC engine...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 h-full">
                {/* Local participant */}
                <div className="relative bg-white/5 rounded-lg overflow-hidden border border-white/5">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white">
                        You
                    </div>
                </div>

                {/* Remote participants */}
                {participants.map((participant) => (
                    <div key={participant.identity} className="relative bg-white/5 rounded-lg overflow-hidden border border-white/5">
                        {Array.from(participant.videoTracks.values()).map(([trackSid, publication]) => {
                            const track = publication.track;
                            if (track) {
                                return (
                                    <video
                                        key={trackSid}
                                        ref={(el) => {
                                            if (el && track) {
                                                track.attach(el);
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                );
                            }
                            return null;
                        })}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white">
                            {participant.identity}
                        </div>
                    </div>
                ))}
            </div>

            {/* Control bar */}
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
                    onClick={onLeave}
                >
                    <PhoneOff className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
