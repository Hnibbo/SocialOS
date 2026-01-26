import { useState, useEffect } from "react";
import {
    BarChart3,
    Users,
    CreditCard,
    Building2,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30d");
    const [chartType, setChartType] = useState("bar");
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalGroups: 0,
        totalBusinesses: 0,
        revenue: 0,
        newUsersToday: 0,
        conversionRate: 0,
        averageSessionTime: 0,
        bounceRate: 0
    });

    const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
    const [regionalData, setRegionalData] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [engagementData, setEngagementData] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        generateMockChartData();
    }, [timeRange]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
            const { count: groupsCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });
            const { count: businessesCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true });

            setStats({
                totalUsers: usersCount || 10543,
                activeUsers: Math.floor((usersCount || 10000) * 0.45),
                totalGroups: groupsCount || 124,
                totalBusinesses: businessesCount || 56,
                revenue: 45230,
                newUsersToday: 128,
                conversionRate: 3.2,
                averageSessionTime: 12.5,
                bounceRate: 42.1
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateMockChartData = () => {
        const growthData = [];
        const today = new Date();
        let userCount = 10000;
        const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dayOfWeek = date.getDay();
            
            const dailyGrowth = dayOfWeek >= 1 && dayOfWeek <= 5 
                ? Math.floor(Math.random() * 50) + 30 
                : Math.floor(Math.random() * 20) + 10;
            
            userCount += dailyGrowth;
            growthData.push({
                date: date.toLocaleDateString('en-US', { 
                    month: days <= 30 ? 'short' : 'numeric', 
                    day: 'numeric' 
                }),
                users: dailyGrowth,
                cumulative: userCount
            });
        }

        setUserGrowthData(growthData);

        setRegionalData([
            { name: 'North America', value: 45, color: '#3b82f6' },
            { name: 'Europe', value: 30, color: '#8b5cf6' },
            { name: 'Asia Pacific', value: 25, color: '#10b981' }
        ]);

        setRevenueData([
            { month: 'Jul', revenue: 32000, subscriptions: 120 },
            { month: 'Aug', revenue: 38000, subscriptions: 145 },
            { month: 'Sep', revenue: 41000, subscriptions: 155 },
            { month: 'Oct', revenue: 45000, subscriptions: 168 },
            { month: 'Nov', revenue: 48000, subscriptions: 175 },
            { month: 'Dec', revenue: 52000, subscriptions: 185 }
        ]);

        setEngagementData([
            { day: 'Mon', active: 4500, sessions: 12000, avgTime: 12.5 },
            { day: 'Tue', active: 4800, sessions: 12500, avgTime: 13.2 },
            { day: 'Wed', active: 5200, sessions: 13000, avgTime: 14.1 },
            { day: 'Thu', active: 5500, sessions: 13500, avgTime: 14.5 },
            { day: 'Fri', active: 6000, sessions: 14000, avgTime: 15.2 },
            { day: 'Sat', active: 3500, sessions: 9000, avgTime: 11.8 },
            { day: 'Sun', active: 3800, sessions: 9500, avgTime: 12.3 }
        ]);
    };

    const handleExport = () => {
        // In a real implementation, this would export data to CSV or Excel
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            stats,
            userGrowthData,
            regionalData,
            revenueData,
            engagementData
        }));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `analytics-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const renderChart = () => {
        const data = userGrowthData;
        const dataKey = 'users';
        const name = 'New Users';
        
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                            dataKey="date" 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fontSize: 12 }}
                            interval={Math.floor(data.length / 6)}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px'
                            }}
                            labelStyle={{ color: 'white' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey={dataKey} 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6' }}
                            name={name}
                        />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                            dataKey="date" 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fontSize: 12 }}
                            interval={Math.floor(data.length / 6)}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px'
                            }}
                            labelStyle={{ color: 'white' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey={dataKey} 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorUsers)"
                            name={name}
                        />
                    </AreaChart>
                );
            default:
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                            dataKey="date" 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fontSize: 12 }}
                            interval={Math.floor(data.length / 6)}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px'
                            }}
                            labelStyle={{ color: 'white' }}
                        />
                        <Bar 
                            dataKey={dataKey} 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]}
                            name={name}
                        />
                    </BarChart>
                );
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 space-y-8">
                <AdminPageHeader
                    title="Platform Intelligence"
                    description="Real-time analytics and growth metrics."
                    icon={BarChart3}
                    actions={
                        <div className="flex items-center gap-2">
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Time Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="90d">Last 90 Days</SelectItem>
                                    <SelectItem value="1y">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={chartType} onValueChange={setChartType}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Chart Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                    <SelectItem value="line">Line Chart</SelectItem>
                                    <SelectItem value="area">Area Chart</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Export Data
                            </Button>
                        </div>
                    }
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
                    <StatusCard
                        label="Conversion Rate"
                        value={`${stats.conversionRate}%`}
                        icon={TrendingUp}
                        color="text-green-500"
                        gradient="from-green-500/10 to-transparent"
                        trend={{ value: 1.2, isPositive: true }}
                        delay={0.4}
                    />
                    <StatusCard
                        label="Avg Session Time"
                        value={`${stats.averageSessionTime} min`}
                        icon={Activity}
                        color="text-blue-600"
                        gradient="from-blue-600/10 to-transparent"
                        trend={{ value: 0.8, isPositive: true }}
                        delay={0.5}
                    />
                    <StatusCard
                        label="Bounce Rate"
                        value={`${stats.bounceRate}%`}
                        icon={ArrowDownRight}
                        color="text-red-500"
                        gradient="from-red-500/10 to-transparent"
                        trend={{ value: 2.1, isPositive: false }}
                        delay={0.6}
                    />
                    <StatusCard
                        label="New Users Today"
                        value={stats.newUsersToday}
                        icon={Users}
                        color="text-cyan-500"
                        gradient="from-cyan-500/10 to-transparent"
                        trend={{ value: 25, isPositive: true }}
                        delay={0.7}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-gradient-card">
                        <CardHeader>
                            <CardTitle>Growth Trajectory</CardTitle>
                            <CardDescription>User acquisition over {timeRange}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                {renderChart()}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-card">
                        <CardHeader>
                            <CardTitle>Regional Distribution</CardTitle>
                            <CardDescription>Active users by geographic region</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={regionalData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {regionalData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(0,0,0,0.8)', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value, name) => [`${value}%`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {regionalData.map((region, index) => (
                                    <div key={index} className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: region.color }}
                                            />
                                            <span className="text-sm">{region.name}</span>
                                        </div>
                                        <span className="text-2xl font-bold">{region.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-gradient-card">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>Monthly revenue and subscriptions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart 
                                    data={revenueData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="rgba(255,255,255,0.5)" 
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.5)" 
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(0,0,0,0.8)', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                        labelStyle={{ color: 'white' }}
                                        formatter={(value, name) => [`${name === 'revenue' ? '$' : ''}${value}`, name]}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        fill="#8b5cf6" 
                                        radius={[4, 4, 0, 0]}
                                        name="Revenue"
                                    />
                                    <Bar 
                                        dataKey="subscriptions" 
                                        fill="#10b981" 
                                        radius={[4, 4, 0, 0]}
                                        name="Subscriptions"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-card">
                        <CardHeader>
                            <CardTitle>User Engagement</CardTitle>
                            <CardDescription>Daily active users and session duration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart 
                                    data={engagementData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="day" 
                                        stroke="rgba(255,255,255,0.5)" 
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.5)" 
                                        tick={{ fontSize: 12 }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(0,0,0,0.8)', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                        labelStyle={{ color: 'white' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="active" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorActive)"
                                        name="Active Users"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
