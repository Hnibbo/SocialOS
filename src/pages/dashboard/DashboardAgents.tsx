import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Cpu,
    Zap,
    Settings,
    Power,
    PowerOff,
    ExternalLink,
    Plus,
    Loader2,
    Activity,
    Shield,
    Search,
    ChevronRight,
    Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserInstalledAgent, AgentTrace } from "@/types/social-os";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function DashboardAgents() {
    const navigate = useNavigate();
    const [installedAgents, setInstalledAgents] = useState<UserInstalledAgent[]>([]);
    const [traces, setTraces] = useState<AgentTrace[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<UserInstalledAgent | null>(null);
    const [configModalOpen, setConfigModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchInstalledAgents(), fetchTraces()]);
        setLoading(false);
    };

    const fetchInstalledAgents = async () => {
        const { data, error } = await supabase
            .from("user_installed_agents")
            .select(`
        *,
        agent:marketplace_agents(*)
      `)
            .order("installed_at", { ascending: false });

        if (error) {
            toast.error("Failed to load your agents");
            return;
        }
        setInstalledAgents(data as any);
    };

    const fetchTraces = async () => {
        const { data, error } = await supabase
            .from("agent_traces")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error fetching traces:", error);
            return;
        }
        setTraces(data as any);
    };

    const toggleAgent = async (agent: UserInstalledAgent) => {
        const newStatus = !agent.is_enabled;
        const { error } = await supabase
            .from("user_installed_agents")
            .update({ is_enabled: newStatus })
            .eq("id", agent.id);

        if (error) {
            toast.error("Failed to update agent status");
            return;
        }

        setInstalledAgents(prev =>
            prev.map(a => a.id === agent.id ? { ...a, is_enabled: newStatus } : a)
        );
        toast.success(`${agent.agent?.name} ${newStatus ? "activated" : "deactivated"}`);
    };

    const updateConfig = async () => {
        if (!selectedAgent) return;

        const { error } = await supabase
            .from("user_installed_agents")
            .update({ custom_config: selectedAgent.custom_config })
            .eq("id", selectedAgent.id);

        if (error) {
            toast.error("Failed to save configuration");
            return;
        }

        toast.success("Configuration updated successfully");
        setConfigModalOpen(false);
        fetchInstalledAgents();
    };

    const runAgent = async (agent: UserInstalledAgent) => {
        if (!agent.is_enabled) {
            toast.error("Agent must be enabled to run");
            return;
        }

        setRefreshing(true);
        try {
            const { data, error } = await supabase.functions.invoke('hup-ai-hub', {
                body: {
                    agent_slug: agent.agent?.slug,
                    prompt: "Perform autonomous audit of my recent social transmissions."
                }
            });

            if (error) throw error;
            toast.success(`${agent.agent?.name} mission complete`);
            fetchData(); // Refresh traces and run count
        } catch (err) {
            console.error(err);
            toast.error("Agent execution failed");
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-primary" />
                        Neural Command Center
                    </h1>
                    <p className="text-muted-foreground">Manage your autonomous social nodes and background processes.</p>
                </div>
                <Button
                    onClick={() => navigate("/dashboard/marketplace")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Acquire New Agent
                    <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                </Button>
            </div>

            <Tabs defaultValue="installed" className="w-full">
                <TabsList className="bg-background/50 backdrop-blur-md border border-white/10 p-1 rounded-xl mb-6">
                    <TabsTrigger value="installed" className="rounded-lg px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Active Agents
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Reasoning Stream
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="installed" className="mt-0">
                    {installedAgents.length === 0 ? (
                        <Card className="border-dashed border-white/20 bg-background/50 backdrop-blur-xl py-12">
                            <CardContent className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary/40">
                                    <Cpu className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">No Neural Nodes Active</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto">
                                        Your social graph is currently manual. Install an agent to begin autonomous operations.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => navigate("/dashboard/marketplace")}>
                                    Explore Agent Marketplace
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {installedAgents.map((installation, i) => (
                                    <motion.div
                                        key={installation.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-white/10 ${!installation.is_enabled ? 'opacity-70 grayscale' : ''}`}>
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />

                                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-background flex items-center justify-center">
                                                        {installation.agent?.icon_url ? (
                                                            <img src={installation.agent.icon_url} alt={installation.agent.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Cpu className="w-6 h-6 text-primary" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl font-bold">{installation.agent?.name}</CardTitle>
                                                        <Badge variant="secondary" className="text-[10px] tracking-widest uppercase py-0">{installation.agent?.category}</Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`rounded-full ${installation.is_enabled ? 'text-primary' : 'text-muted-foreground'}`}
                                                    onClick={() => toggleAgent(installation)}
                                                >
                                                    {installation.is_enabled ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                                                </Button>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                                    {installation.agent?.description || "Autonomous background processing node."}
                                                </p>

                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Status</p>
                                                        <p className="text-xs font-mono flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${installation.is_enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                            {installation.is_enabled ? 'SYNCING' : 'IDLE'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Tasks Run</p>
                                                        <p className="text-xs font-mono">{installation.total_runs || 0}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        variant="secondary"
                                                        className="flex-1 text-xs h-9 rounded-lg"
                                                        onClick={() => {
                                                            setSelectedAgent(installation);
                                                            setConfigModalOpen(true);
                                                        }}
                                                    >
                                                        <Settings className="w-3 h-3 mr-2" />
                                                        Calibrate
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        className="flex-1 text-xs h-9 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
                                                        onClick={() => runAgent(installation)}
                                                        disabled={refreshing || !installation.is_enabled}
                                                    >
                                                        {refreshing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Zap className="w-3 h-3 mr-2" />}
                                                        Run Mission
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="activity">
                    <Card className="bg-background/50 backdrop-blur-xl border-white/10">
                        <CardHeader>
                            <CardTitle>Reasoning Stream</CardTitle>
                            <CardDescription>Real-time audit of autonomous decisions and agent logic.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {traces.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Activity className="w-12 h-12 mb-4 opacity-10" />
                                    <p>No transmissions recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {traces.map((trace) => (
                                        <div key={trace.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-primary" />
                                                    <span className="font-mono text-sm font-bold uppercase tracking-tight">{trace.action_name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase py-0.5 px-2 bg-white/5 rounded-full border border-white/10">
                                                        {new Date(trace.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">AGENT_{trace.agent_id?.substring(0, 4)}</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Current Thought</Label>
                                                    <p className="text-xs italic text-foreground/80 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">
                                                        "{trace.thought_process}"
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Observation & Result</Label>
                                                    <div className="text-xs bg-black/40 p-2 rounded-lg border border-white/5 font-mono text-green-400">
                                                        <span className="text-blue-400">IN:</span> {trace.observation || 'NONE'}
                                                        <br />
                                                        <span className="text-purple-400">OUT:</span> {trace.result || 'EXECUTING...'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Configuration Modal */}
            <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-2xl border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Node Calibration: {selectedAgent?.agent?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Fine-tune the autonomous behavior of this neural node.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Operational Sensitivity (Temperature)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                value={(selectedAgent?.custom_config?.temperature as number) || 0.7}
                                onChange={(e) => setSelectedAgent(prev => prev ? {
                                    ...prev,
                                    custom_config: { ...prev.custom_config, temperature: parseFloat(e.target.value) }
                                } : null)}
                                className="bg-background/50 border-white/10"
                            />
                            <p className="text-[10px] text-muted-foreground">Higher values increase creativity and unpredictability.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Neural Depth (Max Tokens)</Label>
                            <Input
                                type="number"
                                value={(selectedAgent?.custom_config?.max_tokens as number) || 500}
                                onChange={(e) => setSelectedAgent(prev => prev ? {
                                    ...prev,
                                    custom_config: { ...prev.custom_config, max_tokens: parseInt(e.target.value) }
                                } : null)}
                                className="bg-background/50 border-white/10"
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-3">
                            <Info className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-xs text-muted-foreground leading-snug">
                                Operational costs are deducted from your daily XP allowance. Ensure high energy levels for continuous uptime.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConfigModalOpen(false)}>Cancel</Button>
                        <Button onClick={updateConfig}>Sync Node</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
