import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
    Users,
    Activity,
    DollarSign,
    TrendingUp,
    MapPin,
    Video,
    Heart,
    Zap
} from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend }) => {
    return (
        <GlassCard className="p-6" hover>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gradient-electric mb-2">{value}</h3>
                    {change && (
                        <p className={`text-sm flex items-center gap-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
                            {change}
                        </p>
                    )}
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    {icon}
                </div>
            </div>
        </GlassCard>
    );
};

export const AdminDashboard: React.FC = () => {
    // Mock data - replace with real data from Supabase
    const stats = {
        totalUsers: 12847,
        activeUsers: 3421,
        revenue: 45678,
        liveStreams: 23,
        mapActivity: 1234,
        matches: 5678,
        avgEngagement: 87,
    };

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div className="animate-slide-up">
                <h1 className="text-4xl font-bold text-gradient-electric mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Real-time analytics and system overview
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    change="+12.5% from last month"
                    trend="up"
                    icon={<Users className="w-6 h-6" />}
                />
                <StatCard
                    title="Active Now"
                    value={stats.activeUsers.toLocaleString()}
                    change="+8.2% from yesterday"
                    trend="up"
                    icon={<Activity className="w-6 h-6" />}
                />
                <StatCard
                    title="Revenue (MRR)"
                    value={`$${stats.revenue.toLocaleString()}`}
                    change="+23.1% from last month"
                    trend="up"
                    icon={<DollarSign className="w-6 h-6" />}
                />
                <StatCard
                    title="Live Streams"
                    value={stats.liveStreams}
                    icon={<Video className="w-6 h-6" />}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Map Activity"
                    value={stats.mapActivity.toLocaleString()}
                    change="+15.3% today"
                    trend="up"
                    icon={<MapPin className="w-6 h-6" />}
                />
                <StatCard
                    title="Matches Made"
                    value={stats.matches.toLocaleString()}
                    change="+9.7% this week"
                    trend="up"
                    icon={<Heart className="w-6 h-6" />}
                />
                <StatCard
                    title="Engagement Rate"
                    value={`${stats.avgEngagement}%`}
                    change="+2.1% from last week"
                    trend="up"
                    icon={<Zap className="w-6 h-6" />}
                />
            </div>

            {/* Recent Activity */}
            <GlassCard className="p-6">
                <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
                <div className="space-y-4">
                    {[
                        { user: 'John Doe', action: 'Started live stream', time: '2 min ago', type: 'stream' },
                        { user: 'Jane Smith', action: 'Upgraded to Pro', time: '5 min ago', type: 'subscription' },
                        { user: 'Mike Johnson', action: 'Made a match', time: '8 min ago', type: 'match' },
                        { user: 'Sarah Williams', action: 'Joined event', time: '12 min ago', type: 'event' },
                    ].map((activity, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-dark font-semibold">
                                    {activity.user.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="font-medium">{activity.user}</p>
                                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 hover:border-primary/50 transition-colors cursor-pointer" hover>
                    <h3 className="font-semibold mb-2">User Management</h3>
                    <p className="text-sm text-muted-foreground">View and manage all users</p>
                </GlassCard>
                <GlassCard className="p-6 hover:border-primary/50 transition-colors cursor-pointer" hover>
                    <h3 className="font-semibold mb-2">Content Moderation</h3>
                    <p className="text-sm text-muted-foreground">Review flagged content</p>
                </GlassCard>
                <GlassCard className="p-6 hover:border-primary/50 transition-colors cursor-pointer" hover>
                    <h3 className="font-semibold mb-2">System Health</h3>
                    <p className="text-sm text-muted-foreground">Monitor system status</p>
                </GlassCard>
            </div>
        </div>
    );
};
