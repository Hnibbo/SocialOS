import { Content, ContentType } from '@/types/social-os';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContentCardProps {
    content: Content;
    onLike?: (id: string) => void;
    onComment?: (id: string) => void;
    onShare?: (id: string) => void;
    onView?: (id: string) => void;
    isLiked?: boolean;
}

export function ContentCard({ content, onLike, onComment, onShare, onView, isLiked = false }: ContentCardProps) {
    const renderMedia = () => {
        if (!content.media_urls || content.media_urls.length === 0) return null;

        const mainMedia = content.media_urls[0];
        const isVideo = content.content_type === 'reel' || content.content_type === 'live' || mainMedia.endsWith('.mp4');

        if (isVideo) {
            return (
                <div className="relative aspect-[9/16] w-full bg-black overflow-hidden rounded-md mt-2">
                    {/* In a real app, use a proper video player (e.g. react-player) */}
                    <video
                        src={mainMedia}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                        loop={content.content_type === 'reel'}
                    />
                    {content.content_type === 'live' && (
                        <Badge className="absolute top-2 left-2 bg-red-600 animate-pulse border-none">LIVE</Badge>
                    )}
                </div>
            );
        }

        return (
            <div className="relative aspect-square w-full bg-gray-900 overflow-hidden rounded-md mt-2">
                <img src={mainMedia} alt="Content" className="w-full h-full object-cover" />
            </div>
        );
    };

    return (
        <Card className="w-full max-w-md overflow-hidden bg-gray-900/40 backdrop-blur border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                <Avatar className="w-10 h-10 border border-gray-700 cursor-pointer" onClick={() => onView?.(content.creator_id!)}>
                    <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${content.creator_id}`} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white cursor-pointer hover:underline" onClick={() => onView?.(content.creator_id!)}>
                            Creator {content.creator_id?.slice(0, 4)}...
                        </h4>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
                        {content.location_name && ` • ${content.location_name}`}
                    </p>
                </div>
            </CardHeader>

            <CardContent className="p-4 py-2">
                {content.caption && (
                    <p className="text-sm text-gray-200 mb-2 whitespace-pre-wrap">{content.caption}</p>
                )}

                {content.vibe_tags && content.vibe_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {content.vibe_tags.map(tag => (
                            <span key={tag} className="text-xs text-blue-400 hover:underline cursor-pointer">#{tag}</span>
                        ))}
                    </div>
                )}

                {renderMedia()}
            </CardContent>

            <CardFooter className="p-4 pt-2 flex justify-between items-center text-gray-400">
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`pl-0 h-8 gap-1 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
                        onClick={() => onLike?.(content.id)}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs">{content.likes_count}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 h-8 gap-1 hover:text-blue-500"
                        onClick={() => onComment?.(content.id)}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs">{content.comments_count}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 h-8 gap-1 hover:text-green-500"
                        onClick={() => onShare?.(content.id)}
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-xs">{content.shares_count}</span>
                    </Button>
                </div>

                <div className="flex gap-2">
                    <div className="flex items-center text-xs gap-1">
                        <Eye className="w-4 h-4" />
                        {content.views_count}
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-yellow-500">
                        <Bookmark className="w-5 h-5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
