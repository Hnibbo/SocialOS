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

// General Settings Interface
interface GeneralSettings {
  site_name: string;
  site_description: string;
  support_email: string;
  maintenance_mode: boolean;
  social_twitter?: string;
  social_github?: string;
  social_discord?: string;
  social_linkedin?: string;
  [key: string]: string | boolean | undefined;
}

// Feature Settings Interface
interface FeatureSettings {
  feature_ai_assistant: boolean;
  feature_marketplace: boolean;
  feature_enterprise_plans: boolean;
  feature_code_editor: boolean;
  feature_realtime_collaboration: boolean;
  [key: string]: boolean;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<Record<string, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    site_name: "Hup",
    site_description: "Hup - The Social App for Real World Connections",
    support_email: "support@hup.social",
    maintenance_mode: false,
    social_twitter: "",
    social_github: "",
    social_discord: "",
    social_linkedin: ""
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    require_email_verification: true,
    allow_signups: true,
    max_login_attempts: 5,
    session_timeout_hours: 24,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_new_users: true,
    email_gdpr_requests: true,
    email_support_tickets: true,
    slack_webhook: "",
    discord_webhook: "",
  });

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState({
    openrouter_api_key: "",
    ai_model: "anthropic/claude-3.5-sonnet",
    model_coding: "anthropic/claude-3.5-sonnet",
    sendgrid_api_key: "",
    analytics_tracking_id: "",
    payment_provider: "stripe",
    stripe_publishable_key: "",
    stripe_secret_key: "",
  });

  // Design Settings
  const [designSettings, setDesignSettings] = useState({
    theme_primary_color: "#8B5CF6",
    theme_border_radius: "0.5rem",
    theme_glassmorphism: true,
    theme_font_family: "Inter",
  });

  // Feature Flags
  const [featureSettings, setFeatureSettings] = useState<FeatureSettings>({
    feature_ai_assistant: true,
    feature_dating_module: true,
    feature_map_events: true,
    feature_business_tools: true,
    feature_payouts: false,
  });

  // availableModels and loadingModels are used.

  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchOpenRouterModels = async () => {
    if (!integrationSettings.openrouter_api_key) {
      toast.error("API Key required");
      return;
    }
    setLoadingModels(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${integrationSettings.openrouter_api_key}`,
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

      // Update state with fetched values
      setGeneralSettings({
        site_name: (settings.site_name as string) || "Hup",
        site_description: (settings.site_description as string) || "The Social App for Real World Connections",
        support_email: (settings.support_email as string) || "support@hup.social",
        maintenance_mode: settings.maintenance_mode === true,
        // Social Links
        social_twitter: (settings.social_twitter as string) || "",
        social_github: (settings.social_github as string) || "",
        social_discord: (settings.social_discord as string) || "",
        social_linkedin: (settings.social_linkedin as string) || "",
      });

      setSecuritySettings({
        require_email_verification: settings.require_email_verification !== false,
        allow_signups: settings.allow_signups !== false,
        max_login_attempts: (settings.max_login_attempts as number) || 5,
        session_timeout_hours: (settings.session_timeout_hours as number) || 24,
      });

      setNotificationSettings({
        email_new_users: settings.email_new_users !== false,
        email_gdpr_requests: settings.email_gdpr_requests !== false,
        email_support_tickets: settings.email_support_tickets !== false,
        slack_webhook: (settings.slack_webhook as string) || "",
        discord_webhook: (settings.discord_webhook as string) || "",
      });

      setIntegrationSettings({
        openrouter_api_key: (settings.openrouter_api_key as string) || "",
        ai_model: (settings.ai_model as string) || "anthropic/claude-3.5-sonnet",
        model_coding: (settings.model_coding as string) || "anthropic/claude-3.5-sonnet",
        sendgrid_api_key: (settings.sendgrid_api_key as string) || "",
        analytics_tracking_id: (settings.analytics_tracking_id as string) || "",
        payment_provider: (settings.payment_provider as string) || "stripe",
        stripe_publishable_key: (settings.stripe_publishable_key as string) || "",
        stripe_secret_key: (settings.stripe_secret_key as string) || "",
      });

      setDesignSettings({
        theme_primary_color: (settings.theme_primary_color as string) || "#8B5CF6",
        theme_border_radius: (settings.theme_border_radius as string) || "0.5rem",
        theme_glassmorphism: settings.theme_glassmorphism !== false,
        theme_font_family: (settings.theme_font_family as string) || "Inter",
      });

      setFeatureSettings({
        feature_ai_assistant: settings.feature_ai_assistant !== false,
        feature_dating_module: settings.feature_dating_module !== false,
        feature_map_events: settings.feature_map_events !== false,
        feature_business_tools: settings.feature_business_tools !== false,
        feature_payouts: settings.feature_payouts === true,
      });

      // Design and features are updated in the database but currently don't have a UI tab.

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
        apiKey: integrationSettings.openrouter_api_key,
        model: integrationSettings.ai_model,
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
        apiKey: integrationSettings.sendgrid_api_key,
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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-auto sm:h-10">
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
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={generalSettings.site_name}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, site_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={generalSettings.support_email}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, support_email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={generalSettings.site_description}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, site_description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Enable to show a maintenance page to all users
                      </p>
                    </div>
                    <Switch
                      checked={generalSettings.maintenance_mode}
                      onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings("general", generalSettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-gradient-card border-border/50">
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
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter / X URL</Label>
                      <Input
                        id="twitter"
                        placeholder="https://twitter.com/hup"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub URL</Label>
                      <Input
                        id="github"
                        placeholder="https://github.com/hup"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord">Discord URL</Label>
                      <Input
                        id="discord"
                        placeholder="https://discord.gg/hup"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        value={generalSettings.social_linkedin || ""}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, social_linkedin: e.target.value }))}
                        placeholder="https://linkedin.com/company/hup"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings("general", generalSettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="font-medium">Require Email Verification</p>
                        <p className="text-sm text-muted-foreground">
                          Users must verify their email before accessing the platform
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.require_email_verification}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, require_email_verification: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="font-medium">Allow New Signups</p>
                        <p className="text-sm text-muted-foreground">
                          Allow new users to create accounts
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.allow_signups}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, allow_signups: checked }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={securitySettings.max_login_attempts}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) || 5 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={securitySettings.session_timeout_hours}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout_hours: parseInt(e.target.value) || 24 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings("security", securitySettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="font-medium">New User Signups</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when new users register
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.email_new_users}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_new_users: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="font-medium">GDPR Requests</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when users submit GDPR requests
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.email_gdpr_requests}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_gdpr_requests: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="font-medium">Support Tickets</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified for new support conversations
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.email_support_tickets}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_support_tickets: checked }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => testWebhook('slack', notificationSettings.slack_webhook)}
                          disabled={!notificationSettings.slack_webhook || testingConnection.slack}
                        >
                          {testingConnection.slack ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                          Test
                        </Button>
                      </div>
                      <Input
                        id="slackWebhook"
                        value={notificationSettings.slack_webhook}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, slack_webhook: e.target.value }))}
                        placeholder="https://hooks.slack.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => testWebhook('discord', notificationSettings.discord_webhook)}
                          disabled={!notificationSettings.discord_webhook || testingConnection.discord}
                        >
                          {testingConnection.discord ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                          Test
                        </Button>
                      </div>
                      <Input
                        id="discordWebhook"
                        value={notificationSettings.discord_webhook}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, discord_webhook: e.target.value }))}
                        placeholder="https://discord.com/api/webhooks/..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings("notifications", notificationSettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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
                        disabled={testingConnection.ai || !integrationSettings.openrouter_api_key}
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
                  <div className="space-y-2">
                    <Label>OpenRouter API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.openrouter ? "text" : "password"}
                        value={integrationSettings.openrouter_api_key}
                        onChange={(e) => setIntegrationSettings(prev => ({ ...prev, openrouter_api_key: e.target.value }))}
                        placeholder="sk-or-..."
                        className="font-mono text-sm"
                      />
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
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Model Configuration</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Chat / General Model</Label>
                        <Select
                          value={integrationSettings.ai_model}
                          onValueChange={(value) => setIntegrationSettings(prev => ({ ...prev, ai_model: value }))}
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
                      </div>

                      <div className="space-y-2">
                        <Label>Coding Model</Label>
                        <Select
                          value={integrationSettings.model_coding || integrationSettings.ai_model}
                          onValueChange={(value) => setIntegrationSettings(prev => ({ ...prev, model_coding: value }))}
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
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={fetchOpenRouterModels}
                        disabled={loadingModels || !integrationSettings.openrouter_api_key}
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
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-base">Active Provider</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose which service handles new subscriptions.
                        </p>
                      </div>
                      <Select
                        value={integrationSettings.payment_provider}
                        onValueChange={(value) => setIntegrationSettings(prev => ({ ...prev, payment_provider: value }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe (Default Provider)</SelectItem>
                          <SelectItem value="manual" disabled>Manual Approval (Offline)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {integrationSettings.payment_provider === 'stripe' && (
                      <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Publishable Key</Label>
                            <Input
                              value={integrationSettings.stripe_publishable_key}
                              onChange={(e) => setIntegrationSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                              placeholder="pk_test_..."
                              className="font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showSecrets.stripe ? "text" : "password"}
                                value={integrationSettings.stripe_secret_key}
                                onChange={(e) => setIntegrationSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                                placeholder="sk_test_..."
                                className="font-mono"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => toggleSecretVisibility("stripe")}
                              >
                                {showSecrets.stripe ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings("integrations", integrationSettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
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
                        disabled={testingConnection.sendgrid || !integrationSettings.sendgrid_api_key}
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
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.sendgrid ? "text" : "password"}
                        value={integrationSettings.sendgrid_api_key}
                        onChange={(e) => setIntegrationSettings(prev => ({ ...prev, sendgrid_api_key: e.target.value }))}
                        placeholder="SG...."
                        className="font-mono text-sm"
                      />
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
                  </div>
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
                  <div className="space-y-2">
                    <Label>Google Analytics  Tracking ID</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={integrationSettings.analytics_tracking_id}
                        onChange={(e) => setIntegrationSettings(prev => ({ ...prev, analytics_tracking_id: e.target.value }))}
                        placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                        className="font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Google Analytics 4 measurement ID</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={() => saveSettings("integrations", integrationSettings)} disabled={saving}>
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
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paintbrush className="w-5 h-5" />
                      Visual Identity
                    </CardTitle>
                    <CardDescription>Customize the look and feel of the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={designSettings.theme_primary_color}
                          onChange={(e) => setDesignSettings(prev => ({ ...prev, theme_primary_color: e.target.value }))}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={designSettings.theme_primary_color}
                          onChange={(e) => setDesignSettings(prev => ({ ...prev, theme_primary_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Border Radius (UI Roundness)</Label>
                      <Select
                        value={designSettings.theme_border_radius}
                        onValueChange={(val) => setDesignSettings(prev => ({ ...prev, theme_border_radius: val }))}
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
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="space-y-0.5">
                        <Label>Glassmorphism Effects</Label>
                        <p className="text-sm text-muted-foreground">Enable blurred backgrounds on cards and dialogs.</p>
                      </div>
                      <Switch
                        checked={designSettings.theme_glassmorphism}
                        onCheckedChange={(checked) => setDesignSettings(prev => ({ ...prev, theme_glassmorphism: checked }))}
                      />
                    </div>

                    <Button className="w-full" onClick={() => saveSettings("design", designSettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Design Tokens
                    </Button>
                  </CardContent>
                </Card>

                {/* Feature Toggles */}
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
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/30 transition-colors">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{f.label}</p>
                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                          </div>
                          <Switch
                            checked={featureSettings[f.id]}
                            onCheckedChange={(checked) => setFeatureSettings(prev => ({ ...prev, [f.id]: checked }))}
                          />
                        </div>
                      ))}
                    </div>

                    <Button className="w-full" onClick={() => saveSettings("features", featureSettings)} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Feature Flags
                    </Button>
                  </CardContent>
                </Card>
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
