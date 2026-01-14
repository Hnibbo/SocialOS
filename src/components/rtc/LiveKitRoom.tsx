
import { useEffect, useRef } from 'react';
import { useLiveKit } from '@/hooks/useLiveKit';

interface LiveKitRoomProps {
    url: string;
    token: string;
}

export default function LiveKitRoom({ url, token }: LiveKitRoomProps) {
    const { room, isConnecting, error } = useLiveKit(url, token);
    const containerRef = useRef<HTMLDivElement>(null);

    if (error) return <div className="text-red-500">Error: {error.message}</div>;
    if (isConnecting) return <div className="text-primary animate-pulse">Connecting to Secure Channel...</div>;

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10" ref={containerRef}>
            {!room ? (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    Initializing RTC Engine...
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 p-4 h-full">
                    {/* Placeholder for video tracks - would map participants here */}
                    <div className="bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
                        <span className="text-xs text-white/40">Local Participant</span>
                    </div>
                    <div className="bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
                        <span className="text-xs text-white/40">Remote Participant</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex gap-4">
                <button className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-500 transition-colors">
                    End Call
                </button>
            </div>
        </div>
    );
}
