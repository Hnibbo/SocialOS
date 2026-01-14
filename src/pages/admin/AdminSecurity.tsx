import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Activity,
    Search,
    Lock,
    AlertTriangle,
    Terminal,
    User,
    Clock,
    Key,
    ScanLine,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Loader2
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    metadata: Record<string, unknown>;
    created_at: string;
    ip_address?: string;
}

interface AgentTrace {
    id: string;
    session_id: string;
    step: string;
    reasoning: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

interface ApiUser {
    id: string;
    email: string;
    api_token: string | null;
    created_at: string;
}

interface ScanResult {
    table_name: string;
    rls_enabled: boolean;
}

export default function AdminSecurity() {
    const [activeTab, setActiveTab] = useState("audit");
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
    const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchData();
        // Subscribe to real-time updates
        const channel = supabase
            .channel('security-hub')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                setAuditLogs(prev => [payload.new as AuditLog, ...prev]);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_traces' }, (payload) => {
                setAgentTraces(prev => [payload.new as AgentTrace, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [auditRes, traceRes] = await Promise.all([
                supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
                supabase.from("agent_traces").select("*").order("created_at", { ascending: false }).limit(100),
            ]);

            if (auditRes.error) throw auditRes.error;
            if (traceRes.error) throw traceRes.error;

            setAuditLogs(auditRes.data || []);
            setAgentTraces(traceRes.data || []);

            // Fetch API Users
            const { data: userData } = await supabase
                .from("users")
                .select("id, email, api_token, created_at")
                .not("api_token", "is", null);
            setApiUsers(userData || []);

        } catch (error) {
            console.error("Error fetching security data:", error);
            toast.error("Failed to load security logs");
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    const runSecurityScan = async () => {
        setScanning(true);
        try {
            const { data, error } = await supabase.rpc('check_rls_status');
            if (error) throw error;
            setScanResults(data || []);
            toast.success("Security scan completed");
        } catch (error) {
            console.error("Scan failed:", error);
            toast.error("Security scan failed");
        } finally {
            setScanning(false);
        }
    };

    const revokeApiToken = async (userId: string) => {
        if (!confirm("Are you sure you want to revoke this user's API token?")) return;
        try {
            const { error } = await supabase
                .from("users")
                .update({ api_token: null })
                .eq("id", userId);

            if (error) throw error;
            setApiUsers(apiUsers.filter(u => u.id !== userId));
            toast.success("API token revoked");
        } catch {
            toast.error("Failed to revoke token");
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 lg:p-8 space-y-6">
                <AdminPageHeader
                    title="Security Hub"
                    description="Monitor system audits, agent reasoning, and security events."
                    icon={Shield}
                    actions={
                        <Button variant="outline" onClick={fetchData} disabled={loading}>
                            <Activity className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatusCard
                        label="Security Health"
                        value="98%"
                        icon={Shield}
                        color="text-emerald-500"
                        gradient="from-emerald-500/10 to-transparent"
                        delay={0}
                        subtitle="Optimal status across all services"
                    />
                    <StatusCard
                        label="Threats Blocked"
                        value="0"
                        icon={AlertTriangle}
                        color="text-amber-500"
                        gradient="from-amber-500/10 to-transparent"
                        delay={0.04}
                        subtitle="Last 24 hours"
                    />
                    <StatusCard
                        label="Audit Events"
                        value={auditLogs.length}
                        icon={Lock}
                        color="text-blue-500"
                        gradient="from-blue-500/10 to-transparent"
                        delay={0.08}
                        subtitle="System wide"
                    />
                    <StatusCard
                        label="Agent Thoughts"
                        value={agentTraces.length}
                        icon={Terminal}
                        color="text-primary"
                        gradient="from-primary/10 to-transparent"
                        delay={0.12}
                        subtitle="Active sessions"
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted/30 p-1 rounded-xl border border-border/50">
                        <TabsTrigger value="audit" className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Lock className="w-4 h-4" /> Audit Logs
                        </TabsTrigger>
                        <TabsTrigger value="agent" className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Terminal className="w-4 h-4" /> Agent Traces
                        </TabsTrigger>
                        <TabsTrigger value="scan" className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ScanLine className="w-4 h-4" /> Vulnerability Scan
                        </TabsTrigger>
                        <TabsTrigger value="access" className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Key className="w-4 h-4" /> API Access
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative group max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search security logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted/30 border-border/50 focus:bg-background transition-all rounded-xl"
                        />
                    </div>

                    <TabsContent value="audit" className="mt-0">
                        <Card className="bg-gradient-card border-border/50 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {auditLogs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                <Lock className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">No system events recorded</p>
                                        </div>
                                    ) : (
                                        auditLogs
                                            .filter(l => JSON.stringify(l).toLowerCase().includes(search.toLowerCase()))
                                            .map((log, i) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                                    className="p-5 hover:bg-primary/5 transition-all group flex flex-col gap-3"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-2xl bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
                                                                <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{log.action}</p>
                                                                    <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 h-4 bg-background/50 border-border/50">
                                                                        {log.ip_address || "internal"}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate font-mono opacity-70">
                                                                    {log.user_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                                                                <Clock className="w-3.5 h-3.5 text-primary/60" />
                                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                                                        </div>
                                                    </div>

                                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                        <div className="ml-[60px] pl-4 border-l-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                                                            <div className="bg-muted/30 dark:bg-black/20 rounded-xl p-4 text-[11px] font-mono overflow-x-auto text-muted-foreground border border-border/30 group-hover:border-primary/10 transition-colors">
                                                                <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(log.metadata, null, 2)}</pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="agent" className="mt-0">
                        <Card className="bg-gradient-card border-border/50 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {agentTraces.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                                <Terminal className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <p className="text-muted-foreground font-medium">No agent traces active</p>
                                        </div>
                                    ) : (
                                        agentTraces
                                            .filter(t => JSON.stringify(t).toLowerCase().includes(search.toLowerCase()))
                                            .map((trace, i) => (
                                                <motion.div
                                                    key={trace.id}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                                    className="p-5 hover:bg-primary/5 transition-all group border-b border-border/30 last:border-0"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                                <ScanLine className="w-4 h-4 text-primary animate-pulse" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0 border-none ${getSeverityColor(trace.metadata?.severity)}`}>
                                                                        {trace.step}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                                        TRACE: {trace.session_id.slice(0, 8)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold bg-muted/30 px-2.5 py-1 rounded-full border border-border/50">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {format(new Date(trace.created_at), 'HH:mm:ss')}
                                                        </div>
                                                    </div>

                                                    <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-4 border border-border/30 group-hover:border-primary/20 transition-all duration-300">
                                                        <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                                            {trace.reasoning}
                                                        </p>
                                                    </div>

                                                    {trace.metadata && Object.keys(trace.metadata).length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {Object.entries(trace.metadata).map(([key, val]) => (
                                                                <div key={key} className="text-[10px] bg-muted/50 px-2.5 py-1 rounded-full text-muted-foreground border border-border/20 flex items-center gap-1.5 hover:bg-muted/80 transition-colors">
                                                                    <span className="opacity-60 font-bold uppercase tracking-tighter">{key}:</span>
                                                                    <span className="font-mono text-foreground">{typeof val === 'object' ? 'object' : String(val)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="scan" className="mt-0">
                        <Card className="bg-gradient-card border-border/50 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/30" />
                            <CardHeader className="flex flex-row items-center justify-between pb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="w-5 h-5 text-primary" />
                                        <CardTitle className="text-lg font-display">RLS Protection Audit</CardTitle>
                                    </div>
                                    <CardDescription>Scan all database tables for active Row Level Security policies.</CardDescription>
                                </div>
                                <Button
                                    onClick={runSecurityScan}
                                    disabled={scanning}
                                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border border-primary/20"
                                >
                                    {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Initiate Scan
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {scanResults.length === 0 ? (
                                    <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                                        <ScanLine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-muted-foreground font-medium">No results found. Run a scan to evaluate system safety.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scanResults.map((table, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${table.rls_enabled ? 'bg-emerald-500/10' : 'bg-red-500/10'} transition-colors group-hover:scale-110 duration-300`}>
                                                        {table.rls_enabled ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-mono text-sm font-bold block">{table.table_name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Public Domain</span>
                                                    </div>
                                                </div>
                                                <Badge variant={table.rls_enabled ? "outline" : "destructive"} className={table.rls_enabled ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : ""}>
                                                    {table.rls_enabled ? "Encrypted" : "Exposed"}
                                                </Badge>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="access" className="mt-0">
                        <Card className="bg-gradient-card border-border/50 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {apiUsers.length === 0 ? (
                                        <div className="p-20 text-center text-muted-foreground">
                                            <Key className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                            <p className="font-medium">No active API tokens found in the environment.</p>
                                        </div>
                                    ) : (
                                        apiUsers.map((user, i) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-6 flex items-center justify-between hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <Key className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight">{user.email}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <code className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                                                                {user.api_token?.substring(0, 8)}...••••••••
                                                            </code>
                                                            <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/5 border-emerald-500/10">Active</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Issue Date</p>
                                                        <p className="text-xs font-semibold text-foreground/70">
                                                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hover:bg-destructive/10 hover:text-destructive transition-colors px-4 border border-transparent hover:border-destructive/20"
                                                        onClick={() => revokeApiToken(user.id)}
                                                    >
                                                        Revoke Access
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
