import { useState, useEffect } from "react";

import {
    Zap,
    BarChart3,

    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { PerformanceMonitor } from "@/lib/utils/performance";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";

export default function PerformanceDashboard() {

    const [summary, setSummary] = useState(PerformanceMonitor.getSummary());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setSummary(PerformanceMonitor.getSummary());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const refreshData = () => {
        setLoading(true);
        setSummary(PerformanceMonitor.getSummary());
        setTimeout(() => {
            setLoading(false);
            toast.success("Metrics synchronized");
        }, 500);
    };

    const stats = [
        { label: "Avg Page Load", value: `${Math.round(summary.avgPageLoad)}ms`, icon: Globe, trend: "down" as const, color: "text-blue-500", gradient: "from-blue-500/5 to-transparent" },
        { label: "API Latency", value: `${Math.round(summary.avgApiCall)}ms`, icon: Activity, trend: "up" as const, color: "text-amber-500", gradient: "from-amber-500/5 to-transparent" },
        { label: "Render Time", value: `${Math.round(summary.avgRender)}ms`, icon: Cpu, trend: "up" as const, color: "text-emerald-500", gradient: "from-emerald-500/5 to-transparent" },
        { label: "Total Actions", value: summary.totalInteractions, icon: BarChart3, trend: "up" as const, color: "text-primary", gradient: "from-primary/5 to-transparent" },
    ];

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
                <AdminPageHeader
                    title="Performance Vitals"
                    description="Real-time monitoring of system latency, rendering, and interaction metrics."
                    icon={Zap}
                    actions={
                        <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Sync Metrics
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <StatusCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            trend={stat.trend}
                            color={stat.color}
                            gradient={stat.gradient}
                            delay={i * 0.05}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gradient-card border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-display flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Recent Slow Operations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {PerformanceMonitor.getSlowOperations(100).length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No slow operations detected. Platform is healthy.
                                    </div>
                                ) : (
                                    PerformanceMonitor.getSlowOperations(100).slice(0, 5).map((op, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-orange-500 bg-orange-500/10 font-mono">
                                                    {op.category}
                                                </Badge>
                                                <span className="text-sm font-medium">{op.name}</span>
                                            </div>
                                            <span className="font-mono text-sm font-bold text-orange-500">{Math.round(op.value)}ms</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-card border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-display flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Network Throughput
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px] flex items-center justify-center">
                            <p className="text-muted-foreground text-sm italic">Real-time throughput chart visualization placeholder</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
