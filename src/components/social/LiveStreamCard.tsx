import { LiveStream } from '@/types/social-os';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Radio } from 'lucide-react';

interface LiveStreamCardProps {
    stream: LiveStream;
    onWatch?: (id: string) => void;
}

export function LiveStreamCard({ stream, onWatch }: LiveStreamCardProps) {
    return (
        <Card
            className="w-full max-w-sm overflow-hidden border-0 relative group cursor-pointer"
            onClick={() => onWatch?.(stream.id)}
        >
            <div className="aspect-video bg-black relative">
                <img
                    src={stream.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80'}
                    alt={stream.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />

                <div className="absolute top-2 left-2 flex gap-2">
                    <Badge className="bg-red-600 animate-pulse border-none px-2 py-0.5 text-xs font-bold uppercase">
                        LIVE
                    </Badge>
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur border-none text-white gap-1 px-2 py-0.5">
                        <Eye className="w-3 h-3" />
                        {stream.current_viewers}
                    </Badge>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <h3 className="text-white font-semibold truncate">{stream.title}</h3>
                    <p className="text-gray-300 text-xs flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" />
                        Creator {stream.host_id?.slice(0, 4) || 'Unknown'}...
                    </p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                    <Button size="icon" className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur border-2 border-white">
                        <Radio className="w-6 h-6 text-white" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
