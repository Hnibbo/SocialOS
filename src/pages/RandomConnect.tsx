import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    X,
    Video,
    VideoOff,
    Mic,
    MicOff,
    ArrowRight,
    Flag,
    UserCheck,
    Lock
} from 'lucide-react';
import { useRandomConnect } from '@/hooks/useRandomConnect';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RandomConnect() {
    const {
        status,
        localStream,
        remoteStream,
        startSearch,
        next,
        stop
    } = useRandomConnect();

    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isAnonymous, setIsAnonymous] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleReport = () => {
        toast.error("User reported. Disconnecting...");
        next();
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col">
            {/* Header / Status */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Zap className="w-6 h-6 text-primary fill-primary" />
                    </div>
                    <div>
                        <h2 className="font-black tracking-tighter text-xl">RANDOM SOLO</h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                {status === 'searching' ? 'Transmitting Signal...' :
                                    status === 'matched' ? 'Decrypting Peer...' :
                                        status === 'connected' ? 'LIVE CONNECTION' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/10"
                    onClick={stop}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Video Canvas */}
            <div className="flex-1 relative flex flex-col md:flex-row gap-2 p-2 pt-24 pb-32">
                {/* Remote Video (Full screen or half) */}
                <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                    {status === 'connected' ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6"
                            >
                                <Zap className="w-12 h-12 text-primary" />
                            </motion.div>
                            <h3 className="text-2xl font-black mb-2 italic">SCANNING SECTOR...</h3>
                            <p className="text-muted-foreground text-sm max-w-xs">Waiting for a proximity or global solo match match.</p>
                        </div>
                    )}

                    {/* Peer Metadata Overlay */}
                    {status === 'connected' && (
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isAnonymous ? 'ANONYMOUS ENTITY' : 'IDENTITY REVEALED'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (Floating on mobile, Side on desktop) */}
                <div className="absolute bottom-36 right-6 w-40 h-56 md:relative md:bottom-0 md:right-0 md:w-72 md:h-full rounded-[2rem] overflow-hidden bg-slate-800 border-2 border-primary/50 shadow-2xl z-10">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover grayscale brightness-75 scale-x-[-1]"
                    />
                    {!isVideoOn && (
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-white/20" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-4 z-20 bg-gradient-to-t from-black to-transparent">
                <div className="flex gap-3 bg-white/5 backdrop-blur-2xl p-3 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-14 h-14 rounded-full transition-all ${!isMicOn ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}
                        onClick={() => setIsMicOn(!isMicOn)}
                    >
                        {isMicOn ? <Mic /> : <MicOff />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-14 h-14 rounded-full transition-all ${!isVideoOn ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}
                        onClick={() => setIsVideoOn(!isVideoOn)}
                    >
                        {isVideoOn ? <Video /> : <VideoOff />}
                    </Button>
                </div>

                <div className="flex-1 max-w-[200px]">
                    {status === 'idle' ? (
                        <Button
                            className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-lg gap-2 shadow-[0_0_30px_rgba(124,58,237,0.5)]"
                            onClick={startSearch}
                        >
                            CONNECT <ArrowRight className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button
                            className="w-full h-16 rounded-[2rem] bg-white text-black font-black text-lg gap-2"
                            onClick={next}
                        >
                            NEXT <ArrowRight className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                <div className="flex gap-3 bg-white/5 backdrop-blur-2xl p-3 rounded-[2.5rem] border border-white/10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-14 h-14 rounded-full transition-all ${!isAnonymous ? 'bg-primary text-white' : 'hover:bg-white/10'}`}
                        onClick={() => {
                            setIsAnonymous(!isAnonymous);
                            if (isAnonymous) toast.success("Identity reveal requested");
                        }}
                    >
                        {isAnonymous ? <Lock /> : <UserCheck />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-14 h-14 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all"
                        onClick={handleReport}
                    >
                        <Flag />
                    </Button>
                </div>
            </div>

            {/* Decrypting Overlay */}
            <AnimatePresence>
                {status === 'matched' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-md flex items-center justify-center p-12 text-center"
                    >
                        <div className="max-w-md">
                            <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-2xl" />
                            <h1 className="text-4xl font-black italic tracking-tighter mb-4">DECRYPTING MATCH...</h1>
                            <p className="text-white/70 font-mono text-xs uppercase tracking-widest">Establishing encrypted peer-to-peer tunnel</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
