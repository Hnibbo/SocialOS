import { useState, useEffect } from "react";
import {
  Building2,
  Palette,
  Globe,
  Bell,
  Shield,
  Save,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function OrganizationSettings() {
  const { user } = useAuth();
  const { currentOrg, fetchOrganizationSettings, updateOrganizationSettings, updateOrganization } = useOrganizations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    custom_branding: false,
    allow_signups: true,
    dark_mode: false,
    timezone: "UTC"
  });
  const [orgDetails, setOrgDetails] = useState({
    name: "",
    slug: "",
    custom_domain: "",
    primary_color: ""
  });

  useEffect(() => {
    if (!currentOrg) return;

    const loadData = async () => {
      setLoading(true);
      
      // Load organization settings
      const orgSettings = await fetchOrganizationSettings(currentOrg.id);
      if (orgSettings) {
        setSettings(orgSettings.settings);
      }

      // Load organization details
      setOrgDetails({
        name: currentOrg.name,
        slug: currentOrg.slug,
        custom_domain: currentOrg.custom_domain || "",
        primary_color: currentOrg.primary_color || ""
      });

      setLoading(false);
    };

    loadData();
  }, [currentOrg, fetchOrganizationSettings]);

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDetailsChange = (key: string, value: string) => {
    setOrgDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!currentOrg) return;

    setSaving(true);
    try {
      // Save organization details
      await updateOrganization(currentOrg.id, {
        name: orgDetails.name,
        slug: orgDetails.slug,
        custom_domain: orgDetails.custom_domain || null,
        primary_color: orgDetails.primary_color || null
      });

      // Save organization settings
      await updateOrganizationSettings(currentOrg.id, settings);

      toast.success("Organization settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
        <p className="text-muted-foreground">Please join or create an organization to access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Configure your organization preferences</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={orgDetails.name}
                onChange={(e) => handleDetailsChange("name", e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={orgDetails.slug}
                onChange={(e) => handleDetailsChange("slug", e.target.value)}
                placeholder="organization-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-domain">Custom Domain</Label>
              <Input
                id="org-domain"
                value={orgDetails.custom_domain}
                onChange={(e) => handleDetailsChange("custom_domain", e.target.value)}
                placeholder="example.com"
              />
              <p className="text-xs text-muted-foreground">
                Custom domain for your organization's portal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={orgDetails.primary_color || "#000000"}
                  onChange={(e) => handleDetailsChange("primary_color", e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={orgDetails.primary_color}
                  onChange={(e) => handleDetailsChange("primary_color", e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding & Customization */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding & Customization
              </div>
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Custom Branding</Label>
                <p className="text-sm text-muted-foreground">
                  Enable custom branding for your organization
                </p>
              </div>
              <Switch
                checked={settings.custom_branding}
                onCheckedChange={(checked) => handleSettingsChange("custom_branding", checked)}
              />
            </div>

            {settings.custom_branding && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    value={settings.logo_url || ""}
                    onChange={(e) => handleSettingsChange("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-url">Banner URL</Label>
                  <Input
                    id="banner-url"
                    value={settings.banner_url || ""}
                    onChange={(e) => handleSettingsChange("banner_url", e.target.value)}
                    placeholder="https://example.com/banner.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favicon-url">Favicon URL</Label>
                  <Input
                    id="favicon-url"
                    value={settings.favicon_url || ""}
                    onChange={(e) => handleSettingsChange("favicon_url", e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode by default
                </p>
              </div>
              <Switch
                checked={settings.dark_mode}
                onCheckedChange={(checked) => handleSettingsChange("dark_mode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </div>
            </CardTitle>
            <CardDescription>
              Configure notification preferences for your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to team members
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingsChange("notifications", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={settings.timezone}
                onChange={(e) => handleSettingsChange("timezone", e.target.value)}
                placeholder="UTC"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </div>
            </CardTitle>
            <CardDescription>
              Security and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Public Signups</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to sign up without an invitation
                </p>
              </div>
              <Switch
                checked={settings.allow_signups}
                onCheckedChange={(checked) => handleSettingsChange("allow_signups", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all team members
                </p>
              </div>
              <Switch
                checked={settings.two_factor_auth || false}
                onCheckedChange={(checked) => handleSettingsChange("two_factor_auth", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Whitelisting</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict access to specific IP addresses
                </p>
              </div>
              <Switch
                checked={settings.ip_whitelisting || false}
                onCheckedChange={(checked) => handleSettingsChange("ip_whitelisting", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
