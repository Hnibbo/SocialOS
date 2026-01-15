// Hup - AI Configuration Admin Page
// Control AI features, models, and automation

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Bot,
    Shield,
    Users,
    Calendar,
    Building,
    HeadphonesIcon,
    AlertTriangle,
    DollarSign,
    Activity,
    Settings2,
    Sparkles,
    Zap
} from 'lucide-react';
import type { AIConfig } from '@/types/social-os';

// Dynamic AI Model Discovery
// Fetches real-time models from OpenRouter or OpenAI
const STATIC_FALLBACK_MODELS = [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', cost: '$3.00' },
    { value: 'openai/gpt-4o', label: 'GPT-4o', cost: '$2.50' },
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', cost: '$0.52' },
];

const FEATURE_ICONS: Record<string, React.ElementType> = {
    content_moderation: Shield,
    user_matching: Users,
    activity_recommendations: Calendar,
    business_verification: Building,
    support_bot: HeadphonesIcon,
    report_triage: AlertTriangle,
};

export default function AdminAIConfig() {
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [decisions, setDecisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalDecisions: 0,
        totalCost: 0,
        avgLatency: 0,
        overrideRate: 0
    });
    const [availableModels, setAvailableModels] = useState<any[]>(STATIC_FALLBACK_MODELS);
    const [modelSearch, setModelSearch] = useState('');
    const [activeProvider, setActiveProvider] = useState('openrouter');
    const [keys, setKeys] = useState({ openrouter: '', openai: '' });

    useEffect(() => {
        fetchConfigs();
        fetchDecisions();
        fetchStats();
        fetchKeys();
    }, []);

    useEffect(() => {
        if (keys.openrouter || keys.openai) {
            discoverModels();
        }
    }, [keys, activeProvider]);

    const fetchKeys = async () => {
        const { data } = await supabase
            .from('platform_config')
            .select('key, value')
            .in('key', ['openrouter_api_key', 'openai_api_key', 'active_ai_provider']);

        const keyMap: any = {};
        data?.forEach(item => {
            if (item.key === 'active_ai_provider') setActiveProvider(JSON.parse(item.value));
            else keyMap[item.key.split('_')[0]] = JSON.parse(item.value);
        });
        setKeys(keyMap);
    };

    const discoverModels = async () => {
        try {
            if (activeProvider === 'openrouter' && keys.openrouter) {
                const res = await fetch('https://openrouter.ai/api/v1/models');
                const json = await res.json();
                if (json.data) {
                    setAvailableModels(json.data.map((m: any) => ({
                        value: m.id,
                        label: m.name,
                        cost: `$${m.pricing.prompt}/${m.pricing.completion}`
                    })));
                }
            } else if (activeProvider === 'openai' && keys.openai) {
                // Simplified OpenAI discovery
                setAvailableModels([
                    { value: 'gpt-4o', label: 'GPT-4o', cost: 'OpenAI Std' },
                    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', cost: 'OpenAI Std' },
                ]);
            }
        } catch (error) {
            console.error('Model discovery failed:', error);
        }
    };

    const fetchConfigs = async () => {
        const { data, error } = await supabase
            .from('ai_config')
            .select('*')
            .order('feature');

        if (error) {
            toast.error('Failed to load AI configs');
            return;
        }

        setConfigs(data || []);
        setLoading(false);
    };

    const fetchDecisions = async () => {
        const { data } = await supabase
            .from('ai_decisions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        setDecisions(data || []);
    };

    const fetchStats = async () => {
        const { data: totalData } = await supabase
            .from('ai_decisions')
            .select('id', { count: 'exact' });

        const { data: costData } = await supabase
            .from('ai_decisions')
            .select('cost')
            .not('cost', 'is', null);

        const { data: latencyData } = await supabase
            .from('ai_decisions')
            .select('latency_ms')
            .not('latency_ms', 'is', null);

        const { data: overrideData } = await supabase
            .from('ai_decisions')
            .select('id', { count: 'exact' })
            .eq('was_overridden', true);

        const totalCost = costData?.reduce((sum, d) => sum + (d.cost || 0), 0) || 0;
        const avgLatency = latencyData?.length
            ? latencyData.reduce((sum, d) => sum + (d.latency_ms || 0), 0) / latencyData.length
            : 0;

        setStats({
            totalDecisions: totalData?.length || 0,
            totalCost,
            avgLatency: Math.round(avgLatency),
            overrideRate: totalData?.length ? ((overrideData?.length || 0) / totalData.length) * 100 : 0
        });
    };

    const updateConfig = async (feature: string, updates: Partial<AIConfig>) => {
        setSaving(feature);

        const { error } = await supabase
            .from('ai_config')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('feature', feature);

        if (error) {
            toast.error('Failed to update config');
        } else {
            toast.success('Config updated');
            fetchConfigs();
        }

        setSaving(null);
    };

    const toggleFeature = async (feature: string, enabled: boolean) => {
        await updateConfig(feature, { enabled });
    };

    const resetDailyCosts = async () => {
        const { error } = await supabase
            .from('ai_config')
            .update({
                current_cost_today: 0,
                cost_reset_at: new Date().toISOString()
            })
            .neq('feature', '');

        if (error) {
            toast.error('Failed to reset costs');
        } else {
            toast.success('Daily costs reset');
            fetchConfigs();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI Configuration</h1>
                    <p className="text-muted-foreground">
                        Control AI-powered features across the platform
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetDailyCosts}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Reset Daily Costs
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-purple-500/10">
                                <Bot className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Decisions</p>
                                <p className="text-2xl font-bold">{stats.totalDecisions.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-500/10">
                                <DollarSign className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Cost</p>
                                <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-500/10">
                                <Zap className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Latency</p>
                                <p className="text-2xl font-bold">{stats.avgLatency}ms</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-orange-500/10">
                                <Activity className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Override Rate</p>
                                <p className="text-2xl font-bold">{stats.overrideRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="features" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="features">AI Features</TabsTrigger>
                    <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
                    <TabsTrigger value="prompts">System Prompts</TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-4">
                    {configs.map(config => {
                        const Icon = FEATURE_ICONS[config.feature] || Sparkles;

                        return (
                            <Card key={config.feature}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.enabled ? 'bg-purple-500/10' : 'bg-gray-500/10'}`}>
                                                <Icon className={`w-5 h-5 ${config.enabled ? 'text-purple-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{config.display_name}</CardTitle>
                                                <CardDescription>{config.description}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {config.enabled ? (
                                                <Badge variant="default" className="bg-green-500">Enabled</Badge>
                                            ) : (
                                                <Badge variant="secondary">Disabled</Badge>
                                            )}
                                            <Switch
                                                checked={config.enabled}
                                                onCheckedChange={(enabled) => toggleFeature(config.feature, enabled)}
                                                disabled={saving === config.feature}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Model (Searchable)</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Search models..."
                                                    value={modelSearch}
                                                    onChange={(e) => setModelSearch(e.target.value)}
                                                    className="h-8 text-xs font-mono"
                                                />
                                                <Select
                                                    value={config.model}
                                                    onValueChange={(model) => updateConfig(config.feature, { model })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableModels
                                                            .filter(m => m.label.toLowerCase().includes(modelSearch.toLowerCase()) || m.value.toLowerCase().includes(modelSearch.toLowerCase()))
                                                            .slice(0, 50)
                                                            .map(model => (
                                                                <SelectItem key={model.value} value={model.value}>
                                                                    <div className="flex justify-between items-center w-64">
                                                                        <span className="truncate">{model.label}</span>
                                                                        <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap opacity-50">{model.cost}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Max Cost/Day ($)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={config.max_cost_per_day}
                                                onChange={(e) => updateConfig(config.feature, { max_cost_per_day: parseFloat(e.target.value) })}
                                            />
                                        </div>

                                        <div>
                                            <Label>Today's Cost</Label>
                                            <div className="flex items-center gap-2 h-10">
                                                <span className="text-lg font-mono">
                                                    ${(config.current_cost_today || 0).toFixed(4)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    / ${config.max_cost_per_day}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={config.fallback_enabled}
                                                onCheckedChange={(fallback_enabled) => updateConfig(config.feature, { fallback_enabled })}
                                                id={`fallback-${config.feature}`}
                                            />
                                            <Label htmlFor={`fallback-${config.feature}`}>Enable fallback when AI unavailable</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={config.cost_tracking}
                                                onCheckedChange={(cost_tracking) => updateConfig(config.feature, { cost_tracking })}
                                                id={`cost-${config.feature}`}
                                            />
                                            <Label htmlFor={`cost-${config.feature}`}>Track costs</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>

                <TabsContent value="decisions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent AI Decisions</CardTitle>
                            <CardDescription>Manage the AI brains behind Hup.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-2 text-left">Time</th>
                                            <th className="px-4 py-2 text-left">Feature</th>
                                            <th className="px-4 py-2 text-left">Decision</th>
                                            <th className="px-4 py-2 text-left">Confidence</th>
                                            <th className="px-4 py-2 text-left">Latency</th>
                                            <th className="px-4 py-2 text-left">Cost</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {decisions.map(decision => (
                                            <tr key={decision.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-2 text-sm">
                                                    {new Date(decision.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge variant="outline">{decision.feature}</Badge>
                                                </td>
                                                <td className="px-4 py-2 text-sm font-mono">
                                                    {decision.decision || '-'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {decision.confidence ? `${(decision.confidence * 100).toFixed(0)}%` : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {decision.latency_ms}ms
                                                </td>
                                                <td className="px-4 py-2 text-sm font-mono">
                                                    ${decision.cost?.toFixed(6) || '0'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {decision.was_overridden ? (
                                                        <Badge variant="destructive">Overridden</Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-green-500">Applied</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                    {configs.map(config => (
                        <Card key={config.feature}>
                            <CardHeader>
                                <CardTitle>{config.display_name} - System Prompt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={config.system_prompt || ''}
                                    onChange={(e) => updateConfig(config.feature, { system_prompt: e.target.value })}
                                    rows={6}
                                    placeholder="Enter the system prompt for this AI feature..."
                                    className="font-mono text-sm"
                                />
                                <div className="mt-2 flex gap-2">
                                    <Label>Temperature:</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="2"
                                        value={config.temperature}
                                        onChange={(e) => updateConfig(config.feature, { temperature: parseFloat(e.target.value) })}
                                        className="w-20"
                                    />
                                    <Label className="ml-4">Max Tokens:</Label>
                                    <Input
                                        type="number"
                                        step="100"
                                        min="100"
                                        max="4000"
                                        value={config.max_tokens}
                                        onChange={(e) => updateConfig(config.feature, { max_tokens: parseInt(e.target.value) })}
                                        className="w-24"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
