import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Shield,
  Bell,
  Save,
  Loader2,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Zap,
  Paintbrush,
  Plus,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Confetti } from "@/components/ui/Confetti";

import { getAIService } from "@/lib/ai-service";
import { getSendGridService } from "@/lib/sendgrid-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface SettingsMap {
  [key: string]: string | number | boolean;
}

interface AIModel {
  id: string;
  name: string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface SecurityRule {
  id: string;
  pattern: string;
  reason: string;
  severity: "medium" | "high" | "critical";
  is_active: boolean;
  created_at: string;
}

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

// Zod Schemas for validation
const generalSettingsSchema = z.object({
  site_name: z.string().min(2, "Site name must be at least 2 characters").max(50, "Site name must be less than 50 characters"),
  site_description: z.string().min(10, "Description must be at least 10 characters").max(200, "Description must be less than 200 characters"),
  support_email: z.string().email("Please enter a valid email address"),
  maintenance_mode: z.boolean(),
  social_twitter: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  social_github: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  social_discord: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  social_linkedin: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

const securitySettingsSchema = z.object({
  require_email_verification: z.boolean(),
  allow_signups: z.boolean(),
  max_login_attempts: z.number().int().min(1, "Must be at least 1").max(20, "Must be less than 20"),
  session_timeout_hours: z.number().int().min(1, "Must be at least 1").max(720, "Must be less than 720 hours (30 days)"),
});

const notificationSettingsSchema = z.object({
  email_new_users: z.boolean(),
  email_gdpr_requests: z.boolean(),
  email_support_tickets: z.boolean(),
  slack_webhook: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  discord_webhook: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

const integrationSettingsSchema = z.object({
  openrouter_api_key: z.string(),
  ai_model: z.string(),
  model_coding: z.string(),
  sendgrid_api_key: z.string(),
  analytics_tracking_id: z.string(),
  payment_provider: z.string(),
  stripe_publishable_key: z.string(),
  stripe_secret_key: z.string(),
});

const designSettingsSchema = z.object({
  theme_primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  theme_border_radius: z.string(),
  theme_glassmorphism: z.boolean(),
  theme_font_family: z.string(),
});

const featureSettingsSchema = z.object({
  feature_ai_assistant: z.boolean(),
  feature_dating_module: z.boolean(),
  feature_map_events: z.boolean(),
  feature_business_tools: z.boolean(),
  feature_payouts: z.boolean(),
});

const performanceSettingsSchema = z.object({
  enable_caching: z.boolean(),
  cache_ttl_seconds: z.number().int().min(60, "Must be at least 60 seconds").max(86400, "Must be less than 24 hours"),
  enable_image_compression: z.boolean(),
  image_quality: z.number().int().min(10, "Must be at least 10%").max(100, "Must be less than 100%"),
  enable_lazy_loading: z.boolean(),
  enable_offline_mode: z.boolean(),
});

type PerformanceSettings = z.infer<typeof performanceSettingsSchema>;

// Type definitions from schemas
type GeneralSettings = z.infer<typeof generalSettingsSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;
type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
type IntegrationSettings = z.infer<typeof integrationSettingsSchema>;
type DesignSettings = z.infer<typeof designSettingsSchema>;
type FeatureSettings = z.infer<typeof featureSettingsSchema>;

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<Record<string, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize forms with validation
  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    mode: "onChange",
  });

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    mode: "onChange",
  });

  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    mode: "onChange",
  });

  const integrationForm = useForm<IntegrationSettings>({
    resolver: zodResolver(integrationSettingsSchema),
    mode: "onChange",
  });

  const designForm = useForm<DesignSettings>({
    resolver: zodResolver(designSettingsSchema),
    mode: "onChange",
  });

  const featureForm = useForm<FeatureSettings>({
    resolver: zodResolver(featureSettingsSchema),
    mode: "onChange",
  });

  const performanceForm = useForm<PerformanceSettings>({
    resolver: zodResolver(performanceSettingsSchema),
    mode: "onChange",
  });

  // availableModels and loadingModels are used.

  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchOpenRouterModels = async () => {
    if (!integrationForm.watch("openrouter_api_key")) {
      toast.error("API Key required");
      return;
    }
    setLoadingModels(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${integrationForm.watch("openrouter_api_key")}`,
          "HTTP-Referer": "https://hup.social",
          "X-Title": "Hup"
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.data) {
        setAvailableModels((data.data as AIModel[]).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)));
        toast.success(`Successfully fetched ${data.data.length} models from OpenRouter`);
      }
    } catch (error: unknown) {
      console.error("Error fetching models:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch models";
      toast.error(`Fetch Failed: ${message}`);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value, category");

      if (error) throw error;

      const settings: SettingsMap = {};
      data?.forEach(item => {
        const value = item.value;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          settings[item.key] = value;
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          settings[item.key] = JSON.stringify(value);
        }
      });

      // Update forms with fetched values
      generalForm.reset({
        site_name: (settings.site_name as string) || "Hup",
        site_description: (settings.site_description as string) || "The Social App for Real World Connections",
        support_email: (settings.support_email as string) || "support@hup.social",
        maintenance_mode: settings.maintenance_mode === true,
        social_twitter: (settings.social_twitter as string) || "",
        social_github: (settings.social_github as string) || "",
        social_discord: (settings.social_discord as string) || "",
        social_linkedin: (settings.social_linkedin as string) || "",
      });

      securityForm.reset({
        require_email_verification: settings.require_email_verification !== false,
        allow_signups: settings.allow_signups !== false,
        max_login_attempts: (settings.max_login_attempts as number) || 5,
        session_timeout_hours: (settings.session_timeout_hours as number) || 24,
      });

      notificationForm.reset({
        email_new_users: settings.email_new_users !== false,
        email_gdpr_requests: settings.email_gdpr_requests !== false,
        email_support_tickets: settings.email_support_tickets !== false,
        slack_webhook: (settings.slack_webhook as string) || "",
        discord_webhook: (settings.discord_webhook as string) || "",
      });

      integrationForm.reset({
        openrouter_api_key: (settings.openrouter_api_key as string) || "",
        ai_model: (settings.ai_model as string) || "anthropic/claude-3.5-sonnet",
        model_coding: (settings.model_coding as string) || "anthropic/claude-3.5-sonnet",
        sendgrid_api_key: (settings.sendgrid_api_key as string) || "",
        analytics_tracking_id: (settings.analytics_tracking_id as string) || "",
        payment_provider: (settings.payment_provider as string) || "stripe",
        stripe_publishable_key: (settings.stripe_publishable_key as string) || "",
        stripe_secret_key: (settings.stripe_secret_key as string) || "",
      });

      designForm.reset({
        theme_primary_color: (settings.theme_primary_color as string) || "#8B5CF6",
        theme_border_radius: (settings.theme_border_radius as string) || "0.5rem",
        theme_glassmorphism: settings.theme_glassmorphism !== false,
        theme_font_family: (settings.theme_font_family as string) || "Inter",
      });

      featureForm.reset({
        feature_ai_assistant: settings.feature_ai_assistant !== false,
        feature_dating_module: settings.feature_dating_module !== false,
        feature_map_events: settings.feature_map_events !== false,
        feature_business_tools: settings.feature_business_tools !== false,
        feature_payouts: settings.feature_payouts === true,
      });

      performanceForm.reset({
        enable_caching: settings.enable_caching !== false,
        cache_ttl_seconds: (settings.cache_ttl_seconds as number) || 3600,
        enable_image_compression: settings.enable_image_compression !== false,
        image_quality: (settings.image_quality as number) || 80,
        enable_lazy_loading: settings.enable_lazy_loading !== false,
        enable_offline_mode: settings.enable_offline_mode === true,
      });

    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (category: string, settings: Record<string, unknown>) => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.parse(JSON.stringify(value)),
        category,
      }));

      for (const update of updates) {
        const isPublic = category === "general" || category === "design" || category === "features";
        const { error } = await supabase
          .from("platform_settings")
          .upsert({ ...update, is_public: isPublic }, { onConflict: "key" });

        if (error) throw error;
      }

      setShowConfetti(false);
      setTimeout(() => setShowConfetti(true), 10);
      toast.success(category.charAt(0).toUpperCase() + category.slice(1) + " settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };



  const testAIConnection = async () => {
    setTestingConnection(prev => ({ ...prev, ai: true }));
    try {
      const aiService = getAIService({
        apiKey: integrationForm.watch("openrouter_api_key"),
        model: integrationForm.watch("ai_model"),
      });

      const result = await aiService.testConnection();
      setConnectionStatus(prev => ({ ...prev, ai: result }));

      if (result.success) {
        toast.success(result.message + (result.model ? ' (Model: ' + result.model + ')' : ''));
      } else {
        toast.error(result.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Checking connection failed";
      setConnectionStatus(prev => ({ ...prev, ai: { success: false, message } }));
      toast.error("AI connection test failed: " + message);
    } finally {
      setTestingConnection(prev => ({ ...prev, ai: false }));
    }
  };

  const testSendGridConnection = async () => {
    setTestingConnection(prev => ({ ...prev, sendgrid: true }));
    try {
      const sendgridService = getSendGridService({
        apiKey: integrationForm.watch("sendgrid_api_key"),
      });

      const result = await sendgridService.testConnection();
      setConnectionStatus(prev => ({ ...prev, sendgrid: result }));

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      setConnectionStatus(prev => ({ ...prev, sendgrid: { success: false, message } }));
      toast.error("SendGrid test failed: " + message);
    } finally {
      setTestingConnection(prev => ({ ...prev, sendgrid: false }));
    }
  };

  const testWebhook = async (platform: 'slack' | 'discord', url: string) => {
    setTestingConnection(prev => ({ ...prev, [platform]: true }));
    try {
      // Direct fetch to webhook endpoint (Note: some webhooks require POST)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🔔 Hup Platform Test: ${platform} integration is working correctly!`,
          content: `🔔 Hup Platform Test: ${platform} integration is working correctly!` // Discord format
        })
      });

      if (response.ok || response.status === 400) {
        // 400 often means invalid payload but valid URL for Slack/Discord sometimes
        toast.success(`${platform.toUpperCase()} connection reached successfully`);
      } else {
        throw new Error(`Platform returned ${response.status}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Request failed";
      toast.error(`Failed to reach ${platform}: ${msg}`);
    } finally {
      setTestingConnection(prev => ({ ...prev, [platform]: false }));
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Confetti trigger={showConfetti} />
      <div className="section-padding container-padding max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <AdminPageHeader
          title="Platform Settings"
          description="Configure global settings for the Hup platform."
          icon={Globe}
        />

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 h-auto sm:h-10">
            <TabsTrigger value="general" className="gap-2 h-11 sm:h-9">
              <Globe className="w-4 h-4" />
              <span className="sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 h-11 sm:h-9">
              <Shield className="w-4 h-4" />
              <span className="sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 h-11 sm:h-9">
              <Bell className="w-4 h-4" />
              <span className="sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 h-11 sm:h-9">
              <Key className="w-4 h-4" />
              <span className="sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-2 h-11 sm:h-9">
              <Paintbrush className="w-4 h-4" />
              <span className="sm:inline">Design & Features</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 h-11 sm:h-9">
              <Zap className="w-4 h-4" />
              <span className="sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit((data) => saveSettings("general", data))}>
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        General Settings
                      </CardTitle>
                      <CardDescription>
                        Basic platform configuration and branding.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="site_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="support_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Support Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={generalForm.control}
                        name="site_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generalForm.control}
                        name="maintenance_mode"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                            <div>
                              <FormLabel className="font-medium">Maintenance Mode</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Enable to show a maintenance page to all users
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving || !generalForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  <Card className="bg-gradient-card border-border/50 mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Social Media
                      </CardTitle>
                      <CardDescription>
                        Manage social media links displayed in the footer.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="social_twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter / X URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://twitter.com/hup" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="social_github"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://github.com/hup" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="social_discord"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discord URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://discord.gg/hup" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="social_linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://linkedin.com/company/hup" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving || !generalForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </motion.div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit((data) => saveSettings("security", data))}>
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Security Settings
                      </CardTitle>
                      <CardDescription>
                        Authentication and security configuration.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={securityForm.control}
                          name="require_email_verification"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Require Email Verification</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Users must verify their email before accessing the platform
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="allow_signups"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Allow New Signups</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Allow new users to create accounts
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="max_login_attempts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Login Attempts</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="session_timeout_hours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Timeout (hours)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 24)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving || !securityForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>

              {/* Dynamic Security Rules */}
              <SecurityRulesTable />
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit((data) => saveSettings("notifications", data))}>
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notification Settings
                      </CardTitle>
                      <CardDescription>
                        Configure admin notifications and integrations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="email_new_users"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">New User Signups</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Get notified when new users register
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="email_gdpr_requests"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">GDPR Requests</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Get notified when users submit GDPR requests
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="email_support_tickets"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Support Tickets</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Get notified for new support conversations
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={notificationForm.control}
                          name="slack_webhook"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Slack Webhook URL</FormLabel>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => testWebhook('slack', field.value)}
                                  disabled={!field.value || testingConnection.slack}
                                >
                                  {testingConnection.slack ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                                  Test
                                </Button>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://hooks.slack.com/..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={notificationForm.control}
                          name="discord_webhook"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Discord Webhook URL</FormLabel>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => testWebhook('discord', field.value)}
                                  disabled={!field.value || testingConnection.discord}
                                >
                                  {testingConnection.discord ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                                  Test
                                </Button>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://discord.com/api/webhooks/..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving || !notificationForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </motion.div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Form {...integrationForm}>
                <form onSubmit={integrationForm.handleSubmit((data) => saveSettings("integrations", data))}>
                  {/* Info Banner */}
                  <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-500">Important Security Note</p>
                        <p className="text-sm text-muted-foreground">
                          API keys stored here are saved in the database for admin convenience.
                          For production, secret keys should be stored in Supabase Edge Function secrets.
                          <a
                            href="https://supabase.com/dashboard/project/pltlcpqtivuvyeuywvql/settings/functions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
                          >
                            Manage Secrets <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* OpenRouter AI Integration */}
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">OpenRouter AI</CardTitle>
                            <CardDescription>Multi-model AI integration</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {connectionStatus.ai && (
                            <Badge className={connectionStatus.ai.success ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                              {connectionStatus.ai.success ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                              ) : (
                                <><AlertTriangle className="w-3 h-3 mr-1" /> Error</>
                              )}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={testAIConnection}
                            disabled={testingConnection.ai || !integrationForm.watch("openrouter_api_key")}
                            className="min-w-[120px]"
                          >
                            {testingConnection.ai ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                            ) : (
                              <><Zap className="w-4 h-4 mr-2" /> Test Connection</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {connectionStatus.ai && !connectionStatus.ai.success && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                          {connectionStatus.ai.message}
                        </div>
                      )}
                      <FormField
                        control={integrationForm.control}
                        name="openrouter_api_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OpenRouter API Key</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  type={showSecrets.openrouter ? "text" : "password"}
                                  {...field}
                                  placeholder="sk-or-..."
                                  className="font-mono text-sm"
                                />
                              </FormControl>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleSecretVisibility("openrouter")}
                                className="flex-shrink-0"
                              >
                                {showSecrets.openrouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Used to access models like Claude 3.5 and GPT-4o via OpenRouter</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-medium">Model Configuration</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={integrationForm.control}
                            name="ai_model"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chat / General Model</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableModels.length > 0 ? (
                                      availableModels.map(model => (
                                        <SelectItem key={model.id} value={model.id}>{model.name || model.id}</SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="google/gemini-flash-1.5">Gemini Flash 1.5</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={integrationForm.control}
                            name="model_coding"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Coding Model</FormLabel>
                                <Select
                                  value={field.value || integrationForm.watch("ai_model")}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableModels.length > 0 ? (
                                      availableModels.map(model => (
                                        <SelectItem key={model.id} value={model.id}>{model.name || model.id}</SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={fetchOpenRouterModels}
                            disabled={loadingModels || !integrationForm.watch("openrouter_api_key")}
                          >
                            {loadingModels ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Fetch Available Models
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Provider Settings */}
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-emerald-500" />
                        </div>
                        Payment Infrastructure
                      </CardTitle>
                      <CardDescription>
                        Configure your monetization engine. Switch providers instantly.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={integrationForm.control}
                          name="payment_provider"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Active Provider</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Choose which service handles new subscriptions.
                                </p>
                              </div>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Provider" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="stripe">Stripe (Default Provider)</SelectItem>
                                    <SelectItem value="manual" disabled>Manual Approval (Offline)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {integrationForm.watch("payment_provider") === 'stripe' && (
                          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField
                                control={integrationForm.control}
                                name="stripe_publishable_key"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Publishable Key</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="pk_test_..."
                                        className="font-mono"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={integrationForm.control}
                                name="stripe_secret_key"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Secret Key</FormLabel>
                                    <div className="flex gap-2">
                                      <FormControl>
                                        <Input
                                          type={showSecrets.stripe ? "text" : "password"}
                                          {...field}
                                          placeholder="sk_test_..."
                                          className="font-mono"
                                        />
                                      </FormControl>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => toggleSecretVisibility("stripe")}
                                      >
                                        {showSecrets.stripe ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* SendGrid Integration */}
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#1a82e2]/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1a82e2">
                              <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
                            </svg>
                          </div>
                          <div>
                            <CardTitle className="text-lg">SendGrid</CardTitle>
                            <CardDescription>Email delivery service</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {connectionStatus.sendgrid && (
                            <Badge className={connectionStatus.sendgrid.success ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                              {connectionStatus.sendgrid.success ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</>
                              ) : (
                                <><AlertTriangle className="w-3 h-3 mr-1" /> Error</>
                              )}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={testSendGridConnection}
                            disabled={testingConnection.sendgrid || !integrationForm.watch("sendgrid_api_key")}
                            className="min-w-[120px]"
                          >
                            {testingConnection.sendgrid ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                            ) : (
                              <><Zap className="w-4 h-4 mr-2" /> Test Connection</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {connectionStatus.sendgrid && !connectionStatus.sendgrid.success && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                          {connectionStatus.sendgrid.message}
                        </div>
                      )}
                      <FormField
                        control={integrationForm.control}
                        name="sendgrid_api_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  type={showSecrets.sendgrid ? "text" : "password"}
                                  {...field}
                                  placeholder="SG...."
                                  className="font-mono text-sm"
                                />
                              </FormControl>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleSecretVisibility("sendgrid")}
                                className="flex-shrink-0"
                              >
                                {showSecrets.sendgrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Used for sending transactional emails</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Analytics Card */}
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Analytics
                      </CardTitle>
                      <CardDescription>
                        Configure analytics tracking.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={integrationForm.control}
                        name="analytics_tracking_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Analytics Tracking ID</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  type="text"
                                  {...field}
                                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                                  className="font-mono text-sm"
                                />
                              </FormControl>
                            </div>
                            <p className="text-xs text-muted-foreground">Google Analytics 4 measurement ID</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="submit" disabled={saving || !integrationForm.formState.isValid}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Integration Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Form {...performanceForm}>
                <form onSubmit={performanceForm.handleSubmit((data) => saveSettings("performance", data))}>
                  <Card className="bg-gradient-card border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Performance Settings
                      </CardTitle>
                      <CardDescription>Optimize platform performance and loading times.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={performanceForm.control}
                          name="enable_caching"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Enable Caching</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Cache API responses and static content
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {performanceForm.watch("enable_caching") && (
                          <FormField
                            control={performanceForm.control}
                            name="cache_ttl_seconds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cache TTL (seconds)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 3600)}
                                    min={60}
                                    max={86400}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Time to live for cached content (in seconds)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={performanceForm.control}
                          name="enable_image_compression"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Enable Image Compression</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Automatically compress images to reduce file size
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {performanceForm.watch("enable_image_compression") && (
                          <FormField
                            control={performanceForm.control}
                            name="image_quality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Image Quality (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 80)}
                                    min={10}
                                    max={100}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Quality of compressed images (10-100)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={performanceForm.control}
                          name="enable_lazy_loading"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Enable Lazy Loading</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Lazy load images and content for faster initial load
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={performanceForm.control}
                          name="enable_offline_mode"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <FormLabel className="font-medium">Enable Offline Mode</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Allow users to use the app offline (PWA feature)
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving || !performanceForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Performance Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </motion.div>
          </TabsContent>

          {/* Design & Features Settings */}
          <TabsContent value="design">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Identity */}
                <Form {...designForm}>
                  <form onSubmit={designForm.handleSubmit((data) => saveSettings("design", data))}>
                    <Card className="bg-gradient-card border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Paintbrush className="w-5 h-5" />
                          Visual Identity
                        </CardTitle>
                        <CardDescription>Customize the look and feel of the platform.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={designForm.control}
                          name="theme_primary_color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Brand Color</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    type="color"
                                    {...field}
                                    className="w-12 h-10 p-1"
                                  />
                                </FormControl>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="flex-1"
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={designForm.control}
                          name="theme_border_radius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Border Radius (UI Roundness)</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0rem">Sharp (0px)</SelectItem>
                                  <SelectItem value="0.25rem">Slightly Rounded (4px)</SelectItem>
                                  <SelectItem value="0.5rem">Subtle (8px)</SelectItem>
                                  <SelectItem value="0.75rem">Modern (12px)</SelectItem>
                                  <SelectItem value="1rem">Soft (16px)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={designForm.control}
                          name="theme_glassmorphism"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                              <div className="space-y-0.5">
                                <FormLabel>Glassmorphism Effects</FormLabel>
                                <p className="text-sm text-muted-foreground">Enable blurred backgrounds on cards and dialogs.</p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={saving || !designForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Design Tokens
                        </Button>
                      </CardContent>
                    </Card>
                  </form>
                </Form>

                {/* Feature Toggles */}
                <Form {...featureForm}>
                  <form onSubmit={featureForm.handleSubmit((data) => saveSettings("features", data))}>
                    <Card className="bg-gradient-card border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Platform Features
                        </CardTitle>
                        <CardDescription>Enable or disable major functional modules.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {[
                            { id: 'feature_ai_assistant', label: 'AI Support Assistant', desc: 'Enable chatbot for user help.' },
                            { id: 'feature_dating_module', label: 'Dating & Matching', desc: 'Enable the intellectual dating features.' },
                            { id: 'feature_map_events', label: 'Social Map Events', desc: 'Allow users to create and see events on map.' },
                            { id: 'feature_business_tools', label: 'Business Registry', desc: 'Enable tools for local business owners.' },
                            { id: 'feature_payouts', label: 'Creator Payouts', desc: 'Enable monetization and payout features.' },
                          ].map((f) => (
                            <FormField
                              key={f.id}
                              control={featureForm.control}
                              name={f.id as keyof FeatureSettings}
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between p-3 rounded-md hover:bg-muted/30 transition-colors">
                                  <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{f.label}</p>
                                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>

                        <Button type="submit" className="w-full" disabled={saving || !featureForm.formState.isValid}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Feature Flags
                        </Button>
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div >
    </AdminLayout >
  );
}

function SecurityRulesTable() {
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState({ pattern: '', reason: '', severity: 'high' });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Failed to load security rules");
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('security_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
      toast.success("Security rule updated");
    } catch {
      toast.error("Failed to update rule");
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase.from('security_rules').delete().eq('id', id);
      if (error) throw error;
      setRules(rules.filter(r => r.id !== id));
      toast.success("Security rule deleted");
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  const addRule = async () => {
    if (!newRule.pattern) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('security_rules')
        .insert([newRule])
        .select();

      if (error) throw error;
      setRules([data[0], ...rules]);
      setNewRule({ pattern: '', reason: '', severity: 'high' });
      toast.success("New security rule added");
    } catch {
      toast.error("Failed to add rule");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-destructive" />
          Manageable Security Rules
        </CardTitle>
        <CardDescription>
          Globally block or flag dangerous command patterns. Changes take effect immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Rule */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
          <Input
            placeholder="Pattern (e.g. rm -rf)"
            value={newRule.pattern}
            onChange={e => setNewRule({ ...newRule, pattern: e.target.value })}
          />
          <Input
            placeholder="Reason"
            value={newRule.reason}
            onChange={e => setNewRule({ ...newRule, reason: e.target.value })}
          />
          <Select
            value={newRule.severity}
            onValueChange={v => setNewRule({ ...newRule, severity: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addRule} disabled={adding || !newRule.pattern}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Rule
          </Button>
        </div>

        {/* Rules List */}
        <div className="border rounded-lg overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Pattern</th>
                <th className="px-4 py-2 text-left">Severity</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No rules defined</td></tr>
              ) : rules.map(rule => (
                <tr key={rule.id} className={`border-b hover:bg-muted/20 transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono">{rule.pattern}</td>
                  <td className="px-4 py-3">
                    <Badge variant={rule.severity === 'critical' ? 'destructive' : rule.severity === 'high' ? 'outline' : 'secondary'}>
                      {rule.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{rule.reason}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
