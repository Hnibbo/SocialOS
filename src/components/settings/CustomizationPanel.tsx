import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
    Palette,
    Type,
    Layout,
    Eye,
    Bell,
    Shield,
    Accessibility,
    Globe,
    Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface UserPreferences {
    theme_mode: string;
    theme_color: string;
    font_size: string;
    show_animations: boolean;
    reduce_motion: boolean;
    high_contrast: boolean;
    // ... other preferences
}

export const CustomizationPanel: React.FC = () => {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            fetchPreferences();
        }
    }, [user]);

    const fetchPreferences = async () => {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setPreferences(data || getDefaultPreferences());
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = async (key: string, value: any) => {
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user?.id,
                    [key]: value,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setPreferences(prev => ({ ...prev!, [key]: value }));

            // Apply theme changes immediately
            applyTheme({ ...preferences!, [key]: value });

            toast({
                title: 'Preferences Updated',
                description: 'Your changes have been saved',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update preferences',
                variant: 'destructive',
            });
        }
    };

    const applyTheme = (prefs: UserPreferences) => {
        const root = document.documentElement;

        // Apply theme mode
        root.classList.remove('light', 'dark');
        root.classList.add(prefs.theme_mode === 'auto' ?
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') :
            prefs.theme_mode
        );

        // Apply font size
        const fontSizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
        root.style.fontSize = fontSizes[prefs.font_size as keyof typeof fontSizes];

        // Apply animations
        if (!prefs.show_animations || prefs.reduce_motion) {
            root.style.setProperty('--animation-duration', '0s');
        } else {
            root.style.removeProperty('--animation-duration');
        }

        // Apply high contrast
        if (prefs.high_contrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
    };

    const getDefaultPreferences = (): UserPreferences => ({
        theme_mode: 'dark',
        theme_color: 'electric',
        font_size: 'medium',
        show_animations: true,
        reduce_motion: false,
        high_contrast: false,
    });

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-gradient-electric mb-2">
                    Customization
                </h1>
                <p className="text-muted-foreground">
                    Make this platform truly yours - customize every detail
                </p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-6">
                <TabsList className="glass-card p-1">
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="w-4 h-4" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="gap-2">
                        <Layout className="w-4 h-4" />
                        Layout
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="gap-2">
                        <Shield className="w-4 h-4" />
                        Privacy
                    </TabsTrigger>
                    <TabsTrigger value="accessibility" className="gap-2">
                        <Accessibility className="w-4 h-4" />
                        Accessibility
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <GlassCard className="p-6 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                Theme & Colors
                            </h3>

                            {/* Theme Mode */}
                            <div className="space-y-4">
                                <div>
                                    <Label>Theme Mode</Label>
                                    <Select
                                        value={preferences?.theme_mode}
                                        onValueChange={(value) => updatePreference('theme_mode', value)}
                                    >
                                        <SelectTrigger className="glass-card border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass-card border-white/10">
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="auto">Auto (System)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Theme Color */}
                                <div>
                                    <Label>Theme Color</Label>
                                    <div className="grid grid-cols-5 gap-3 mt-2">
                                        {['electric', 'ocean', 'sunset', 'forest', 'purple'].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => updatePreference('theme_color', color)}
                                                className={`h-12 rounded-xl transition-all ${preferences?.theme_color === color
                                                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                                                        : 'hover:scale-105'
                                                    }`}
                                                style={{
                                                    background: {
                                                        electric: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
                                                        ocean: 'linear-gradient(135deg, #0077be, #00d4ff)',
                                                        sunset: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
                                                        forest: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                                                        purple: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                                                    }[color],
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div>
                                    <Label>Font Size</Label>
                                    <Select
                                        value={preferences?.font_size}
                                        onValueChange={(value) => updatePreference('font_size', value)}
                                    >
                                        <SelectTrigger className="glass-card border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass-card border-white/10">
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                            <SelectItem value="xlarge">Extra Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Animations & Effects
                        </h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Show Animations</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable smooth transitions and effects
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.show_animations}
                                onCheckedChange={(checked) => updatePreference('show_animations', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Reduce Motion</Label>
                                <p className="text-sm text-muted-foreground">
                                    Minimize animations for accessibility
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.reduce_motion}
                                onCheckedChange={(checked) => updatePreference('reduce_motion', checked)}
                            />
                        </div>
                    </GlassCard>
                </TabsContent>

                {/* Accessibility Tab */}
                <TabsContent value="accessibility" className="space-y-6">
                    <GlassCard className="p-6 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Accessibility className="w-5 h-5 text-primary" />
                            Accessibility Options
                        </h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>High Contrast Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Increase contrast for better visibility
                                </p>
                            </div>
                            <Switch
                                checked={preferences?.high_contrast}
                                onCheckedChange={(checked) => updatePreference('high_contrast', checked)}
                            />
                        </div>

                        <div className="pt-4">
                            <ElectricButton variant="secondary" className="w-full">
                                <Eye className="w-4 h-4" />
                                Preview Accessibility Settings
                            </ElectricButton>
                        </div>
                    </GlassCard>
                </TabsContent>
            </Tabs>
        </div>
    );
};
