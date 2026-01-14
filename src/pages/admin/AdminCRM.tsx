import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  DollarSign,
  CreditCard,
  UserPlus,
  Clock,
  RefreshCw,
  Loader2,
  BarChart3,
  Target,
  Zap,
  Globe,
  LayoutDashboard
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfDay, subMonths } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeWorkspaces: number;
  totalWorkspaces: number;
  activeSubscriptions: number;
  totalRevenueMRR: number;
  averageSessionDuration: number;
  conversionRate: number;
  churnRate: number;
  totalCommands: number;
  commandsToday: number;
}

interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  has_subscription: boolean;
}

export default function AdminCRM() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    activeWorkspaces: 0,
    totalWorkspaces: 0,
    activeSubscriptions: 0,
    totalRevenueMRR: 0,
    averageSessionDuration: 0,
    conversionRate: 0,
    churnRate: 0,
    totalCommands: 0,
    commandsToday: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekAgo = subDays(now, 7).toISOString();
      const monthAgo = subMonths(now, 1).toISOString();

      // Parallel fetch all stats
      const [
        usersResult,
        newTodayResult,
        newWeekResult,
        newMonthResult,
        workspacesResult,
        activeWorkspacesResult,
        subscriptionsResult,
        commandsResult,
        commandsTodayResult,
        recentUsersResult,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
        supabase.from("workspaces").select("id", { count: "exact", head: true }),
        supabase.from("workspaces").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("commands").select("id", { count: "exact", head: true }),
        supabase.from("commands").select("id", { count: "exact", head: true }).gte("executed_at", todayStart),
        supabase.from("users").select("id, email, name, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      // Calculate MRR from subscriptions (simplified)
      const { data: planData } = await supabase
        .from("user_subscriptions")
        .select("plan_id, subscription_plans(price_monthly)")
        .eq("status", "active");

      const mrr = (planData || []).reduce((sum, sub) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase join types are complex to type perfectly here without generated types
        const plan = sub.subscription_plans as { price_monthly: number } | null;
        return sum + (plan?.price_monthly || 0);
      }, 0);

      // Calculate conversion rate (users with active subscriptions / total users)
      const totalUsers = usersResult.count || 0;
      const activeSubs = subscriptionsResult.count || 0;
      const conversionRate = totalUsers > 0 ? (activeSubs / totalUsers) * 100 : 0;

      setStats({
        totalUsers,
        newUsersToday: newTodayResult.count || 0,
        newUsersThisWeek: newWeekResult.count || 0,
        newUsersThisMonth: newMonthResult.count || 0,
        totalWorkspaces: workspacesResult.count || 0,
        activeWorkspaces: activeWorkspacesResult.count || 0,
        activeSubscriptions: activeSubs,
        totalRevenueMRR: mrr,
        averageSessionDuration: 0, // Would need session tracking
        conversionRate,
        churnRate: 0, // Would need historical data
        totalCommands: commandsResult.count || 0,
        commandsToday: commandsTodayResult.count || 0,
      });

      // Get subscription status for recent users
      const usersWithSubs = await Promise.all(
        (recentUsersResult.data || []).map(async (user) => {
          const { count } = await supabase
            .from("user_subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "active");
          return { ...user, has_subscription: (count || 0) > 0 };
        })
      );
      setRecentUsers(usersWithSubs);

    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard data");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const statCards = [
    {
      label: "Total Platform Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      change: stats.newUsersToday,
      changeLabel: "today",
      gradient: "from-blue-500/10 to-transparent",
      subtitle: "Lifetime growth"
    },
    {
      label: "Weekly Velocity",
      value: stats.newUsersThisWeek,
      icon: UserPlus,
      color: "text-green-500",
      trend: "up" as const,
      gradient: "from-green-500/10 to-transparent",
      subtitle: "New signups"
    },
    {
      label: "Active Units",
      value: stats.activeWorkspaces,
      icon: Activity,
      color: "text-purple-500",
      subtitle: `${stats.totalWorkspaces} total nodes`,
      gradient: "from-purple-500/10 to-transparent"
    },
    {
      label: "Premium Tier",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "text-emerald-500",
      subtitle: "Active subscriptions",
      gradient: "from-emerald-500/10 to-transparent"
    },
    {
      label: "Annual MRR",
      value: `$${stats.totalRevenueMRR.toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-500",
      isRevenue: true,
      gradient: "from-amber-500/10 to-transparent",
      subtitle: "Projected revenue"
    },
    {
      label: "Conversion",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: "text-pink-500",
      gradient: "from-pink-500/10 to-transparent",
      subtitle: "Free-to-Paid"
    },
    {
      label: "Neural Actions",
      value: stats.commandsToday,
      icon: Zap,
      color: "text-orange-500",
      subtitle: `${stats.totalCommands} lifetime`,
      gradient: "from-orange-500/10 to-transparent"
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 data-testid="loader" className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <AdminPageHeader
          title="CRM Dashboard"
          description="Real-time platform analytics and insights"
          icon={LayoutDashboard}
          actions={
            <>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px] bg-background/50 backdrop-blur-sm border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statCards.map((stat, index) => (
            <StatusCard
              key={stat.label}
              {...stat}
              delay={index * 0.04}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-panel border-border/50 overflow-hidden relative h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-primary/5" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  Recent Nucleus Growth
                </CardTitle>
                <CardDescription>Latest agents to integrate with the platform</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y divide-border/30">
                  {recentUsers.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.05) }}
                      className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all group cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight text-foreground/90">{user.name || "Anonymous Base"}</p>
                          <p className="text-xs text-muted-foreground opacity-70 truncate max-w-[150px] sm:max-w-[200px]">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <Badge variant={user.has_subscription ? "default" : "secondary"} className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border-none shadow-none ${user.has_subscription ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-muted/50 text-muted-foreground'}`}>
                          {user.has_subscription ? "PREMIUM" : "STANDARD"}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground font-mono font-medium">
                          {user.created_at ? format(new Date(user.created_at), "MMM d, HH:mm") : ""}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Platform Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-panel border-border/50 overflow-hidden relative h-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500/50 to-emerald-500/5" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  Vitals & Resilience
                </CardTitle>
                <CardDescription>Core distribution and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Active Workspace Density</p>
                      <p className="text-sm font-medium">Activation Rate</p>
                    </div>
                    <span className="font-mono text-lg font-bold text-primary">
                      {stats.totalUsers > 0
                        ? ((stats.activeWorkspaces / stats.totalUsers) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.totalUsers > 0 ? (stats.activeWorkspaces / stats.totalUsers) * 100 : 0}%` }}
                      transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Revenue Capture</p>
                      <p className="text-sm font-medium">Subscription Conversion</p>
                    </div>
                    <span className="font-mono text-lg font-bold text-emerald-500">{stats.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.conversionRate}%` }}
                      transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Node Saturation</p>
                      <p className="text-sm font-medium">Workspace Utilization</p>
                    </div>
                    <span className="font-mono text-lg font-bold text-purple-500">
                      {stats.totalWorkspaces > 0
                        ? ((stats.activeWorkspaces / stats.totalWorkspaces) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.totalWorkspaces > 0 ? (stats.activeWorkspaces / stats.totalWorkspaces) * 100 : 0}%` }}
                      transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 mt-2 border-t border-border/30">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                    <p className="text-2xl font-display font-bold text-emerald-500 tracking-tight">{stats.newUsersThisMonth}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Velocity / mo</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 group hover:border-primary/30 transition-all">
                    <p className="text-2xl font-display font-bold text-primary tracking-tight">${stats.totalRevenueMRR}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">MRR Capital</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Insights */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-panel border-border/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                Deep Intelligence Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 rounded-3xl bg-blue-500/5 group hover:bg-blue-500/10 border border-blue-500/10 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-xs uppercase font-bold tracking-widest text-blue-500/80">Avg Engagement</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">--</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Minutes / Session</p>
                </div>

                <div className="p-5 rounded-3xl bg-green-500/5 group hover:bg-green-500/10 border border-green-500/10 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-green-500/10 group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-xs uppercase font-bold tracking-widest text-green-500/80">Compute Actions</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">{stats.totalCommands?.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Neural operations</p>
                </div>

                <div className="p-5 rounded-3xl bg-purple-500/5 group hover:bg-purple-500/10 border border-purple-500/10 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform">
                      <Globe className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-xs uppercase font-bold tracking-widest text-purple-500/80">Global Nodes</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">{stats.totalWorkspaces?.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Active clusters</p>
                </div>

                <div className="p-5 rounded-3xl bg-amber-500/5 group hover:bg-amber-500/10 border border-amber-500/10 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-amber-500/10 group-hover:scale-110 transition-transform">
                      <Target className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-xs uppercase font-bold tracking-widest text-amber-500/80">Scale Target</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground mb-1 tracking-tight">{((stats.activeSubscriptions / 100) * 100).toFixed(0)}%</p>
                  <div className="w-full bg-muted/30 h-1.5 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="bg-amber-500 h-full relative"
                      style={{ width: `${((stats.activeSubscriptions / 100) * 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                    </motion.div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-2">Alpha project limit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
