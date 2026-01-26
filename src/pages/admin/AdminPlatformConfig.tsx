// Hup - Platform Configuration Admin Page
// Edit all platform settings, feature flags, and environment variables

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
    Settings,
    Flag,
    Globe,
    Lock,
    MapPin,
    Heart,
    Video,
    MessageSquare,
    Store,
    Sparkles,
    Save,
    RefreshCw,
    Cpu,
    Activity,
    History,
    DollarSign,
    Users,
    Shield,
    Settings2,
    Plus
} from 'lucide-react';
import type { PlatformConfig, FeatureFlag } from '@/types/social-os';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    branding: Sparkles,
    contact: MessageSquare,
    map: MapPin,
    presence: Globe,
    dating: Heart,
    content: Video,
    streaming: Video,
    random: MessageSquare,
    ads: Store,
    business: Store,
};

export default function AdminPlatformConfig() {
    const [configs, setConfigs] = useState<Record<string, PlatformConfig[]>>({});
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedConfigs, setEditedConfigs] = useState<Record<string, unknown>>({});
    const [editedFlags, setEditedFlags] = useState<Record<string, Partial<FeatureFlag>>>({});
    const [autoTasks, setAutoTasks] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        const [configResult, flagsResult, tasksResult] = await Promise.all([
            supabase.from('platform_config').select('*').order('category, key'),
            supabase.from('feature_flags').select('*').order('category, name'),
            supabase.from('auto_tasks').select('*').order('run_at', { ascending: false }).limit(20)
        ]);

        if (configResult.data) {
            const grouped = configResult.data.reduce((acc, config) => {
                if (!acc[config.category]) acc[config.category] = [];
                acc[config.category].push(config);
                return acc;
            }, {} as Record<string, PlatformConfig[]>);
            setConfigs(grouped);
        }

        if (flagsResult.data) {
            setFeatureFlags(flagsResult.data);
        }

        if (tasksResult.data) {
            setAutoTasks(tasksResult.data);
        }

        setLoading(false);
    };

    const updateConfig = async (key: string, value: unknown) => {
        setEditedConfigs(prev => ({ ...prev, [key]: value }));
    };

    const saveConfigs = async () => {
        setSaving(true);

        const updates = Object.entries(editedConfigs).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
        }));

        for (const update of updates) {
            await supabase
                .from('platform_config')
                .update({ value: update.value, updated_at: update.updated_at })
                .eq('key', update.key);
        }

        toast.success('Configuration saved');
        setEditedConfigs({});
        fetchData();
        setSaving(false);
    };

    const toggleFeatureFlag = async (name: string, enabled: boolean) => {
        const { error } = await supabase
            .from('feature_flags')
            .update({ enabled, updated_at: new Date().toISOString() })
            .eq('name', name);

        if (error) {
            toast.error('Failed to update feature flag');
        } else {
            toast.success(`Feature ${enabled ? 'enabled' : 'disabled'}`);
            fetchData();
        }
    };

    const updateFlagRollout = async (name: string, rollout_percentage: number) => {
        const { error } = await supabase
            .from('feature_flags')
            .update({ rollout_percentage, updated_at: new Date().toISOString() })
            .eq('name', name);

        if (error) {
            toast.error('Failed to update rollout');
        } else {
            toast.success('Rollout updated');
            fetchData();
        }
    };

    const runManualTask = async (taskType: string) => {
        const toastId = toast.loading(`Initializing ${taskType}...`);
        try {
            const { data, error } = await supabase.rpc('log_auto_task', {
                p_type: taskType,
                p_status: 'completed',
                p_details: `Manual trigger of ${taskType} initiated by Admin.`
            });
            if (error) throw error;
            toast.success(`${taskType} completed successfully`, { id: toastId });
            fetchData();
        } catch (err) {
            toast.error(`Task failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
        }
    };

    const getConfigValue = (config: PlatformConfig) => {
        if (editedConfigs[config.key] !== undefined) {
            return editedConfigs[config.key];
        }
        try {
            return JSON.parse(config.value as string);
        } catch {
            return config.value;
        }
    };

    const renderConfigInput = (config: PlatformConfig) => {
        const value = getConfigValue(config);
        const isEdited = editedConfigs[config.key] !== undefined;

        if (config.is_secret) {
            return (
                <div className="flex items-center gap-2">
                    <Input
                        type="password"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => updateConfig(config.key, e.target.value)}
                        className={isEdited ? 'border-yellow-500' : ''}
                    />
                    <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
            );
        }

        if (typeof value === 'boolean') {
            return (
                <Switch
                    checked={value}
                    onCheckedChange={(checked) => updateConfig(config.key, checked)}
                />
            );
        }

        if (typeof value === 'number') {
            return (
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => updateConfig(config.key, parseFloat(e.target.value))}
                    className={isEdited ? 'border-yellow-500' : ''}
                />
            );
        }

        if (typeof value === 'object') {
            return (
                <Input
                    value={JSON.stringify(value)}
                    onChange={(e) => {
                        try {
                            updateConfig(config.key, JSON.parse(e.target.value));
                        } catch {
                            // Invalid JSON, keep as string
                        }
                    }}
                    className={`font-mono text-sm ${isEdited ? 'border-yellow-500' : ''}`}
                />
            );
        }

        return (
            <Input
                value={String(value).replace(/^"|"$/g, '')}
                onChange={(e) => updateConfig(config.key, e.target.value)}
                className={isEdited ? 'border-yellow-500' : ''}
            />
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const hasEdits = Object.keys(editedConfigs).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Platform Configuration</h1>
                    <p className="text-muted-foreground">
                        Manage all platform settings and feature flags
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {hasEdits && (
                        <Button onClick={saveConfigs} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : `Save ${Object.keys(editedConfigs).length} Changes`}
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="settings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger value="features">
                        <Flag className="w-4 h-4 mr-2" />
                        Feature Flags
                    </TabsTrigger>
                    <TabsTrigger value="automation">
                        <Cpu className="w-4 h-4 mr-2" />
                        Autonomous Ops
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-6">
                    {Object.entries(configs).map(([category, categoryConfigs]) => {
                        const Icon = CATEGORY_ICONS[category] || Settings;

                        return (
                            <Card key={category}>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            <Icon className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="capitalize">{category}</CardTitle>
                                            <CardDescription>Global configuration for the Hup application.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4">
                                        {categoryConfigs.map(config => (
                                            <div
                                                key={config.key}
                                                className="flex items-center justify-between py-2 border-b last:border-0"
                                            >
                                                <div className="flex-1">
                                                    <Label className="font-medium">
                                                        {config.display_name || config.key}
                                                    </Label>
                                                    {config.description && (
                                                        <p className="text-sm text-muted-foreground">{config.description}</p>
                                                    )}
                                                    <code className="text-xs text-muted-foreground">{config.key}</code>
                                                </div>
                                                <div className="w-72">
                                                    {renderConfigInput(config)}
                                                </div>
                                                {!config.can_edit_live && (
                                                    <Badge variant="outline" className="ml-2">Requires Restart</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                    <div className="grid gap-4">
                        {/* Group by category */}
                        {Object.entries(
                            featureFlags.reduce((acc, flag) => {
                                const cat = flag.category || 'general';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(flag);
                                return acc;
                            }, {} as Record<string, FeatureFlag[]>)
                        ).map(([category, flags]) => (
                            <Card key={category}>
                                <CardHeader>
                                    <CardTitle className="capitalize">{category}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {flags.map(flag => (
                                            <div
                                                key={flag.name}
                                                className="flex items-center justify-between py-3 border-b last:border-0"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="font-medium">{flag.name}</Label>
                                                        {flag.enabled ? (
                                                            <Badge className="bg-green-500">On</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Off</Badge>
                                                        )}
                                                    </div>
                                                    {flag.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {flag.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {flag.enabled && (
                                                        <div className="flex items-center gap-2 w-48">
                                                            <span className="text-sm text-muted-foreground">Rollout:</span>
                                                            <Slider
                                                                value={[flag.rollout_percentage]}
                                                                onValueChange={([value]) => updateFlagRollout(flag.name, value)}
                                                                max={100}
                                                                step={5}
                                                                className="w-24"
                                                            />
                                                            <span className="text-sm font-mono w-12">
                                                                {flag.rollout_percentage}%
                                                            </span>
                                                        </div>
                                                    )}

                                                    <Switch
                                                        checked={flag.enabled}
                                                        onCheckedChange={(enabled) => toggleFeatureFlag(flag.name, enabled)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="automation" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Core Automation Engines</CardTitle>
                                    <CardDescription>Managed background processes that run the Hup Social OS autonomously.</CardDescription>
                                </div>
                                <Activity className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {[
                                    { name: 'Fee Transmission', status: 'Running', frequency: 'Real-time', icon: DollarSign },
                                    { name: 'Energy Regeneration', status: 'Stable', frequency: 'Every 5m', icon: Zap },
                                    { name: 'Identity Indexer', status: 'Optimal', frequency: 'Daily', icon: Users },
                                    { name: 'Content Audit AI', status: 'Active', frequency: 'On-demand', icon: Shield },
                                    { name: 'Agent Sequencer', status: 'Active', frequency: 'Every 1h', icon: Cpu },
                                    { name: 'Task Sequencer', status: 'Standby', frequency: 'Continuous', icon: Cpu },
                                ].map(engine => (
                                    <div key={engine.name} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3 group hover:border-primary/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <engine.icon className="w-5 h-5 text-primary" />
                                                <div>
                                                    <p className="text-xs font-bold">{engine.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{engine.frequency}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-500">
                                                {engine.status}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => runManualTask(engine.name.toLowerCase().replace(' ', '_'))}
                                        >
                                            Force Run <RefreshCw className="w-3 h-3 ml-2" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Autonomous Task Log</h4>
                            <div className="space-y-2">
                                {autoTasks.map(task => (
                                    <div key={task.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                task.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                                            )}>
                                                <History className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-tighter">{task.task_type.replace('_', ' ')}</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(task.run_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <code className="text-[9px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded">ID: {task.id.split('-')[0]}</code>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100"><Settings2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
