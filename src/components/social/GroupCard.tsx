import { Group } from '@/types/social-os';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Lock, Globe } from 'lucide-react';

interface GroupCardProps {
    group: Group;
    onJoin?: (groupId: string) => void;
    onView?: (groupId: string) => void;
    isMember?: boolean;
}

export function GroupCard({ group, onJoin, onView, isMember = false }: GroupCardProps) {
    return (
        <Card className="w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow border-gray-800 bg-gray-900/50 backdrop-blur">
            <div className="h-24 bg-gradient-to-r from-purple-900 to-indigo-900 relative">
                {group.cover_url && (
                    <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute -bottom-6 left-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-800 border-2 border-gray-900 flex items-center justify-center overflow-hidden">
                        {group.avatar_url ? (
                            <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-bold text-white">{group.name[0]}</span>
                        )}
                    </div>
                </div>
            </div>

            <CardHeader className="pt-8 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-white">{group.name}</CardTitle>
                    <Badge variant={group.is_public ? "secondary" : "outline"} className="ml-2">
                        {group.is_public ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                        {group.is_public ? 'Public' : 'Private'}
                    </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-gray-400">
                    {group.description || 'No description'}
                </CardDescription>
            </CardHeader>

            <CardContent className="py-2">
                <div className="flex items-center text-sm text-gray-500 gap-4">
                    <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {group.member_count} members
                    </div>
                    {group.location_name && (
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {group.location_name}
                        </div>
                    )}
                </div>

                {group.vibe_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {group.vibe_tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs border-gray-700 text-gray-400">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2">
                {isMember ? (
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => onView?.(group.id)}
                    >
                        View Group
                    </Button>
                ) : (
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => onJoin?.(group.id)}
                    >
                        Join Group
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
