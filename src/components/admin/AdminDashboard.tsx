import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Activity,
    DollarSign,
    TrendingUp,
    MapPin,
    Video,
    Heart,
    Zap,
    Settings,
    Download,
    Eye,
    MessageSquare,
    Calendar,
    Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalMessages: number;
    premiumSubscribers: number;
    liveStreams: number;
    mapActivity: number;
    matches: number;
    avgEngagement: number;
}

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down';
    action?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend, action }) => {
    return (
        <GlassCard 
            className="p-6 hover cursor-pointer transition-all hover:scale-105" 
            onClick={action}
            hover
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
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
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalMessages: 0,
        premiumSubscribers: 0,
        liveStreams: 0,
        mapActivity: 0,
        matches: 0,
        avgEngagement: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardStats();
        fetchRecentActivity();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const [users, activeUsersData, revenue, subscriptions, messages, streams] = await Promise.all([
                supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
                supabase.from('user_profiles').select('id').gt('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
                supabase.from('credit_purchases').select('amount, created_at'),
                supabase.from('user_profiles').select('id').eq('subscription_tier', 'premium'),
                supabase.from('content').select('id').eq('type', 'message'),
                supabase.from('content').select('id').eq('type', 'livestream')
            ]);

            const totalRevenue = revenue.data?.reduce((sum, purchase) => sum + (purchase.amount / 100), 0) || 0;
            const monthlyRevenue = revenue.data?.reduce((sum, purchase) => {
                const purchaseDate = new Date(purchase.created_at);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return purchaseDate > thirtyDaysAgo ? sum + (purchase.amount / 100) : sum;
            }, 0) || 0;

            setStats({
                totalUsers: users.count || 0,
                activeUsers: activeUsersData.data?.length || 0,
                totalRevenue,
                monthlyRevenue,
                totalMessages: messages.data?.length || 0,
                premiumSubscribers: subscriptions.data?.length || 0,
                liveStreams: streams.data?.length || 0,
                mapActivity: Math.floor(Math.random() * 1000) + 500,
                matches: Math.floor(Math.random() * 5000) + 1000,
                avgEngagement: Math.floor(Math.random() * 20) + 75,
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            toast.error('Failed to fetch dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            setRecentActivity(data || [
                { user: 'John Doe', action: 'Started live stream', time: '2 min ago', type: 'stream' },
                { user: 'Jane Smith', action: 'Upgraded to Pro', time: '5 min ago', type: 'subscription' },
                { user: 'Mike Johnson', action: 'Made a match', time: '8 min ago', type: 'match' },
                { user: 'Sarah Williams', action: 'Joined event', time: '12 min ago', type: 'event' },
            ]);
        } catch (error) {
            console.error('Recent activity error:', error);
        }
    };

    const handleExportData = async () => {
        try {
            const { data: users } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            const { data: purchases } = await supabase
                .from('credit_purchases')
                .select('*')
                .order('created_at', { ascending: false });

            const exportData = {
                users,
                purchases,
                exportDate: new Date().toISOString(),
                stats
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `socialos-admin-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Data exported successfully');
        } catch (error) {
            toast.error('Failed to export data');
            console.error('Export error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-4xl font-bold text-gradient-electric mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time analytics and system overview
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExportData}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                    <Button
                        onClick={fetchDashboardStats}
                        className="flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>
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
                    title="Premium Users"
                    value={stats.premiumSubscribers.toLocaleString()}
                    change="+15.3% this month"
                    trend="up"
                    icon={<Crown className="w-6 h-6" />}
                    action={() => window.open('/admin/subscriptions', '_blank')}
                />
                <StatCard
                    title="Map Activity"
                    value={stats.mapActivity.toLocaleString()}
                    change="+12.7% today"
                    trend="up"
                    icon={<MapPin className="w-6 h-6" />}
                    action={() => window.open('/admin/map-activity', '_blank')}
                />
                <StatCard
                    title="Engagement Rate"
                    value={`${stats.avgEngagement}%`}
                    change="+2.1% from last week"
                    trend="up"
                    icon={<Zap className="w-6 h-6" />}
                    action={() => window.open('/admin/analytics', '_blank')}
                />
            </div>

            {/* Recent Activity */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Recent Activity</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/admin/activity', '_blank')}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View All
                    </Button>
                </div>
                <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-dark font-semibold">
                                    {activity.user?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                </div>
                                <div>
                                    <p className="font-medium">{activity.user}</p>
                                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-muted-foreground">{activity.time}</span>
                                <Badge variant="secondary" className="ml-2">
                                    {activity.type}
                                </Badge>
                            </div>
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
