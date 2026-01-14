import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Heart, Star, MapPin, Info } from 'lucide-react';
import type { DatingProfile } from '@/hooks/useDating';

interface DatingCardProps {
    profile: DatingProfile;
    onSwipe: (direction: 'left' | 'right' | 'super') => void;
    active?: boolean;
}

export function DatingCard({ profile, onSwipe, active = false }: DatingCardProps) {
    const [exitX, setExitX] = useState<number | null>(null);
    const controls = useAnimation();

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

    // Color overlays
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

    const handleDragEnd = async (_: any, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 100 || velocity > 500) {
            setExitX(200);
            onSwipe('right');
        } else if (offset < -100 || velocity < -500) {
            setExitX(-200);
            onSwipe('left');
        } else {
            controls.start({ x: 0 });
        }
    };

    if (!active) return null;

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
            className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing"
        >
            <Card className="w-full h-full overflow-hidden border-0 relative shadow-xl bg-black rounded-3xl">
                <img
                    src={profile.photos[0]}
                    alt={profile.first_name}
                    className="w-full h-full object-cover pointer-events-none"
                />

                {/* Gradients */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                {/* Action Overlays */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-15deg] pointer-events-none">
                    <span className="text-green-500 text-4xl font-bold uppercase tracking-widest">LIKE</span>
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-red-500 rounded-lg px-4 py-2 rotate-[15deg] pointer-events-none">
                    <span className="text-red-500 text-4xl font-bold uppercase tracking-widest">NOPE</span>
                </motion.div>

                {/* Profile Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                {profile.first_name}, {profile.age}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{profile.distance_km || 5} km</span>
                                </div>
                                {profile.match_score && (
                                    <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10">
                                        {profile.match_score}% Match
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="mb-1 pointer-events-auto hover:bg-white/10 rounded-full">
                            <Info className="w-6 h-6" />
                        </Button>
                    </div>

                    <p className="text-gray-200 line-clamp-2 mb-4 text-sm font-medium">
                        {profile.bio || "No bio yet..."}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-20 pointer-events-none">
                        {profile.interests.slice(0, 3).map(i => (
                            <Badge key={i} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                {i}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Controls - These stay at bottom usually, but since the card is draggable, maybe keep them outside? 
            For this simplified component, we can render visually but rely on parent for actual button placement if stationary.
            However, usually buttons are fixed at bottom of screen, not on card. 
        */}
            </Card>
        </motion.div>
    );
}
