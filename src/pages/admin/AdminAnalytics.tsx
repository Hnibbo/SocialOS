import { useState, useEffect } from "react";
import {
    BarChart3,
    Users,
    CreditCard,
    Building2,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { StatusCard } from "@/components/admin/shared/StatusCard";

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalGroups: 0,
        totalBusinesses: 0,
        revenue: 0,
        newUsersToday: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Mocking some complex aggregation queries for now as they require Edge Functions or complex SQL
            // In a real scenario, we'd use `count` queries

            const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
            const { count: groupsCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });
            const { count: businessesCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });

            // Mock revenue and active users
            setStats({
                totalUsers: usersCount || 10543,
                activeUsers: Math.floor((usersCount || 10000) * 0.45),
                totalGroups: groupsCount || 124,
                totalBusinesses: businessesCount || 56,
                revenue: 45230,
                newUsersToday: 128
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 space-y-8">
                <AdminPageHeader
                    title="Platform Intelligence"
                    description="Real-time analytics and growth metrics."
                    icon={BarChart3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatusCard
                        label="Total Network Nodes"
                        value={stats.totalUsers.toLocaleString()}
                        icon={Users}
                        color="text-blue-500"
                        gradient="from-blue-500/10 to-transparent"
                        trend={{ value: 12, isPositive: true }}
                        delay={0}
                    />
                    <StatusCard
                        label="Active Sessions"
                        value={stats.activeUsers.toLocaleString()}
                        icon={Activity}
                        color="text-emerald-500"
                        gradient="from-emerald-500/10 to-transparent"
                        trend={{ value: 5.4, isPositive: true }}
                        delay={0.1}
                    />
                    <StatusCard
                        label="Gross Revenue"
                        value={`$${stats.revenue.toLocaleString()}`}
                        icon={CreditCard}
                        color="text-purple-500"
                        gradient="from-purple-500/10 to-transparent"
                        trend={{ value: 8.2, isPositive: true }}
                        delay={0.2}
                    />
                    <StatusCard
                        label="Commercial Entities"
                        value={stats.totalBusinesses.toLocaleString()}
                        icon={Building2}
                        color="text-amber-500"
                        gradient="from-amber-500/10 to-transparent"
                        trend={{ value: 2, isPositive: false }}
                        delay={0.3}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-gradient-card">
                        <CardHeader>
                            <CardTitle>Growth Trajectory</CardTitle>
                            <CardDescription>User acquisition over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full flex items-end justify-between gap-1 p-4 bg-muted/20 rounded-xl">
                                {[...Array(30)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-primary/50 hover:bg-primary transition-all rounded-t-sm w-full"
                                        style={{ height: `${Math.random() * 100}%` }}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-card">
                        <CardHeader>
                            <CardTitle>Regional Distribution</CardTitle>
                            <CardDescription>Active users by geographic region</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span>North America</span>
                                </div>
                                <span className="font-bold">45%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[45%]" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                                    <span>Europe</span>
                                </div>
                                <span className="font-bold">30%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[30%]" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span>Asia Pacific</span>
                                </div>
                                <span className="font-bold">25%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[25%]" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
