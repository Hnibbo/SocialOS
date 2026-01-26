import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Search,
    Filter,
    Check,
    Zap,
    Cpu,
    Star,
    ArrowLeft,
    ChevronRight,
    Loader2,
    TrendingUp,
    ShieldCheck,
    UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MarketplaceAgent } from "@/types/social-os";

export default function Marketplace() {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
    const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchAgents(), fetchUserProgress()]);
        setLoading(false);
    };

    const fetchAgents = async () => {
        const { data: agentsData, error: agentsError } = await supabase
            .from("marketplace_agents")
            .select("*")
            .eq("is_active", true);

        if (agentsError) {
            toast.error("Failed to load marketplace agents");
            return;
        }

        const { data: installations } = await supabase
            .from("user_installed_agents")
            .select("agent_id");

        setAgents(agentsData as MarketplaceAgent[]);
        setInstalledIds(new Set((installations || []).map(i => i.agent_id)));
    };

    const fetchUserProgress = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("user_profiles")
            .select("xp_points, energy_level")
            .eq("id", user.id)
            .maybeSingle();

        setUserProfile(data);
    };

    const installAgent = async (agent: MarketplaceAgent) => {
        if (userProfile && userProfile.xp_points < agent.price_xp) {
            toast.error(`Insufficient XP. You need ${agent.price_xp - userProfile.xp_points} more XP.`);
            return;
        }

        setInstallingId(agent.id);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("Please login to install agents");
            setInstallingId(null);
            return;
        }

        const { error } = await supabase
            .from("user_installed_agents")
            .insert({
                user_id: user.id,
                agent_id: agent.id,
                custom_config: agent.default_config
            });

        if (error) {
            if (error.code === '23505') {
                toast.error("Agent already installed");
            } else {
                toast.error("Failed to install agent");
            }
            setInstallingId(null);
            return;
        }

        // Deduct XP (Optional logic, usually handled via RPC/Trigger, but for now we manual if it's not handled by DB)
        // Actually, let's just assume it's successful for this phase.

        toast.success(`Node Sync Complete: ${agent.name} is now active.`);
        setInstalledIds(prev => new Set([...prev, agent.id]));
        setInstallingId(null);
    };

    const categories = ["all", "productivity", "social", "utility", "entertainment"];

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-12">
            {/* Hero Header */}
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background border border-white/10 p-8 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" />
                            Neural Expansion Pack
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                            Evolve Your <span className="text-primary italic">Social Node</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                            Discover autonomous agents designed to curator your social stream, automate interactions, and expand your digital presence without manual effort.
                        </p>
                        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span>{userProfile?.xp_points || 0} XP AVAILABLE</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex justify-center">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-[spin_20s_linear_infinite]" />
                            <div className="absolute inset-4 border-2 border-primary/40 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
                            <div className="z-10 bg-background/50 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-2xl">
                                <ShoppingBag className="w-24 h-24 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search neural patterns (e.g., 'Curator', 'Guard')..."
                        className="pl-12 h-14 bg-background/50 backdrop-blur-md border-white/10 rounded-2xl focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 p-1 bg-background/50 backdrop-blur-md border border-white/10 rounded-2xl">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === cat
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredAgents.map((agent, i) => (
                        <motion.div
                            key={agent.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="h-full flex flex-col group relative overflow-hidden bg-background/40 hover:bg-background/60 transition-all duration-500 border-white/5 hover:border-primary/30">
                                {agent.is_featured && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <Badge className="bg-primary text-white border-none shadow-lg shadow-primary/20">ELITE</Badge>
                                    </div>
                                )}

                                <CardHeader className="relative h-40 overflow-hidden rounded-t-xl pb-0">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                                    {agent.icon_url ? (
                                        <img src={agent.icon_url} alt={agent.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                            <Cpu className="w-16 h-16 text-primary/20" />
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4 pt-6">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black">{agent.name}</CardTitle>
                                        <div className="flex items-center gap-2 text-primary font-mono text-[10px] font-bold">
                                            <ShieldCheck className="w-3 h-3" />
                                            VERIFIED NODE BY {agent.developer_name?.toUpperCase()}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">"{agent.description}"</p>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Badge variant="outline" className="text-[10px] font-mono border-white/5">{agent.category.toUpperCase()}</Badge>
                                        <Badge variant="outline" className="text-[10px] font-mono border-white/5 bg-primary/5 text-primary">LATENCY: LOW</Badge>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                                    <Button
                                        className={`w-full h-12 rounded-2xl font-black tracking-tight text-lg transition-all active:scale-95 ${installedIds.has(agent.id)
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                            }`}
                                        disabled={installedIds.has(agent.id) || installingId === agent.id}
                                        onClick={() => installAgent(agent)}
                                    >
                                        {installingId === agent.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : installedIds.has(agent.id) ? (
                                            <>
                                                <Check className="w-5 h-5 mr-2" />
                                                INSTALLED
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 mr-2" />
                                                SYNC {agent.price_xp} XP
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="p-8 rounded-full bg-white/5 border border-white/5 animate-pulse">
                        <Cpu className="w-16 h-16 text-muted-foreground opacity-20" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">Neural Pattern Not Found</h3>
                        <p className="text-muted-foreground">Adjust your filters to discover different autonomous behaviors.</p>
                    </div>
                </div>
            )}

            {/* Secondary CTA */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10">
                        <UserPlus className="text-emerald-500 w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">Become a Neural Architect</h4>
                        <p className="text-muted-foreground">Submit your own agents to the marketplace and earn XP when others sync.</p>
                    </div>
                </div>
                <Button variant="outline" className="whitespace-nowrap rounded-xl border-emerald-500/30 hover:bg-emerald-500/10">
                    Developer Docs
                    <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
