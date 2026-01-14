import { useState } from 'react';
import { useStreaming, useStreamViewer } from '@/hooks/useStreaming';
import { LiveStreamCard } from '@/components/social/LiveStreamCard';
import { LiveStreamPlayer } from '@/components/social/LiveStreamPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video, Radio } from 'lucide-react';
import SEO from '@/components/SEO';

export default function LiveStreamPage() {
    const { streams, loading, startBroadcast, webrtc } = useStreaming();
    const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const [newStreamTitle, setNewStreamTitle] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const viewer = useStreamViewer(selectedStreamId || '');

    const handleWatch = async (streamId: string) => {
        setSelectedStreamId(streamId);
        await viewer.joinStream();
    };

    const handleGoLive = async () => {
        if (!newStreamTitle.trim()) return;
        const result = await startBroadcast(newStreamTitle);
        if (result) {
            setIsBroadcasting(true);
            setIsDialogOpen(false);
        }
    };

    const handleStopBroadcast = () => {
        webrtc.stopLocalStream();
        setIsBroadcasting(false);
    };

    const handleCloseViewer = () => {
        viewer.leaveStream();
        setSelectedStreamId(null);
    };

    return (
        <>
            <SEO title="Live Streams" description="Watch live broadcasts from the Social OS community." />

            <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-32">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Live Now</h1>
                        <p className="text-muted-foreground">Real-time peer-to-peer streaming.</p>
                    </div>

                    {!isBroadcasting ? (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20">
                                    <Radio className="w-4 h-4" /> Go Live
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-panel border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Start Broadcast</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stream Title</label>
                                        <Input
                                            placeholder="What's happening?"
                                            value={newStreamTitle}
                                            onChange={(e) => setNewStreamTitle(e.target.value)}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <Button onClick={handleGoLive} className="w-full bg-red-600 hover:bg-red-700">
                                        Start Streaming
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Button onClick={handleStopBroadcast} variant="destructive" className="gap-2">
                            <Radio className="w-4 h-4 animate-pulse" /> End Broadcast
                        </Button>
                    )}
                </div>

                {/* Stream Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : streams.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <Video className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                        <h3 className="text-lg font-medium text-white">No active streams</h3>
                        <p className="text-gray-400">Be the first to go live!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {streams.map((stream) => (
                            <LiveStreamCard
                                key={stream.id}
                                stream={stream}
                                onWatch={handleWatch}
                            />
                        ))}
                    </div>
                )}

                {/* Broadcaster View */}
                {isBroadcasting && webrtc.localStream && (
                    <LiveStreamPlayer
                        stream={webrtc.localStream}
                        connectionState="connected"
                        isHost={true}
                        onClose={handleStopBroadcast}
                    />
                )}

                {/* Viewer Player */}
                {selectedStreamId && (
                    <LiveStreamPlayer
                        stream={viewer.remoteStream}
                        connectionState={viewer.connectionState}
                        isHost={false}
                        onClose={handleCloseViewer}
                    />
                )}
            </div>
        </>
    );
}
