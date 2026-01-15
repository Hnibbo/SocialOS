import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Zap,
    Brain,
    Settings,
    History,
    Save,
    Activity,
    Eye,
    FileText,
    Cpu,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    Search,
    Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusCard } from "@/components/admin/shared/StatusCard";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

interface AIConfig {
    id: string;
    feature: string;
    display_name: string;
    enabled: boolean;
    model: string;
    system_prompt: string;
    temperature: number;
    max_tokens: number;
    daily_cost_limit: number;
}

interface AIDecision {
    id: string;
    feature: string;
    decision: string;
    latency_ms: number;
    user_id: string;
    prompt_raw: string;
    response_raw: string;
    status: string;
    created_at: string;
    metadata: any;
}

export default function AdminAI() {
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [decisions, setDecisions] = useState<AIDecision[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<AIConfig | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchAIStatus = async () => {
        setIsLoading(true);
        try {
            const [configsRes, decisionsRes] = await Promise.all([
                supabase.from('ai_config').select('*').order('feature'),
                supabase.from('ai_decisions').select('*').order('created_at', { ascending: false }).limit(50)
            ]);

            if (configsRes.error) throw configsRes.error;
            if (decisionsRes.error) throw decisionsRes.error;

            setConfigs(configsRes.data || []);
            setDecisions(decisionsRes.data || []);
            if (configsRes.data?.length > 0 && !selectedConfig) {
                setSelectedConfig(configsRes.data[0]);
            }
        } catch (error: any) {
            toast.error("Extraction Failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAIStatus();
    }, []);

    const saveConfig = async () => {
        if (!selectedConfig) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('ai_config')
                .update({
                    system_prompt: selectedConfig.system_prompt,
                    model: selectedConfig.model,
                    temperature: selectedConfig.temperature,
                    max_tokens: selectedConfig.max_tokens,
                    enabled: selectedConfig.enabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedConfig.id);

            if (error) throw error;
            toast.success("Neural parameters updated");
            fetchAIStatus();
        } catch (error: any) {
            toast.error("Sync Failed: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'error': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'filtered': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const filteredDecisions = decisions.filter(d =>
        d.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.prompt_raw?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="section-padding container-padding max-w-7xl mx-auto space-y-8">
                <AdminPageHeader
                    title="Neural Control Center"
                    description="Administrative oversight of autonomous agents, prompt architectures, and decision matrices."
                    icon={Brain}
                />

                {/* Neural Pulse Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatusCard
                        label="Active Models"
                        value={configs.filter(c => c.enabled).length}
                        icon={Cpu}
                        color="text-primary"
                        gradient="from-primary/10 to-transparent"
                        delay={0}
                    />
                    <StatusCard
                        label="Decisions (24h)"
                        value={decisions.length}
                        icon={Activity}
                        color="text-emerald-500"
                        gradient="from-emerald-500/10 to-transparent"
                        delay={0.1}
                    />
                    <StatusCard
                        label="Avg Latency"
                        value={`${Math.round(decisions.reduce((acc, d) => acc + (d.latency_ms || 0), 0) / (decisions.length || 1))}ms`}
                        icon={Zap}
                        color="text-amber-500"
                        gradient="from-amber-500/10 to-transparent"
                        delay={0.2}
                    />
                    <StatusCard
                        label="Security Status"
                        value="OPTIMAL"
                        icon={ShieldCheck}
                        color="text-blue-500"
                        gradient="from-blue-500/10 to-transparent"
                        delay={0.3}
                    />
                </div>

                <Tabs defaultValue="architect" className="space-y-6">
                    <TabsList className="bg-white/5 p-1 border border-white/10 rounded-xl">
                        <TabsTrigger value="architect" className="gap-2 px-4">
                            <Settings className="w-4 h-4" /> Prompt Architect
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="gap-2 px-4">
                            <History className="w-4 h-4" /> Decision Stream
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="architect">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Sidebar: Feature Selection */}
                            <div className="lg:col-span-3 space-y-2">
                                {configs.map(config => (
                                    <button
                                        key={config.id}
                                        onClick={() => setSelectedConfig(config)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedConfig?.id === config.id
                                                ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-50">Feature</span>
                                            {!config.enabled && <Badge variant="secondary" className="text-[8px]">Inert</Badge>}
                                        </div>
                                        <div className="font-bold text-sm">{config.display_name}</div>
                                        <div className="text-[10px] opacity-40 mt-1 font-mono uppercase truncate">{config.feature}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Main: Parameter Tuning */}
                            <div className="lg:col-span-9">
                                {selectedConfig ? (
                                    <Card className="glass-panel border-white/10">
                                        <CardHeader className="border-b border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">Tuning: {selectedConfig.display_name}</CardTitle>
                                                    <CardDescription>Calibrate autonomous behavior for the {selectedConfig.feature} node.</CardDescription>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-xs opacity-50">Active Status</Label>
                                                    <Switch
                                                        checked={selectedConfig.enabled}
                                                        onCheckedChange={(val) => setSelectedConfig({ ...selectedConfig, enabled: val })}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-widest opacity-50">Neural System Prompt</Label>
                                                <Textarea
                                                    value={selectedConfig.system_prompt}
                                                    onChange={(e) => setSelectedConfig({ ...selectedConfig, system_prompt: e.target.value })}
                                                    className="min-h-[250px] bg-white/5 border-white/10 font-mono text-sm leading-relaxed"
                                                    placeholder="Enter core behavioral instructions..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs opacity-50">Target Model</Label>
                                                    <Input
                                                        value={selectedConfig.model}
                                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, model: e.target.value })}
                                                        className="bg-white/5 border-white/10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs opacity-50">Creativity (Temp)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={selectedConfig.temperature}
                                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, temperature: parseFloat(e.target.value) })}
                                                        className="bg-white/5 border-white/10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs opacity-50">Max Tokens</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedConfig.max_tokens}
                                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, max_tokens: parseInt(e.target.value) })}
                                                        className="bg-white/5 border-white/10"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    onClick={saveConfig}
                                                    disabled={isSaving}
                                                    className="bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                                >
                                                    {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                    Inject Parameters
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="flex items-center justify-center min-h-[400px] border border-dashed border-white/10 rounded-2xl opacity-40">
                                        Select a neural node to calibrate
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs">
                        <Card className="glass-panel border-white/10">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <CardTitle className="text-lg">Automated Decision Matrix</CardTitle>
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                        <Input
                                            placeholder="Search logs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 bg-white/5 border-white/10 text-xs"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px]">
                                    <div className="divide-y divide-white/5">
                                        {filteredDecisions.map(log => (
                                            <div key={log.id} className="p-4 hover:bg-white/5 transition-colors group">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex gap-4">
                                                        <div className={`mt-1 p-2 rounded-lg border ${getStatusColor(log.status)}`}>
                                                            <Cpu className="w-4 h-4" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{log.feature}</span>
                                                                <span className="text-[10px] opacity-30">•</span>
                                                                <span className="text-[10px] opacity-40">{format(new Date(log.created_at), 'HH:mm:ss.SSS')}</span>
                                                            </div>
                                                            <div className="text-sm font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                                                                {log.prompt_raw || <span className="italic opacity-30">System Triggered</span>}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <Badge variant="outline" className="text-[9px] py-0 border-white/10 opacity-60">
                                                                    {log.latency_ms}ms
                                                                </Badge>
                                                                <span className="text-[10px] opacity-40">User: {log.user_id?.slice(0, 8)}...</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl bg-black border-white/10 backdrop-blur-3xl">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    <Activity className="w-5 h-5 text-primary" />
                                                                    Neural Trace Detail
                                                                </DialogTitle>
                                                                <DialogDescription>Full transparency for automated decision ID: {log.id}</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-6 py-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase opacity-50">Input Matrix (Prompt)</Label>
                                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                                                                        {log.prompt_raw}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-bold uppercase opacity-50">Neural Synthesis (Response)</Label>
                                                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs font-mono whitespace-pre-wrap leading-relaxed text-primary">
                                                                        {log.response_raw}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                                        <div className="text-[8px] uppercase opacity-40">Latency</div>
                                                                        <div className="text-sm font-bold">{log.latency_ms}ms</div>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                                        <div className="text-[8px] uppercase opacity-40">Model Context</div>
                                                                        <div className="text-sm font-bold truncate">{log.metadata?.model || 'Hup Native'}</div>
                                                                    </div>
                                                                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                                        <div className="text-[8px] uppercase opacity-40">Precision</div>
                                                                        <div className="text-sm font-bold">{log.metadata?.temperature || '0.7'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
