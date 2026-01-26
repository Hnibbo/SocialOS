import { Activity } from '@/types/social-os';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign, Clock, Heart, MessageCircle, Share2, Smile } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityCardProps {
    activity: Activity;
    onRsvp?: (id: string) => void;
    onView?: (id: string) => void;
    isAttending?: boolean;
    onLike?: (id: string) => void;
    onComment?: (id: string) => void;
    onShare?: (id: string) => void;
    onReaction?: (id: string, reaction: string) => void;
    isLiked?: boolean;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
}

export function ActivityCard({ 
    activity, 
    onRsvp, 
    onView, 
    isAttending = false,
    onLike,
    onComment,
    onShare,
    onReaction,
    isLiked = false,
    likesCount = 0,
    commentsCount = 0,
    sharesCount = 0
}: ActivityCardProps) {
    return (
        <Card className="w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow border-gray-800 bg-gray-900/50 backdrop-blur">
            <div className="h-32 bg-gradient-to-r from-orange-500 to-red-600 relative">
                {activity.cover_url && (
                    <img src={activity.cover_url} alt={activity.title} className="w-full h-full object-cover opacity-80" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={activity.is_free ? "secondary" : "default"} className={activity.is_free ? "bg-green-500" : "bg-yellow-500 text-black"}>
                        {activity.is_free ? 'Free' : `$${activity.cost_amount}`}
                    </Badge>
                    <Badge variant="outline" className="bg-black/50 text-white border-none">
                        {activity.activity_type}
                    </Badge>
                </div>
            </div>

            <CardHeader className="pt-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-white leading-tight">{activity.title}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 text-gray-400 mt-1">
                    {activity.description || 'No description'}
                </CardDescription>
            </CardHeader>

            <CardContent className="py-2 space-y-2">
                <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                    {format(new Date(activity.start_time), 'PPp')}
                </div>

                <div className="flex items-center text-sm text-gray-300">
                    <Users className="w-4 h-4 mr-2 text-green-400" />
                    {activity.current_attendees} attending
                    {activity.max_attendees && ` / ${activity.max_attendees}`}
                </div>

                {activity.location_name && (
                    <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="w-4 h-4 mr-2 text-red-400" />
                        {activity.location_name}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-3 pb-3 flex flex-col gap-3">
                <div className="flex justify-between w-full">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
                        onClick={() => onLike?.(activity.id)}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs">{likesCount}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 hover:text-blue-500"
                        onClick={() => onComment?.(activity.id)}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs">{commentsCount}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 hover:text-green-500"
                        onClick={() => onShare?.(activity.id)}
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-xs">{sharesCount}</span>
                    </Button>
                </div>

                {/* Quick Reaction Buttons */}
                <div className="flex gap-2 justify-center w-full">
                    {['❤️', '👍', '🔥', '😂', '🎉'].map((reaction) => (
                        <Button
                            key={reaction}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-white/10"
                            onClick={() => onReaction?.(activity.id, reaction)}
                        >
                            <span className="text-sm">{reaction}</span>
                        </Button>
                    ))}
                </div>

                {isAttending ? (
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => onView?.(activity.id)}
                    >
                        View Details
                    </Button>
                ) : (
                    <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => onRsvp?.(activity.id)}
                    >
                        RSVP Now
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
