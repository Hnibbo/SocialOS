import { motion } from 'framer-motion';
import {
    MapPin,
    Heart,
    Users,
    MessageSquare,
    Zap,
    ArrowUpRight,
    Compass,
    Star,
    Trophy,
    Sparkles,
} from 'lucide-react';
import HupScoreCard from '@/components/gamification/HupScoreCard';
import { StatusCard } from '@/components/admin/shared/StatusCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
    CityEnergyDisplay,
    SocialSignalsSelector,
    MemoryCapsuleViewer,
    LonelinessInterrupter,
    MomentDropsFeed,
    SocialRolesDisplay,
    CityChallengesFeed,
} from '@/components/features';
import { useLocation } from '@/hooks/useLocation';

export default function Dashboard() {
    const { user } = useAuth();
    const { matches, nearbyPeople, groupInvites, activeChats, loading: statsLoading } = useDashboardStats();
    const { latitude, longitude } = useLocation();
    const currentCity = 'New York';

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

    return (
        <>
            <SEO title="HQ" noindex={true} />

            <LonelinessInterrupter threshold={70} />

            <div className="p-6 lg:p-8 space-y-8">
                {/* Header with v2.0 Social Signal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="text-white/60">{currentCity}</span>
                        </div>
                        <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                            What's happening, <span className="text-gradient">{userName}</span>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Command Central: Your social operational headquarters.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <SocialSignalsSelector compact />
                        <Link to="/map">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl">
                                <Compass className="w-4 h-4 mr-2" />
                                Live Map
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* v2.0 Energy Display */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <CityEnergyDisplay city={currentCity} />
                    </div>
                    <div>
                        <MomentDropsFeed limit={3} />
                    </div>
                </div>

                {/* Social Pulse */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[
                        { label: 'New Matches', value: statsLoading ? '...' : matches, icon: Heart, color: 'text-pink-500', gradient: 'from-pink-500/10 to-transparent', delay: 0 },
                        { label: 'People Nearby', value: statsLoading ? '...' : nearbyPeople, icon: MapPin, color: 'text-cyan-500', gradient: 'from-cyan-500/10 to-transparent', delay: 0.05 },
                        { label: 'Group Invites', value: statsLoading ? '...' : groupInvites, icon: Users, color: 'text-emerald-500', gradient: 'from-emerald-500/10 to-transparent', delay: 0.1 },
                        { label: 'Active Chats', value: statsLoading ? '...' : activeChats, icon: MessageSquare, color: 'text-orange-500', gradient: 'from-orange-500/10 to-transparent', delay: 0.15 },
                    ].map((stat, i) => (
                        <StatusCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            gradient={stat.gradient}
                            delay={stat.delay}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Quick Connect */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <Card className="bg-gradient-card border-border/50">
                            <CardHeader>
                                <CardTitle className="font-display text-lg">Jump Right In</CardTitle>
                                <CardDescription>Start engaging with your community</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link to="/dating" className="group">
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-pink-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                                                <Heart className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-semibold">Connections</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Discover verified nodes with high compatibility scores.</p>
                                        <div className="flex items-center text-xs font-medium text-pink-500">
                                            View Matches
                                            <ArrowUpRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/social" className="group">
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-primary/30 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-semibold">The Grid</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Broadcast to the global stream or engage in random encounters.</p>
                                        <div className="flex items-center text-xs font-medium text-primary">
                                            Enter Grid
                                            <ArrowUpRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/map" className="group">
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-cyan-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-semibold">Live Map</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Real-time geospatial visualization of active streams and entities.</p>
                                        <div className="flex items-center text-xs font-medium text-cyan-500">
                                            Launch Map
                                            <ArrowUpRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/challenges" className="group">
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-amber-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                <Trophy className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-semibold">Challenges</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">Compete with other cities and earn rewards.</p>
                                        <div className="flex items-center text-xs font-medium text-amber-500">
                                            Join Challenges
                                            <ArrowUpRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Premium Status / Hup Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-6"
                    >
                        <HupScoreCard />
                        <SocialRolesDisplay userId={user?.id} />
                    </motion.div>
                </div>

                {/* Memory Capsules Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    <MemoryCapsuleViewer userId={user?.id} limit={6} />
                </motion.div>

                {/* Active Challenges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <CityChallengesFeed city={currentCity} limit={4} />
                </motion.div>
            </div>
        </>
    );
}
