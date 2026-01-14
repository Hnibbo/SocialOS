import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  MessageSquare,
  Shield,
  Activity,
  Settings,
  HelpCircle,
  AlertTriangle,
  CreditCard,
  FileText,
  Gift,
  RefreshCw,
  LayoutDashboard,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";

interface Stats {
  totalUsers: number;
  totalBusinesses: number;
  pendingGdprRequests: number;
  activeConversations: number;
  totalActivities: number;
  activeSubscriptions: number;
  activeGiveaways: number;
}
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBusinesses: 0,
    pendingGdprRequests: 0,
    activeConversations: 0,
    totalActivities: 0,
    activeSubscriptions: 0,
    activeGiveaways: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, businesses, gdprRequests, conversations, activities, subscriptions, giveaways] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("businesses").select("id", { count: "exact", head: true }),
          supabase.from("gdpr_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("support_conversations").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("activities").select("id", { count: "exact", head: true }),
          supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("giveaways").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]);

        setStats({
          totalUsers: users.count || 0,
          totalBusinesses: businesses.count || 0,
          pendingGdprRequests: gdprRequests.count || 0,
          activeConversations: conversations.count || 0,
          totalActivities: activities.count || 0,
          activeSubscriptions: subscriptions.count || 0,
          activeGiveaways: giveaways.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", gradient: "from-blue-500/5 to-transparent" },
    { label: "Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-green-500", gradient: "from-green-500/5 to-transparent" },
    { label: "Social Activities", value: stats.totalActivities, icon: Activity, color: "text-purple-500", gradient: "from-purple-500/5 to-transparent" },
    { label: "Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-emerald-500", gradient: "from-emerald-500/5 to-transparent" },
    { label: "Giveaways", value: stats.activeGiveaways, icon: Gift, color: "text-orange-500", gradient: "from-orange-500/5 to-transparent" },
    { label: "Pending GDPR", value: stats.pendingGdprRequests, icon: AlertTriangle, color: "text-yellow-500", gradient: "from-yellow-500/5 to-transparent" },
    { label: "Active Support", value: stats.activeConversations, icon: MessageSquare, color: "text-pink-500", gradient: "from-pink-500/5 to-transparent" },
  ];

  const quickActions = [
    { label: "Manage Users", href: "/admin/users", icon: Users },
    { label: "Businesses", href: "/admin/businesses", icon: Building2 },
    { label: "Plans & Promos", href: "/admin/plans", icon: CreditCard },
    { label: "GDPR Requests", href: "/admin/gdpr", icon: Shield },
    { label: "FAQ Management", href: "/admin/faq", icon: HelpCircle },
    { label: "Support Queue", href: "/admin/support", icon: MessageSquare },
    { label: "Content", href: "/admin/content", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="Admin Dashboard"
          description="Global platform health, user engagement, and management hubs."
          icon={LayoutDashboard}
          actions={
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {statCards.map((stat, index) => (
            <StatusCard
              key={stat.label}
              label={stat.label}
              value={loading ? "..." : stat.value}
              icon={stat.icon}
              color={stat.color}
              gradient={stat.gradient}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-card border-border/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/30" />
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Direct shortcuts to platform control centers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {quickActions.map((action, i) => (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (i * 0.05) }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 group transition-all"
                      asChild
                    >
                      <Link to={action.href}>
                        <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{action.label}</span>
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Actions Alert */}
        {stats.pendingGdprRequests > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <p className="font-medium">
                    {stats.pendingGdprRequests} pending GDPR request(s) require attention
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link to="/admin/gdpr">Review Requests</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
